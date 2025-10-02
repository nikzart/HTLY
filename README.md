# HTLY - Who Thinks Like You

A real-time social platform where like-minded people with similar thoughts can connect using AI-powered semantic matching.

## Features

- 🔐 **Auth0 Authentication**: Secure signup, login, and password recovery with OAuth support
- 👤 **Profile Setup**: Customizable profiles with username, bio, and avatar
- 🖼️ **Avatar Upload**: Upload custom avatars with automatic image optimization and resizing
- 🧠 **Semantic Matching**: Advanced AI-powered matching using Azure OpenAI embeddings
- 💬 **Real-time Messaging**: Direct chat with your thoughtmates using WebSockets
- ⚡ **Live Updates**: Real-time notifications for likes, comments, and new thoughts
- 💭 **Thought Sharing**: Post your thoughts and find people who think like you
- 🤝 **Thoughtmates**: Discover users with similar thinking patterns
- ❤️ **Social Interactions**: Like, comment, save, and share thoughts
- 👥 **Follow System**: Follow users to see their thoughts in your feed
- 🎨 **Beautiful UI**: Dark theme with smooth animations and mobile-first design
- 🔄 **Multiple Feeds**: Trending, News, Following, and Saved thoughts tabs
- ⬆️ **Scroll to Top**: Quick navigation button in feed for better UX

## Tech Stack

### Backend
- Python Flask
- Flask-SocketIO (WebSocket support)
- SQLite database
- Azure OpenAI (text-embedding-3-large)
- NumPy for cosine similarity calculations
- Auth0 (JWT authentication)
- Pillow (image processing)

### Frontend
- React 18 with Hooks
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons
- Socket.IO Client
- Axios
- Auth0 React SDK

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- Azure OpenAI API access
- Auth0 account (for authentication)

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

4. Configure environment variables by copying `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` with your credentials:
```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
AUTH0_ALGORITHMS=RS256

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=text-embedding-3-large

# API Configuration
FLASK_ENV=development
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

3. Configure environment variables by copying `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` with your Auth0 credentials:
```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=https://your-tenant.auth0.com/api/v2/
VITE_API_BASE=http://localhost:5001/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Sign Up/Login**: Authenticate with Auth0 (email/password or social login)
2. **Complete Profile**: Set up your username, bio, and avatar (upload or URL)
3. **Post Thoughts**: Share what's on your mind using the floating action button
4. **Discover Thoughtmates**: The AI will automatically find users with similar thoughts
5. **Interact**: Like, comment, and save thoughts you resonate with
6. **Follow Users**: Follow thoughtmates to see their thoughts in your feed
7. **Chat**: Send direct messages to your thoughtmates in real-time
8. **Explore Feeds**: Browse Trending, News, Following, and Saved thoughts
9. **Customize Avatar**: Upload custom images or use URLs for your profile picture

## How It Works

1. **Thought Creation**: When you post a thought, it's sent to Azure OpenAI to generate a 3072-dimensional embedding vector
2. **Semantic Matching**: The system compares your thought embeddings with other users' embeddings using cosine similarity
3. **Thoughtmate Discovery**: Users with consistently high similarity scores (>50%) become your "thoughtmates"
4. **Real-time Updates**: All interactions (likes, comments, messages, deletions) broadcast instantly via WebSocket
5. **Smart Feed**: Your feed is personalized based on similarity scores and your follows

## API Endpoints

### Authentication
- `POST /api/auth/profile` - Create or update user profile (Auth0 protected)
- `PUT /api/auth/profile` - Update user profile (Auth0 protected)

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user details with stats
- `GET /api/users` - Get all users
- `PUT /api/users/:id/bio` - Update user bio

### Avatar Upload
- `POST /api/upload/avatar` - Upload avatar image (Auth0 protected, max 5MB)
- `GET /uploads/avatars/:filename` - Serve uploaded avatar images

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
│   ├── auth_middleware.py  # Auth0 JWT verification
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Environment variables (not in git)
│   ├── .env.example       # Environment variables template
│   ├── .gitignore         # Git ignore rules
│   ├── htly.db            # SQLite database (auto-generated)
│   └── uploads/           # Uploaded files (not in git)
│       └── avatars/       # User avatar images
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Feed.jsx           # Main feed with tabs & scroll
    │   │   ├── Profile.jsx        # User profile & settings
    │   │   ├── ProfileSetup.jsx   # New user onboarding
    │   │   ├── Thoughtmates.jsx   # Thoughtmates discovery
    │   │   ├── ChatList.jsx       # Conversations list
    │   │   ├── ChatWindow.jsx     # Message thread
    │   │   ├── CommentsModal.jsx  # Thought comments
    │   │   ├── ThoughtComposer.jsx # Create thought modal
    │   │   ├── BottomNav.jsx      # Navigation bar
    │   │   └── LoginPrompt.jsx    # Auth0 login screen
    │   ├── context/
    │   │   ├── UserContext.jsx    # User authentication state
    │   │   └── SocketContext.jsx  # WebSocket connection
    │   ├── config/
    │   │   └── axiosConfig.js     # Axios Auth0 interceptor
    │   ├── App.jsx         # Main app component
    │   ├── main.jsx        # Entry point with Auth0Provider
    │   └── index.css       # Global styles
    ├── package.json        # Node dependencies
    ├── tailwind.config.js  # Tailwind configuration
    ├── vite.config.js      # Vite configuration
    ├── .env               # Environment variables (not in git)
    └── .env.example       # Environment variables template
```

## Database Schema

- **users**: User accounts with auth0_id, username, avatar_url, bio, email
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

- **Auth0 Authentication**: Industry-standard OAuth2/OIDC authentication
- **JWT Tokens**: Secure token-based authorization on protected endpoints
- **Authorization Checks**: All API endpoints verify user permissions
- **Ownership Verification**: Delete operations validate resource ownership
- **SQL Injection Prevention**: Parameterized queries throughout
- **Input Validation**: File uploads validated for type, size, and content
- **Image Processing**: Uploaded images sanitized and optimized
- **Secure File Storage**: Uploaded files stored outside web root

## Performance Optimizations

- Embedding caching in database
- Pre-calculated similarity scores
- Real-time updates via WebSocket (no polling)
- Optimistic UI updates
- Lazy loading of conversations
- Efficient similarity calculations with NumPy
- Image optimization and resizing on upload
- Scroll performance with virtualization patterns

## Future Enhancements

- [x] User authentication (OAuth, JWT) ✅
- [x] Profile pictures upload ✅
- [ ] Thought media attachments (images, videos)
- [ ] Advanced search and filtering
- [ ] Hashtags and categories
- [ ] User reputation/karma system
- [ ] Notification center
- [ ] Email notifications
- [ ] Push notifications
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Dark/Light theme toggle
- [ ] Export user data (GDPR compliance)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Built with ❤️ using Azure OpenAI, Flask, React, and modern web technologies.
