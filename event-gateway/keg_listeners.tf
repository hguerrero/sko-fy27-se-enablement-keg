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

