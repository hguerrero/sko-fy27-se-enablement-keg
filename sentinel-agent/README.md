# 🔴 Sentinel Agent

> *"I've been looking for you, Neo."*

A lightweight LLM reasoning agent built with the [Volcano SDK](https://volcano.dev). It accepts a prompt via command-line arguments and returns an AI-generated response — acting as a Matrix sentinel that can be queried for anomaly intelligence.

## How It Works

```
                          ┌─────────────────────┐
                          │   Volcano SDK       │
                          │  (agent pipeline)   │
                          └─────────┬───────────┘
                                    │
  Command Line                      │                    Terminal Output
┌─────────────────┐    process.argv │   stdout     ┌──────────────────────┐
│ npm start       │ ──────────────▶ │  ──────────▶ │ "Agent 007 active.   │
│ "Analyze sector │                 │              │ Monitoring sector 12  │
│ 12 anomalies"   │                 │              │ power fluctuations..."│
└─────────────────┘                 │              └──────────────────────┘
                                    │
                          ┌─────────▼───────────┐
                          │    OpenAI LLM       │
                          │   (gpt-4o-mini)     │
                          │  reasoning engine   │
                          └─────────────────────┘
```

The agent runs a single LLM reasoning step using Volcano SDK's `agent().then({ prompt }).run()` pipeline. If no prompt is provided, it defaults to a sentinel persona that reports on its current target status.

## Quick Start

```bash
# Install dependencies
npm install

# Run with a custom prompt
OPENAI_API_KEY=sk-... npm start "Analyze the power fluctuation in sector 12"

# Run with default sentinel prompt
OPENAI_API_KEY=sk-... npm start
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | ✅ | — | OpenAI API key |
| `OPENAI_MODEL` | — | `gpt-4o-mini` | Model to use for reasoning |

## Project Structure

```
sentinel-agent/
├── src/
│   └── index.ts      # Agent entry point
├── package.json
└── tsconfig.json
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Run the agent (via `tsx`) |
| `npm run dev` | Run with file watching |
| `npm run build` | Compile TypeScript to `dist/` |

## Tech Stack

- **[Volcano SDK](https://volcano.dev)** — multi-provider AI agent framework
- **OpenAI** — LLM provider (via Volcano SDK)
- **TypeScript** — type-safe implementation
- **tsx** — fast TypeScript execution without a build step

