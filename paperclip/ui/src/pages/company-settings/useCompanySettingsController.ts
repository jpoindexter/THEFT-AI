import { type ChangeEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_COMPANY_ATTACHMENT_MAX_BYTES } from "@paperclipai/shared";
import { accessApi } from "@/api/access";
import { assetsApi } from "@/api/assets";
import { companiesApi } from "@/api/companies";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  DEFAULT_COMPANY_ATTACHMENT_MAX_MIB,
  getAttachmentMaxBytes,
  getAttachmentMaxMiB,
  isValidAttachmentMaxBytes,
} from "./companySettingsModel";
import { buildAgentSnippet } from "./inviteSnippet";

export function useCompanySettingsController() {
  const { companies, selectedCompany, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [attachmentMaxMiB, setAttachmentMaxMiB] = useState(String(DEFAULT_COMPANY_ATTACHMENT_MAX_MIB));
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSnippet, setInviteSnippet] = useState<string | null>(null);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [snippetCopyDelightId, setSnippetCopyDelightId] = useState(0);

  useEffect(() => {
    if (!selectedCompany) return;
    setCompanyName(selectedCompany.name);
    setDescription(selectedCompany.description ?? "");
    setBrandColor(selectedCompany.brandColor ?? "");
    setAttachmentMaxMiB(getAttachmentMaxMiB(selectedCompany.attachmentMaxBytes));
    setLogoUrl(selectedCompany.logoUrl ?? "");
  }, [selectedCompany]);

  useEffect(() => {
    setInviteError(null);
    setInviteSnippet(null);
    setSnippetCopied(false);
    setSnippetCopyDelightId(0);
  }, [selectedCompanyId]);

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: "Settings" },
    ]);
  }, [setBreadcrumbs, selectedCompany?.name]);

  const attachmentMaxBytes = getAttachmentMaxBytes(attachmentMaxMiB);
  const attachmentMaxValid = isValidAttachmentMaxBytes(attachmentMaxBytes);
  const generalDirty = !!selectedCompany && (
    companyName !== selectedCompany.name ||
    description !== (selectedCompany.description ?? "") ||
    brandColor !== (selectedCompany.brandColor ?? "") ||
    attachmentMaxBytes !== (selectedCompany.attachmentMaxBytes ?? DEFAULT_COMPANY_ATTACHMENT_MAX_BYTES)
  );

  const generalMutation = useMutation({
    mutationFn: () => companiesApi.update(selectedCompanyId!, {
      name: companyName.trim(),
      description: description.trim() || null,
      brandColor: brandColor || null,
      attachmentMaxBytes,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.companies.all }),
  });

  const settingsMutation = useMutation({
    mutationFn: (requireApproval: boolean) =>
      companiesApi.update(selectedCompanyId!, { requireBoardApprovalForNewAgents: requireApproval }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.companies.all }),
  });

  const inviteMutation = useMutation({
    mutationFn: () => accessApi.createOpenClawInvitePrompt(selectedCompanyId!),
    onSuccess: async (invite) => {
      setInviteError(null);
      const snippet = await createInviteSnippet(invite);
      setInviteSnippet(snippet);
      await copySnippet(snippet);
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId!) });
    },
    onError: (err) => {
      setInviteError(err instanceof Error ? err.message : "Failed to create invite");
    },
  });

  async function createInviteSnippet(invite: { token: string; onboardingTextUrl?: string | null; onboardingTextPath?: string | null }) {
    const base = window.location.origin.replace(/\/+$/, "");
    const onboardingTextLink =
      invite.onboardingTextUrl ?? invite.onboardingTextPath ?? `/api/invites/${invite.token}/onboarding.txt`;
    const absoluteUrl = onboardingTextLink.startsWith("http") ? onboardingTextLink : `${base}${onboardingTextLink}`;
    setSnippetCopied(false);
    setSnippetCopyDelightId(0);
    try {
      const manifest = await accessApi.getInviteOnboarding(invite.token);
      return buildAgentSnippet({
        onboardingTextUrl: absoluteUrl,
        connectionCandidates: manifest.onboarding.connectivity?.connectionCandidates ?? null,
        testResolutionUrl: manifest.onboarding.connectivity?.testResolutionEndpoint?.url ?? null,
      });
    } catch {
      return buildAgentSnippet({ onboardingTextUrl: absoluteUrl, connectionCandidates: null, testResolutionUrl: null });
    }
  }

  async function copySnippet(snippet = inviteSnippet) {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      setSnippetCopied(true);
      setSnippetCopyDelightId((prev) => prev + 1);
      setTimeout(() => setSnippetCopied(false), 2000);
    } catch {
      /* clipboard may not be available */
    }
  }

  const syncLogoState = (nextLogoUrl: string | null) => {
    setLogoUrl(nextLogoUrl ?? "");
    void queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  };
  const logoUploadMutation = useMutation({
    mutationFn: (file: File) =>
      assetsApi.uploadCompanyLogo(selectedCompanyId!, file)
        .then((asset) => companiesApi.update(selectedCompanyId!, { logoAssetId: asset.assetId })),
    onSuccess: (company) => {
      syncLogoState(company.logoUrl);
      setLogoUploadError(null);
    },
  });
  const clearLogoMutation = useMutation({
    mutationFn: () => companiesApi.update(selectedCompanyId!, { logoAssetId: null }),
    onSuccess: (company) => {
      setLogoUploadError(null);
      syncLogoState(company.logoUrl);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: ({ companyId, nextCompanyId }: { companyId: string; nextCompanyId: string | null }) =>
      companiesApi.archive(companyId).then(() => ({ nextCompanyId })),
    onSuccess: async ({ nextCompanyId }) => {
      if (nextCompanyId) setSelectedCompanyId(nextCompanyId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.stats });
    },
  });

  function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!file) return;
    setLogoUploadError(null);
    logoUploadMutation.mutate(file);
  }

  function handleArchive() {
    if (!selectedCompanyId || !selectedCompany) return;
    const confirmed = window.confirm(`Archive company "${selectedCompany.name}"? It will be hidden from the sidebar.`);
    if (!confirmed) return;
    const nextCompanyId = companies.find((company) =>
      company.id !== selectedCompanyId && company.status !== "archived"
    )?.id ?? null;
    archiveMutation.mutate({ companyId: selectedCompanyId, nextCompanyId });
  }

  return {
    selectedCompany,
    companyName,
    setCompanyName,
    description,
    setDescription,
    brandColor,
    setBrandColor,
    attachmentMaxMiB,
    setAttachmentMaxMiB,
    attachmentMaxValid,
    generalDirty,
    generalMutation,
    settingsMutation,
    inviteMutation,
    inviteError,
    inviteSnippet,
    snippetCopied,
    snippetCopyDelightId,
    copySnippet,
    logoUrl,
    logoUploadError,
    logoUploadMutation,
    clearLogoMutation,
    handleLogoFileChange,
    archiveMutation,
    handleArchive,
  };
}
