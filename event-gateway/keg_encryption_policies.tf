# ============================================================================
# Encrypt + Decrypt Policies
# ============================================================================

# Generate a 32-byte random key and encode it in base64
# Equivalent to: openssl rand -base64 32
# resource "random_bytes" "sentinal_encryption_key" {
#   length = 32
# }

# resource "konnect_event_gateway_static_key" "sentinal_encryption_key" {
#   provider    = konnect-beta
#   name        = "sentinel_encryption_key"
#   description = "Encryption key for transactions topic"
#   gateway_id  = konnect_event_gateway.event_gateway_terraform.id
#   value       = "$${vault.env['SENTINAL_ENCRYPTION_KEY']}"
# }

# resource "konnect_event_gateway_produce_policy_encrypt" "name" {
#   provider           = konnect-beta
#   name               = "sentinal_encryption_policy"
#   description        = "Encrypted transactions for sentinals"
#   gateway_id         = konnect_event_gateway.event_gateway_terraform.id
#   virtual_cluster_id = konnect_event_gateway_virtual_cluster.machine_city_core.id

#   condition = "context.topic.name == \"dock_sector_patrol_logs\""
#   config = {
#     failure_mode = "error"
#     part_of_record = ["value"]
#     encryption_key = {
#       static = {
#         key = {
#           reference_by_id = {
#             id = konnect_event_gateway_static_key.sentinal_encryption_key.id
#           }
#         }
#       }
#     }

#   }
# }

# resource "konnect_event_gateway_consume_policy_decrypt" "name" {
#   provider = konnect-beta
#   name = "sentinal_decryption_policy"
#   description = "Decrypted transactions for sentinals"
#   gateway_id = konnect_event_gateway.event_gateway_terraform.id
#   virtual_cluster_id = konnect_event_gateway_virtual_cluster.machine_city_core.id

#   condition = "context.topic.name == \"dock_sector_patrol_logs\""
#   config = {
#     failure_mode = "error"
#     part_of_record = ["value"]
#     key_sources = [{
#       static = {}
#     }]
#   }

# }