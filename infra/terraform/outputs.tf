output "app_instance_id" {
  description = "EC2 instance ID for the application host."
  value       = aws_instance.app.id
}

output "app_public_ip" {
  description = "Public IPv4 address of the application host."
  value       = aws_instance.app.public_ip
}

output "app_private_ip" {
  description = "Private IPv4 address used by Nagios to monitor the application host."
  value       = aws_instance.app.private_ip
}

output "app_url" {
  description = "Frontend URL. Configure the frontend build's VITE_API_URL to the backend API URL separately."
  value       = "http://${aws_instance.app.public_ip}"
}

output "backend_api_url" {
  description = "Backend health-check URL."
  value       = "http://${aws_instance.app.public_ip}:5000/health"
}

output "nagios_instance_id" {
  description = "EC2 instance ID for the Nagios host."
  value       = aws_instance.nagios.id
}

output "nagios_public_ip" {
  description = "Public IPv4 address of the Nagios host."
  value       = aws_instance.nagios.public_ip
}

output "nagios_private_ip" {
  description = "Private IPv4 address used for internal monitoring."
  value       = aws_instance.nagios.private_ip
}

output "nagios_url" {
  description = "Nagios web interface URL, reachable only from nagios_ui_allowed_cidr."
  value       = "http://${aws_instance.nagios.public_ip}/nagios4"
}
