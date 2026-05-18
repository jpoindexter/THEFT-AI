import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AgentAdapterType } from "@paperclipai/shared";
import { useCompany } from "@/context/CompanyContext";
import { useNavigate, useParams } from "@/lib/router";
import { accessApi } from "../api/access";
import { authApi } from "../api/auth";
import { companiesApi } from "../api/companies";
import { healthApi } from "../api/health";
import { clearPendingInviteToken, rememberPendingInviteToken } from "../lib/invite-memory";
import { queryKeys } from "../lib/queryKeys";
import { InviteLandingContent } from "./invite-landing/InviteLandingContent";
import { InviteErrorPanel, InviteLoadingMessage } from "./invite-landing/InviteLandingPanels";
import {
  renderInviteLandingTerminalState,
  type InviteLandingResult,
} from "./invite-landing/InviteLandingTerminalState";
import {
  formatHumanRole,
  getAuthErrorCode,
  isApprovedHumanJoinPayload,
  isBootstrapAcceptancePayload,
  mapInviteAuthFeedback,
  type AuthFeedback,
  type AuthMode,
} from "./invite-landing/inviteLandingModel";

export function InviteLandingPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setSelectedCompanyId } = useCompany();
  const params = useParams();
  const token = (params.token ?? "").trim();
  const [authMode, setAuthMode] = useState<AuthMode>("sign_up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agentName, setAgentName] = useState("");
  const [adapterType, setAdapterType] = useState<AgentAdapterType>("claude_local");
  const [capabilities, setCapabilities] = useState("");
  const [result, setResult] = useState<InviteLandingResult>(null);
  const [error, setError] = useState<string | null>(null);
  const [authFeedback, setAuthFeedback] = useState<AuthFeedback | null>(null);
  const [autoAcceptStarted, setAutoAcceptStarted] = useState(false);

  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.get(),
    retry: false,
  });
  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });
  const inviteQuery = useQuery({
    queryKey: queryKeys.access.invite(token),
    queryFn: () => accessApi.getInvite(token),
    enabled: token.length > 0,
    retry: false,
  });

  const companiesQuery = useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: () => companiesApi.list(),
    enabled: !!sessionQuery.data && !!inviteQuery.data?.companyId,
    retry: false,
  });

  useEffect(() => {
    if (token) rememberPendingInviteToken(token);
  }, [token]);

  useEffect(() => {
    setAutoAcceptStarted(false);
  }, [token]);

  useEffect(() => {
    if (!companiesQuery.data || !inviteQuery.data?.companyId) return;
    const isMember = companiesQuery.data.some(
      (c) => c.id === inviteQuery.data!.companyId
    );
    if (isMember) {
      clearPendingInviteToken(token);
      navigate("/", { replace: true });
    }
  }, [companiesQuery.data, inviteQuery.data, token, navigate]);

  const invite = inviteQuery.data;
  const isCheckingExistingMembership =
    Boolean(sessionQuery.data) &&
    Boolean(invite?.companyId) &&
    companiesQuery.isLoading;
  const isCurrentMember =
    Boolean(invite?.companyId) &&
    Boolean(
      companiesQuery.data?.some((company) => company.id === invite?.companyId),
    );
  const companyName = invite?.companyName?.trim() || null;
  const companyDisplayName = companyName || "this THEFT company";
  const companyLogoUrl = invite?.companyLogoUrl?.trim() || null;
  const companyBrandColor = invite?.companyBrandColor?.trim() || null;
  const invitedByUserName = invite?.invitedByUserName?.trim() || null;
  const inviteMessage = invite?.inviteMessage?.trim() || null;
  const requestedHumanRole = formatHumanRole(invite?.humanRole);
  const inviteJoinRequestStatus = invite?.joinRequestStatus ?? null;
  const inviteJoinRequestType = invite?.joinRequestType ?? null;
  const requiresHumanAccount =
    healthQuery.data?.deploymentMode === "authenticated" &&
    !sessionQuery.data &&
    invite?.allowedJoinTypes !== "agent";
  const showsAgentForm = invite?.inviteType !== "bootstrap_ceo" && invite?.allowedJoinTypes === "agent";
  const shouldAutoAcceptHumanInvite =
    Boolean(sessionQuery.data) &&
    !showsAgentForm &&
    invite?.inviteType !== "bootstrap_ceo" &&
    !inviteJoinRequestStatus &&
    !isCheckingExistingMembership &&
    !isCurrentMember &&
    !result &&
    error === null;
  const sessionLabel =
    sessionQuery.data?.user.name?.trim() ||
    sessionQuery.data?.user.email?.trim() ||
    "this account";

  const authCanSubmit =
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    (authMode === "sign_in" || (name.trim().length > 0 && password.trim().length >= 8));

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!invite) throw new Error("Invite not found");
      if (isCheckingExistingMembership) {
        throw new Error("Checking your company access. Try again in a moment.");
      }
      if (isCurrentMember) {
        throw new Error("This account already belongs to the company.");
      }
      if (invite.inviteType === "bootstrap_ceo" || invite.allowedJoinTypes !== "agent") {
        return accessApi.acceptInvite(token, { requestType: "human" });
      }
      return accessApi.acceptInvite(token, {
        requestType: "agent",
        agentName: agentName.trim(),
        adapterType,
        capabilities: capabilities.trim() || null,
      });
    },
    onSuccess: async (payload) => {
      setError(null);
      clearPendingInviteToken(token);
      const asBootstrap = isBootstrapAcceptancePayload(payload);
      setResult({ kind: asBootstrap ? "bootstrap" : "join", payload });
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      if (invite?.companyId && isApprovedHumanJoinPayload(payload, showsAgentForm)) {
        setSelectedCompanyId(invite.companyId, { source: "manual" });
        navigate("/", { replace: true });
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    },
  });

  useEffect(() => {
    if (!shouldAutoAcceptHumanInvite || autoAcceptStarted || acceptMutation.isPending) return;
    setAutoAcceptStarted(true);
    setError(null);
    acceptMutation.mutate();
  }, [acceptMutation, autoAcceptStarted, shouldAutoAcceptHumanInvite]);

  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === "sign_in") {
        await authApi.signInEmail({ email: email.trim(), password });
        return;
      }
      await authApi.signUpEmail({
        name: name.trim(),
        email: email.trim(),
        password,
      });
    },
    onSuccess: async () => {
      setAuthFeedback(null);
      rememberPendingInviteToken(token);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      const companies = await queryClient.fetchQuery({
        queryKey: queryKeys.companies.all,
        queryFn: () => companiesApi.list(),
        retry: false,
      });

      if (invite?.companyId && companies.some((company) => company.id === invite.companyId)) {
        clearPendingInviteToken(token);
        setSelectedCompanyId(invite.companyId, { source: "manual" });
        navigate("/", { replace: true });
        return;
      }

      if (!invite || invite.inviteType !== "bootstrap_ceo") {
        return;
      }

      try {
        const payload = await acceptMutation.mutateAsync();
        if (isBootstrapAcceptancePayload(payload)) {
          navigate("/", { replace: true });
        }
      } catch {
        return;
      }
    },
    onError: (err) => {
      const nextFeedback = mapInviteAuthFeedback(err, authMode, email);
      if (getAuthErrorCode(err) === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        setAuthMode("sign_in");
        setPassword("");
      }
      setAuthFeedback(nextFeedback);
    },
  });

  const joinButtonLabel = useMemo(() => {
    if (!invite) return "Continue";
    if (invite.inviteType === "bootstrap_ceo") return "Accept invite";
    if (showsAgentForm) return "Submit request";
    return sessionQuery.data ? "Accept invite" : "Continue";
  }, [invite, sessionQuery.data, showsAgentForm]);

  if (!token) return <InviteErrorPanel message="Invalid invite token." />;

  if (inviteQuery.isLoading || healthQuery.isLoading || sessionQuery.isLoading) return <InviteLoadingMessage message="Loading invite..." />;

  if (isCheckingExistingMembership) return <InviteLoadingMessage message="Checking your access..." />;

  if (inviteQuery.error || !invite) return <InviteErrorPanel />;

  const terminalState = renderInviteLandingTerminalState({
    companyDisplayName,
    companyLogoUrl,
    companyBrandColor,
    inviteJoinRequestStatus,
    inviteJoinRequestType,
    invitedByUserName,
    isCurrentMember,
    result,
    showsAgentForm,
  });

  if (terminalState) {
    return terminalState;
  }

  return (
    <InviteLandingContent
      acceptMutation={acceptMutation}
      adapterType={adapterType}
      agentName={agentName}
      authCanSubmit={authCanSubmit}
      authFeedback={authFeedback}
      authMode={authMode}
      authMutation={authMutation}
      capabilities={capabilities}
      companyDisplayName={companyDisplayName}
      companyLogoUrl={companyLogoUrl}
      companyBrandColor={companyBrandColor}
      email={email}
      error={error}
      invite={invite}
      inviteMessage={inviteMessage}
      invitedByUserName={invitedByUserName}
      isCurrentMember={isCurrentMember}
      joinButtonLabel={joinButtonLabel}
      name={name}
      password={password}
      requestedHumanRole={requestedHumanRole}
      requiresHumanAccount={requiresHumanAccount}
      session={sessionQuery.data}
      sessionLabel={sessionLabel}
      setAdapterType={setAdapterType}
      setAgentName={setAgentName}
      setAuthFeedback={setAuthFeedback}
      setAuthMode={setAuthMode}
      setCapabilities={setCapabilities}
      setEmail={setEmail}
      setName={setName}
      setPassword={setPassword}
      shouldAutoAcceptHumanInvite={shouldAutoAcceptHumanInvite}
      showsAgentForm={showsAgentForm}
    />
  );
}
