terraform {
  required_version = ">= 1.0"

  required_providers {
    konnect-beta = {
      source  = "Kong/konnect-beta"
      version = "~> 0.14.0"
    }
  }
}

# ============================================================================
# Event Gateway Resource
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

  authentication = {
    sasl_plain = {
      username = "$${env['KAFKA_USERNAME']}"
      password = "$${env['KAFKA_PASSWORD']}"
    }
  }

  bootstrap_servers = var.backend_cluster_bootstrap_servers

  tls = {
    enabled = true
  }

  insecure_allow_anonymous_virtual_cluster_auth = true

  depends_on = [konnect_event_gateway.event_gateway_terraform]
}

# ============================================================================
# Virtual Clusters
# ============================================================================

resource "konnect_event_gateway_virtual_cluster" "sim_1999_ny" {
  provider    = konnect-beta
  name        = "Sim_1999_NY"
  description = "Simulation layer replicating late 20th-century New York. Primary interface for bluepill event streams and anomaly detection feeds."
  gateway_id  = konnect_event_gateway.event_gateway_terraform.id

  destination = {
    id = konnect_event_gateway_backend_cluster.backend_cluster.id
  }

  acl_mode  = "enforce_on_gateway"
  dns_label = "sim-1999-ny"

  namespace = {
    prefix = "WORLD_NY_1999."
    mode   = "hide_prefix"
    additional = {
      consumer_groups = [{}]
      topics          = []
    }
  }

  authentication = [{anonymous = {
    
  }}]

  depends_on = [konnect_event_gateway.event_gateway_terraform, konnect_event_gateway_backend_cluster.backend_cluster]
}

resource "konnect_event_gateway_virtual_cluster" "sim_2026_la" {
  provider    = konnect-beta
  name        = "Sim_2024_LA"
  description = "Simulation layer replicating mid-2020s Los Angeles. Handles redpill recruitment signals and resistance cell coordination events."
  gateway_id  = konnect_event_gateway.event_gateway_terraform.id

  destination = {
    id = konnect_event_gateway_backend_cluster.backend_cluster.id
  }

  acl_mode  = "enforce_on_gateway"
  dns_label = "sim-2024-la"

  namespace = {
    prefix = "WORLD_LA_2024."
    mode   = "hide_prefix"
    additional = {
      consumer_groups = [{}]
      topics          = []
    }
  }

  authentication = [{anonymous = {
    
  }}]

  depends_on = [konnect_event_gateway.event_gateway_terraform, konnect_event_gateway_backend_cluster.backend_cluster]
}

resource "konnect_event_gateway_virtual_cluster" "machine_city_core" {
  provider    = konnect-beta
  name        = "Machine_City_Core"
  description = "Central nervous system of the Machine City. Processes sentinel telemetry, power grid metrics, and pod lifecycle events. Highest clearance required."
  gateway_id  = konnect_event_gateway.event_gateway_terraform.id

  destination = {
    id = konnect_event_gateway_backend_cluster.backend_cluster.id
  }

  acl_mode  = "enforce_on_gateway"
  dns_label = "machine-city-core"

  authentication = [{anonymous = {
    
  }}]

  depends_on = [konnect_event_gateway.event_gateway_terraform, konnect_event_gateway_backend_cluster.backend_cluster]
}

