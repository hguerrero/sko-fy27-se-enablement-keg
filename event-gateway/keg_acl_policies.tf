# ============================================================================
# ACL Policies
# ============================================================================

resource "konnect_event_gateway_cluster_policy_acls" "acl_sim_1999_ny" {
  provider           = konnect-beta
  name               = "acl_sim_1999_ny"
  description        = "ACL policy for ensuring access to topics based on principals"
  gateway_id         = konnect_event_gateway.event_gateway_terraform.id
  virtual_cluster_id = konnect_event_gateway_virtual_cluster.sim_1999_ny.id

  config = {
    rules = [
      {
        action = "allow"
        operations = [
          { name = "describe" },
          { name = "read" },
          { name = "write" }
        ]
        resource_type = "topic"
        resource_names = [{
          match = "*"
        }]
      },
      {
        action = "deny"
        operations = [
          { name = "describe" },
          { name = "read" },
          { name = "write" }
        ]
        resource_type = "topic"
        resource_names = [{
          match = "system_*"
        }]
      },
      {
        action = "allow"
        operations = [
          { name = "describe" },
          { name = "read" },
          { name = "write" },
          { name = "create" }
        ]
        resource_type = "group"
        resource_names = [{
          match = "*"
        }]
      }
    ]
  }
}

resource "konnect_event_gateway_cluster_policy_acls" "acl_sim_2026_la" {
  provider           = konnect-beta
  name               = "acl_sim_2026_la"
  description        = "ACL policy for ensuring access to topics based on principals"
  gateway_id         = konnect_event_gateway.event_gateway_terraform.id
  virtual_cluster_id = konnect_event_gateway_virtual_cluster.sim_2026_la.id

  condition = "context.auth.principal.name != 'redpill-rebels'"

  config = {
    rules = [
      {
        action = "allow"
        operations = [
          { name = "describe" },
          { name = "read" },
          { name = "write" }
        ]
        resource_type = "topic"
        resource_names = [{
          match = "*"
        }]
      },
      {
        action = "deny"
        operations = [
          { name = "describe" },
          { name = "read" },
          { name = "write" }
        ]
        resource_type = "topic"
        resource_names = [{
          match = "system_*"
        }]
      }
    ]
  }
}

resource "konnect_event_gateway_cluster_policy_acls" "acl_sim_2026_la_rebels" {
  provider           = konnect-beta
  name               = "acl_sim_2026_la_rebels"
  description        = "ACL policy for ensuring access to topics based on principals"
  gateway_id         = konnect_event_gateway.event_gateway_terraform.id
  virtual_cluster_id = konnect_event_gateway_virtual_cluster.sim_2026_la.id

  condition = "context.auth.principal.name == 'redpill-rebels'"

  config = {
    rules = [
      {
        action = "allow"
        operations = [
          { name = "describe" },
          { name = "read" },
          { name = "write" }
        ]
        resource_type = "topic"
        resource_names = [{
          match = "*"
        }]
      }
    ]
  }
}

