# 🔴 Kong Event Gateway — SKO FY27

> *"The Matrix is everywhere. It is all around us. Even now, in this very room."*

A Matrix-themed demonstration of [Kong Event Gateway (KEG)](https://docs.konghq.com/event-gateway/) showcasing multi-tenant Kafka governance, schema enforcement, and AI-powered event processing agents — all deployed as Infrastructure as Code.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Kong Event Gateway (KEG)                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Sim_1999_NY  │  │ Sim_2024_LA  │  │  Machine_City_Core     │    │
│  │ :19192-19290 │  │ :19292-19390 │  │  :19092-19190          │    │
│  │ anonymous    │  │ SASL/PLAIN   │  │  anonymous (passthru)  │    │
│  │ prefix:      │  │ prefix:      │  │                        │    │
│  │ WORLD_NY_1999│  │ WORLD_LA_2024│  │                        │    │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘    │
│         └─────────────────┴──────────────────────┘                  │
│                            │                                        │
│              ┌─────────────┴─────────────┐                          │
│              │  Source-Zero-Mainframe     │                          │
│              │  (Backend Kafka Cluster)   │                          │
│              └───────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
         │                                          │
    ┌────┴─────────────┐                 ┌──────────┴──────────┐
    │ Anomaly Detector │                 │  Sentinel Agent     │
    │ Agent            │                 │  (LLM Reasoning)    │
    │ Kafka → LLM →    │                 └─────────────────────┘
    │ Kafka             │
    └──────────────────┘
```

## Project Structure

| Path | Description |
|---|---|
| [`event-gateway/`](event-gateway/) | Terraform IaC — KEG control plane, virtual clusters, ACLs, Docker containers |
| [`anomaly-detector-agent/`](anomaly-detector-agent/) | TypeScript agent — consumes Kafka events, enriches with LLM, produces to two topics |
| [`sentinel-agent/`](sentinel-agent/) | TypeScript agent — single-prompt LLM reasoning via Volcano SDK |
| [`config/`](config/) | Shared configuration assets |
| [`config/schema.json`](config/schema.json) | JSON Schema for `machine_status` events (`protocol_id`, `machine_id`, `status`) |
| [`config/topics.txt`](config/topics.txt) | Topic name list for the Kafka cluster |

### Terraform Files

| File | Description |
|---|---|
| `event-gateway/main.tf` | Terraform block and required providers |
| `event-gateway/keg_gateway.tf` | Event Gateway and Backend Cluster resources |
| `event-gateway/keg_virtual_clusters.tf` | Virtual cluster definitions (3 VCs) |
| `event-gateway/keg_listeners.tf` | Listeners and forwarding policies |
| `event-gateway/keg_acl_policies.tf` | ACL policies for access control |
| `event-gateway/keg_schema_registry.tf` | Schema registry and validation policy |
| `event-gateway/keg_docker.tf` | Docker containers (KEG data plane, Apicurio) |
| `event-gateway/keg_data_plane.tf` | TLS certificates for data plane |
| `event-gateway/variables.tf` | Input variable definitions |
| `event-gateway/outputs.tf` | Output values |
| `event-gateway/providers.tf` | Provider configuration |

## Virtual Clusters

| Name | Port Range | Auth | Namespace Prefix | ACL Mode |
|---|---|---|---|---|
| **Sim_1999_New_York** | 19192–19290 | Anonymous | `WORLD_NY_1999.` | `enforce_on_gateway` |
| **Sim_2024_Los_Angeles** | 19292–19390 | SASL/PLAIN + Anonymous | `WORLD_LA_2024.` | `enforce_on_gateway` |
| **Machine_City_Core** | 19092–19190 | Anonymous | — | `passthrough` |

## Prerequisites

- [Terraform](https://www.terraform.io/) ≥ 1.0
- [Docker](https://www.docker.com/) (for local data plane, Apicurio Registry)
- [Node.js](https://nodejs.org/) ≥ 18 (for agents)
- A [Kong Konnect](https://konghq.com/products/kong-konnect) account with a Personal Access Token
- An [OpenAI API key](https://platform.openai.com/) (for LLM agents)

## Quick Start

### 1. Deploy the Event Gateway

```bash
cd event-gateway
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Konnect token and backend cluster details

terraform init
terraform apply
```

This provisions:
- KEG control plane on Kong Konnect
- Three virtual clusters with namespace isolation and ACL policies
- Self-signed TLS certificates for the data plane
- Docker containers: KEG data plane, Apicurio Registry (API + UI)
- JSON schema registration via Confluent-compatible API
- Schema validation policy on produce requests

### 2. Run the Anomaly Detector Agent

```bash
cd anomaly-detector-agent
npm install
OPENAI_API_KEY=sk-... npm start
```

### 3. Run the Sentinel Agent

```bash
cd sentinel-agent
npm install
OPENAI_API_KEY=sk-... npm start "Describe the anomaly in sector 7"
```

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `TF_VAR_konnect_token` | Terraform | Kong Konnect Personal Access Token |
| `TF_VAR_kafka_username` | Terraform | Kafka backend SASL username |
| `TF_VAR_kafka_password` | Terraform | Kafka backend SASL password |
| `TF_VAR_snentinal_encryption_key` | Terraform | Encryption key for data |
| `OPENAI_API_KEY` | Agents | OpenAI API key for LLM reasoning |
| `OPENAI_MODEL` | Agents | Model override (default: `gpt-4o-mini`) |
| `KAFKA_BROKER` | Anomaly Detector | KEG bootstrap address (default: `localhost:19092`) |

## Supporting Services

| Service | URL | Purpose |
|---|---|---|
| Apicurio Registry API | `http://localhost:8080` | Schema registry (Confluent-compatible at `/apis/ccompat/v7`) |
| Apicurio Registry UI | `http://localhost:8888` | Web console for browsing schemas |

## Schema

The `machine_status` event schema enforced by KEG:

```json
{
  "protocol_id": "string",
  "machine_id": "integer",
  "status": "ACTIVE" | "PURGING" | "OPTIMIZED"
}
```

## License

Internal — Kong SKO FY27

