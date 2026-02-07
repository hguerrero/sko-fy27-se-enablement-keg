# ============================================================================
# Virtual Clusters
# ============================================================================

resource "konnect_event_gateway_virtual_cluster" "sim_1999_ny" {
  provider    = konnect-beta
  name        = "Sim_1999_New_York"
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
      topics          = [{
          exact_list = {
            exact_list = [
              {
                backend = "weather_pattern_emulation"
              },
            ]
          }
        },
        {
          glob = {
            glob =  "system_*"
          }
        }
      ]
    }
  }

  authentication = [{anonymous = {

  }}]

  depends_on = [konnect_event_gateway.event_gateway_terraform, konnect_event_gateway_backend_cluster.backend_cluster]
}

resource "konnect_event_gateway_virtual_cluster" "sim_2026_la" {
  provider    = konnect-beta
  name        = "Sim_2024_Los_Angeles"
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
      topics          = [{
          exact_list = {
            exact_list = [
              {
                backend = "weather_pattern_emulation"
              }
            ]
          }
        },
        {
          glob = {
            glob =  "system_*"
          }
        }
      ]
    }
  }

  authentication = [
    {anonymous = {

    }},
    {
      sasl_plain = {
        mediation = "terminate"
        principals = [
          {
            username = "redpill-rebels"
            password = "secret"
          }
        ]
      }
    }
  ]

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

  # namespace = {
  #   prefix = "sko."
  #   mode   = "hide_prefix"
  #   additional = {
  #     consumer_groups = [{}]
  #     topics          = []
  #   }
  # }

  depends_on = [konnect_event_gateway.event_gateway_terraform, konnect_event_gateway_backend_cluster.backend_cluster]
}

