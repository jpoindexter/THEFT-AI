import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import {
  companySkills as companySkillsTable,
  issueComments,
  issues,
} from "@paperclipai/db";
import { extractSkillMentionIds } from "@paperclipai/shared";
import { parseObject } from "../adapters/utils.js";
import {
  readPaperclipSkillSyncPreference,
  writePaperclipSkillSyncPreference,
} from "@paperclipai/adapter-utils/server-utils";
import { secretService } from "./secrets.js";

type RuntimeConfigSecretResolver = Pick<
  ReturnType<typeof secretService>,
  "resolveAdapterConfigForRuntime" | "resolveEnvBindings"
>;

export async function resolveExecutionRunAdapterConfig(input: {
  companyId: string;
  executionRunConfig: Record<string, unknown>;
  projectEnv: unknown;
  secretsSvc: RuntimeConfigSecretResolver;
}) {
  const { config: resolvedConfig, secretKeys } = await input.secretsSvc.resolveAdapterConfigForRuntime(
    input.companyId,
    input.executionRunConfig,
  );
  const projectEnvResolution = input.projectEnv
    ? await input.secretsSvc.resolveEnvBindings(input.companyId, input.projectEnv)
    : { env: {}, secretKeys: new Set<string>() };
  if (Object.keys(projectEnvResolution.env).length > 0) {
    resolvedConfig.env = {
      ...parseObject(resolvedConfig.env),
      ...projectEnvResolution.env,
    };
    for (const key of projectEnvResolution.secretKeys) {
      secretKeys.add(key);
    }
  }
  return { resolvedConfig, secretKeys };
}

export function extractMentionedSkillIdsFromSources(
  sources: Array<string | null | undefined>,
): string[] {
  const mentionedIds = new Set<string>();
  for (const source of sources) {
    if (typeof source !== "string" || source.length === 0) continue;
    for (const skillId of extractSkillMentionIds(source)) {
      mentionedIds.add(skillId);
    }
  }
  return [...mentionedIds];
}

export function applyRunScopedMentionedSkillKeys(
  config: Record<string, unknown>,
  skillKeys: string[],
): Record<string, unknown> {
  const normalizedSkillKeys = Array.from(
    new Set(
      skillKeys
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
  if (normalizedSkillKeys.length === 0) return config;

  const existingPreference = readPaperclipSkillSyncPreference(config);
  return writePaperclipSkillSyncPreference(config, [
    ...existingPreference.desiredSkills,
    ...normalizedSkillKeys,
  ]);
}

export async function resolveRunScopedMentionedSkillKeys(input: {
  db: Db;
  companyId: string;
  issueId: string | null;
}): Promise<string[]> {
  if (!input.issueId) return [];

  const issue = await input.db
    .select({
      title: issues.title,
      description: issues.description,
    })
    .from(issues)
    .where(and(eq(issues.id, input.issueId), eq(issues.companyId, input.companyId)))
    .then((rows) => rows[0] ?? null);
  if (!issue) return [];

  const comments = await input.db
    .select({ body: issueComments.body })
    .from(issueComments)
    .where(
      and(
        eq(issueComments.issueId, input.issueId),
        eq(issueComments.companyId, input.companyId),
      ),
    );
  const mentionedSkillIds = extractMentionedSkillIdsFromSources([
    issue.title,
    issue.description ?? "",
    ...comments.map((comment) => comment.body),
  ]);
  if (mentionedSkillIds.length === 0) return [];

  const skillRows = await input.db
    .select({
      id: companySkillsTable.id,
      key: companySkillsTable.key,
    })
    .from(companySkillsTable)
    .where(
      and(
        eq(companySkillsTable.companyId, input.companyId),
        inArray(companySkillsTable.id, mentionedSkillIds),
      ),
    );
  const skillKeyById = new Map(skillRows.map((row) => [row.id, row.key]));
  return mentionedSkillIds
    .map((skillId) => skillKeyById.get(skillId) ?? null)
    .filter((skillKey): skillKey is string => Boolean(skillKey));
}
