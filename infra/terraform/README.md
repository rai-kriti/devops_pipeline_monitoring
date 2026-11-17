# AWS infrastructure

This Terraform configuration creates a dedicated VPC and public subnet, an application EC2 instance, a separate Nagios EC2 instance, and the supporting security groups and EC2 Systems Manager instance profile. Ansible configuration and deployment are in `../ansible/`.

## Prerequisites

- Terraform 1.10 or later.
- AWS CLI credentials for an identity allowed to manage the resources in this configuration.
- An existing EC2 key pair in the chosen region.
- An existing S3 bucket for Terraform state. Enable bucket versioning, server-side encryption, and S3 Block Public Access before use. Restrict access to the bucket; the state file can contain infrastructure metadata.
- A trusted IPv4 CIDR for SSH access and the Nagios UI. Use a narrow CIDR such as your fixed public IP with `/32`.
- For Actions-based Ansible deployment, a separate private, encrypted S3 bucket for SSM file transfers. See `../ansible/README.md`.

The EC2 instances use the latest Canonical Ubuntu 24.04 LTS AMD64 image and an instance profile with `AmazonSSMManagedInstanceCore`. SSM access can be used as an alternative management path; SSH is limited to `ssh_allowed_cidr`.

## Configure and deploy

From this directory, copy `terraform.tfvars.example` to `terraform.tfvars` and set the region, existing key-pair name, and trusted CIDRs. The example uses documentation-only IP space; replace it before applying. `app_api_allowed_cidr` controls access to the existing backend port 5000. It is set to `0.0.0.0/0` in the example because the current Compose deployment publishes that API port; narrow it if your client access pattern permits.

Initialize the S3 backend, replacing the bucket and region values:

```powershell
terraform init `
  -backend-config="bucket=YOUR_STATE_BUCKET" `
  -backend-config="key=devops-observatory/terraform.tfstate" `
  -backend-config="region=YOUR_AWS_REGION" `
  -backend-config="encrypt=true" `
  -backend-config="use_lockfile=true"
```

Then review and apply the plan:

```powershell
terraform fmt -check -recursive
terraform validate
terraform plan
terraform apply
```

Terraform uses the standard AWS credential chain; do not put AWS credentials in `terraform.tfvars`. Review the plan and expected AWS costs before applying. The two instances, public IPv4 addresses, and EBS volumes incur charges while provisioned.

## Outputs and security boundaries

`terraform output` reports the app and Nagios public/private IP addresses and the service URLs. The app allows HTTP on port 80 and backend API traffic on port 5000; SSH is limited to the configured admin CIDR. Nagios HTTP and SSH are limited to their respective configured CIDRs. App-host NRPE traffic on TCP 5666 and ICMP echo checks are allowed only from the Nagios security group. Backend checks from Nagios are also allowed through the security-group reference. NRPE and the authenticated Nagios UI are configured by Ansible.

The deployment workflow reads the app instance ID from Terraform state and resolves its current public IP before building the frontend with the correct `VITE_API_URL`. The EC2 public IP is not elastic; if the app instance is replaced or stopped and restarted, rerun the image publishing workflow to rebuild the frontend with the current address.

The GitHub Actions infrastructure workflow is manually dispatched, defaults to a plan, and only applies after selecting `apply` and passing the configured `production` environment protection. Configure the repository variables `AWS_REGION`, `AWS_TERRAFORM_ROLE_ARN`, and `TF_STATE_BUCKET`. The Terraform role needs permission to manage the VPC, security groups, EC2 instances, instance profile, and related IAM resources in the target account. It uses AWS OIDC; no long-lived AWS access keys are required.

Destroying this configuration removes both EC2 instances and the network resources. Back up or retain any application data before doing so.
