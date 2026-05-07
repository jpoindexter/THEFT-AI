"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Row } from "@/components/settings/section";
import { toast } from "@/components/toast-host";

type Props = {
  org: string;
  initialAiModel: string;
  initialEngineerModel: string;
  initialGlobalPrompt: string;
  initialReviewBotMode: string;
};

async function patch(org: string, body: Record<string, string | null>) {
  await fetch(`/api/${org}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function AISettingsForm({
  org,
  initialAiModel,
  initialEngineerModel,
  initialGlobalPrompt,
  initialReviewBotMode,
}: Props) {
  const [aiModel, setAiModel] = useState(initialAiModel);
  const [engineerModel, setEngineerModel] = useState(initialEngineerModel);
  const [globalPrompt, setGlobalPrompt] = useState(initialGlobalPrompt);
  const [reviewBotMode, setReviewBotMode] = useState(initialReviewBotMode);
  const [saving, setSaving] = useState(false);

  async function savePrompt() {
    setSaving(true);
    await patch(org, { global_prompt: globalPrompt });
    setSaving(false);
    toast("Global prompt saved", "ok");
  }

  return (
    <>
      <Row
        label="Cofounder Review Bot mode"
        hint="Controls how selective Cofounder Review Bot is when reviewing GitHub repositories."
      >
        <Select
          value={reviewBotMode}
          onValueChange={(v) => {
            const val = v ?? reviewBotMode;
            setReviewBotMode(val);
            void patch(org, { review_bot_mode: val });
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Off</SelectItem>
            <SelectItem value="blockers">Blockers only</SelectItem>
            <SelectItem value="all">All comments</SelectItem>
          </SelectContent>
        </Select>
      </Row>

      <div className="space-y-1">
        <div className="text-base">Global Prompt Personalization</div>
        <p className="text-xs text-ink-muted">
          Add context that should be included globally across chats and agents.
        </p>
        <Textarea
          value={globalPrompt}
          onChange={(e) => setGlobalPrompt(e.target.value)}
          placeholder="Example: be direct. Prefer bullets over paragraphs. Flag assumptions explicitly."
          className="min-h-24"
        />
        <div className="flex justify-end">
          <button
            onClick={savePrompt}
            disabled={saving}
            className="text-xs rounded-md bg-ink text-paper px-3 py-1 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <Row label="Cofounder model">
          <Select
            value={aiModel}
            onValueChange={(v) => {
              const val = v ?? aiModel;
              setAiModel(val);
              void patch(org, { ai_model: val });
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sonnet-4-6">Claude Sonnet 4.6</SelectItem>
              <SelectItem value="opus-4-7">Claude Opus 4.7</SelectItem>
              <SelectItem value="haiku-4-5">Claude Haiku 4.5</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Engineer model">
          <Select
            value={engineerModel}
            onValueChange={(v) => {
              const val = v ?? engineerModel;
              setEngineerModel(val);
              void patch(org, { engineer_model: val });
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opus-4-7">Claude Opus 4.7</SelectItem>
              <SelectItem value="sonnet-4-6">Claude Sonnet 4.6</SelectItem>
              <SelectItem value="haiku-4-5">Claude Haiku 4.5</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </div>
    </>
  );
}
