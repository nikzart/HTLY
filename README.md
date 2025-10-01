# HTLY - Who Thinks Like You

A platform where like-minded people with similar thoughts can connect with each other using AI-powered semantic matching.

## Features

- 🧠 **Semantic Matching**: Advanced AI-powered matching using Azure OpenAI embeddings
- 🎨 **Beautiful UI**: Dark theme with smooth animations and mobile-friendly design
- 💭 **Thought Sharing**: Post your thoughts and find people who think like you
- 🤝 **Thoughtmates**: Discover users with similar thinking patterns
- ⚡ **Real-time Matching**: Automatic similarity scoring as you post

## Tech Stack

### Backend
- Python Flask
- SQLite database
- Azure OpenAI (text-embedding-3-large)
- NumPy for similarity calculations

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React Icons

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. The `.env` file is already configured with Azure OpenAI credentials. If needed, update it:
```env
AZURE_OPENAI_ENDPOINT=https://xandar.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_API_VERSION=2024-12-01-preview
AZURE_OPENAI_DEPLOYMENT=text-embedding-3-large
```

4. Start the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

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

The frontend will run on `http://localhost:3000`

## Usage

1. **Sign Up**: Enter a username to get started
2. **Post Thoughts**: Share what's on your mind using the floating action button
3. **Discover Thoughtmates**: The AI will automatically find users with similar thoughts
4. **View Matches**: Check your profile to see your top thoughtmates and similarity scores

## How It Works

1. **Thought Creation**: When you post a thought, it's sent to Azure OpenAI to generate a 3072-dimensional embedding vector
2. **Semantic Matching**: The system compares your thought embeddings with other users' embeddings using cosine similarity
3. **Thoughtmate Discovery**: Users with consistently high similarity scores become your "thoughtmates"
4. **Real-time Updates**: Match scores are updated automatically as you post more thoughts

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user details
- `GET /api/users` - Get all users

### Thoughts
- `POST /api/thoughts` - Create a new thought
- `GET /api/thoughts` - Get all thoughts (with optional user_id for similarity scores)
- `GET /api/users/:id/thoughts` - Get user's thoughts

### Thoughtmates
- `GET /api/users/:id/thoughtmates` - Get user's thoughtmates
- `GET /api/users/:id/similar-thoughts` - Get thoughts similar to user's thoughts

## Project Structure

```
HTLY/
├── backend/
│   ├── app.py              # Flask application
│   ├── database.py         # SQLite database operations
│   ├── embedding_service.py # Azure OpenAI embedding service
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
└── frontend/
    ├── src/
    │   ├── components/     # React components
    │   ├── context/        # React context
    │   ├── App.jsx         # Main app component
    │   └── main.jsx        # Entry point
    ├── package.json        # Node dependencies
    └── vite.config.js      # Vite configuration
```

## Design Inspiration

The UI is inspired by modern crypto and social platforms, featuring:
- Dark theme (#0a0a0a background)
- Gradient accents (blue to purple)
- Card-based layouts
- Smooth animations and transitions
- Mobile-first responsive design

## Future Enhancements

- Real-time notifications
- Direct messaging between thoughtmates
- Thought categories and tags
- Advanced filtering and search
- User reputation system
- Mobile app (React Native)

## License

MIT
