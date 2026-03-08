# Deployment Guide

Complete step-by-step guide for deploying the Player Journey Visualization Tool to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Testing](#local-testing)
3. [Docker Build & Test](#docker-build--test)
4. [Platform-Specific Guides](#platform-specific-guides)
5. [Post-Deployment Setup](#post-deployment-setup)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Scaling & Performance](#scaling--performance)
8. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

- [ ] All tests passing: `npm test` (frontend), `pytest` (backend)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented
- [ ] Database backups created
- [ ] Rollback plan documented
- [ ] Team notified of deployment time
- [ ] Downtime window communicated (if needed)

## Local Testing

### 1. Run Complete Test Suite

**Backend**:
```bash
cd backend
source venv/bin/activate

# Unit tests
pytest tests/ -v

# Coverage report
pytest --cov=app tests/

# Type checking
mypy app/

# Linting
flake8 app/
```

**Frontend**:
```bash
cd frontend

# Unit tests
npm test -- --coverage

# Lint
npm run lint

# Build test
npm run build
```

### 2. Manual Testing Checklist

#### Frontend
- [ ] Timeline playback works smoothly
- [ ] All filters function correctly
- [ ] Heatmaps render and toggle properly
- [ ] Dark mode works
- [ ] Mobile responsive layout works
- [ ] No console errors
- [ ] API calls succeed
- [ ] Performance acceptable (Network tab)

#### Backend
- [ ] Health check endpoint responds: `curl http://localhost:8000/health`
- [ ] All API endpoints return correct data
- [ ] Error handling works (bad requests, missing data)
- [ ] Caching works (test with repeated requests)
- [ ] Database indexes functioning
- [ ] CORS properly configured
- [ ] Rate limiting active (if configured)

### 3. Load Testing

**Install load testing tool**:
```bash
pip install locust
```

**Create locustfile.py**:
```python
from locust import HttpUser, task, between

class APIUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def get_maps(self):
        self.client.get("/maps")

    @task
    def get_matches(self):
        self.client.get("/matches?date=2024-02-14")

    @task
    def get_heatmap(self):
        self.client.get("/heatmaps/map_name/kills")
```

**Run load test**:
```bash
locust -f locustfile.py --host http://localhost:8000
```

## Docker Build & Test

### 1. Build Images Locally

```bash
# Build both services
docker-compose build

# Verify images
docker images | grep player-journey

# Check image sizes
docker images --format "table {{.Repository}}\t{{.Size}}"
```

### 2. Test Docker Compose Locally

```bash
# Start services
docker-compose up -d

# Verify services running
docker-compose ps

# Check logs for errors
docker-compose logs --follow backend
docker-compose logs --follow frontend

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:3000

# Test API call
curl http://localhost:8000/maps

# Stop services
docker-compose down
```

### 3. Security Scanning

```bash
# Scan container images for vulnerabilities
trivy image player-journey-backend:latest
trivy image player-journey-frontend:latest

# Or using Grype
grype player-journey-backend:latest

# Check Docker configuration
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image player-journey-backend:latest
```

## Platform-Specific Guides

### AWS Elastic Container Service (ECS)

#### Step 1: Push Images to ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name player-journey-backend
aws ecr create-repository --repository-name player-journey-frontend

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag player-journey-backend:latest \
  <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-backend:latest
docker tag player-journey-frontend:latest \
  <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-frontend:latest

# Push images
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-backend:latest
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-frontend:latest
```

#### Step 2: Create ECS Task Definition

```json
{
  "family": "player-journey-backend",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "sqlite:///./player_data.db"
        },
        {
          "name": "CORS_ORIGINS",
          "value": "[\"https://your-domain.com\"]"
        },
        {
          "name": "LOG_LEVEL",
          "value": "info"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/player-journey-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 10
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "512",
  "memory": "1024"
}
```

#### Step 3: Create ECS Service

```bash
# Create ECS Cluster
aws ecs create-cluster --cluster-name player-journey

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster player-journey \
  --service-name player-journey-backend \
  --task-definition player-journey-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Google Cloud Run

#### Step 1: Set Up Project

```bash
# Set project
gcloud config set project PROJECT_ID

# Create artifact registry
gcloud artifacts repositories create player-journey \
  --repository-format=docker \
  --location=us-central1
```

#### Step 2: Build and Push

```bash
# Configure Docker auth
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build backend
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/player-journey/backend ./backend

# Build frontend
gcloud builds submit --tag us-central1-docker.pkg.dev/PROJECT_ID/player-journey/frontend ./frontend
```

#### Step 3: Deploy to Cloud Run

```bash
# Deploy backend
gcloud run deploy player-journey-backend \
  --image us-central1-docker.pkg.dev/PROJECT_ID/player-journey/backend \
  --platform managed \
  --region us-central1 \
  --memory 1024Mi \
  --cpu 1 \
  --timeout 3600 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=sqlite:///./player_data.db

# Deploy frontend
gcloud run deploy player-journey-frontend \
  --image us-central1-docker.pkg.dev/PROJECT_ID/player-journey/frontend \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --allow-unauthenticated \
  --set-env-vars REACT_APP_API_URL=https://player-journey-backend-xxx.run.app
```

### Heroku

#### Step 1: Create Apps

```bash
# Login
heroku login

# Create apps
heroku create player-journey-backend
heroku create player-journey-frontend
```

#### Step 2: Deploy Backend

```bash
cd backend

# Add buildpack
heroku buildpacks:add heroku/python -a player-journey-backend

# Set environment
heroku config:set DATABASE_URL=sqlite:///./player_data.db -a player-journey-backend
heroku config:set LOG_LEVEL=info -a player-journey-backend

# Create Procfile
echo "web: gunicorn --workers 3 app.main:app" > Procfile

# Deploy
git subtree push --prefix backend heroku/main

# Check logs
heroku logs --tail -a player-journey-backend
```

#### Step 3: Deploy Frontend

```bash
cd frontend

# Add buildpack
heroku buildpacks:add heroku/nodejs -a player-journey-frontend

# Set environment
heroku config:set REACT_APP_API_URL=https://player-journey-backend-xxx.herokuapp.com -a player-journey-frontend

# Deploy
git subtree push --prefix frontend heroku/main

# Check logs
heroku logs --tail -a player-journey-frontend
```

### DigitalOcean App Platform

#### Step 1: Create app.yaml

```yaml
name: player-journey
services:
  - name: backend
    github:
      repo: your-org/player-journey-tool
      branch: main
    build_command: pip install -r requirements.txt
    run_command: uvicorn app.main:app --host 0.0.0.0 --port 8080
    http_port: 8080
    envs:
      - key: DATABASE_URL
        value: sqlite:///./player_data.db
      - key: LOG_LEVEL
        value: info

  - name: frontend
    github:
      repo: your-org/player-journey-tool
      branch: main
    build_command: npm install && npm run build
    http_port: 3000
    envs:
      - key: REACT_APP_API_URL
        value: https://player-journey-backend-xxx.ondigitalocean.app
```

#### Step 2: Deploy

```bash
# Deploy via CLI
doctl apps create --spec app.yaml

# Or via web console: https://cloud.digitalocean.com/apps
```

## Post-Deployment Setup

### 1. Domain Configuration

#### SSL/TLS Certificate
```bash
# AWS (ACM)
aws acm request-certificate --domain-name your-domain.com \
  --subject-alternative-names "*.your-domain.com"

# Let's Encrypt (with Certbot)
certbot certonly --standalone -d your-domain.com
```

#### DNS Configuration
```
# Add CNAME records pointing to load balancer
api.your-domain.com    CNAME    your-lb.aws.amazonaws.com
www.your-domain.com    CNAME    your-static-site.cdn.cloudflare.com
```

### 2. Database Setup

```bash
# Backup production database
sqlite3 player_data.db ".backup '/backups/player_data.backup.db'"

# Create indexes for performance
sqlite3 player_data.db << EOF
CREATE INDEX idx_match_id ON events(match_id);
CREATE INDEX idx_event_type ON events(event_type);
CREATE INDEX idx_timestamp ON events(timestamp);
CREATE INDEX idx_position ON events(x, y);
EOF
```

### 3. Monitoring Setup

**CloudWatch (AWS)**:
```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/player-journey

# Set up alarms
aws cloudwatch put-metric-alarm \
  --alarm-name high-cpu \
  --alarm-description "Alert on high CPU" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold
```

**Datadog**:
```bash
# Install agent
DD_AGENT_MAJOR_VERSION=7 bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_mac_os.sh)"

# Configure service monitors
```

### 4. Security Hardening

#### Environment Variables
```bash
# Use secrets manager instead of .env files
# AWS Secrets Manager
aws secretsmanager create-secret --name prod/player-journey/env

# Google Secret Manager
gcloud secrets create prod-player-journey-env
```

#### Network Security
```bash
# AWS Security Groups - Backend
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 8000 \
  --source-security-group-id sg-frontend

# Firewall rules
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
```

## Monitoring & Maintenance

### 1. Health Checks

```bash
# Manual health check
curl -i https://your-domain.com/api/health

# Automated monitoring
watch -n 5 'curl -s https://your-domain.com/api/health | jq'
```

### 2. Log Aggregation

**ELK Stack**:
```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.10.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:7.10.0
    ports:
      - "5601:5601"
```

**CloudWatch Insights**:
```
fields @timestamp, @message, @duration
| filter @message like /ERROR/
| stats count() by bin(5m)
```

### 3. Performance Monitoring

```bash
# Backend metrics
curl https://your-domain.com/metrics

# Frontend performance
- Use Google PageSpeed Insights
- Monitor Core Web Vitals in browser console
- Check Network tab for API latency
```

### 4. Backup Schedule

```bash
# Daily backups
0 2 * * * aws s3 cp /data/player_data.db s3://backups/player_data-$(date +%Y-%m-%d).db

# Test restore procedure monthly
aws s3 cp s3://backups/player_data-2024-02-14.db /tmp/test-restore.db
```

## Scaling & Performance

### Horizontal Scaling

#### Auto-Scaling Configuration

**AWS ECS**:
```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/player-journey/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling \
  --service-namespace ecs \
  --resource-id service/player-journey/backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration TargetValue=70,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization}
```

**Kubernetes (if using)**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: player-journey-backend
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: player-journey-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Caching Optimization

```bash
# Redis caching
docker run -d -p 6379:6379 redis:latest

# Update backend config
CACHE_BACKEND=redis://localhost:6379
CACHE_TTL=3600
```

### Database Optimization

```sql
-- Add useful indexes
CREATE INDEX idx_match_position ON events(match_id, x, y);
CREATE INDEX idx_timeline ON events(match_id, timestamp);

-- Analyze query performance
EXPLAIN QUERY PLAN
SELECT * FROM events WHERE match_id = ? AND timestamp BETWEEN ? AND ?;
```

## Rollback Procedures

### Quick Rollback

```bash
# Docker Compose
docker-compose down
git revert <commit-hash>
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/player-journey-backend

# Heroku
heroku releases
heroku rollback v25

# AWS ECS
aws ecs update-service \
  --cluster player-journey \
  --service player-journey-backend \
  --task-definition player-journey-backend:24 \
  --force-new-deployment
```

### Database Rollback

```bash
# Restore from backup
sqlite3 player_data.db ".restore '/backups/player_data.backup.db'"

# Verify data integrity
sqlite3 player_data.db "PRAGMA integrity_check;"
```

### Communicate Incident

```
Subject: Production Incident - Player Journey Tool

1. Status: Degraded Service / Down
2. Affected: API / Frontend / Both
3. Start Time: 2024-02-14 10:30 UTC
4. Duration: ~15 minutes
5. Root Cause: [describe]
6. Resolution: [describe]
7. ETA Restore: [time]
8. Updates: [link to status page]
```

## Checklist After Successful Deployment

- [ ] All services running and healthy
- [ ] Endpoints responding correctly
- [ ] Database accessible and data intact
- [ ] Logs being collected properly
- [ ] Monitoring alerts configured
- [ ] Health checks passing
- [ ] Performance baseline established
- [ ] Backups completed
- [ ] Team notified of successful deployment
- [ ] Documentation updated
- [ ] Schedule post-deployment review

---

**Need Help?**  
Contact: devops@company.com  
On-call: [rotation schedule]  
Incident Channel: #production-incidents
