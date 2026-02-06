import { agent, llmOpenAI } from "volcano-sdk";

// ---------------------------------------------------------------------------
// LLM – uses OpenAI via Volcano SDK (set OPENAI_API_KEY env var)
// ---------------------------------------------------------------------------
const llm = llmOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
});

// ---------------------------------------------------------------------------
// Sentinel agent – single-prompt LLM reasoning
// ---------------------------------------------------------------------------
const prompt = process.argv.slice(2).join(" ") || "You are a Matrix anomaly-detection sentinel. What is the target and where it was last seen? If you don't know answer in one sentence I don't have a current target.";

async function main() {
  console.log(`🔴 Sentinel Agent activated`);
  // console.debug(`   Prompt: "${prompt}"\n`);

  const results = await agent({ llm, name: "sentinel", hideProgress: true })
    .then({ prompt })
    .run();

  const output = results[results.length - 1]?.llmOutput ?? "(no response)";
  console.log(`\n🟢 Response:\n${output}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

