output "app_url" {
  description = "Public URL of the PlacementHub EC2 instance — open this in your browser"
  value       = "http://${aws_instance.app.public_ip}"
}

output "app_health_check" {
  description = "Direct health check endpoint URL"
  value       = "http://${aws_instance.app.public_ip}/api/health"
}

output "app_public_ip" {
  description = "Public IPv4 address of the PlacementHub instance"
  value       = aws_instance.app.public_ip
}

output "app_instance_id" {
  description = "EC2 instance ID (use with SSM Session Manager)"
  value       = aws_instance.app.id
}

output "s3_resumes_bucket" {
  description = "Created S3 Bucket for resumes and offer letters"
  value       = aws_s3_bucket.resumes.id
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Observability Dashboard direct link"
  value       = "https://${var.region}.console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group for application and system access logs"
  value       = aws_cloudwatch_log_group.app.name
}

output "shared_rds_database" {
  description = "Shared PostgreSQL Amazon RDS instance (Account A)"
  value       = "placementhub-db.cofeamqier1q.us-east-1.rds.amazonaws.com:5432"
}

output "shared_sns_topic_arn" {
  description = "Shared Amazon SNS drive alert broadcast topic (Account A)"
  value       = var.sns_topic_arn
}

output "local_sns_topic_arn" {
  description = "Local fallback SNS topic used when the shared topic denies cross-account publish"
  value       = aws_sns_topic.local_fallback.arn
}
