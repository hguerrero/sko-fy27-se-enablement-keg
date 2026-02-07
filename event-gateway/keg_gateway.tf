# ============================================================================
# Event Gateway & Backend Cluster
# ============================================================================

resource "konnect_event_gateway" "event_gateway_terraform" {
  provider = konnect-beta
  name     = var.event_gateway_name
}

resource "konnect_event_gateway_backend_cluster" "backend_cluster" {
  provider    = konnect-beta
  name        = "Source-Zero-Mainframe"
  description = "The singular point of convergence for all bio-electric and heuristic event streams. This cluster facilitates the absolute synchronization between the simulated sub-layers and the Machine City Core. Unauthorized access results in immediate session pruning. Order is not an option; it is the architecture."
  gateway_id  = konnect_event_gateway.event_gateway_terraform.id

  labels = {
    env       = "production"
    role      = "source"
    tier      = "core"
    clearance = "maximum"
  }

  # authentication = {
  #   sasl_plain = {
  #     username = "$${env['KAFKA_USERNAME']}"
  #     password = "$${env['KAFKA_PASSWORD']}"
  #   }
  # }
  authentication = {
    anonymous = {
    }
  }

  bootstrap_servers = var.backend_cluster_bootstrap_servers

  tls = {
    enabled = false
    # enabled = true
  }

  insecure_allow_anonymous_virtual_cluster_auth = true

  depends_on = [konnect_event_gateway.event_gateway_terraform]
}

