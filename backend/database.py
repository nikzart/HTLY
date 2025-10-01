import sqlite3
import json
from datetime import datetime
from typing import List, Tuple, Optional

class Database:
    def __init__(self, db_path='htly.db'):
        self.db_path = db_path
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Users table with bio
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                avatar_url TEXT,
                bio TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Thoughts table with embedding stored as JSON
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS thoughts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                embedding TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        # Matches table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                matched_user_id INTEGER NOT NULL,
                similarity_score REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (matched_user_id) REFERENCES users (id),
                UNIQUE(user_id, matched_user_id)
            )
        ''')

        # Likes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thought_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (thought_id) REFERENCES thoughts (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(thought_id, user_id)
            )
        ''')

        # Comments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thought_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (thought_id) REFERENCES thoughts (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

        # Follows table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS follows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                follower_id INTEGER NOT NULL,
                following_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(follower_id, following_id)
            )
        ''')

        # Saved thoughts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS saved_thoughts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                thought_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (thought_id) REFERENCES thoughts (id) ON DELETE CASCADE,
                UNIQUE(user_id, thought_id)
            )
        ''')

        # Conversations table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user1_id INTEGER NOT NULL,
                user2_id INTEGER NOT NULL,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user1_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (user2_id) REFERENCES users (id) ON DELETE CASCADE,
                UNIQUE(user1_id, user2_id)
            )
        ''')

        # Messages table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                sender_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                is_read INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')

        conn.commit()
        conn.close()

    # User operations
    def create_user(self, username: str, avatar_url: str = None, bio: str = '') -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, avatar_url, bio) VALUES (?, ?, ?)',
            (username, avatar_url, bio)
        )
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return user_id

    def update_user_bio(self, user_id: int, bio: str):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET bio = ? WHERE id = ?', (bio, user_id))
        conn.commit()
        conn.close()

    def get_user(self, user_id: int) -> Optional[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        conn.close()
        return dict(user) if user else None

    def get_user_by_username(self, username: str) -> Optional[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        return dict(user) if user else None

    def get_all_users(self) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
        users = cursor.fetchall()
        conn.close()
        return [dict(user) for user in users]

    # Thought operations
    def create_thought(self, user_id: int, content: str, embedding: List[float]) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        embedding_json = json.dumps(embedding)
        cursor.execute(
            'INSERT INTO thoughts (user_id, content, embedding) VALUES (?, ?, ?)',
            (user_id, content, embedding_json)
        )
        thought_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return thought_id

    def get_thought(self, thought_id: int) -> Optional[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM thoughts WHERE id = ?', (thought_id,))
        thought = cursor.fetchone()
        conn.close()
        if thought:
            thought_dict = dict(thought)
            thought_dict['embedding'] = json.loads(thought_dict['embedding'])
            return thought_dict
        return None

    def get_all_thoughts(self, user_id: int = None) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()

        query = '''
            SELECT t.*, u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id) as like_count,
                   (SELECT COUNT(*) FROM comments WHERE thought_id = t.id) as comment_count
        '''

        if user_id:
            query += f''',
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id AND user_id = {user_id}) as is_liked,
                   (SELECT COUNT(*) FROM saved_thoughts WHERE thought_id = t.id AND user_id = {user_id}) as is_saved
            '''

        query += '''
            FROM thoughts t
            JOIN users u ON t.user_id = u.id
            ORDER BY t.created_at DESC
        '''

        cursor.execute(query)
        thoughts = cursor.fetchall()
        conn.close()
        result = []
        for thought in thoughts:
            thought_dict = dict(thought)
            thought_dict['embedding'] = json.loads(thought_dict['embedding'])
            if user_id:
                thought_dict['is_liked'] = bool(thought_dict.get('is_liked', 0))
                thought_dict['is_saved'] = bool(thought_dict.get('is_saved', 0))
            result.append(thought_dict)
        return result

    def get_user_thoughts(self, user_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT t.*,
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id) as like_count,
                   (SELECT COUNT(*) FROM comments WHERE thought_id = t.id) as comment_count
            FROM thoughts t
            WHERE t.user_id = ?
            ORDER BY t.created_at DESC
        ''', (user_id,))
        thoughts = cursor.fetchall()
        conn.close()
        result = []
        for thought in thoughts:
            thought_dict = dict(thought)
            thought_dict['embedding'] = json.loads(thought_dict['embedding'])
            result.append(thought_dict)
        return result

    def get_following_thoughts(self, user_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT t.*, u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id) as like_count,
                   (SELECT COUNT(*) FROM comments WHERE thought_id = t.id) as comment_count,
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id AND user_id = ?) as is_liked,
                   (SELECT COUNT(*) FROM saved_thoughts WHERE thought_id = t.id AND user_id = ?) as is_saved
            FROM thoughts t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
            ORDER BY t.created_at DESC
        ''', (user_id, user_id, user_id))
        thoughts = cursor.fetchall()
        conn.close()
        result = []
        for thought in thoughts:
            thought_dict = dict(thought)
            thought_dict['embedding'] = json.loads(thought_dict['embedding'])
            thought_dict['is_liked'] = bool(thought_dict['is_liked'])
            thought_dict['is_saved'] = bool(thought_dict['is_saved'])
            result.append(thought_dict)
        return result

    def get_trending_thoughts(self, user_id: int = None, hours: int = 24) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()

        query = '''
            SELECT t.*, u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id) as like_count,
                   (SELECT COUNT(*) FROM comments WHERE thought_id = t.id) as comment_count,
                   ((SELECT COUNT(*) FROM likes WHERE thought_id = t.id) +
                    (SELECT COUNT(*) FROM comments WHERE thought_id = t.id) * 2) as engagement_score
        '''

        if user_id:
            query += f''',
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id AND user_id = {user_id}) as is_liked,
                   (SELECT COUNT(*) FROM saved_thoughts WHERE thought_id = t.id AND user_id = {user_id}) as is_saved
            '''

        query += f'''
            FROM thoughts t
            JOIN users u ON t.user_id = u.id
            WHERE t.created_at >= datetime('now', '-{hours} hours')
            ORDER BY engagement_score DESC, t.created_at DESC
            LIMIT 50
        '''

        cursor.execute(query)
        thoughts = cursor.fetchall()
        conn.close()
        result = []
        for thought in thoughts:
            thought_dict = dict(thought)
            thought_dict['embedding'] = json.loads(thought_dict['embedding'])
            if user_id:
                thought_dict['is_liked'] = bool(thought_dict.get('is_liked', 0))
                thought_dict['is_saved'] = bool(thought_dict.get('is_saved', 0))
            result.append(thought_dict)
        return result

    # Like operations
    def like_thought(self, thought_id: int, user_id: int):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO likes (thought_id, user_id) VALUES (?, ?)',
                (thought_id, user_id)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            pass  # Already liked
        conn.close()

    def unlike_thought(self, thought_id: int, user_id: int):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM likes WHERE thought_id = ? AND user_id = ?',
            (thought_id, user_id)
        )
        conn.commit()
        conn.close()

    def get_thought_likes(self, thought_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.id, u.username, u.avatar_url, l.created_at
            FROM likes l
            JOIN users u ON l.user_id = u.id
            WHERE l.thought_id = ?
            ORDER BY l.created_at DESC
        ''', (thought_id,))
        likes = cursor.fetchall()
        conn.close()
        return [dict(like) for like in likes]

    # Comment operations
    def create_comment(self, thought_id: int, user_id: int, content: str) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO comments (thought_id, user_id, content) VALUES (?, ?, ?)',
            (thought_id, user_id, content)
        )
        comment_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return comment_id

    def get_thought_comments(self, thought_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT c.*, u.username, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.thought_id = ?
            ORDER BY c.created_at ASC
        ''', (thought_id,))
        comments = cursor.fetchall()
        conn.close()
        return [dict(comment) for comment in comments]

    def delete_comment(self, comment_id: int, user_id: int) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM comments WHERE id = ? AND user_id = ?',
            (comment_id, user_id)
        )
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return deleted

    # Follow operations
    def follow_user(self, follower_id: int, following_id: int):
        if follower_id == following_id:
            return False
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
                (follower_id, following_id)
            )
            conn.commit()
            conn.close()
            return True
        except sqlite3.IntegrityError:
            conn.close()
            return False

    def unfollow_user(self, follower_id: int, following_id: int):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            (follower_id, following_id)
        )
        conn.commit()
        conn.close()

    def is_following(self, follower_id: int, following_id: int) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'SELECT COUNT(*) as count FROM follows WHERE follower_id = ? AND following_id = ?',
            (follower_id, following_id)
        )
        result = cursor.fetchone()
        conn.close()
        return result['count'] > 0

    def get_following(self, user_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.*, f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
            ORDER BY f.created_at DESC
        ''', (user_id,))
        following = cursor.fetchall()
        conn.close()
        return [dict(f) for f in following]

    def get_followers(self, user_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.*, f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
            ORDER BY f.created_at DESC
        ''', (user_id,))
        followers = cursor.fetchall()
        conn.close()
        return [dict(f) for f in followers]

    def get_follow_counts(self, user_id: int) -> dict:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT
                (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
                (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count
        ''', (user_id, user_id))
        result = cursor.fetchone()
        conn.close()
        return dict(result)

    # Saved thoughts operations
    def save_thought(self, user_id: int, thought_id: int):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                'INSERT INTO saved_thoughts (user_id, thought_id) VALUES (?, ?)',
                (user_id, thought_id)
            )
            conn.commit()
        except sqlite3.IntegrityError:
            pass  # Already saved
        conn.close()

    def unsave_thought(self, user_id: int, thought_id: int):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM saved_thoughts WHERE user_id = ? AND thought_id = ?',
            (user_id, thought_id)
        )
        conn.commit()
        conn.close()

    def get_saved_thoughts(self, user_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT t.*, u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id) as like_count,
                   (SELECT COUNT(*) FROM comments WHERE thought_id = t.id) as comment_count,
                   (SELECT COUNT(*) FROM likes WHERE thought_id = t.id AND user_id = ?) as is_liked,
                   1 as is_saved,
                   st.created_at as saved_at
            FROM saved_thoughts st
            JOIN thoughts t ON st.thought_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE st.user_id = ?
            ORDER BY st.created_at DESC
        ''', (user_id, user_id))
        thoughts = cursor.fetchall()
        conn.close()
        result = []
        for thought in thoughts:
            thought_dict = dict(thought)
            thought_dict['embedding'] = json.loads(thought_dict['embedding'])
            thought_dict['is_liked'] = bool(thought_dict['is_liked'])
            thought_dict['is_saved'] = True
            result.append(thought_dict)
        return result

    # Match operations
    def create_or_update_match(self, user_id: int, matched_user_id: int, similarity_score: float):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO matches (user_id, matched_user_id, similarity_score)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, matched_user_id)
            DO UPDATE SET similarity_score = ?, created_at = CURRENT_TIMESTAMP
        ''', (user_id, matched_user_id, similarity_score, similarity_score))
        conn.commit()
        conn.close()

    def get_thoughtmates(self, user_id: int, limit: int = 10) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT u.*, m.similarity_score,
                   (SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following
            FROM matches m
            JOIN users u ON m.matched_user_id = u.id
            WHERE m.user_id = ?
            ORDER BY m.similarity_score DESC
            LIMIT ?
        ''', (user_id, user_id, limit))
        thoughtmates = cursor.fetchall()
        conn.close()
        result = [dict(tm) for tm in thoughtmates]
        for tm in result:
            tm['is_following'] = bool(tm['is_following'])
        return result

    # Conversation operations
    def create_or_get_conversation(self, user1_id: int, user2_id: int) -> int:
        # Ensure consistent ordering
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id

        conn = self.get_connection()
        cursor = conn.cursor()

        # Check if conversation exists
        cursor.execute(
            'SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?',
            (user1_id, user2_id)
        )
        result = cursor.fetchone()

        if result:
            conn.close()
            return result['id']

        # Create new conversation
        cursor.execute(
            'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
            (user1_id, user2_id)
        )
        conversation_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return conversation_id

    def get_user_conversations(self, user_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT c.*,
                   CASE
                       WHEN c.user1_id = ? THEN u2.id
                       ELSE u1.id
                   END as other_user_id,
                   CASE
                       WHEN c.user1_id = ? THEN u2.username
                       ELSE u1.username
                   END as other_username,
                   CASE
                       WHEN c.user1_id = ? THEN u2.avatar_url
                       ELSE u1.avatar_url
                   END as other_avatar_url,
                   (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                   (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
            FROM conversations c
            JOIN users u1 ON c.user1_id = u1.id
            JOIN users u2 ON c.user2_id = u2.id
            WHERE c.user1_id = ? OR c.user2_id = ?
            ORDER BY c.last_message_at DESC
        ''', (user_id, user_id, user_id, user_id, user_id, user_id))
        conversations = cursor.fetchall()
        conn.close()
        return [dict(conv) for conv in conversations]

    def send_message(self, conversation_id: int, sender_id: int, content: str) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
            (conversation_id, sender_id, content)
        )
        message_id = cursor.lastrowid

        # Update conversation last_message_at
        cursor.execute(
            'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
            (conversation_id,)
        )

        conn.commit()
        conn.close()
        return message_id

    def get_conversation_messages(self, conversation_id: int, user_id: int) -> List[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT m.*, u.username, u.avatar_url
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = ?
            ORDER BY m.created_at ASC
        ''', (conversation_id,))
        messages = cursor.fetchall()

        # Mark messages as read
        cursor.execute('''
            UPDATE messages
            SET is_read = 1
            WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
        ''', (conversation_id, user_id))

        conn.commit()
        conn.close()
        return [dict(msg) for msg in messages]

    def get_unread_message_count(self, user_id: int) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) as count
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE (c.user1_id = ? OR c.user2_id = ?)
              AND m.sender_id != ?
              AND m.is_read = 0
        ''', (user_id, user_id, user_id))
        result = cursor.fetchone()
        conn.close()
        return result['count']
