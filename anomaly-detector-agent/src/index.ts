import { Kafka, logLevel } from "kafkajs";
import { agent, llmOpenAI } from "volcano-sdk";

// ---------------------------------------------------------------------------
// Config – connects through KEG machine-city-core virtual cluster
// ---------------------------------------------------------------------------
const BROKER = process.env.KAFKA_BROKER ?? "localhost:19092";
// const USERNAME = process.env.KAFKA_USERNAME ?? "redpill-rebels";
// const PASSWORD = process.env.KAFKA_PASSWORD ?? "secret";

const INPUT_TOPIC = "WORLD_NY_1999.subway_commuter_density";
const TRIGGER_TOPIC = "anomaly_detection_pings";
const ENRICHED_TOPIC = "knowledge_ingestion";

// ---------------------------------------------------------------------------
// LLM – uses OpenAI via Volcano SDK (set OPENAI_API_KEY env var)
// ---------------------------------------------------------------------------
const llm = llmOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
});

// ---------------------------------------------------------------------------
// Kafka client (KafkaJS) with SASL/PLAIN through KEG gateway
// ---------------------------------------------------------------------------
const kafka = new Kafka({
  clientId: "sko-anomaly-detector-agent",
  brokers: [BROKER],
  // sasl: { mechanism: "plain", username: USERNAME, password: PASSWORD },
  logLevel: logLevel.WARN
});

const consumer = kafka.consumer({ groupId: "sko-anomaly-detector-agent" });
const producer = kafka.producer();

// ---------------------------------------------------------------------------
// Anomaly analysis agent – single LLM step powered by Volcano SDK
// ---------------------------------------------------------------------------
async function analyzeMessage(raw: string): Promise<{
  triggerPayload: string;
  enrichedPayload: string;
}> {
  const results = await agent({ llm, hideProgress: true })
    .then({
      prompt: `You are a Matrix anomaly-detection sentinel. Analyze the following machine
status event and determine if it represents an anomaly or noteworthy pattern.

Event payload:
${raw}

Respond STRICTLY as JSON with these fields:
{
  "is_anomaly": boolean,
  "severity": "low" | "medium" | "high" | "critical",
  "analysis": "<one-sentence explanation>",
  "recommended_action": "<what other agents should do>",
  "enriched_event": { <original fields plus your added context fields> }
}`,
    })
    .run();

  const llmOutput = results[results.length - 1]?.llmOutput ?? "{}";

  // Parse the LLM JSON response (strip markdown fences if present)
  const cleaned = llmOutput.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  // Build the trigger message for other agents
  const trigger = {
    source: "anomaly-detector-agent",
    timestamp: new Date().toISOString(),
    is_anomaly: parsed.is_anomaly,
    severity: parsed.severity,
    recommended_action: parsed.recommended_action,
    original_event: JSON.parse(raw),
  };

  // Build the enriched message for vector DB / RAG storage
  const enriched = {
    ...parsed.enriched_event,
    _analysis: parsed.analysis,
    _severity: parsed.severity,
    _is_anomaly: parsed.is_anomaly,
    _analyzed_at: new Date().toISOString(),
    _agent: "anomaly-detector-agent",
  };

  return {
    triggerPayload: JSON.stringify(trigger),
    enrichedPayload: JSON.stringify(enriched),
  };
}

// ---------------------------------------------------------------------------
// Main loop – consume → analyze → produce
// ---------------------------------------------------------------------------
async function main() {
  console.log("🔴 Anomaly Detector Agent initializing...");
  console.log(`   Broker : ${BROKER}`);
  console.log(`   Input  : ${INPUT_TOPIC}`);
  console.log(`   Outputs: ${TRIGGER_TOPIC}, ${ENRICHED_TOPIC}`);

  await consumer.connect();
  await producer.connect();
  await consumer.subscribe({ topic: INPUT_TOPIC, fromBeginning: true });

  console.log("🟢 Listening for machine status events...\n");

  await consumer.run({
    eachMessage: async ({ message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      console.log(`⚡ Received event: ${raw}`);

      try {
        const { triggerPayload, enrichedPayload } = await analyzeMessage(raw);

        await producer.send({
          topic: TRIGGER_TOPIC,
          messages: [{ key: message.key, value: triggerPayload }],
        });

        await producer.send({
          topic: ENRICHED_TOPIC,
          messages: [{ key: message.key, value: enrichedPayload }],
        });

        console.log(`✅ Processed → trigger + enriched messages produced\n`);
      } catch (err) {
        console.error("❌ Failed to process event:", err);
      }
    },
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

