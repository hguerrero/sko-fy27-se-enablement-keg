# KEG Data Plane Docker Container
# Runs the Kong Event Gateway data plane container using the generated certificates

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

  # Port range 19092-19101 mapped 1:1
  dynamic "ports" {
    for_each = range(19092, 19290)
    content {
      internal = ports.value
      external = ports.value
    }
  }

  restart = "unless-stopped"

  depends_on = [
    konnect_event_gateway_data_plane_certificate.keg_data_plane_cert
  ]
}

