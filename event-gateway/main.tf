terraform {
  required_version = ">= 1.0"

  required_providers {
    konnect-beta = {
      source  = "Kong/konnect-beta"
      version = "~> 0.14.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
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

  labels = {
    env        = "simulation"
    location   = "new-york"
    year       = "1999"
    tier       = "bluepill"
  }

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

  labels = {
    env        = "simulation"
    location   = "los-angeles"
    year       = "2024"
    tier       = "redpill"
  }

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

  labels = {
    env        = "production"
    location   = "machine-city"
    tier       = "core"
    clearance  = "maximum"
  }

  destination = {
    id = konnect_event_gateway_backend_cluster.backend_cluster.id
  }

  acl_mode  = "passthrough"
  dns_label = "machine-city-core"

  authentication = [{anonymous = {
    
  }}]

  depends_on = [konnect_event_gateway.event_gateway_terraform, konnect_event_gateway_backend_cluster.backend_cluster]
}

# ============================================================================
# Listeners
# ============================================================================

resource "konnect_event_gateway_listener" "sim_1999_ny" {
  provider   = konnect-beta
  name       = "sim-1999-ny-listener"
  gateway_id = konnect_event_gateway.event_gateway_terraform.id
  addresses  = ["0.0.0.0"]
  ports      = ["19192-19290"]

  depends_on = [konnect_event_gateway.event_gateway_terraform]
}

resource "konnect_event_gateway_listener" "sim_2026_la" {
  provider   = konnect-beta
  name       = "sim-2024-la-listener"
  gateway_id = konnect_event_gateway.event_gateway_terraform.id
  addresses  = ["0.0.0.0"]
  ports      = ["19292-19390"]

  depends_on = [konnect_event_gateway.event_gateway_terraform]
}

resource "konnect_event_gateway_listener" "machine_city_core" {
  provider   = konnect-beta
  name       = "machine-city-core-listener"
  gateway_id = konnect_event_gateway.event_gateway_terraform.id
  addresses  = ["0.0.0.0"]
  ports      = ["19092-19190"]

  depends_on = [konnect_event_gateway.event_gateway_terraform]
}

# ============================================================================
# Forwarding Policies (Port Mapping)
# ============================================================================

resource "konnect_event_gateway_listener_policy_forward_to_virtual_cluster" "sim_1999_ny" {
  provider                  = konnect-beta
  name                      = "forward-to-sim-1999-ny"
  gateway_id                = konnect_event_gateway.event_gateway_terraform.id
  event_gateway_listener_id = konnect_event_gateway_listener.sim_1999_ny.id

  config = {
    port_mapping = {
      advertised_host = "localhost"
      bootstrap_port  = "none"
      min_broker_id   = 0
      destination = {
        virtual_cluster_reference_by_id = {
          id = konnect_event_gateway_virtual_cluster.sim_1999_ny.id
        }
      }
    }
  }
}

resource "konnect_event_gateway_listener_policy_forward_to_virtual_cluster" "sim_2026_la" {
  provider                  = konnect-beta
  name                      = "forward-to-sim-2024-la"
  gateway_id                = konnect_event_gateway.event_gateway_terraform.id
  event_gateway_listener_id = konnect_event_gateway_listener.sim_2026_la.id

  config = {
    port_mapping = {
      advertised_host = "localhost"
      bootstrap_port  = "none"
      min_broker_id   = 0
      destination = {
        virtual_cluster_reference_by_id = {
          id = konnect_event_gateway_virtual_cluster.sim_2026_la.id
        }
      }
    }
  }
}

resource "konnect_event_gateway_listener_policy_forward_to_virtual_cluster" "machine_city_core" {
  provider                  = konnect-beta
  name                      = "forward-to-machine-city-core"
  gateway_id                = konnect_event_gateway.event_gateway_terraform.id
  event_gateway_listener_id = konnect_event_gateway_listener.machine_city_core.id

  config = {
    port_mapping = {
      advertised_host = "localhost"
      bootstrap_port  = "none"
      min_broker_id   = 0
      destination = {
        virtual_cluster_reference_by_id = {
          id = konnect_event_gateway_virtual_cluster.machine_city_core.id
        }
      }
    }
  }
}
