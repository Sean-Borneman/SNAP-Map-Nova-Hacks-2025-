# Mac/Linux Deployment Scripts

Shell scripts for deploying and running SnapMap on macOS and Linux.

## 📁 Scripts

### Quick Start Scripts

| Script | Purpose |
|--------|---------|
| `deploy-agentuity-remote.sh` | Deploy Agentuity to cloud with `agentuity deploy` |
| `start-backend-frontend.sh` | Start chatbot + frontend together |

### Individual Server Scripts

| Script | Purpose |
|--------|---------|
| `start-agentuity.sh` | Start Agentuity server locally |
| `start-chatbot.sh` | Start chatbot server only |
| `start-frontend.sh` | Start frontend server only |
| `start-app.sh` | Start all three servers (Agentuity + Chatbot + Frontend) |

### Advanced Scripts

| Script | Purpose |
|--------|---------|
| `deploy-vps.sh` | Deploy to a remote VPS (DigitalOcean, AWS, etc.) |

---

## 🚀 Recommended Workflow

### 1. Deploy Agentuity to Cloud

```bash
./deploy_mac/deploy-agentuity-remote.sh
```

This will:
- Install Agentuity CLI (if needed)
- Log you in
- Build and deploy to Agentuity Cloud
- Give you a deployment URL

### 2. Configure Environment

```bash
cd 1
nano .env
```

Set:
```env
AGENTUITY_URL=https://your-project.agentuity.cloud
```

### 3. Start Application

```bash
./deploy_mac/start-backend-frontend.sh
```

---

## 📝 All Scripts Explained

### `deploy-agentuity-remote.sh`

**Deploy Agentuity to Agentuity Cloud** (Recommended)

```bash
./deploy_mac/deploy-agentuity-remote.sh
```

Uses native `agentuity deploy` command. No server management needed.

---

### `start-backend-frontend.sh`

**Start chatbot and frontend together** (Most common)

```bash
./deploy_mac/start-backend-frontend.sh
```

Perfect for daily development after Agentuity is deployed remotely.

---

### `start-app.sh`

**Start everything locally** (All-in-one)

```bash
./deploy_mac/start-app.sh
```

Starts:
- Local Agentuity server (port 3500)
- Chatbot server (port 3001)
- Frontend (port 5173)

Use when you want to run Agentuity locally instead of using remote.

---

### `start-agentuity.sh`

**Start only Agentuity server**

```bash
./deploy_mac/start-agentuity.sh
```

Run Agentuity locally on this machine. Other machines can connect to it.

---

### `start-chatbot.sh`

**Start only chatbot server**

```bash
./deploy_mac/start-chatbot.sh
```

Connects to remote Agentuity (set via `AGENTUITY_URL` in `.env`).

---

### `start-frontend.sh`

**Start only frontend server**

```bash
./deploy_mac/start-frontend.sh
```

Connects to chatbot server on port 3001.

---

### `deploy-vps.sh`

**Deploy Agentuity to your own VPS**

```bash
./deploy_mac/deploy-vps.sh
```

Interactive deployment to DigitalOcean, AWS EC2, Linode, etc.

---

## 🔧 Environment Variables

All scripts support environment variable overrides:

```bash
# Custom ports
CHATBOT_PORT=4000 FRONTEND_PORT=8080 ./deploy_mac/start-backend-frontend.sh

# Use specific Agentuity URL
AGENTUITY_URL=https://my-server.com ./deploy_mac/start-chatbot.sh

# Don't open browser
OPEN_BROWSER=false ./deploy_mac/start-frontend.sh
```

---

## 🎯 Use Cases

### Use Case 1: Remote Agentuity + Local Development

**Best for:** Teams sharing one Agentuity server

```bash
# One time: Deploy Agentuity
./deploy_mac/deploy-agentuity-remote.sh

# Daily: Start local servers
./deploy_mac/start-backend-frontend.sh
```

---

### Use Case 2: Everything Local

**Best for:** Offline development, testing

```bash
./deploy_mac/start-app.sh
```

---

### Use Case 3: Distributed Servers

**Best for:** Multiple developers, separate terminals

Terminal 1 (Agentuity):
```bash
./deploy_mac/start-agentuity.sh
```

Terminal 2 (Chatbot):
```bash
./deploy_mac/start-chatbot.sh
```

Terminal 3 (Frontend):
```bash
./deploy_mac/start-frontend.sh
```

---

## 📊 Script Comparison

| Script | Agentuity | Chatbot | Frontend | Best For |
|--------|-----------|---------|----------|----------|
| `deploy-agentuity-remote.sh` | ☁️ Cloud | ❌ | ❌ | Deployment |
| `start-backend-frontend.sh` | ☁️ Remote | ✅ | ✅ | Daily dev |
| `start-app.sh` | ✅ Local | ✅ | ✅ | All-in-one |
| Individual scripts | Varies | Varies | Varies | Separate terminals |

---

## 📚 Documentation

- [Main Deployment Guide](../DEPLOYMENT.md)
- [Agentuity Cloud Deployment](../AGENTUITY_DEPLOYMENT.md)
- [Quick Start Guide](../REMOTE_SETUP_QUICKSTART.md)

---

## 🆘 Troubleshooting

See [../START_SERVERS.md](../START_SERVERS.md) for troubleshooting common issues.
