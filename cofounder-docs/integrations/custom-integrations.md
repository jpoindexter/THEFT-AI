# Custom Integrations

## What Custom Integrations Are

Use **Integrations > Custom Integrations** when an agent needs to call a private API, internal service, or vendor tool that is not already available as a built-in integration or MCP toolkit.

Custom integrations are lighter than MCP integrations. They do not add a new `cofounder run` tool. Instead, they give eligible agents secure environment variables that scripts can read at runtime.

That makes them a good fit for:

- an internal admin API
- a private reporting endpoint
- a vendor API key
- a small workflow service your company owns
- an API that is not supported natively or through MCP yet

## What You Configure

Each custom integration stores:

- a name
- a private API key
- one or more allowed domains or URLs
- an optional docs link
- whether agents can change data through the integration

Allowed domains define where the credential is allowed to be used. You can paste a full API URL in the domain field, and Cofounder stores the hostname.

By default, custom integrations are read-only. Read-only integrations can make safe read requests and recognized search or query requests. Turn on **Let agents change data** only when the API needs mutation, write, or state-changing endpoints.

## How Agents Use Them

Custom integrations are env-var based, not tool-based.

Eligible agents can discover available custom integrations with the cofounder CLI:

- **`cofounder list`** — Shows all available integrations, including custom integrations in a dedicated section
- **`cofounder list --integration <name>`** — Filters to a specific custom integration by name
- **`cofounder search <query>`** — Searches across tools and custom integrations

When an agent needs to use a custom integration repeatedly, the usual pattern is to write a saved script in the Library. The script reads the integration's environment variables, calls the API, and writes results back to the workspace.

### Example Output

When an eligible agent runs `cofounder list`, its available custom integrations appear in a dedicated section:

```text
Custom integrations (env-var based, not tool-based):
  [custom:My API] My API
    API key env var: MY_API_API_KEY
    Endpoint env var: MY_API_ENDPOINT_URL (not configured)
    Docs: https://docs.example.com/api
    Usage: custom integrations are env-var based, not tool-based. Write a script in the sandbox
    that reads the env var(s) directly and calls the API. There is no 'cofounder run' subcommand
    for custom integrations.

Total: 42 tools, 1 custom integrations
```

The environment variable names are based on the integration name. For example, **Lead Enrichment API** becomes `LEAD_ENRICHMENT_API_API_KEY` and `LEAD_ENRICHMENT_API_ENDPOINT_URL`.

## How Credentials Stay Safe

Custom integration credentials are double encrypted when stored, and raw secret values are not shown in the UI or CLI output.

At runtime, agents see the integration name, docs link, allowed domains, and environment variable names. The LLM only needs a placeholder value for the secret. Cofounder's trusted backend securely swaps that placeholder for the real credential when the script makes an allowed proxied request.

The backend also enforces the allowed domains and read/write setting. If an integration is read-only, mutation-style requests are blocked unless **Let agents change data** is enabled.

## Example: Enrich A CSV With A Custom API

Say your team uses a private lead enrichment API.

First, add a custom integration:

- **Name:** Lead Enrichment API
- **API key:** the private key from your vendor
- **Domains:** `api.enrich.example`
- **Docs link:** `https://docs.enrich.example`
- **Let agents change data:** off, unless the API requires writes

Then ask an agent to create a reusable Library script:

```text
Use the Lead Enrichment API custom integration to write enrich_leads.py.
It should read an uploaded CSV, call the enrichment API for each row, and
save an enriched CSV back to the workspace. Save it as a reusable Library script.
```

The script can read the custom integration at runtime:

```python
#!/usr/bin/env python3

from pathlib import Path

API_KEY = os.environ["LEAD_ENRICHMENT_API_API_KEY"]
BASE_URL = os.environ.get("LEAD_ENRICHMENT_API_ENDPOINT_URL", "https://api.enrich.example")

def enrich(row):
    response = requests.get(
        f"{BASE_URL.rstrip('/')}/v1/enrich",
        params={"domain": row["domain"]},
        headers={"Authorization": f"Bearer {API_KEY}"},
        timeout=30,
    )
    response.raise_for_status()
    return {**row, **response.json()}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", default="/workspace/artifacts/enriched-leads.csv")
    args = parser.parse_args()

    with open(args.input, newline="") as source:
        rows = list(csv.DictReader(source))

    enriched_rows = [enrich(row) for row in rows]
    fieldnames = sorted({key for row in enriched_rows for key in row})

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", newline="") as target:
        writer = csv.DictWriter(target, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched_rows)

    print(f"Wrote {len(enriched_rows)} enriched rows to {args.output}")

if __name__ == "__main__":
    main()
```

After the script is saved, you can run it from the Library and choose an uploaded CSV as the input file. Cofounder passes that file to the script as `--input <path>`, so the same script can be reused for the next enrichment batch.

## Next Steps

- [Integrations Overview](/integrations/overview)
- [MCP Toolkits](/integrations/mcp-toolkits)
- [Library](/workspace/library)
- [Custom Agents](/agents/custom-agents)
