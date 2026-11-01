terraform {
  required_version = ">= 1.9"
  required_providers {
    aws    = { source = "hashicorp/aws", version = "~> 6.0" }
    random = { source = "hashicorp/random", version = "~> 3.7" }
  }
}

provider "aws" {
  region = var.region
}

variable "region"         { default = "us-east-1" }
variable "project"        { default = "placementhub" }
variable "db_identifier"  { default = "placementhub-db" }
variable "db_name"        { default = "placementhub" }
variable "db_username"    { default = "placement_app" }

# ---------------------------------------------------------------- data sources
data "aws_vpc" "current" {
  default = true
}
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.current.id]
  }
}

# ------------------------------------------------------------------ networking
resource "aws_db_subnet_group" "this" {
  name        = "${var.project}-subnet-group"
  subnet_ids  = data.aws_subnets.default.ids
  description = "Default-VPC subnets for PlacementHub RDS"
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.project}-rds-"
  description = "PostgreSQL access for PlacementHub"

  vpc_id = data.aws_vpc.current.id

  tags = { Name = "${var.project}-rds-sg", Project = var.project }
}

# NOTE: open to the world for the multi-account demo. Tighten to the
# teammate's IP after their EC2 instance exists (see handoff.md).
resource "aws_vpc_security_group_ingress_rule" "postgres" {
  security_group_id = aws_security_group.rds.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
  description       = "Postgres - temporary wide-open for cross-account demo"
}

# ------------------------------------------------------------------- database
resource "random_password" "db" {
  length  = 28
  special = false
}

resource "aws_db_instance" "this" {
  identifier     = var.db_identifier
  engine         = "postgres"
  instance_class = "db.t3.micro"
  db_name        = var.db_name
  username       = var.db_username
  password       = random_password.db.result

  allocated_storage    = 20
  storage_type         = "gp3"
  multi_az             = false
  publicly_accessible  = true
  auto_minor_version_upgrade = true
  backup_retention_period    = 1

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot       = true
  delete_automated_backups = true
  apply_immediately         = true

  tags = { Project = var.project, ManagedBy = "terraform" }
}

# ----------------------------------------------------------------- messaging (SNS)
resource "aws_sns_topic" "drive_alerts" {
  name         = "${var.project}-drive-alerts"
  display_name = "PlacementHub Drive Alerts"
  tags         = { Project = var.project, ManagedBy = "terraform" }
}

# ----------------------------------------------------------------- auth (Cognito)
resource "aws_cognito_user_pool" "pool" {
  name                     = "${var.project}-user-pool"
  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = false
  }

  schema {
    attribute_data_type = "String"
    name                = "role"
    mutable             = true
  }

  tags = { Project = var.project, ManagedBy = "terraform" }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "${var.project}-app-client"
  user_pool_id = aws_cognito_user_pool.pool.id
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]
  generate_secret = false
}

resource "aws_cognito_user_group" "students" {
  name         = "Students"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "PlacementHub Student candidates"
}

resource "aws_cognito_user_group" "recruiters" {
  name         = "Recruiters"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Corporate recruitment partners"
}

resource "aws_cognito_user_group" "officers" {
  name         = "Officers"
  user_pool_id = aws_cognito_user_pool.pool.id
  description  = "Training & Placement Officers (TPO)"
}

# ---------------------------------------------------------------------- outputs
output "db_endpoint"   { value = aws_db_instance.this.address }
output "db_port"       { value = aws_db_instance.this.port }
output "db_name"       { value = var.db_name }
output "db_username"   { value = var.db_username }
output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
output "sns_topic_arn" { value = aws_sns_topic.drive_alerts.arn }
output "cognito_user_pool_id" { value = aws_cognito_user_pool.pool.id }
output "cognito_client_id"    { value = aws_cognito_user_pool_client.client.id }
