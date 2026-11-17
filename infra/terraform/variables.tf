variable "aws_region" {
  description = "AWS region in which to create the infrastructure."
  type        = string
}

variable "project_name" {
  description = "Project name used in resource names and tags."
  type        = string
  default     = "devops-observatory"

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]+$", var.project_name))
    error_message = "project_name may contain only letters, numbers, and hyphens."
  }
}

variable "ssh_key_name" {
  description = "Name of an existing EC2 key pair used for SSH administration."
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH to either instance. Use a trusted /32 where possible."
  type        = string

  validation {
    condition     = can(cidrhost(var.ssh_allowed_cidr, 0))
    error_message = "ssh_allowed_cidr must be a valid IPv4 CIDR."
  }
}

variable "nagios_ui_allowed_cidr" {
  description = "CIDR allowed to access the Nagios web interface on port 80."
  type        = string

  validation {
    condition     = can(cidrhost(var.nagios_ui_allowed_cidr, 0))
    error_message = "nagios_ui_allowed_cidr must be a valid IPv4 CIDR."
  }
}

variable "app_api_allowed_cidr" {
  description = "CIDR allowed to reach the backend's existing public port 5000."
  type        = string

  validation {
    condition     = can(cidrhost(var.app_api_allowed_cidr, 0))
    error_message = "app_api_allowed_cidr must be a valid IPv4 CIDR."
  }
}

variable "vpc_cidr" {
  description = "IPv4 CIDR for the dedicated VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "public_subnet_cidr" {
  description = "IPv4 CIDR for the public subnet containing both EC2 instances."
  type        = string
  default     = "10.40.1.0/24"
}

variable "app_instance_type" {
  description = "EC2 instance type for the application host."
  type        = string
  default     = "t3.small"
}

variable "nagios_instance_type" {
  description = "EC2 instance type for the Nagios host."
  type        = string
  default     = "t3.small"
}

variable "root_volume_size" {
  description = "Encrypted gp3 root-volume size in GiB for each instance."
  type        = number
  default     = 20

  validation {
    condition     = var.root_volume_size >= 8
    error_message = "root_volume_size must be at least 8 GiB."
  }
}
