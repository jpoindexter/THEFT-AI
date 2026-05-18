import { DesignGuideCompositionSections } from "./design-guide/DesignGuideCompositionSections";
import { DesignGuideDataPatternSections } from "./design-guide/DesignGuideDataPatternSections";
import { DesignGuideFeedbackPatternSections } from "./design-guide/DesignGuideFeedbackPatternSections";
import { DesignGuideFormSections } from "./design-guide/DesignGuideFormSections";
import { DesignGuideFoundationSections } from "./design-guide/DesignGuideFoundationSections";
import { DesignGuideInteractionSections } from "./design-guide/DesignGuideInteractionSections";
import { DesignGuideOverlaySections } from "./design-guide/DesignGuideOverlaySections";

export function DesignGuide() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold">Design Guide</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Every component, style, and pattern used across Paperclip.
        </p>
      </div>

      <DesignGuideFoundationSections />
      <DesignGuideInteractionSections />
      <DesignGuideFormSections />
      <DesignGuideOverlaySections />
      <DesignGuideCompositionSections />
      <DesignGuideFeedbackPatternSections />
      <DesignGuideDataPatternSections />
    </div>
  );
}
