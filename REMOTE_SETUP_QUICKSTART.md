# Quick Start: Remote Agentuity Setup

This guide gets you set up with a remote Agentuity server in under 10 minutes.

## Choose Your Deployment Method

### 🚀 Fastest: Railway (Recommended for Quick Setup)

**Time: ~5 minutes**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login & Deploy:**
   ```bash
   cd snapagent
   railway login
   railway init
   railway up
   ```

3. **Get your URL:**
   ```bash
   railway domain
   # Output: https://snapagent-production-xxxx.up.railway.app
   ```

4. **Update all client machines:**
   ```bash
   # On each machine running the chatbot
   cd 1
   nano .env
   ```

   Set:
   ```
   AGENTUITY_URL=https://snapagent-production-xxxx.up.railway.app
   ```

5. **Done!** Test: `./start-chatbot.sh`

---

### ☁️ Native: Agentuity Cloud

**Time: ~5 minutes**

1. **Deploy:**
   ```bash
   cd snapagent
   agentuity login
   agentuity deploy
   ```

2. **Get URL:**
   ```bash
   agentuity status
   # Shows: https://your-project.agentuity.cloud
   ```

3. **Update clients:**
   ```bash
   # On each machine
   cd 1
   nano .env
   ```

   Set:
   ```
   AGENTUITY_URL=https://your-project.agentuity.cloud
   ```

---

### 🐳 Docker: Any Cloud Provider

**Time: ~10 minutes**

1. **Build & Run:**
   ```bash
   # From project root
   docker-compose up -d
   ```

2. **Access at:**
   ```
   http://localhost:3500
   ```

3. **Deploy to cloud:**

   **DigitalOcean:**
   ```bash
   doctl apps create --spec docker-compose.yml
   ```

   **Google Cloud Run:**
   ```bash
   gcloud run deploy agentuity \
     --source ./snapagent \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

### 🖥️ VPS: Maximum Control

**Time: ~15 minutes**

1. **Run deployment script:**
   ```bash
   ./deploy-vps.sh
   ```

2. **Follow prompts to:**
   - Enter VPS IP and credentials
   - Install Node.js (if needed)
   - Deploy and configure Agentuity

3. **Access at:**
   ```
   http://your-vps-ip:3500
   ```

---

## After Deployment: Client Setup

### On Each Machine Running the Chatbot:

1. **Update environment:**
   ```bash
   cd 1
   nano .env
   ```

2. **Set the Agentuity URL:**
   ```env
   AGENTUITY_URL=https://your-deployed-url.com
   ```

3. **Restart chatbot:**
   ```bash
   cd ..
   ./start-chatbot.sh
   ```

### Or Use Environment Variable:

```bash
AGENTUITY_URL=https://your-url.com ./start-chatbot.sh
```

---

## Testing the Connection

### Test from command line:

```bash
curl https://your-agentuity-url.com
```

### Test from your app:

```bash
cd 1
node -e "
const axios = require('axios');
axios.post('https://your-agentuity-url.com/agent_snap_search_001', {
  query: 'food banks in Pittsburgh',
  state: 'PA'
}).then(r => console.log('✓ Connected!', r.status))
  .catch(e => console.error('✗ Error:', e.message));
"
```

---

## Comparison Table

| Method | Cost | Time | Difficulty | HTTPS |
|--------|------|------|------------|-------|
| Railway | Free tier | 5 min | Easy | Yes ✓ |
| Agentuity Cloud | Pay-as-go | 5 min | Easy | Yes ✓ |
| Docker | Varies | 10 min | Medium | Manual |
| VPS | $5+/mo | 15 min | Medium | Manual |

---

## Next Steps

- ✅ [Security Setup](AGENTUITY_DEPLOYMENT.md#security-best-practices) - Add API keys
- ✅ [Monitoring](AGENTUITY_DEPLOYMENT.md#monitoring) - Setup uptime checks
- ✅ [Custom Domain](AGENTUITY_DEPLOYMENT.md#custom-domain) - Use your own domain
- ✅ [SSL Setup](AGENTUITY_DEPLOYMENT.md#ssl-setup) - For VPS deployments

---

## Troubleshooting

### "Connection refused"

**Check firewall:**
```bash
# On VPS
sudo ufw status
sudo ufw allow 3500/tcp
```

### "Deployment failed"

**Check logs:**

Railway:
```bash
railway logs
```

Docker:
```bash
docker-compose logs -f
```

VPS:
```bash
pm2 logs agentuity-server
```

### "Still not working?"

See the full deployment guide: [AGENTUITY_DEPLOYMENT.md](AGENTUITY_DEPLOYMENT.md)

---

## Getting Help

- 📖 Full Guide: [AGENTUITY_DEPLOYMENT.md](AGENTUITY_DEPLOYMENT.md)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/Nova-Hacks-2025/issues)
- 💬 Discord: [Agentuity Community](https://discord.gg/agentuity)
