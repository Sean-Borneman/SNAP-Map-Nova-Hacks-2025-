# Getting Started with SnapMap

Quick start guide to get SnapMap running on your machine.

## 📋 Prerequisites

- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org))
- **Git** (for cloning the repository)
- **Anthropic API Key** (Get from [console.anthropic.com](https://console.anthropic.com))

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Deploy Agentuity to Cloud

#### macOS / Linux:
```bash
./deploy_mac/deploy-agentuity-remote.sh
```

#### Windows:
```powershell
.\deploy_windows\deploy-agentuity-remote.bat
```

**What happens:** Deploys your search agent to Agentuity Cloud and gives you a URL.

---

### Step 2: Configure Environment

Edit `1/.env`:

```bash
cd 1
cp .env.example .env  # If .env doesn't exist
nano .env             # Or use your favorite editor
```

Set these values:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx...
AGENTUITY_URL=https://your-project.agentuity.cloud
```

---

### Step 3: Start the Application

#### macOS / Linux:
```bash
./deploy_mac/start-backend-frontend.sh
```

#### Windows:
```powershell
.\deploy_windows\start-backend-frontend.bat
```

**What happens:** Starts chatbot + frontend, opens browser to http://localhost:5173

---

## 🎉 Done!

You should now see the SnapMap application running in your browser.

---

## 📚 Next Steps

### Learn More

- **[START_SERVERS.md](START_SERVERS.md)** - All ways to start servers
- **[deploy_mac/README.md](deploy_mac/README.md)** - Mac/Linux scripts explained
- **[deploy_windows/README.md](deploy_windows/README.md)** - Windows scripts explained
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Advanced deployment options
- **[AGENTUITY_DEPLOYMENT.md](AGENTUITY_DEPLOYMENT.md)** - Cloud deployment guide

### Choose Your Setup

#### Option 1: Remote Agentuity (Recommended)
**Best for:** Teams, production, sharing agent across machines

✅ Deploy once: `./deploy_mac/deploy-agentuity-remote.sh`
✅ Daily use: `./deploy_mac/start-backend-frontend.sh`

#### Option 2: Everything Local
**Best for:** Offline development, testing

```bash
./deploy_mac/start-app.sh
```

Runs Agentuity + chatbot + frontend all on your machine.

#### Option 3: Separate Terminals
**Best for:** Debugging, separate processes

```bash
# Terminal 1
./deploy_mac/start-agentuity.sh

# Terminal 2
./deploy_mac/start-chatbot.sh

# Terminal 3
./deploy_mac/start-frontend.sh
```

---

## 🗂️ Project Structure

```
Nova-Hacks-2025/
├── deploy_mac/              # Mac/Linux deployment scripts
│   ├── deploy-agentuity-remote.sh
│   ├── start-backend-frontend.sh
│   ├── start-app.sh
│   └── ... (other scripts)
│
├── deploy_windows/          # Windows deployment scripts
│   ├── deploy-agentuity-remote.bat
│   └── start-backend-frontend.bat
│
├── 1/                       # Chatbot backend server
│   ├── server.js
│   ├── chatbotHandler.js
│   ├── .env.example
│   └── package.json
│
├── snap-map/                # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── snapagent/               # Agentuity agent server
│   ├── src/agents/
│   ├── agentuity.yaml
│   └── package.json
│
├── Database/                # SQLite database
│   └── my_records.db
│
└── Documentation/           # Guides
    ├── GETTING_STARTED.md (this file)
    ├── START_SERVERS.md
    ├── DEPLOYMENT.md
    └── AGENTUITY_DEPLOYMENT.md
```

---

## 🔧 Configuration Files

### `1/.env` (Chatbot Backend)

```env
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxx
AGENTUITY_URL=https://your-project.agentuity.cloud

# Optional
CLAUDE_MODEL=claude-haiku-4-5-20251001
PORT=3001
DB_PATH=../Database/my_records.db
BRAVE_SEARCH_API_KEY=xxxxx
```

### `snapagent/.env` (Agentuity - if running locally)

```env
# Only needed if running Agentuity locally
# Not needed for cloud deployment
```

---

## 🌐 Ports Used

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Chatbot | 3001 | http://localhost:3001 |
| Agentuity (local) | 3500 | http://localhost:3500 |

---

## 🆘 Troubleshooting

### "Port already in use"

**Mac/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Windows:**
```powershell
netstat -ano | findstr :3001
taskkill /PID <pid> /F
```

### "Cannot connect to Agentuity"

1. Check `.env` has correct `AGENTUITY_URL`
2. Test: `curl https://your-project.agentuity.cloud`
3. Redeploy: Run `deploy-agentuity-remote` script again

### "API key error"

1. Get API key: https://console.anthropic.com
2. Set in `1/.env`: `ANTHROPIC_API_KEY=sk-ant-xxxxx`

### "npm not found"

Install Node.js from: https://nodejs.org

---

## 📖 Common Commands

```bash
# Deploy Agentuity to cloud
./deploy_mac/deploy-agentuity-remote.sh

# Start development servers
./deploy_mac/start-backend-frontend.sh

# Start everything locally
./deploy_mac/start-app.sh

# View logs
tail -f chatbot-server.log
tail -f frontend-server.log

# Check server health
curl http://localhost:3001/health
```

---

## 💡 Development Workflow

### Daily Development

1. Start servers: `./deploy_mac/start-backend-frontend.sh`
2. Edit code
3. Servers auto-reload (frontend hot-reloads, chatbot needs restart)
4. Test in browser

### When You Update Agents

1. Make changes in `snapagent/src/agents/`
2. Redeploy: `./deploy_mac/deploy-agentuity-remote.sh`
3. Chatbot picks up changes automatically

### Before Committing

```bash
# Stop all servers
Ctrl+C (in each terminal)

# Check for uncommitted changes
git status

# Commit your changes
git add .
git commit -m "Your message"
git push
```

---

## 🎯 What Each Component Does

### Agentuity (snapagent/)
- Handles web search for SNAP information
- Runs agents that fetch real-time data
- Can run locally or in cloud

### Chatbot Backend (1/)
- Node.js/Express server
- Talks to Claude AI (Anthropic)
- Queries database
- Calls Agentuity for web search

### Frontend (snap-map/)
- React application
- Interactive map
- Chat interface
- Filters and search

### Database (Database/)
- SQLite database
- Food banks, pantries, stores
- Location and service info

---

## 🚀 Ready to Start?

Run the quick start at the top of this file, or jump to detailed guides:

- **[START_SERVERS.md](START_SERVERS.md)** - Start servers guide
- **[deploy_mac/README.md](deploy_mac/README.md)** - Mac/Linux scripts
- **[deploy_windows/README.md](deploy_windows/README.md)** - Windows scripts

---

## 📞 Support

- **Documentation**: See files listed above
- **Issues**: Create a GitHub issue
- **Logs**: Check `*-server.log` files in project root
