import { AuthPreviewSet, CompanyInvitesPreview } from "./invite-ux-lab/InviteAuthAndManagementPreviews";
import { InviteLandingPreviewSet } from "./invite-ux-lab/InviteLandingPreviewFrames";
import { InviteResultPreviewGrid } from "./invite-ux-lab/InviteResultPreviews";
import { InviteUxLabHero, LabSection, StatusCard } from "./invite-ux-lab/InviteUxLabShell";
import { statusFixtures } from "./invite-ux-lab/inviteUxLabData";

export function InviteUxLab() {
  return (
    <div className="space-y-6">
      <InviteUxLabHero />

      <LabSection
        eyebrow="Top-level states"
        title="Landing state coverage"
        description="Small cards for the fast-return invite states that do not render the full split-screen layout."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statusFixtures.map((fixture) => (
            <StatusCard key={fixture.title} fixture={fixture} />
          ))}
        </div>
      </LabSection>

      <LabSection
        eyebrow="Invite landing"
        title="Split-screen invite flows"
        description="These frames mirror the production invite surface closely enough to review spacing, hierarchy, and control states while keeping data fixture-driven."
      >
        <InviteLandingPreviewSet />
      </LabSection>

      <LabSection
        eyebrow="Result states"
        title="Approval and completion screens"
        description="These are the post-submit states returned from invite acceptance, including optional claim and onboarding metadata."
      >
        <InviteResultPreviewGrid />
      </LabSection>

      <LabSection
        eyebrow="Standalone auth"
        title="Auth page states"
        description="The general `/auth` page uses a different composition from invite landing. These previews keep both sign-in and sign-up variants visible."
      >
        <AuthPreviewSet />
      </LabSection>

      <LabSection
        eyebrow="Company settings"
        title="Company invite management"
        description="This section captures the board-side invite creation flow, copied-link state, audit table, and the edge states that are otherwise tedious to stage."
      >
        <CompanyInvitesPreview />
      </LabSection>
    </div>
  );
}
