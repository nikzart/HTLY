import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Send, Sparkles } from 'lucide-react'
import axios from 'axios'
import { useSocket } from '../context/SocketContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api'

const CommentsModal = ({ thought, currentUser, onClose, onCommentAdded }) => {
  const { socket } = useSocket()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [thought.id])

  // Real-time comment listener
  useEffect(() => {
    if (!socket) return

    const handleCommentPosted = (data) => {
      // Only add comment if it's for this thought
      if (data.thought_id === thought.id) {
        setComments(prevComments => [...prevComments, data.comment])
      }
    }

    socket.on('comment_posted', handleCommentPosted)

    return () => {
      socket.off('comment_posted', handleCommentPosted)
    }
  }, [socket, thought.id])

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/thoughts/${thought.id}/comments`)
      setComments(response.data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      await axios.post(`${API_BASE}/thoughts/${thought.id}/comments`, {
        user_id: currentUser.id,
        content: newComment.trim()
      })

      // Don't update comments locally - the real-time event will handle it
      setNewComment('')
      onCommentAdded()
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-card w-full max-w-2xl rounded-3xl border border-dark-border flex flex-col max-h-[75vh] m-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-accent-blue" />
            <h2 className="text-xl font-bold">Comments</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-hover rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Original Thought */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-start space-x-3 mb-2">
            <img
              src={thought.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thought.username}`}
              alt={thought.username}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold">{thought.username}</p>
              <p className="text-sm text-gray-400">
                {new Date(thought.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <p className="text-white leading-relaxed">{thought.content}</p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="text-accent-blue" size={24} />
              </motion.div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start space-x-3"
              >
                <img
                  src={comment.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`}
                  alt={comment.username}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200">{comment.content}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-dark-border">
          <div className="flex items-center space-x-3">
            <img
              src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
              alt={currentUser.username}
              className="w-8 h-8 rounded-full flex-shrink-0"
            />
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue transition-colors text-sm"
              disabled={submitting}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="p-2 bg-accent-blue text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={18} />
                </motion.div>
              ) : (
                <Send size={18} />
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default CommentsModal
