# VAPI AI Chat Feature

## Overview
A text-based chat interface for interacting with your VAPI AI agents. This allows you to test and communicate with your AI assistants through a beautiful, real-time chat UI.

## Features

### ✅ Implemented
- **Real-time Text Chat**: Send and receive messages from your AI agent
- **Voice Integration**: VAPI handles both voice and text seamlessly
- **Live Status Indicators**: See when the AI is connected and speaking
- **Message History**: View full conversation history
- **Auto-scrolling**: Automatically scrolls to latest messages
- **Typing Indicators**: Visual feedback when AI is responding
- **Keyboard Shortcuts**: Press Enter to send, Shift+Enter for new lines
- **Responsive Design**: Works on all screen sizes
- **Connection Management**: Start/stop chat sessions easily

## How to Use

### 1. Create an AI Agent
Before using the chat feature, you need to create an AI agent:
1. Go to **AI Agents** page from the sidebar
2. Click "Create Agent"
3. Give it a name and configure the system prompt
4. Save the agent

### 2. Start Chatting
1. Navigate to **AI Chat** in the sidebar
2. Click "Start Chat" to connect to your AI agent
3. Type your message in the input box at the bottom
4. Press Enter or click the Send button
5. The AI will respond in real-time!

## Technical Details

### Components

#### VapiChat Component
**Location:** `/src/components/vapi/VapiChat.tsx`

**Props:**
- `assistantId` (string, required): The VAPI assistant ID
- `assistantName` (string, optional): Display name for the assistant

**Features:**
- Manages VAPI WebSocket connection
- Handles message state
- Listens to VAPI events (speech-start, speech-end, call-start, call-end)
- Auto-scrolls to new messages
- Displays connection status

#### AI Chat Page
**Location:** `/src/app/(protectedRoutes)/ai-chat/page.tsx`

- Server-side component
- Fetches user's AI agents from database
- Passes agent data to VapiChat component
- Handles case when no agent exists

### VAPI Integration

The chat uses the VAPI Web SDK (`@vapi-ai/web`) which provides:

**Events Listened:**
- `message`: Receives transcripts from the AI
- `speech-start`: AI begins speaking
- `speech-end`: AI stops speaking
- `call-start`: Connection established
- `call-end`: Connection terminated
- `error`: Connection/API errors

**Methods Used:**
- `vapi.start(assistantId)`: Initialize chat session
- `vapi.stop()`: End chat session
- `vapi.send(message)`: Send text message to AI
- `vapi.on(event, callback)`: Listen to events

### Message Flow

1. User types message and presses Enter
2. Message added to local state immediately
3. Message sent to VAPI via `vapi.send()`
4. VAPI processes with OpenAI GPT-4o
5. AI response streamed back via `message` event
6. Response displayed in chat UI

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key_here
```

### AI Agent Settings
Configure in the AI Agents page:
- **Name**: Agent display name
- **First Message**: Initial greeting
- **System Prompt**: Instructions for AI behavior
- **Model**: OpenAI GPT-4o (default)
- **Temperature**: 0.5 (balanced creativity)

## UI/UX Features

### Visual Elements
- **Bot Icon**: Identifies AI messages
- **User Icon**: Identifies your messages
- **Status Dot**: Shows connection state (green = connected)
- **Typing Animation**: Three bouncing dots when AI is speaking
- **Timestamps**: Shows time for each message
- **Color-coded Messages**: Blue for user, gray for AI

### Accessibility
- Keyboard navigation supported
- Clear visual feedback for all actions
- Descriptive status messages
- ARIA-compliant components

## Use Cases

1. **Testing AI Agents**: Verify your agent's responses before deployment
2. **Lead Qualification**: Pre-screen leads with AI conversations
3. **Customer Support**: Provide instant AI-powered support
4. **Sales Conversations**: Engage prospects with AI sales agents
5. **Training**: Test different prompts and configurations

## Future Enhancements

Possible additions:
- [ ] Chat history persistence (save to database)
- [ ] Multiple concurrent chat sessions
- [ ] Voice input toggle (switch between text and voice)
- [ ] Export chat transcripts
- [ ] AI agent selection dropdown
- [ ] Message reactions and feedback
- [ ] File/image sharing
- [ ] Suggested responses
- [ ] Analytics dashboard for conversations

## Troubleshooting

### Chat Won't Connect
- Verify VAPI API key is set in `.env`
- Check that AI agent exists in database
- Ensure VAPI account has available credits
- Check browser console for errors

### Messages Not Appearing
- Check network tab for WebSocket connection
- Verify VAPI assistant ID is correct
- Ensure system prompt is not empty
- Check VAPI dashboard for API errors

### AI Not Responding
- Verify OpenAI API key is configured in VAPI
- Check VAPI assistant model is set to GPT-4o
- Ensure temperature is between 0-1
- Review system prompt for issues

## Related Files

- `/src/components/vapi/VapiChat.tsx` - Chat UI component
- `/src/app/(protectedRoutes)/ai-chat/page.tsx` - Chat page
- `/src/lib/vapi/vapiClient.ts` - VAPI client initialization
- `/src/action/vapi.ts` - Server actions for AI agents
- `/src/lib/data.ts` - Sidebar navigation configuration

## Resources

- [VAPI Documentation](https://docs.vapi.ai/)
- [VAPI Web SDK](https://github.com/VapiAI/web)
- [OpenAI GPT-4o](https://platform.openai.com/docs/models/gpt-4o)
