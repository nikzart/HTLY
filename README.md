# HTLY - Who Thinks Like You

A real-time social platform where like-minded people with similar thoughts can connect using AI-powered semantic matching.

## Features

- 🧠 **Semantic Matching**: Advanced AI-powered matching using Azure OpenAI embeddings
- 💬 **Real-time Messaging**: Direct chat with your thoughtmates using WebSockets
- ⚡ **Live Updates**: Real-time notifications for likes, comments, and new thoughts
- 💭 **Thought Sharing**: Post your thoughts and find people who think like you
- 🤝 **Thoughtmates**: Discover users with similar thinking patterns
- ❤️ **Social Interactions**: Like, comment, save, and share thoughts
- 👥 **Follow System**: Follow users to see their thoughts in your feed
- 🎨 **Beautiful UI**: Dark theme with smooth animations and mobile-first design
- 🔄 **Multiple Feeds**: Trending, News, Following, and Saved thoughts tabs

## Tech Stack

### Backend
- Python Flask
- Flask-SocketIO (WebSocket support)
- SQLite database
- Azure OpenAI (text-embedding-3-large)
- NumPy for cosine similarity calculations

### Frontend
- React 18 with Hooks
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Socket.IO Client
- Axios

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Azure OpenAI API access

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables in `.env`:
```env
AZURE_OPENAI_ENDPOINT=https://xandar.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=text-embedding-3-large
```

5. Start the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5001` with WebSocket support.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Sign Up**: Enter a username to get started
2. **Post Thoughts**: Share what's on your mind using the floating action button
3. **Discover Thoughtmates**: The AI will automatically find users with similar thoughts
4. **Interact**: Like, comment, and save thoughts you resonate with
5. **Follow Users**: Follow thoughtmates to see their thoughts in your feed
6. **Chat**: Send direct messages to your thoughtmates in real-time
7. **Explore Feeds**: Browse Trending, News, Following, and Saved thoughts

## How It Works

1. **Thought Creation**: When you post a thought, it's sent to Azure OpenAI to generate a 3072-dimensional embedding vector
2. **Semantic Matching**: The system compares your thought embeddings with other users' embeddings using cosine similarity
3. **Thoughtmate Discovery**: Users with consistently high similarity scores (>50%) become your "thoughtmates"
4. **Real-time Updates**: All interactions (likes, comments, messages, deletions) broadcast instantly via WebSocket
5. **Smart Feed**: Your feed is personalized based on similarity scores and your follows

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user details with stats
- `GET /api/users` - Get all users
- `PUT /api/users/:id/bio` - Update user bio

### Thoughts
- `POST /api/thoughts` - Create a new thought (generates embeddings)
- `GET /api/thoughts` - Get all thoughts with similarity scores
- `GET /api/thoughts/trending` - Get trending thoughts by engagement
- `GET /api/thoughts/following` - Get thoughts from followed users
- `GET /api/thoughts/:id` - Get specific thought
- `DELETE /api/thoughts/:id` - Delete a thought
- `GET /api/users/:id/thoughts` - Get user's thoughts
- `DELETE /api/users/:id/thoughts` - Delete all user's thoughts

### Social Interactions
- `POST /api/thoughts/:id/like` - Like a thought
- `POST /api/thoughts/:id/unlike` - Unlike a thought
- `GET /api/thoughts/:id/likes` - Get users who liked a thought
- `POST /api/thoughts/:id/comments` - Add a comment
- `GET /api/thoughts/:id/comments` - Get thought comments
- `DELETE /api/comments/:id` - Delete a comment

### Following
- `POST /api/users/:id/follow` - Follow a user
- `POST /api/users/:id/unfollow` - Unfollow a user
- `GET /api/users/:id/following` - Get users being followed
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:follower_id/is-following/:following_id` - Check follow status

### Saved Thoughts
- `POST /api/thoughts/:id/save` - Save a thought
- `POST /api/thoughts/:id/unsave` - Unsave a thought
- `GET /api/users/:id/saved` - Get saved thoughts

### Thoughtmates
- `GET /api/users/:id/thoughtmates` - Get user's top thoughtmates
- `GET /api/users/:id/similar-thoughts` - Get thoughts similar to user's thoughts

### Messaging
- `POST /api/conversations` - Create or get a conversation
- `GET /api/users/:id/conversations` - Get user's conversations
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send a message
- `DELETE /api/conversations/:id/messages` - Delete conversation
- `GET /api/users/:id/unread-count` - Get unread message count

### WebSocket Events
- `thought_created` - New thought posted
- `thought_liked` - Thought was liked
- `thought_unliked` - Thought was unliked
- `thought_deleted` - Thought was deleted
- `thoughts_bulk_deleted` - All user thoughts deleted
- `comment_posted` - New comment added
- `message_sent` - New message in conversation
- `conversation_deleted` - Conversation was deleted

## Project Structure

```
HTLY/
├── backend/
│   ├── app.py              # Flask + SocketIO application
│   ├── database.py         # SQLite database operations
│   ├── embedding_service.py # Azure OpenAI embedding service
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables
│   └── htly.db            # SQLite database (auto-generated)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Feed.jsx           # Main feed with tabs
    │   │   ├── Profile.jsx        # User profile & settings
    │   │   ├── Thoughtmates.jsx   # Thoughtmates discovery
    │   │   ├── ChatList.jsx       # Conversations list
    │   │   ├── ChatWindow.jsx     # Message thread
    │   │   ├── CommentsModal.jsx  # Thought comments
    │   │   ├── ThoughtComposer.jsx # Create thought modal
    │   │   ├── BottomNav.jsx      # Navigation bar
    │   │   └── LoginPrompt.jsx    # Login screen
    │   ├── context/
    │   │   ├── UserContext.jsx    # User authentication
    │   │   └── SocketContext.jsx  # WebSocket connection
    │   ├── App.jsx         # Main app component
    │   └── main.jsx        # Entry point
    ├── package.json        # Node dependencies
    ├── tailwind.config.js  # Tailwind configuration
    └── vite.config.js      # Vite configuration
```

## Database Schema

- **users**: User accounts with username, avatar, bio
- **thoughts**: User thoughts with content and embeddings
- **matches**: Pre-calculated thoughtmate similarity scores
- **likes**: Thought likes
- **comments**: Thought comments
- **follows**: User follow relationships
- **saved_thoughts**: User-saved thoughts
- **conversations**: Direct message conversations
- **messages**: Chat messages with read status

## Design Philosophy

The UI is inspired by modern social platforms, featuring:
- Dark theme (#0a0a0a background)
- Gradient accents (blue #3b82f6 to purple #a855f7)
- Card-based layouts with subtle borders
- Smooth animations using Framer Motion
- Mobile-first responsive design
- Bottom navigation for easy thumb access
- Real-time feedback for all interactions

## Security Considerations

- User authentication via localStorage (client-side)
- Authorization checks on all API endpoints
- Ownership verification for delete operations
- SQL injection prevention via parameterized queries
- Input validation on all user inputs

## Performance Optimizations

- Embedding caching in database
- Pre-calculated similarity scores
- Real-time updates via WebSocket (no polling)
- Optimistic UI updates
- Lazy loading of conversations
- Efficient similarity calculations with NumPy

## Future Enhancements

- [ ] User authentication (OAuth, JWT)
- [ ] Profile pictures upload
- [ ] Thought media attachments
- [ ] Advanced search and filtering
- [ ] Hashtags and categories
- [ ] User reputation/karma system
- [ ] Notification center
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Built with ❤️ using Azure OpenAI, Flask, React, and modern web technologies.
