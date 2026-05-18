import type { CompanySkillListItem } from "@paperclipai/shared";
import { Checkbox } from "@/components/ui/checkbox";

export function CompanySkillsSection({
  skills,
  selectedSkillKeys,
  onSkillToggle,
}: {
  skills: CompanySkillListItem[];
  selectedSkillKeys: string[];
  onSkillToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="border-t border-border px-4 py-4">
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Company skills</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional skills from the company library. Built-in Paperclip runtime skills are added automatically.
          </p>
        </div>
        {skills.length === 0 ? (
          <p className="text-xs text-muted-foreground">No optional company skills installed yet.</p>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => {
              const inputId = `skill-${skill.id}`;
              const checked = selectedSkillKeys.includes(skill.key);
              return (
                <div key={skill.id} className="flex items-start gap-3">
                  <Checkbox
                    id={inputId}
                    checked={checked}
                    onCheckedChange={(next) => onSkillToggle(skill.key, next === true)}
                  />
                  <label htmlFor={inputId} className="grid gap-1 leading-none">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-xs text-muted-foreground">{skill.description ?? skill.key}</span>
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
