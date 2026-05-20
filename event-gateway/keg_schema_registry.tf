# ============================================================================
# Schema Registry & Validation Policies
# ============================================================================

resource "konnect_event_gateway_schema_registry" "apicurio_schema_registry" {
  provider   = konnect
  gateway_id = konnect_event_gateway.event_gateway_terraform.id

  confluent = {
    name        = "Apicurio Schema Registry Compatibility Mode"
    description = "Confluent-compatible schema registry interface powered by Apicurio Registry. Provides centralized schema validation and evolution governance for all event streams traversing the Machine City network."

    labels = {
      env       = "production"
      role      = "schema-registry"
      tier      = "core"
      clearance = "elevated"
    }

    config = {
      endpoint        = "http://apicurio-registry:8080/apis/ccompat/v7"
      schema_type     = "json"
      timeout_seconds = 8
    }
  }
}

resource "konnect_event_gateway_produce_policy_schema_validation" "system_produce_schema_validation" {
  provider           = konnect
  name               = "system-produce-schema-validation"
  description        = "Enforces JSON schema validation on system_machine_status produce requests. Rejects non-conformant payloads to preserve data integrity across the Machine City telemetry pipeline."
  gateway_id         = konnect_event_gateway.event_gateway_terraform.id
  virtual_cluster_id = konnect_event_gateway_virtual_cluster.sim_2026_la.id

  labels = {
    env       = "production"
    role      = "schema-validation"
    tier      = "policy"
    clearance = "elevated"
  }

  enabled   = true
  condition = "context.topic.name == 'system_machine_status'"

  config = {
    confluent_schema_registry = {
      value_validation_action = "reject"

      schema_registry = {
        id = konnect_event_gateway_schema_registry.apicurio_schema_registry.id
      }
    }
  }
}

