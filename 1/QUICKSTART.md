# Quick Start Guide - SnapMap Chatbot

Get the SnapMap chatbot running in 3 simple steps!

## Step 1: Install Dependencies

```bash
cd chatbot
npm install
```

## Step 2: Set Up Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Your `.env` file already has the API key configured. If you need to change it:
```env
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5-20250929
PORT=3001
DB_PATH=../Database/my_records.db
```

## Step 3: Start the Server

```bash
npm start
```

You should see:
```
🤖 SnapBot server is running on http://localhost:3001
📊 Health check: http://localhost:3001/health
✨ Ready to assist with SNAP benefits!
```

## Testing the Chatbot

### Option 1: From React Frontend

1. Open your React app ([SnapMap.jsx](SnapMap.jsx) or [SnapMap.js](SnapMap.js))
2. Enter your location (state and city)
3. Click "Find Opportunities"
4. Use the chatbot on the right side of the screen

### Option 2: Direct API Test with curl

```bash
# Test health endpoint
curl http://localhost:3001/health

# Create a session
curl -X POST http://localhost:3001/api/session \
  -H "Content-Type: application/json" \
  -d '{"city":"Pittsburgh","state":"Pennsylvania"}'

# Send a chat message (use the sessionId from above)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find food banks near me",
    "sessionId": "your-session-id-here",
    "city": "Pittsburgh",
    "state": "Pennsylvania"
  }'
```

## Try These Example Queries

Once your chatbot is running, try asking:

1. **Find Resources**:
   - "Show me food banks in Pittsburgh"
   - "Where can I get a hot meal?"
   - "Find soup kitchens near me"

2. **SNAP/EBT Stores**:
   - "What stores accept SNAP?"
   - "Find Halal stores that take EBT"
   - "Show me Kosher grocery stores"

3. **SNAP Application**:
   - "How do I apply for SNAP in Pennsylvania?"
   - "What documents do I need for SNAP?"

4. **Benefit Status**:
   - "Are SNAP benefits being cancelled?"
   - "Is my state still giving out food stamps?"

## Troubleshooting

### Server won't start?
- Check if port 3001 is already in use
- Verify you're in the `/chatbot` directory
- Run `npm install` again

### Can't connect from React?
- Make sure the server is running (`npm start`)
- Check the API_URL in SnapMap.jsx and SnapMap.js is `http://localhost:3001`
- Look for CORS errors in browser console

### No database results?
- Verify `../Database/my_records.db` exists
- Check the DB_PATH in your `.env` file
- Make sure the database has records

## Next Steps

- Read the full [README.md](chatbot/README.md) for detailed API documentation
- Modify [chatbotHandler.js](chatbot/chatbotHandler.js:48) to customize bot behavior
- Update [dbQueries.js](chatbot/dbQueries.js) to add new database search functions

## Need Help?

Check the logs in your terminal where you ran `npm start` for error messages and debugging information.
