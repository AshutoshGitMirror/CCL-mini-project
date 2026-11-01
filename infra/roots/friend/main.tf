terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  # AWS Academy labs expose a pre-made LabInstanceProfile and may not allow
  # iam:CreateRole. Set existing_instance_profile_name to use it.
  create_iam = var.existing_instance_profile_name == ""

  app_bundle_path = "${path.module}/../../../deploy/placementhub-app.zip"
  app_bundle_key  = "deploy/placementhub-app.zip"
}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==============================================================================
# 1. Amazon VPC & Multi-AZ Networking
# ==============================================================================
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project}-vpc"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project}-igw"
  }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "${var.project}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ==============================================================================
# 2. Security Group (single public EC2 instance)
# ==============================================================================
# One instance serves the SPA and API on port 80. SSH stays closed unless
# var.ssh_cidr is set; use SSM Session Manager for shell access.
resource "aws_security_group" "app" {
  name_prefix = "${var.project}-app-sg-"
  description = "Public HTTP access to PlacementHub and outbound AWS/RDS access"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = var.ssh_cidr == "" ? [] : [var.ssh_cidr]
    content {
      description = "SSH administration (only when ssh_cidr is set)"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [ingress.value]
    }
  }

  egress {
    description = "Allow all outbound (packages, RDS PostgreSQL 5432, S3, SNS)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-app-sg"
  }
}

