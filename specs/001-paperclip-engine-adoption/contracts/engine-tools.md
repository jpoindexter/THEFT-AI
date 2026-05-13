# Contract: Engine Tools

## List Tools

The engine exposes registered tools to adapters as model-facing descriptors.

```ts
listEngineTools(): Anthropic.Tool[]
```

Each descriptor includes:

- `name`
- `description`
- `input_schema`

## Execute Tool

```ts
executeEngineTool({
  org,
  name,
  input,
  agentId?,
  taskId?,
  departmentSlug?,
  source?
}): Promise<unknown>
```

Expected behavior:

- Unknown tools return `{ ok: false, error: "unknown tool: <name>" }`
- Known tools return structured JSON-compatible results
- Handlers never require route-specific code
- Handlers receive enough context to scope results to the current company
