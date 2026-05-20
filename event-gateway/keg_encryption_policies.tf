# ============================================================================
# Encrypt + Decrypt Policies
# ============================================================================


# Generate a 32-byte random key and encode it in base64 only if not provided
resource "random_bytes" "sentinal_encryption_key" {
  count  = var.sentinel_encryption_key == null ? 1 : 0
  length = 32
}

locals {
  effective_encryption_key = var.sentinel_encryption_key != null ? var.sentinel_encryption_key : (length(random_bytes.sentinal_encryption_key) > 0 ? random_bytes.sentinal_encryption_key[0].base64 : null)
}

resource "konnect_event_gateway_static_key" "sentinal_encryption_key" {
  provider    = konnect
  name        = "sentinel_encryption_key"
  description = "Encryption key for transactions topic"
  gateway_id  = konnect_event_gateway.event_gateway_terraform.id
  value       = local.effective_encryption_key
}

resource "konnect_event_gateway_produce_policy_encrypt" "name" {
  provider           = konnect
  name               = "sentinal_encryption_policy"
  description        = "Encrypted transactions for sentinals"
  gateway_id         = konnect_event_gateway.event_gateway_terraform.id
  virtual_cluster_id = konnect_event_gateway_virtual_cluster.machine_city_core.id

  condition = "context.topic.name == \"dock_sector_patrol_logs\""
  config = {
    failure_mode   = "error"
    part_of_record = ["value"]
    encryption_key = {
      static = {
        key = {
          id = konnect_event_gateway_static_key.sentinal_encryption_key.id
        }
      }
    }
  }
}

resource "konnect_event_gateway_consume_policy_decrypt" "name" {
  provider           = konnect
  name               = "sentinal_decryption_policy"
  description        = "Decrypted transactions for sentinals"
  gateway_id         = konnect_event_gateway.event_gateway_terraform.id
  virtual_cluster_id = konnect_event_gateway_virtual_cluster.machine_city_core.id

  condition = "context.topic.name == \"dock_sector_patrol_logs\""
  config = {
    failure_mode   = "error"
    part_of_record = ["value"]
    key_sources = [{
      static = {}
    }]
  }

}
