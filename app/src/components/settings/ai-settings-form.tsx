"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Row } from "@/components/settings/section";
import { toast } from "@/components/toast-host";
import { LLM_BACKENDS, MODEL_PROVIDERS } from "@/lib/agent/models";

type Props = {
  org: string;
  initialAiModel: string;
  initialEngineerModel: string;
  initialLlmBackend?: string;
  initialLlmBaseUrl?: string;
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
  initialLlmBackend = "codex-cli",
  initialLlmBaseUrl = "",
  initialGlobalPrompt,
  initialReviewBotMode,
}: Props) {
  const [aiModel, setAiModel] = useState(initialAiModel);
  const [engineerModel, setEngineerModel] = useState(initialEngineerModel);
  const [llmBackend, setLlmBackend] = useState(initialLlmBackend);
  const [llmBaseUrl, setLlmBaseUrl] = useState(initialLlmBaseUrl);
  const [globalPrompt, setGlobalPrompt] = useState(initialGlobalPrompt);
  const [reviewBotMode, setReviewBotMode] = useState(initialReviewBotMode);
  const [ollamaModel, setOllamaModel] = useState("qwen2.5:7b");
  const [pulling, setPulling] = useState(false);
  const [saving, setSaving] = useState(false);

  async function savePrompt() {
    setSaving(true);
    await patch(org, { global_prompt: globalPrompt });
    setSaving(false);
    toast("Global prompt saved", "ok");
  }

  async function saveRuntime() {
    setSaving(true);
    await patch(org, {
      llm_backend: llmBackend || null,
      llm_base_url: llmBaseUrl || null,
      ai_model: aiModel || null,
      engineer_model: engineerModel || null,
    });
    setSaving(false);
    toast("Model runtime saved", "ok");
  }

  async function pullOllamaModel() {
    if (!ollamaModel.trim() || pulling) return;
    setPulling(true);
    try {
      const res = await fetch("/api/models/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel.trim(),
          baseUrl: llmBackend === "ollama" && llmBaseUrl ? llmBaseUrl : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Pull failed");
      toast(`Ollama model ready: ${ollamaModel.trim()}`, "ok");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Ollama pull failed", "warn");
    } finally {
      setPulling(false);
    }
  }

  return (
    <>
      <Row
        label="Operator Review Bot mode"
        hint="Controls how selective Operator Review Bot is when reviewing GitHub repositories."
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
        <Row
          label="Runtime backend"
          hint="Local CLI adapters use your existing session auth. Choose Claude Code, Codex CLI, Gemini CLI, OpenCode, or BYOK/API endpoints."
        >
          <Select
            value={llmBackend}
            onValueChange={(v) => setLlmBackend(v ?? llmBackend)}
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LLM_BACKENDS.map((backend) => (
                <SelectItem key={backend.id} value={backend.id}>
                  {backend.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <Row
          label="Local endpoint"
          hint="Optional. Use http://localhost:11434 for Ollama, http://localhost:1234/v1 for LM Studio, or any OpenAI-compatible base URL."
        >
          <Input
            value={llmBaseUrl}
            onChange={(e) => setLlmBaseUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-80"
          />
        </Row>

        <Row label="Operator model">
          <ModelPicker value={aiModel} onChange={setAiModel} />
        </Row>
        <Row label="Engineer model">
          <ModelPicker value={engineerModel} onChange={setEngineerModel} />
        </Row>

        <div className="flex justify-end">
          <Button type="button" onClick={() => void saveRuntime()} disabled={saving}>
            {saving ? "Saving..." : "Save runtime"}
          </Button>
        </div>

        <div className="rounded-md border border-line/70 bg-canvas p-3 space-y-2">
          <div>
            <div className="text-sm font-medium text-ink">Download local Ollama model</div>
            <p className="text-xs text-ink-muted">
              Pulls a model into the Ollama server configured above. LM Studio downloads happen in LM Studio; this app will use whatever model it has loaded.
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="qwen2.5:7b"
              className="max-w-xs"
            />
            <Button type="button" variant="outline" onClick={() => void pullOllamaModel()} disabled={pulling}>
              {pulling ? "Pulling..." : "Pull"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ModelPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [custom, setCustom] = useState(value);
  return (
    <div className="flex flex-col gap-2 w-full max-w-xl">
      <Select
        value={value}
        onValueChange={(v) => {
          const next = v ?? value;
          onChange(next);
          setCustom(next);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select provider/model" />
        </SelectTrigger>
        <SelectContent>
          {MODEL_PROVIDERS.map((provider) =>
            provider.models.map((model) => {
              const id = provider.id === "opencode" ? model.id : `${provider.id}/${model.id}`;
              return (
                <SelectItem key={`${provider.id}-${model.id}`} value={id}>
                  {provider.name} · {model.name}
                </SelectItem>
              );
            }),
          )}
        </SelectContent>
      </Select>
      <Input
        value={custom}
        onChange={(e) => {
          setCustom(e.target.value);
          onChange(e.target.value);
        }}
        placeholder="provider/model, e.g. openrouter/anthropic/claude-sonnet-4 or ollama/qwen2.5:7b"
        className="font-mono text-xs"
      />
    </div>
  );
}
