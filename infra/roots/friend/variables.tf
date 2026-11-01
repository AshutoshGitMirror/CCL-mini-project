variable "region" {
  description = "AWS deployment region"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name tag and prefix"
  type        = string
  default     = "placementhub"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "db_url" {
  description = "Full DATABASE_URL of the shared account-A RDS PostgreSQL database (from handoff.md)"
  type        = string
  default     = "postgresql://placement_app:L21v6dmJkrW252sg3FtZ0sUeCqST@placementhub-db.cofeamqier1q.us-east-1.rds.amazonaws.com:5432/placementhub?schema=public&sslmode=require"
}

variable "sns_topic_arn" {
  description = "Amazon SNS Topic ARN for campus drive broadcast alerts (from handoff.md)"
  type        = string
  default     = "arn:aws:sns:us-east-1:331146038587:placementhub-drive-alerts"
}

variable "repo_url" {
  description = "Deprecated: kept for compatibility. The EC2 bootstrap now downloads the app bundle from S3."
  type        = string
  default     = ""
}

variable "instance_type" {
  description = "EC2 instance size (t3.micro is AWS free-tier eligible)"
  type        = string
  default     = "t3.micro"
}

variable "resume_parser" {
  description = "Resume parser engine: 'local' for free unpdf extraction, 'textract' for Amazon Textract OCR (requires Textract access on the account)"
  type        = string
  default     = "local"
}

variable "jwt_secret" {
  description = "JWT secret for student and recruiter session signing"
  type        = string
  default     = "placementhub-jwt-secret-prod-2026-key"
}

variable "key_name" {
  description = "Optional EC2 SSH Key Pair name (leave empty if not using SSH)"
  type        = string
  default     = ""
}

variable "ssh_cidr" {
  description = "CIDR allowed to SSH into app instances. Leave empty to disable SSH (SSM is enabled)."
  type        = string
  default     = ""
}

variable "existing_instance_profile_name" {
  description = "Use an existing EC2 instance profile (e.g. AWS Academy LabInstanceProfile) instead of creating one. Leave empty to create a scoped role."
  type        = string
  default     = ""
}
