# GitHub Actions CI/CD Setup

## Prerequisites

1. **Docker Hub Secrets**
   Add to GitHub repository secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_TOKEN`: Docker Hub Personal Access Token

2. **Get Docker Token**
   - Go to https://hub.docker.com/settings/security
   - Create new Personal Access Token
   - Copy and paste into GitHub Secrets

## Workflow File

`.github/workflows/deploy.yml`

### What it does:
- Builds on every push to `main` branch
- Runs on pull requests (no push)
- Builds Docker image
- Pushes to Docker Hub
- Tests image before deployment

### Triggers:
```
- Push to main → Build & Push
- Pull request on main → Build & Test only
```

## Debugging Failures

### View logs
1. Go to GitHub repo → Actions tab
2. Click failed workflow
3. See detailed build logs

### Common Issues

**Docker login fails**
- Check Docker Hub token is valid
- Verify secrets names match exactly

**Build times out**
- Increase `timeout-minutes: 30` to 45
- Check Dockerfile for large operations

**Push fails**
- Verify Docker Hub account has capacity
- Check image size

## Manual Trigger

Create `.github/workflows/manual.yml`:
```yaml
name: Manual Build

on: workflow_dispatch

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t test ./pcs-express
```

Then trigger from Actions tab.

## Viewing Docker Image

After successful push:
```bash
docker pull [DOCKER_USERNAME]/pcs-express:latest
docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 3001:3001 [DOCKER_USERNAME]/pcs-express:latest
```
