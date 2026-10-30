# Account B's share: app box + a real observation alarm, in the friend's account.
# Mirrors infra/roots/mine in style so both roots read alike. See handoff.md.
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
}

provider "aws" {
  region = var.region
}

variable "region"    { default = "us-east-1" }
variable "project"   { default = "placementhub" }
variable "repo_url"  { description = "git clone URL of this repo" }
variable "ssh_cidr"  { description = "your home IP /32 for SSH" }
variable "db_url"    { description = "full DATABASE_URL of the shared account-A RDS (handoff.md section 1)" }

data "aws_vpc" "current" { default = true }
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.current.id]
  }
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# ------------------------------------------------------------------- the app box
resource "aws_security_group" "app" {
  name_prefix = "${var.project}-app-"
  description = "App port from anywhere, SSH from home only"
  vpc_id      = data.aws_vpc.current.id
}

resource "aws_vpc_security_group_ingress_rule" "api" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 4000
  to_port           = 4000
}

resource "aws_vpc_security_group_egress_rule" "out" { # node install + RDS traffic
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = var.ssh_cidr
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_key_pair" "me" {
  key_name   = "${var.project}-key"
  public_key = file("~/.ssh/id_ed25519.pub") # generate yours with ssh-keygen first
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t2.micro" # free tier eligible
  subnet_id              = element(data.aws_subnets.default.ids, 0)
  vpc_security_group_ids = [aws_security_group.app.id]
  key_name               = aws_key_pair.me.key_name

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail
    apt-get update && apt-get install -y git
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs
    git clone ${var.repo_url} /opt/placementhub
    cd /opt/placementhub/backend && npm ci
    printf 'DATABASE_URL=%s\nJWT_SECRET=change-me-in-prod\n' '${var.db_url}' >> .env
    npx prisma db push
    nohup node src/index.js > /var/log/placementhub.log 2>&1 &
  EOF

  tags = { Name = "${var.project}-app", Project = var.project, ManagedBy = "terraform" }
}

# ------------------------------------------------- the observed alarm (real metric)
resource "aws_cloudwatch_metric_alarm" "down" {
  alarm_name          = "${var.project}-app-failing"
  alarm_description   = "EC2 status check failing — demo box unhealthy"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  dimensions          = { InstanceId = aws_instance.app.id }
  treat_missing_data  = "missing"

  tags = { Project = var.project }
}

output "app_public_ip"   { value = aws_instance.app.public_ip }
output "app_api_health"  { value = "http://${aws_instance.app.public_ip}:4000/api/health" }
