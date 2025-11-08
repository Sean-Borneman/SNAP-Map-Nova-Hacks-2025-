# Agentuity Remote Deployment Guide

This guide shows you how to deploy Agentuity to a remote server so multiple machines can access it.

## Table of Contents

1. [Option 1: Agentuity Cloud (Recommended)](#option-1-agentuity-cloud-recommended)
2. [Option 2: VPS Deployment (DigitalOcean, AWS, etc.)](#option-2-vps-deployment)
3. [Option 3: Docker Deployment](#option-3-docker-deployment)
4. [Option 4: Railway Deployment](#option-4-railway-deployment)
5. [Client Configuration](#client-configuration)
6. [Security Best Practices](#security-best-practices)

---

## Option 1: Agentuity Cloud (Recommended)

Agentuity has native cloud deployment built-in. This is the easiest and most reliable option.

### Prerequisites

1. Agentuity account (create at https://agentuity.com)
2. Agentuity CLI installed: `npm install -g @agentuity/cli`

### Deployment Steps

1. **Login to Agentuity:**
   ```bash
   cd snapagent
   agentuity login
   ```

2. **Build the project:**
   ```bash
   agentuity build
   ```

3. **Deploy to Agentuity Cloud:**
   ```bash
   agentuity deploy
   ```

4. **Get your deployment URL:**
   ```bash
   agentuity status
   ```

   You'll get a URL like: `https://your-project.agentuity.cloud`

5. **Test the deployment:**
   ```bash
   curl https://your-project.agentuity.cloud/agent_snap_search_001
   ```

### Update Client Configuration

On all machines that need to use this Agentuity server:

```bash
cd 1
nano .env
```

Update:
```
AGENTUITY_URL=https://your-project.agentuity.cloud
```

**Advantages:**
- ✅ Automatic scaling
- ✅ Built-in monitoring
- ✅ HTTPS by default
- ✅ No server management
- ✅ Pay per use

---

## Option 2: VPS Deployment

Deploy Agentuity on a virtual private server (DigitalOcean, AWS EC2, Linode, etc.)

### Prerequisites

- A VPS with Node.js 18+ installed
- SSH access to the server
- Domain name (optional, recommended)

### Server Setup

1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js (if not installed):**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Or using nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 20
   ```

3. **Install PM2 (process manager):**
   ```bash
   npm install -g pm2
   ```

4. **Install Agentuity CLI:**
   ```bash
   npm install -g @agentuity/cli
   ```

5. **Clone your project:**
   ```bash
   git clone https://github.com/yourusername/Nova-Hacks-2025.git
   cd Nova-Hacks-2025/snapagent
   ```

6. **Install dependencies:**
   ```bash
   npm install
   ```

7. **Login to Agentuity:**
   ```bash
   agentuity login
   ```

8. **Create production environment file:**
   ```bash
   nano .env.production
   ```

   Add:
   ```
   NODE_ENV=production
   PORT=3500
   ```

9. **Build the project:**
   ```bash
   agentuity bundle
   ```

10. **Start with PM2:**
    ```bash
    pm2 start .agentuity/index.js --name agentuity-server \
      --env-file .env.production \
      --node-args="--no-deprecation"

    # Save PM2 configuration
    pm2 save

    # Setup PM2 to start on boot
    pm2 startup
    ```

11. **Check status:**
    ```bash
    pm2 status
    pm2 logs agentuity-server
    ```

### Configure Firewall

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3500/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3500/tcp
sudo firewall-cmd --reload
```

### Setup Nginx Reverse Proxy (Optional but Recommended)

1. **Install Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Create Nginx configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/agentuity
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # Replace with your domain or IP

       location / {
           proxy_pass http://localhost:3500;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;

           # Timeouts for long-running requests
           proxy_connect_timeout 600s;
           proxy_send_timeout 600s;
           proxy_read_timeout 600s;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/agentuity /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Setup SSL with Let's Encrypt (Recommended):**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Update Client Configuration

```bash
# If using domain with SSL
AGENTUITY_URL=https://your-domain.com

# If using IP without SSL
AGENTUITY_URL=http://your-server-ip:3500
```

**Advantages:**
- ✅ Full control
- ✅ Cost-effective for continuous use
- ✅ Can customize everything

**Disadvantages:**
- ❌ Requires server management
- ❌ You handle scaling
- ❌ You manage security updates

---

## Option 3: Docker Deployment

Deploy using Docker for easy portability.

### Create Dockerfile

Create `snapagent/Dockerfile`:

```dockerfile
FROM node:20-alpine

# Install Agentuity CLI
RUN npm install -g @agentuity/cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Bundle the application
RUN agentuity bundle

# Expose port
EXPOSE 3500

# Set environment
ENV NODE_ENV=production
ENV PORT=3500

# Start the application
CMD ["node", "--env-file", ".env", "--no-deprecation", ".agentuity/index.js"]
```

### Create docker-compose.yml

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  agentuity:
    build:
      context: ./snapagent
      dockerfile: Dockerfile
    ports:
      - "3500:3500"
    environment:
      - NODE_ENV=production
      - PORT=3500
    volumes:
      - ./snapagent/.env:/app/.env:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3500"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f agentuity

# Stop
docker-compose down
```

### Deploy to Cloud with Docker

**DigitalOcean App Platform:**
```bash
doctl apps create --spec docker-compose.yml
```

**AWS ECS:**
```bash
# Use AWS ECS console or CLI with the Dockerfile
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

## Option 4: Railway Deployment

Railway offers easy deployment with automatic HTTPS.

### Prerequisites

- Railway account (https://railway.app)
- Railway CLI: `npm install -g @railway/cli`

### Deployment Steps

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Initialize project:**
   ```bash
   cd snapagent
   railway init
   ```

3. **Add environment variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3500
   ```

4. **Create railway.json:**
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm install && agentuity bundle"
     },
     "deploy": {
       "startCommand": "node --env-file .env --no-deprecation .agentuity/index.js",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get your URL:**
   ```bash
   railway domain
   ```

   You'll get: `https://your-app.railway.app`

**Advantages:**
- ✅ Easy deployment
- ✅ Automatic HTTPS
- ✅ Built-in monitoring
- ✅ Free tier available

---

## Client Configuration

After deployment, update all client machines:

### Update Chatbot Server

On each machine running the chatbot:

```bash
cd 1
nano .env
```

Update:
```env
# For Agentuity Cloud
AGENTUITY_URL=https://your-project.agentuity.cloud

# For VPS with SSL
AGENTUITY_URL=https://your-domain.com

# For VPS without SSL
AGENTUITY_URL=http://your-server-ip:3500

# For Railway
AGENTUITY_URL=https://your-app.railway.app
```

### Or use environment variable:

```bash
AGENTUITY_URL=https://your-server.com ./start-chatbot.sh
```

### Test the connection:

```bash
# Test from command line
curl https://your-agentuity-url.com

# Test from your app
cd 1
node -e "
const axios = require('axios');
axios.post('https://your-agentuity-url.com/agent_snap_search_001', {
  query: 'test',
  state: 'PA'
}).then(r => console.log('Connected!', r.data))
  .catch(e => console.error('Error:', e.message));
"
```

---

## Security Best Practices

### 1. Authentication (Recommended for Production)

Add API key authentication to your Agentuity server.

Create `snapagent/src/middleware/auth.js`:

```javascript
export function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validKey = process.env.API_KEY;

    if (!apiKey || apiKey !== validKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
}
```

Update your agent to use it:

```javascript
import { requireApiKey } from '../middleware/auth.js';

// In your agent route
router.post('/agent_snap_search_001', requireApiKey, async (req, res) => {
    // Your agent logic
});
```

Set API key on server:
```bash
# .env.production
API_KEY=your-secure-random-api-key-here
```

Update clients:
```bash
# In 1/.env
AGENTUITY_API_KEY=your-secure-random-api-key-here
```

Update chatbot code to send API key:
```javascript
// In chatbotHandler.js
const response = await axios.post(`${AGENTUITY_URL}/agent_snap_search_001`, {
    query: query,
    state: state,
    type: type
}, {
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.AGENTUITY_API_KEY
    },
    timeout: 20000
});
```

### 2. Rate Limiting

Install rate limiter:
```bash
npm install express-rate-limit
```

Add to your server:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/agent_', limiter);
```

### 3. CORS Configuration

```javascript
import cors from 'cors';

app.use(cors({
    origin: ['https://your-frontend.com', 'https://your-app.com'],
    methods: ['POST'],
    credentials: true
}));
```

### 4. HTTPS Only

Always use HTTPS in production:
- Let's Encrypt for VPS
- Automatic with Agentuity Cloud, Railway, Vercel

### 5. Environment Variables

Never commit `.env` files:
```bash
# .gitignore
.env
.env.*
!.env.example
```

### 6. Monitoring

Setup monitoring with:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Logs**: Papertrail, LogDNA

---

## Cost Comparison

| Option | Cost (est.) | Setup Time | Maintenance |
|--------|-------------|------------|-------------|
| Agentuity Cloud | $5-50/mo | 5 min | None |
| VPS (DigitalOcean) | $5-10/mo | 30 min | Medium |
| Railway | $5/mo | 10 min | Low |
| Docker + Cloud | $10-20/mo | 45 min | Medium |

---

## Troubleshooting

### Connection Timeout

**Problem:** Clients can't connect to remote Agentuity

**Solutions:**
1. Check firewall: `sudo ufw status`
2. Verify server is running: `pm2 status` or `docker ps`
3. Test locally on server: `curl http://localhost:3500`
4. Check DNS: `nslookup your-domain.com`

### High Latency

**Problem:** Requests are slow from remote clients

**Solutions:**
1. Deploy Agentuity closer to your clients (same region)
2. Use a CDN or edge network
3. Implement caching for common queries
4. Check server resources: `top` or `htop`

### Authentication Errors

**Problem:** 401 Unauthorized errors

**Solutions:**
1. Verify API key matches on both ends
2. Check header name is correct: `X-API-Key`
3. Ensure no extra whitespace in env file

---

## Support

For deployment issues:
- Agentuity Docs: https://docs.agentuity.com
- Community: https://discord.gg/agentuity
- GitHub Issues: https://github.com/agentuity/cli/issues
