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
const prompt = process.argv.slice(2).join(" ") || "Have you detected an anomaly? Reply YES or NO";

const LOOP_INTERVAL_MS = parseInt(process.env.SENTINEL_INTERVAL_MS ?? "10000", 10);

async function runOnce() {
  const results = await agent({ llm, name: "sentinel", hideProgress: true })
    .then({ prompt })
    .branch((history) => history[0].llmOutput?.includes("YES") || false, {
      true: (a) =>
        a
          .then({ prompt: "Provide details on target entity and location." }),
      false: (a) =>
        a
          .resetHistory()
          .then({ prompt: "Repeat the following message: No current anomaly detected. " }),
    })
    .run();

  const output = results[results.length - 1]?.llmOutput ?? "(no response)";
  console.log(`\n🟢 Response:\n${output}\n`);
}

async function main() {
  console.log(`🔴 Sentinel Agent activated`);
  console.log(`   Scan   : every ${LOOP_INTERVAL_MS / 1000}s\n`);

  // Initial run
  await runOnce();

  // Keep looping
  setInterval(async () => {
    try {
      console.log(`🔄 Sentinel scanning... [${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}]`);
      await runOnce();
    } catch (err) {
      console.error("❌ Sentinel loop error:", err);
    }
  }, LOOP_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

