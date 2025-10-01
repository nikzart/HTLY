from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from database import Database
from embedding_service import EmbeddingService
from typing import List, Dict

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SocketIO with CORS support
socketio = SocketIO(app, cors_allowed_origins="*")

db = Database()
embedding_service = EmbeddingService()

# Health check
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

# ========== User endpoints ==========

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    username = data.get('username')
    avatar_url = data.get('avatar_url')
    bio = data.get('bio', '')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    # Check if user exists
    existing_user = db.get_user_by_username(username)
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 409

    user_id = db.create_user(username, avatar_url, bio)
    user = db.get_user(user_id)

    # Add counts
    user['thoughts_count'] = 0
    user['thoughtmates_count'] = 0
    follow_counts = db.get_follow_counts(user_id)
    user.update(follow_counts)

    return jsonify(user), 201

@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = db.get_user(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Get user's thoughts count
    thoughts = db.get_user_thoughts(user_id)
    user['thoughts_count'] = len(thoughts)

    # Get thoughtmates count
    thoughtmates = db.get_thoughtmates(user_id)
    user['thoughtmates_count'] = len(thoughtmates)

    # Get follow counts
    follow_counts = db.get_follow_counts(user_id)
    user.update(follow_counts)

    return jsonify(user)

@app.route('/api/users/<int:user_id>/bio', methods=['PUT'])
def update_user_bio(user_id):
    data = request.json
    bio = data.get('bio', '')

    db.update_user_bio(user_id, bio)
    return jsonify({'success': True})

@app.route('/api/users', methods=['GET'])
def get_all_users():
    users = db.get_all_users()
    return jsonify(users)

# ========== Thought endpoints ==========

@app.route('/api/thoughts', methods=['POST'])
def create_thought():
    data = request.json
    user_id = data.get('user_id')
    content = data.get('content')

    if not user_id or not content:
        return jsonify({'error': 'user_id and content are required'}), 400

    # Check if user exists
    user = db.get_user(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Generate embedding
    try:
        embedding = embedding_service.get_embedding(content)
    except Exception as e:
        return jsonify({'error': f'Failed to generate embedding: {str(e)}'}), 500

    # Save thought
    thought_id = db.create_thought(user_id, content, embedding)

    # Update matches with other users
    update_user_matches(user_id)

    thought = db.get_thought(thought_id)
    # Remove embedding from response
    thought.pop('embedding', None)
    thought['like_count'] = 0
    thought['comment_count'] = 0
    thought['is_liked'] = False
    thought['is_saved'] = False

    # Broadcast new thought to all clients
    socketio.emit('thought_created', {'thought': thought})

    return jsonify(thought), 201

@app.route('/api/thoughts', methods=['GET'])
def get_all_thoughts():
    user_id = request.args.get('user_id', type=int)

    thoughts = db.get_all_thoughts(user_id)

    # Calculate similarity scores if user_id is provided
    if user_id:
        user_thoughts = db.get_user_thoughts(user_id)
        if user_thoughts:
            user_embeddings = [t['embedding'] for t in user_thoughts]

            for thought in thoughts:
                if thought['user_id'] != user_id:
                    full_thought = db.get_thought(thought['id'])
                    max_similarity = 0.0
                    for user_embedding in user_embeddings:
                        similarity = embedding_service.cosine_similarity(
                            user_embedding,
                            full_thought['embedding']
                        )
                        max_similarity = max(max_similarity, similarity)
                    thought['similarity_score'] = max_similarity

    # Remove embeddings from response
    for thought in thoughts:
        thought.pop('embedding', None)

    return jsonify(thoughts)

@app.route('/api/thoughts/trending', methods=['GET'])
def get_trending_thoughts():
    user_id = request.args.get('user_id', type=int)
    hours = request.args.get('hours', default=24, type=int)

    thoughts = db.get_trending_thoughts(user_id, hours)

    # Remove embeddings from response
    for thought in thoughts:
        thought.pop('embedding', None)

    return jsonify(thoughts)

@app.route('/api/thoughts/following', methods=['GET'])
def get_following_thoughts():
    user_id = request.args.get('user_id', type=int)

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    thoughts = db.get_following_thoughts(user_id)

    # Remove embeddings from response
    for thought in thoughts:
        thought.pop('embedding', None)

    return jsonify(thoughts)

@app.route('/api/thoughts/<int:thought_id>', methods=['GET'])
def get_thought_route(thought_id):
    thought = db.get_thought(thought_id)
    if not thought:
        return jsonify({'error': 'Thought not found'}), 404

    # Remove embedding from response
    thought.pop('embedding', None)

    return jsonify(thought)

@app.route('/api/users/<int:user_id>/thoughts', methods=['GET'])
def get_user_thoughts(user_id):
    thoughts = db.get_user_thoughts(user_id)

    # Remove embeddings from response
    for thought in thoughts:
        thought.pop('embedding', None)

    return jsonify(thoughts)

# ========== Like endpoints ==========

@app.route('/api/thoughts/<int:thought_id>/like', methods=['POST'])
def like_thought(thought_id):
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    db.like_thought(thought_id, user_id)

    # Get updated thought data and broadcast to all clients
    thoughts = db.get_all_thoughts(user_id)
    thought = next((t for t in thoughts if t['id'] == thought_id), None)
    if thought:
        socketio.emit('thought_liked', {'thought_id': thought_id, 'thought': thought})

    return jsonify({'success': True})

@app.route('/api/thoughts/<int:thought_id>/unlike', methods=['POST'])
def unlike_thought(thought_id):
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    db.unlike_thought(thought_id, user_id)

    # Get updated thought data and broadcast to all clients
    thoughts = db.get_all_thoughts(user_id)
    thought = next((t for t in thoughts if t['id'] == thought_id), None)
    if thought:
        socketio.emit('thought_unliked', {'thought_id': thought_id, 'thought': thought})

    return jsonify({'success': True})

@app.route('/api/thoughts/<int:thought_id>/likes', methods=['GET'])
def get_thought_likes(thought_id):
    likes = db.get_thought_likes(thought_id)
    return jsonify(likes)

# ========== Comment endpoints ==========

@app.route('/api/thoughts/<int:thought_id>/comments', methods=['POST'])
def create_comment(thought_id):
    data = request.json
    user_id = data.get('user_id')
    content = data.get('content')

    if not user_id or not content:
        return jsonify({'error': 'user_id and content are required'}), 400

    comment_id = db.create_comment(thought_id, user_id, content)
    comments = db.get_thought_comments(thought_id)

    # Find the comment we just created
    comment = next((c for c in comments if c['id'] == comment_id), None)

    # Broadcast the new comment to all clients
    if comment:
        socketio.emit('comment_posted', {'thought_id': thought_id, 'comment': comment})

    return jsonify(comment), 201

@app.route('/api/thoughts/<int:thought_id>/comments', methods=['GET'])
def get_thought_comments(thought_id):
    comments = db.get_thought_comments(thought_id)
    return jsonify(comments)

@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    user_id = request.args.get('user_id', type=int)

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    deleted = db.delete_comment(comment_id, user_id)

    if deleted:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Comment not found or unauthorized'}), 404

# ========== Follow endpoints ==========

@app.route('/api/users/<int:following_id>/follow', methods=['POST'])
def follow_user(following_id):
    data = request.json
    follower_id = data.get('user_id')

    if not follower_id:
        return jsonify({'error': 'user_id is required'}), 400

    success = db.follow_user(follower_id, following_id)

    if success:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Cannot follow yourself or already following'}), 400

@app.route('/api/users/<int:following_id>/unfollow', methods=['POST'])
def unfollow_user(following_id):
    data = request.json
    follower_id = data.get('user_id')

    if not follower_id:
        return jsonify({'error': 'user_id is required'}), 400

    db.unfollow_user(follower_id, following_id)
    return jsonify({'success': True})

@app.route('/api/users/<int:user_id>/following', methods=['GET'])
def get_following(user_id):
    following = db.get_following(user_id)
    return jsonify(following)

@app.route('/api/users/<int:user_id>/followers', methods=['GET'])
def get_followers(user_id):
    followers = db.get_followers(user_id)
    return jsonify(followers)

@app.route('/api/users/<int:follower_id>/is-following/<int:following_id>', methods=['GET'])
def is_following(follower_id, following_id):
    is_following = db.is_following(follower_id, following_id)
    return jsonify({'is_following': is_following})

# ========== Saved thoughts endpoints ==========

@app.route('/api/thoughts/<int:thought_id>/save', methods=['POST'])
def save_thought(thought_id):
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    db.save_thought(user_id, thought_id)
    return jsonify({'success': True})

@app.route('/api/thoughts/<int:thought_id>/unsave', methods=['POST'])
def unsave_thought(thought_id):
    data = request.json
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    db.unsave_thought(user_id, thought_id)
    return jsonify({'success': True})

@app.route('/api/users/<int:user_id>/saved', methods=['GET'])
def get_saved_thoughts(user_id):
    thoughts = db.get_saved_thoughts(user_id)

    # Remove embeddings from response
    for thought in thoughts:
        thought.pop('embedding', None)

    return jsonify(thoughts)

# ========== Thoughtmates endpoints ==========

@app.route('/api/users/<int:user_id>/thoughtmates', methods=['GET'])
def get_thoughtmates(user_id):
    limit = request.args.get('limit', default=10, type=int)
    thoughtmates = db.get_thoughtmates(user_id, limit)

    # Add thought counts for each thoughtmate
    for tm in thoughtmates:
        thoughts = db.get_user_thoughts(tm['id'])
        tm['thoughts_count'] = len(thoughts)

    return jsonify(thoughtmates)

@app.route('/api/users/<int:user_id>/similar-thoughts', methods=['GET'])
def get_similar_thoughts(user_id):
    """Get thoughts similar to a user's thoughts."""
    threshold = request.args.get('threshold', default=0.7, type=float)

    user_thoughts = db.get_user_thoughts(user_id)
    if not user_thoughts:
        return jsonify([])

    all_thoughts = db.get_all_thoughts()

    # Filter out user's own thoughts
    other_thoughts = [t for t in all_thoughts if t['user_id'] != user_id]

    similar_thoughts = []
    for user_thought in user_thoughts:
        similar = embedding_service.find_similar_thoughts(
            user_thought['embedding'],
            other_thoughts,
            threshold
        )
        similar_thoughts.extend(similar)

    # Remove duplicates and sort by similarity
    seen = set()
    unique_similar = []
    for thought in similar_thoughts:
        if thought['id'] not in seen:
            seen.add(thought['id'])
            thought.pop('embedding', None)
            unique_similar.append(thought)

    unique_similar.sort(key=lambda x: x['similarity_score'], reverse=True)

    return jsonify(unique_similar[:20])  # Return top 20

# ========== Chat/Messaging endpoints ==========

@app.route('/api/conversations', methods=['POST'])
def create_conversation():
    data = request.json
    user1_id = data.get('user_id')
    user2_id = data.get('other_user_id')

    if not user1_id or not user2_id:
        return jsonify({'error': 'user_id and other_user_id are required'}), 400

    conversation_id = db.create_or_get_conversation(user1_id, user2_id)
    return jsonify({'conversation_id': conversation_id})

@app.route('/api/users/<int:user_id>/conversations', methods=['GET'])
def get_conversations(user_id):
    conversations = db.get_user_conversations(user_id)
    return jsonify(conversations)

@app.route('/api/conversations/<int:conversation_id>/messages', methods=['GET'])
def get_messages(conversation_id):
    user_id = request.args.get('user_id', type=int)

    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400

    messages = db.get_conversation_messages(conversation_id, user_id)
    return jsonify(messages)

@app.route('/api/conversations/<int:conversation_id>/messages', methods=['POST'])
def send_message(conversation_id):
    data = request.json
    sender_id = data.get('sender_id')
    content = data.get('content')

    if not sender_id or not content:
        return jsonify({'error': 'sender_id and content are required'}), 400

    message_id = db.send_message(conversation_id, sender_id, content)

    # Get the message we just created
    messages = db.get_conversation_messages(conversation_id, sender_id)
    message = next((m for m in messages if m['id'] == message_id), None)

    # Broadcast the new message to all clients in real-time
    if message:
        socketio.emit('message_sent', {
            'conversation_id': conversation_id,
            'message': message
        })

    return jsonify(message), 201

@app.route('/api/users/<int:user_id>/unread-count', methods=['GET'])
def get_unread_count(user_id):
    count = db.get_unread_message_count(user_id)
    return jsonify({'unread_count': count})

# ========== Helper functions ==========

def update_user_matches(user_id: int):
    """Update similarity scores between a user and all other users."""
    user_thoughts = db.get_user_thoughts(user_id)
    if not user_thoughts:
        return

    all_users = db.get_all_users()

    for other_user in all_users:
        if other_user['id'] == user_id:
            continue

        other_thoughts = db.get_user_thoughts(other_user['id'])
        if not other_thoughts:
            continue

        # Calculate similarity
        similarity = embedding_service.calculate_user_similarity(
            user_thoughts,
            other_thoughts
        )

        # Update matches in both directions
        if similarity > 0.5:  # Only store meaningful matches
            db.create_or_update_match(user_id, other_user['id'], similarity)
            db.create_or_update_match(other_user['id'], user_id, similarity)

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001, allow_unsafe_werkzeug=True)
