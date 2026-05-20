# ============================================================================
# Event Gateway Outputs
# ============================================================================

output "event_gateway_id" {
  description = "The ID of the Event Gateway"
  value       = konnect_event_gateway.event_gateway_terraform.id
}

output "event_gateway_name" {
  description = "The name of the Event Gateway"
  value       = konnect_event_gateway.event_gateway_terraform.name
}

# Sentinel Encryption Key Output
output "sentinal_encryption_key_value" {
  description = "The base64-encoded Sentinel encryption key value (provided or generated)"
  value       = local.effective_encryption_key
  sensitive   = true
}

