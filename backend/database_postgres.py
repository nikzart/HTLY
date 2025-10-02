import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from datetime import datetime

class DatabasePostgres:
    """PostgreSQL database adapter for production"""

    def __init__(self):
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")

        # Create connection pool
        self.pool = SimpleConnectionPool(1, 10, database_url)
        self.init_db()

    def get_connection(self):
        """Get connection from pool"""
        return self.pool.getconn()

    def release_connection(self, conn):
        """Return connection to pool"""
        self.pool.putconn(conn)

    def init_db(self):
        """Initialize database schema"""
        conn = self.get_connection()
        cursor = conn.cursor()

        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                avatar_url TEXT,
                bio TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                auth0_id VARCHAR(255) UNIQUE,
                email VARCHAR(255)
            )
        ''')

        # Thoughts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS thoughts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                embedding JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at)')

        # Matches table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                matched_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                similarity_score REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, matched_user_id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_matches_similarity ON matches(similarity_score)')

        # Likes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS likes (
                id SERIAL PRIMARY KEY,
                thought_id INTEGER REFERENCES thoughts(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(thought_id, user_id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_likes_thought_id ON likes(thought_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id)')

        # Comments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                thought_id INTEGER REFERENCES thoughts(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_comments_thought_id ON comments(thought_id)')

        # Follows table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_id, following_id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)')

        # Saved thoughts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS saved_thoughts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                thought_id INTEGER REFERENCES thoughts(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, thought_id)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_saved_user_id ON saved_thoughts(user_id)')

        # Conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user1_id, user2_id)
            )
        ''')

        # Messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)')

        conn.commit()
        self.release_connection(conn)

    # NOTE: All other methods from database.py should be copied here with:
    # 1. Replace conn = sqlite3.connect() with conn = self.get_connection()
    # 2. Replace conn.close() with self.release_connection(conn)
    # 3. Replace cursor.fetchone() dict conversion with RealDictCursor
    # 4. Replace ? with %s for PostgreSQL parameterized queries
    # 5. Replace json.dumps(embedding) with just embedding (JSONB handles this)

    def dict_factory(self, cursor, row):
        """Convert cursor row to dictionary - not needed with RealDictCursor"""
        d = {}
        for idx, col in enumerate(cursor.description):
            d[col[0]] = row[idx]
        return d

    # The rest of the methods will be similar to database.py but adapted for PostgreSQL
    # Due to size, I'll provide the key pattern changes needed
