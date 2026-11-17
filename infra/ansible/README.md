# Ansible deployment

This configuration sets up the application host, deploys the existing production Compose stack, and configures Nagios. It copies `docker-compose.prod.yml` from the repository as-is and layers the additive `docker-compose.deploy.yml` override on top to select a commit-specific image tag.

## Prerequisites

- Ansible installed on a Linux controller (a Linux/WSL environment or CI runner).
- SSH access to the application EC2 instance using the key pair selected in Terraform.
- The application host's Terraform-created security group permits SSH from the controller's public IPv4 CIDR.
- Docker Hub credentials and the backend API keys listed below, available to the controller as environment variables.

Copy `inventory/hosts.yml.example` to `inventory/hosts.yml`. Replace the example public addresses with the Terraform `app_public_ip` and `nagios_public_ip` outputs, and set `ansible_ssh_private_key_file` to the private key path on the controller. The ignored `hosts.yml` file should not be committed.

## Deploy

Provide these variables through a secure environment or secrets manager on the Ansible controller:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `OPENROUTER_API_KEY`
- `GITHUB_TOKEN` (a long-lived read-only token for the deployed backend)
- Optional: `FRONTEND_URL` (defaults to `*`, matching the backend's current CORS default)

From this directory, check connectivity and run the playbook:

```sh
ansible app -m ansible.builtin.ping
ansible-playbook playbooks/deploy-app.yml
```

The playbook installs Ubuntu's Docker Engine and Compose plugin, writes the runtime `.env` file with mode `0600`, authenticates to Docker Hub in a temporary credential directory, pulls the images selected by the production Compose file and additive override, starts the stack, then waits for frontend HTTP and backend `/health` checks. `IMAGE_TAG` selects the published tag and defaults to `latest` for manual use; the deployment workflow supplies the triggering commit SHA. A failed prerequisite or health check fails the playbook.

The existing Compose file uses the `latest` image tags. The additive override selects the image tag passed by the deployment workflow. The frontend Dockerfile retains its local-build default and accepts a build-time `VITE_API_URL`; the publishing workflow sets that to the current Terraform app endpoint.

## Configure Nagios monitoring

The Nagios phase uses the same inventory. Set `nagios_private_ip` under the `app` inventory group to Terraform's `nagios_private_ip` output and `observatory_app_private_ip` under the `nagios` group to `app_private_ip`. Set `NAGIOS_WEB_PASSWORD` in the Ansible controller environment to a strong password of at least 12 characters. Then run:

```sh
ansible-playbook playbooks/configure-nagios.yml
```

The playbook installs NRPE and CPU-load, memory, and root-disk checks on the app host, then installs Nagios Core and HTTP checks on the monitor host. Nagios checks the app host over its private address. NRPE is allowed only from the Nagios private address and the app security group; the Nagios web UI has HTTP Basic authentication and is additionally restricted to `nagios_ui_allowed_cidr` by the Terraform security group.

The local memory plugin can be tested without an EC2 host using `python -m unittest discover -s playbooks/tests`.

The GitHub deployment workflow connects through AWS Systems Manager, so the EC2 bootstrap installs `curl` and the workflow needs a separate private S3 bucket for Ansible file transfers. The SSM connection collection and its IAM permissions are documented in the repository deployment guide.

## GitHub Actions deployment

The `Deploy to AWS EC2` workflow runs after the existing image-publishing workflow succeeds on `main`; publishing itself waits for CI to pass for the same commit. It uses the published commit SHA for both Docker image tags, then deploys those exact images and applies the Nagios playbook through SSM. The workflow uses a protected GitHub `production` environment.

Configure these repository variables:

- `AWS_REGION`
- `AWS_DEPLOY_ROLE_ARN`
- `TF_STATE_BUCKET`
- `ANSIBLE_SSM_BUCKET` (a dedicated private S3 bucket in the same region; enable encryption and block public access)

Configure these repository secrets:

- `DOCKERHUB_TOKEN`
- `OPENROUTER_API_KEY`
- `GITHUB_API_TOKEN` (a long-lived, read-only token for the deployed backend)
- `NAGIOS_WEB_PASSWORD` (at least 12 characters)

The backend needs `GITHUB_API_TOKEN` after the workflow finishes, so do not pass the short-lived Actions `GITHUB_TOKEN` as its runtime credential. The deployment workflow maps the `GITHUB_API_TOKEN` secret to the Ansible environment variable `GITHUB_TOKEN`. The Docker Hub username matches the existing image-publishing workflow. The deploy role's OIDC trust policy should allow only this repository's `main` branch for the CD workflow and this repository's `production` environment for the deployment workflow. Give it only the access it needs: Terraform state read/lock access, `ec2:DescribeInstances`, required SSM describe/start/resume/terminate-session actions for these two EC2 instances and the Session Manager shell document, and S3 bucket/location/object read-write-delete access for the Ansible transfer bucket. The transfer bucket should have public access blocked, encryption enabled, and a lifecycle rule to expire any objects left behind after a failed transfer. The EC2 role already includes `AmazonSSMManagedInstanceCore`.

The infrastructure workflow separately needs a repository variable `AWS_TERRAFORM_ROLE_ARN` for an OIDC role that can manage the Terraform resources and the state bucket. Set a required-reviewer rule on the `production` environment before using the infrastructure or deployment workflows for live resources. No AWS access keys or SSH private keys are stored in GitHub.

Use the Terraform output `nagios_url` to open the Nagios interface. Nagios is served over HTTP in this phase; deploy it only on a trusted network/CIDR. HTTPS and notification delivery are not configured here.
