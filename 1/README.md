# SnapMap Chatbot Backend

An intelligent chatbot backend for the SnapMap application that helps users find SNAP benefits resources, food banks, soup kitchens, and provides information about SNAP application processes.

## Features

- **Database Integration**: Queries the my_records.db database for food assistance resources
- **Claude AI Integration**: Uses Claude Sonnet 4.5 for natural language understanding and responses
- **Location-Aware**: Filters results based on user's city and state
- **Conversation Management**: Maintains session-based conversation history
- **Multi-Query Support**:
  - Find food banks and pantries
  - Locate soup kitchens and hot meal programs
  - Search for stores accepting SNAP/EBT
  - Filter by dietary requirements (Halal, Kosher)
  - Get step-by-step SNAP application guides
  - Check SNAP benefit disbursement status during shutdowns

## Prerequisites

- **Node.js** 18 or higher
- **Anthropic API Key** (get one at https://console.anthropic.com/)
- **Database**: `my_records.db` in the `Database` folder

## Installation

1. Navigate to the chatbot directory:
```bash
cd chatbot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit the `.env` file and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your_actual_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5-20250929
PORT=3001
DB_PATH=../Database/my_records.db
```

## Running the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on http://localhost:3001

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Create Session
```
POST /api/session
Content-Type: application/json

{
  "city": "Pittsburgh",
  "state": "Pennsylvania"
}
```
Creates a new chat session and returns a `sessionId`.

### Update Session
```
PUT /api/session/:sessionId
Content-Type: application/json

{
  "city": "Philadelphia",
  "state": "Pennsylvania"
}
```
Updates the location for an existing session.

### Send Chat Message
```
POST /api/chat
Content-Type: application/json

{
  "message": "Find me food banks near me",
  "sessionId": "uuid-here",
  "city": "Pittsburgh",
  "state": "Pennsylvania"
}
```
Sends a message to the chatbot and receives a response.

### Delete Session
```
DELETE /api/session/:sessionId
```
Clears conversation history for a session.

### Get Session Info
```
GET /api/session/:sessionId
```
Retrieves session information.

## Example Queries

The chatbot can handle various types of queries:

- "Find food banks in Pittsburgh"
- "Where can I get a hot meal?"
- "What stores accept SNAP/EBT?"
- "Are there any Halal stores that accept SNAP?"
- "How do I apply for SNAP benefits in Pennsylvania?"
- "Are SNAP benefits being cancelled due to the government shutdown?"

## Project Structure

```
chatbot/
├── server.js           # Express server and API routes
├── chatbotHandler.js   # Claude AI integration and conversation logic
├── dbQueries.js        # Database query functions
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
└── README.md          # This file
```

## Integration with React Frontend

The chatbot integrates with both [SnapMap.js](SnapMap.js:210) and [SnapMap.jsx](SnapMap.jsx:202) files. The React components:

1. Create a session when the chatbot loads
2. Update the session when the user selects a location
3. Send user messages to the `/api/chat` endpoint
4. Display bot responses in real-time

## Database Schema

The chatbot queries the `records` table in `my_records.db`:

```sql
CREATE TABLE records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    link TEXT,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) | - |
| `CLAUDE_MODEL` | Claude model to use | `claude-sonnet-4-5-20250929` |
| `PORT` | Server port | `3001` |
| `DB_PATH` | Path to SQLite database | `../Database/my_records.db` |

## Troubleshooting

### "Failed to create session" error
- Make sure the chatbot server is running on port 3001
- Check that there are no CORS issues
- Verify the frontend is pointing to the correct API URL

### "Database not found" error
- Verify the `DB_PATH` in `.env` points to the correct database location
- Check that `my_records.db` exists in the `Database` folder

### Claude API errors
- Verify your `ANTHROPIC_API_KEY` is valid
- Check your API key has sufficient credits
- Ensure you're using the correct model name

### Port already in use
- Change the `PORT` in `.env` to a different port
- Make sure to update the `API_URL` in the React files accordingly

## Development

To modify the chatbot behavior, edit [chatbotHandler.js](chatbot/chatbotHandler.js):
- `queryDatabase()`: Modify database search logic
- `handleChatMessage()`: Update conversation flow and AI prompts
- System prompts: Customize Claude's behavior and personality

## License

MIT
