# KEG Data Plane Docker Container
# Runs the Kong Event Gateway data plane container using the generated certificates

# Shared Docker network for all containers
resource "docker_network" "keg_network" {
  name = "keg-network"
}

# Pull the Kong Event Gateway image
resource "docker_image" "keg" {
  name         = "kong/kong-event-gateway:latest"
  keep_locally = true
}

# Run the KEG data plane container
resource "docker_container" "keg_data_plane" {
  name  = "keg-data-plane"
  image = docker_image.keg.image_id

  env = [
    "KONNECT_REGION=${var.konnect_region}",
    "KONNECT_DOMAIN=${var.konnect_domain}",
    "KONNECT_GATEWAY_CLUSTER_ID=${konnect_event_gateway.event_gateway_terraform.id}",
    "KONNECT_CLIENT_CERT=${tls_self_signed_cert.keg_data_plane.cert_pem}",
    "KONNECT_CLIENT_KEY=${tls_private_key.keg_data_plane.private_key_pem}",
    "KAFKA_USERNAME=${var.kafka_username}",
    "KAFKA_PASSWORD=${var.kafka_password}",
  ]

  # Port range 19092-19390 mapped 1:1
  dynamic "ports" {
    for_each = range(19092, 19390)
    content {
      internal = ports.value
      external = ports.value
    }
  }

  networks_advanced {
    name = docker_network.keg_network.id
  }

  restart = "unless-stopped"

  depends_on = [
    konnect_event_gateway_data_plane_certificate.keg_data_plane_cert
  ]
}

# ============================================================================
# Apicurio Registry API (Schema Registry)
# ============================================================================

# Pull the Apicurio Registry image
resource "docker_image" "apicurio_registry" {
  name         = "apicurio/apicurio-registry:3.1.7"
  keep_locally = true
}

# Run the Apicurio Registry API container (in-memory storage)
resource "docker_container" "apicurio_registry" {
  name  = "apicurio-registry"
  image = docker_image.apicurio_registry.image_id

  ports {
    internal = 8080
    external = 8080
  }

  networks_advanced {
    name = docker_network.keg_network.id
  }

  restart = "unless-stopped"
}

# ============================================================================
# Apicurio Registry UI
# ============================================================================

# Pull the Apicurio Registry UI image
resource "docker_image" "apicurio_registry_ui" {
  name         = "apicurio/apicurio-registry-ui:3.1.7"
  keep_locally = true
}

# Run the Apicurio Registry UI container
resource "docker_container" "apicurio_registry_ui" {
  name  = "apicurio-registry-ui"
  image = docker_image.apicurio_registry_ui.image_id

  # env = [
  #   "REGISTRY_API_URL=http://apicurio-registry:8080/apis/registry/v3",
  # ]

  ports {
    internal = 8080
    external = 8888
  }

  networks_advanced {
    name = docker_network.keg_network.id
  }

  restart = "unless-stopped"

  depends_on = [
    docker_container.apicurio_registry
  ]
}
