# ============================================================================
# Konnect Configuration
# ============================================================================

variable "konnect_server_url" {
  type        = string
  description = "Which Konnect instance to point at"
  default     = "https://us.api.konghq.com"
}

variable "konnect_token" {
  type        = string
  description = "API token to reach Konnect"
  sensitive   = true
}

# ============================================================================
# Event Gateway Configuration
# ============================================================================

variable "event_gateway_name" {
  type        = string
  description = "Name of the Event Gateway instance"
  default     = "event_gateway_terraform"
}

variable "backend_cluster_bootstrap_servers" {
  description = "List of bootstrap servers"
  type        = list(string)
  default = [
    "kafka1:9092",
    "kafka2:9092",
    "kafka3:9092"
  ]
}

# ============================================================================
# Authentication Configuration
# ============================================================================

# variable "jwks_endpoint" {
#   type        = string
#   description = "JWKS endpoint URL for OAuth Bearer token validation"
# }

# variable "client_id_1" {
#   type        = string
#   description = "Client ID for the first principal (full access)"
# }

# variable "client_id_2" {
#   type        = string
#   description = "Client ID for the second principal (limited access)"
# }

