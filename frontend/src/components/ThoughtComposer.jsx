import { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { X, Sparkles, Send } from 'lucide-react'
import axios from 'axios'
import { UserContext } from '../context/UserContext'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api'

const ThoughtComposer = ({ onClose, onSuccess }) => {
  const { currentUser } = useContext(UserContext)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await axios.post(`${API_BASE}/thoughts`, {
        user_id: currentUser.id,
        content: content.trim()
      })
      onSuccess()
    } catch (error) {
      console.error('Error creating thought:', error)
      alert('Failed to post thought. Please try again.')
    } finally {
      setLoading(false)
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
        className="bg-dark-card w-full max-w-md rounded-3xl border border-dark-border p-6 m-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-accent-blue" />
            <h2 className="text-xl font-bold">Share Your Thought</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-hover rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
            alt={currentUser.username}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-medium">{currentUser.username}</p>
            <p className="text-xs text-gray-400">Posting publicly</p>
          </div>
        </div>

        {/* Textarea */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-40 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue transition-colors resize-none"
            disabled={loading}
            autoFocus
          />

          {/* Character Count */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-400">
              {content.length} / 500 characters
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading || !content.trim() || content.length > 500}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={16} />
                  </motion.div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Post</span>
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Hint */}
        <div className="mt-4 p-3 bg-accent-blue/10 border border-accent-blue/20 rounded-xl">
          <p className="text-xs text-gray-400 flex items-start space-x-2">
            <Sparkles size={14} className="text-accent-blue mt-0.5 flex-shrink-0" />
            <span>
              We'll use AI to find people who share similar thoughts with you!
            </span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ThoughtComposer