# ==============================================================================
# 3. IAM Role & Instance Profile (Textract, S3, SNS, CloudWatch)
# ==============================================================================
resource "aws_iam_role" "app" {
  count       = local.create_iam ? 1 : 0
  name_prefix = "${var.project}-ec2-role-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "app_permissions" {
  count       = local.create_iam ? 1 : 0
  name_prefix = "${var.project}-policy-"
  description = "Permissions for PlacementHub: Amazon Textract, S3, SNS, and CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Amazon Textract OCR permissions
      {
        Sid    = "TextractDetectDocumentText"
        Effect = "Allow"
        Action = [
          "textract:DetectDocumentText",
          "textract:AnalyzeDocument"
        ]
        Resource = "*"
      },
      # Amazon S3 Resume & Documents storage permissions
      {
        Sid    = "S3ResumesAccess"
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.resumes.arn,
          "${aws_s3_bucket.resumes.arn}/*"
        ]
      },
      # Amazon SNS broadcast notification permissions
      {
        Sid    = "SNSPublishAlerts"
        Effect = "Allow"
        Action = [
          "sns:Publish",
          "sns:GetTopicAttributes"
        ]
        Resource = compact([
          var.sns_topic_arn,
          aws_sns_topic.local_fallback.arn
        ])
      },
      # Amazon CloudWatch Logs and Metrics
      {
        Sid    = "CloudWatchMetricsAndLogs"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricData",
          "cloudwatch:ListMetrics",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "app" {
  count      = local.create_iam ? 1 : 0
  role       = aws_iam_role.app[0].name
  policy_arn = aws_iam_policy.app_permissions[0].arn
}

resource "aws_iam_role_policy_attachment" "ssm" {
  count      = local.create_iam ? 1 : 0
  role       = aws_iam_role.app[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "app" {
  count       = local.create_iam ? 1 : 0
  name_prefix = "${var.project}-profile-"
  role        = aws_iam_role.app[0].name
}

# ==============================================================================
# 4. Amazon S3 (Resume & Document Storage)
# ==============================================================================
resource "aws_s3_bucket" "resumes" {
  bucket        = "${var.project}-resumes-${random_string.suffix.result}"
  force_destroy = true

  tags = {
    Name = "${var.project}-resumes"
  }
}

resource "aws_s3_bucket_public_access_block" "resumes" {
  bucket = aws_s3_bucket.resumes.id

  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "resumes" {
  bucket = aws_s3_bucket.resumes.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "resumes" {
  bucket = aws_s3_bucket.resumes.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# The application bundle is uploaded to the same bucket and pulled by the
# instance at boot. Build it first with: node scripts/build-bundle.mjs
resource "aws_s3_object" "app_bundle" {
  bucket = aws_s3_bucket.resumes.id
  key    = local.app_bundle_key
  source = local.app_bundle_path
  etag   = filemd5(local.app_bundle_path)

  tags = {
    Name = "${var.project}-app-bundle"
  }
}

# A local topic keeps the demo working if the shared account-A topic has not
# granted this account sns:Publish yet. The app tries the shared topic first
# and only falls back when the cross-account publish is denied.
resource "aws_sns_topic" "local_fallback" {
  name         = "${var.project}-drive-alerts-local"
  display_name = "PlacementHub Drive Alerts (local fallback)"

  tags = {
    Name = "${var.project}-drive-alerts-local"
  }
}

# ==============================================================================
# 5. Single Public EC2 Instance (Node API + static frontend)
# ==============================================================================
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public[0].id
  vpc_security_group_ids      = [aws_security_group.app.id]
  associate_public_ip_address = true
  key_name                    = var.key_name != "" ? var.key_name : null
  iam_instance_profile        = local.create_iam ? aws_iam_instance_profile.app[0].name : var.existing_instance_profile_name

  user_data = <<-EOF
#!/bin/bash
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive

    echo "=== PlacementHub EC2 Bootstrap Started ==="
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg unzip

    # 1. Install AWS CLI v2 (the instance role supplies credentials)
    if ! command -v aws >/dev/null 2>&1; then
      curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
      unzip -q /tmp/awscliv2.zip -d /tmp
      /tmp/aws/install
    fi

    # 2. Install Node 22 LTS (Node >=22 provides the Iterator global used by unpdf/pdf.js)
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs

    # 3. Download and unpack the application bundle from S3
    rm -rf /opt/placementhub
    mkdir -p /opt/placementhub
    aws s3 cp "s3://${aws_s3_bucket.resumes.id}/${local.app_bundle_key}" \
      /tmp/placementhub-app.zip --region ${var.region}
    unzip -q /tmp/placementhub-app.zip -d /opt/placementhub

    # 4. Write the production backend environment
    cat <<'ENVFILE' > /opt/placementhub/backend/.env
DATABASE_URL="${var.db_url}"
JWT_SECRET="${var.jwt_secret}"
AWS_REGION="${var.region}"
S3_BUCKET="${aws_s3_bucket.resumes.id}"
SNS_TOPIC_ARN="${var.sns_topic_arn}"
SNS_FALLBACK_TOPIC_ARN="${aws_sns_topic.local_fallback.arn}"
SNS_ENDPOINT_URL=""
RESUME_PARSER="${var.resume_parser}"
PORT=80
NODE_ENV=production
ENVFILE
    chmod 600 /opt/placementhub/backend/.env

    # 5. Install backend dependencies and generate the Prisma client
    cd /opt/placementhub/backend
    npm ci --no-audit --no-fund
    npx prisma generate

    # 6. Create the systemd service
    cat <<'SERVICE' > /etc/systemd/system/placementhub.service
[Unit]
Description=PlacementHub Campus Placement Management Platform
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/placementhub/backend
EnvironmentFile=/opt/placementhub/backend/.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/placementhub.log
StandardError=append:/var/log/placementhub-error.log

[Install]
WantedBy=multi-user.target
SERVICE

    systemctl daemon-reload
    systemctl enable placementhub.service
    systemctl restart placementhub.service

    # 7. SSM agent (best effort) so the instance can be inspected without SSH
    snap install amazon-ssm-agent --classic || true
    systemctl enable --now snap.amazon-ssm-agent.amazon-ssm-agent.service || true

    # 8. Install and configure the CloudWatch agent for logs
    curl -fsSL https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -o /tmp/amazon-cloudwatch-agent.deb
    dpkg -i -E /tmp/amazon-cloudwatch-agent.deb || true
    mkdir -p /opt/aws/amazon-cloudwatch-agent/etc

    cat <<'CWCONFIG' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/placementhub.log",
            "log_group_name": "${aws_cloudwatch_log_group.app.name}",
            "log_stream_name": "{instance_id}-app",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/placementhub-error.log",
            "log_group_name": "${aws_cloudwatch_log_group.app.name}",
            "log_stream_name": "{instance_id}-error",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
CWCONFIG

    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json || true

    echo "=== PlacementHub EC2 Bootstrap Completed ==="
  EOF

  depends_on = [aws_s3_object.app_bundle]

  tags = {
    Name    = "${var.project}-app-instance"
    Project = var.project
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

# ==============================================================================
# 6. Amazon CloudWatch Observability (Alarms, Logs & Dashboard)
# ==============================================================================
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/placementhub/${var.environment}"
  retention_in_days = 14

  tags = {
    Name = "${var.project}-logs"
  }
}

# Alarm: High CPU Utilization on the PlacementHub instance
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project}-high-cpu-utilization"
  alarm_description   = "Instance CPU utilization exceeded 80% for 2 periods"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  dimensions = {
    InstanceId = aws_instance.app.id
  }
  treat_missing_data = "notBreaching"

  tags = {
    Name = "${var.project}-high-cpu-alarm"
  }
}

# Compact dashboard for the single instance
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-observability"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.app.id, { stat = "Average", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "PlacementHub EC2 CPU Utilization (%)"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "StatusCheckFailed", "InstanceId", aws_instance.app.id, { stat = "Maximum", period = 60, color = "#d62728" }],
            [".", "StatusCheckFailed_Instance", ".", ".", { stat = "Maximum", period = 60 }],
            [".", "StatusCheckFailed_System", ".", ".", { stat = "Maximum", period = 60 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "PlacementHub Instance Health Checks"
        }
      }
    ]
  })
}
