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