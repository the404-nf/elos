# 0006. Three channel emitters: HTML, Slack Block Kit, Markdown

Status: Accepted, 2026-10-23

## Context

Target channels are the web portal, Slack, Claude Desktop, Claude Code, ChatGPT and OpenAI Codex. Slack is an output channel: if a user asks for a report, Slack should render it with components, not only text. Claude Desktop and ChatGPT render HTML widgets returned by MCP tools in an iframe. Claude Code and Codex have no UI.

## Decision

Three emitters, each a pure function from a composition tree plus catalog to an output:

| Emitter | Channels |
|---|---|
| HTML | Web portal; the HTML widget for ChatGPT Apps and Claude Desktop MCP Apps |
| Slack Block Kit | Slack |
| Markdown | Claude Code, Codex |

Each contract declares per-channel support as `native`, `degraded` or `unsupported`, with what the component becomes. The portal preview runs every emitter on the draft and shows the outputs side by side.

## Consequences

- One HTML renderer serves three channels, bundled once as a static widget.
- The Slack preview in the portal is an HTML approximation of Block Kit, since Slack offers no embeddable renderer. It shows what degrades, not pixels.
- Adding a channel means adding an emitter and a `channels` entry per contract, nothing else.
