ShipChat is a real-time internal chat MVP built with Next.js, Supabase, Prisma, and shadcn/ui.

## Getting Started

Run the app:

```bash
bun dev
```

Open `http://127.0.0.1:3000`.

## Shadcn Registry And MCP

This repo exposes a local shadcn-compatible registry for the reusable auth screen.

Build the registry payloads:

```bash
bun run registry:build
```

Once the app is running, the registry endpoints are:

- `http://127.0.0.1:3000/r/registry.json`
- `http://127.0.0.1:3000/r/shipchat-auth-screen.json`

The local registry is already configured in `components.json`:

```json
{
  "registries": {
    "@shipchat": "http://127.0.0.1:3000/r/{name}.json"
  }
}
```

For Codex MCP support, add this to `~/.codex/config.toml` and restart Codex:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

After that, Codex can query the local registry through the shadcn MCP server.

## Supabase MCP

This project already includes a local Supabase CLI setup, so you can use either the local MCP server for this repo or Supabase's hosted remote MCP server.

Start the local Supabase stack when you want MCP access to the local development database:

```bash
bun run supabase:start
```

That exposes the local MCP endpoint at `http://127.0.0.1:54321/mcp`.

For Codex, add one or both of these servers to `~/.codex/config.toml` and restart Codex:

```toml
[mcp_servers.supabase_local]
url = "http://127.0.0.1:54321/mcp"

[mcp_servers.supabase_hosted]
url = "https://mcp.supabase.com/mcp?read_only=true"
```

Notes:

- `supabase_local` talks to this repo's local Supabase stack.
- `supabase_hosted` uses browser-based OAuth on first connect. Supabase no longer requires a personal access token for the default setup.
- MCP server names are arbitrary. If you already have a local `[mcp_servers.supabase]` entry, you can keep that name and only add a separate hosted entry.
- `read_only=true` is the safest default. If you want to scope hosted access to a single project, use `https://mcp.supabase.com/mcp?project_ref=<your-project-ref>&read_only=true`.
- You can further restrict the hosted server with feature groups, for example `https://mcp.supabase.com/mcp?project_ref=<your-project-ref>&read_only=true&features=database,docs`.
