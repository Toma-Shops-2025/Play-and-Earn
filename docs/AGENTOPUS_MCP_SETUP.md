# AgentOpus MCP setup

Hosted **Streamable HTTP** server (OAuth — no API key):

`https://api.opus.pro/api/agent-mcp`

Docs: [agent.opus.pro/mcp](https://agent.opus.pro/mcp)

---

## Cursor (Desktop / Cloud Agent)

Create or merge into **`~/.cursor/mcp.json`** (global) or **`.cursor/mcp.json`** in this repo (project):

```json
{
  "mcpServers": {
    "agentopus": {
      "url": "https://api.opus.pro/api/agent-mcp"
    }
  }
}
```

1. Save the file and **reload Cursor** (or open **Settings → MCP**).
2. Open **Customize → MCP**, select **agentopus**, choose **Authenticate**.
3. Sign in with your AgentOpus / Opus account when the browser opens.

Cloud Agents use: `https://www.cursor.com/agents/mcp/oauth/callback` (handled by Cursor during OAuth).

---

## Claude Code

```bash
claude mcp add --transport http agentopus https://api.opus.pro/api/agent-mcp
```

Then run `claude mcp list` and complete OAuth when Claude Code prompts you.

---

## OpenAI Codex CLI

```bash
codex mcp add agentopus --url https://api.opus.pro/api/agent-mcp
codex mcp login agentopus
```

Open the authorize URL in a browser on the same machine if login does not open automatically.

---

## Verify

After OAuth, ask your agent to call the **whoami** tool (or list MCP tools). You should see your AgentOpus plan; video tools consume the same credits as the web app.
