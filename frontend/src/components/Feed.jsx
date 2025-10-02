import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, MessageCircle, Share2, Sparkles, Bookmark, Trash2 } from 'lucide-react'
import axios from 'axios'
import { UserContext } from '../context/UserContext'
import { useSocket } from '../context/SocketContext'
import LoginPrompt from './LoginPrompt'
import CommentsModal from './CommentsModal'

const API_BASE = 'http://localhost:5001/api'

const Feed = () => {
  const { currentUser, loading: userLoading } = useContext(UserContext)
  const { socket } = useSocket()
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('trending')
  const [selectedThought, setSelectedThought] = useState(null)

  useEffect(() => {
    if (currentUser) {
      fetchThoughts()
    }
  }, [currentUser, activeTab])

  // Real-time event listeners
  useEffect(() => {
    if (!socket) return

    const handleThoughtLiked = (data) => {
      setThoughts(prevThoughts =>
        prevThoughts.map(t =>
          t.id === data.thought_id ? { ...t, ...data.thought } : t
        )
      )
    }

    const handleThoughtUnliked = (data) => {
      setThoughts(prevThoughts =>
        prevThoughts.map(t =>
          t.id === data.thought_id ? { ...t, ...data.thought } : t
        )
      )
    }

    const handleCommentPosted = (data) => {
      setThoughts(prevThoughts =>
        prevThoughts.map(t =>
          t.id === data.thought_id
            ? { ...t, comment_count: (t.comment_count || 0) + 1 }
            : t
        )
      )
    }

    const handleThoughtCreated = (data) => {
      // Add new thought to the beginning of the feed
      setThoughts(prevThoughts => [data.thought, ...prevThoughts])
    }

    const handleThoughtDeleted = (data) => {
      // Remove deleted thought from feed
      setThoughts(prevThoughts => prevThoughts.filter(t => t.id !== data.thought_id))
    }

    const handleThoughtsBulkDeleted = (data) => {
      // Remove all thoughts from the specified user
      setThoughts(prevThoughts => prevThoughts.filter(t => t.user_id !== data.user_id))
    }

    socket.on('thought_liked', handleThoughtLiked)
    socket.on('thought_unliked', handleThoughtUnliked)
    socket.on('comment_posted', handleCommentPosted)
    socket.on('thought_created', handleThoughtCreated)
    socket.on('thought_deleted', handleThoughtDeleted)
    socket.on('thoughts_bulk_deleted', handleThoughtsBulkDeleted)

    return () => {
      socket.off('thought_liked', handleThoughtLiked)
      socket.off('thought_unliked', handleThoughtUnliked)
      socket.off('comment_posted', handleCommentPosted)
      socket.off('thought_created', handleThoughtCreated)
      socket.off('thought_deleted', handleThoughtDeleted)
      socket.off('thoughts_bulk_deleted', handleThoughtsBulkDeleted)
    }
  }, [socket])

  const fetchThoughts = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      let url = ''
      switch (activeTab) {
        case 'trending':
          url = `${API_BASE}/thoughts?user_id=${currentUser.id}`
          break
        case 'news':
          url = `${API_BASE}/thoughts/trending?user_id=${currentUser.id}`
          break
        case 'following':
          url = `${API_BASE}/thoughts/following?user_id=${currentUser.id}`
          break
        case 'saved':
          url = `${API_BASE}/users/${currentUser.id}/saved`
          break
        default:
          url = `${API_BASE}/thoughts?user_id=${currentUser.id}`
      }
      const response = await axios.get(url)
      setThoughts(response.data)
    } catch (error) {
      console.error('Error fetching thoughts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewThought = () => {
    fetchThoughts()
  }

  const handleLike = async (thoughtId, isLiked) => {
    try {
      const endpoint = isLiked ? 'unlike' : 'like'
      await axios.post(`${API_BASE}/thoughts/${thoughtId}/${endpoint}`, {
        user_id: currentUser.id
      })

      // Update local state
      setThoughts(thoughts.map(t => {
        if (t.id === thoughtId) {
          return {
            ...t,
            is_liked: !isLiked,
            like_count: isLiked ? t.like_count - 1 : t.like_count + 1
          }
        }
        return t
      }))
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleSave = async (thoughtId, isSaved) => {
    try {
      const endpoint = isSaved ? 'unsave' : 'save'
      await axios.post(`${API_BASE}/thoughts/${thoughtId}/${endpoint}`, {
        user_id: currentUser.id
      })

      // Update local state
      setThoughts(thoughts.map(t => {
        if (t.id === thoughtId) {
          return { ...t, is_saved: !isSaved }
        }
        return t
      }))
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  const handleDelete = async (thoughtId) => {
    if (!window.confirm('Are you sure you want to delete this thought? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/thoughts/${thoughtId}`, {
        data: { user_id: currentUser.id }
      })

      // Remove from local state
      setThoughts(thoughts.filter(t => t.id !== thoughtId))
    } catch (error) {
      console.error('Error deleting thought:', error)
      alert('Failed to delete thought')
    }
  }

  const handleCommentAdded = () => {
    fetchThoughts()
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="text-accent-blue" size={32} />
        </motion.div>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPrompt />
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-dark-bg/95 backdrop-blur-sm border-b border-dark-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
              HTLY
            </h1>
            <p className="text-xs text-gray-400">Who Thinks Like You</p>
          </div>
          <button className="p-2 rounded-full hover:bg-dark-hover transition-colors">
            <Search size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 pb-3 space-x-6 overflow-x-auto">
          <TabButton
            label="Trending"
            isActive={activeTab === 'trending'}
            onClick={() => setActiveTab('trending')}
          />
          <TabButton
            label="News"
            isActive={activeTab === 'news'}
            onClick={() => setActiveTab('news')}
          />
          <TabButton
            label="Following"
            isActive={activeTab === 'following'}
            onClick={() => setActiveTab('following')}
          />
          <TabButton
            label="Saved"
            isActive={activeTab === 'saved'}
            onClick={() => setActiveTab('saved')}
          />
        </div>
      </div>

      {/* Thoughts Feed - Scrollable */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 pb-28" style={{ overscrollBehavior: 'contain' }}>
        {/* Onboarding Card */}
        {activeTab === 'trending' && thoughts.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-dark-card to-dark-hover rounded-2xl border border-dark-border mb-4"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-accent-blue/20 rounded-full">
                <Sparkles size={20} className="text-accent-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Share your thoughts</h3>
                <p className="text-sm text-gray-400">
                  Post what's on your mind and find people who think like you. Click the Share button below!
                </p>
              </div>
            </div>
          </motion.div>
        )}
        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="text-accent-blue" size={24} />
            </motion.div>
          </div>
        ) : thoughts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {activeTab === 'following' && 'Follow some people to see their thoughts here'}
              {activeTab === 'saved' && 'Save thoughts to see them here'}
              {(activeTab === 'trending' || activeTab === 'news') && 'No thoughts yet. Be the first to share!'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {thoughts.map((thought, index) => (
              <ThoughtCard
                key={thought.id}
                thought={thought}
                index={index}
                currentUser={currentUser}
                onLike={handleLike}
                onSave={handleSave}
                onCommentClick={setSelectedThought}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {selectedThought && (
          <CommentsModal
            thought={selectedThought}
            currentUser={currentUser}
            onClose={() => setSelectedThought(null)}
            onCommentAdded={handleCommentAdded}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

const TabButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative pb-2 text-sm font-medium transition-colors whitespace-nowrap ${
      isActive ? 'text-white' : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    {label}
    {isActive && (
      <motion.div
        layoutId="feedTab"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue"
      />
    )}
  </button>
)

const ThoughtCard = ({ thought, index, currentUser, onLike, onSave, onCommentClick, onDelete }) => {
  const similarityScore = thought.similarity_score
  const isLiked = thought.is_liked || false
  const isSaved = thought.is_saved || false
  const likeCount = thought.like_count || 0
  const commentCount = thought.comment_count || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className="bg-dark-card rounded-2xl border border-dark-border p-4 hover:border-accent-blue/30 transition-colors"
    >
      {/* User Info */}
      <div className="flex items-start space-x-3 mb-3">
        <img
          src={thought.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thought.username}`}
          alt={thought.username}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">{thought.username}</span>
            {similarityScore && similarityScore > 0.6 && (
              <span className="px-2 py-0.5 bg-accent-green/20 text-accent-green text-xs rounded-full font-medium">
                {Math.round(similarityScore * 100)}% match
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {new Date(thought.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-white mb-4 leading-relaxed">{thought.content}</p>

      {/* Actions */}
      <div className="flex items-center space-x-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onLike(thought.id, isLiked)}
          className={`flex items-center space-x-2 transition-colors ${
            isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm">{likeCount}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onCommentClick(thought)}
          className="flex items-center space-x-2 text-gray-400 hover:text-accent-blue transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-sm">{commentCount}</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onSave(thought.id, isSaved)}
          className={`flex items-center space-x-2 transition-colors ${
            isSaved ? 'text-accent-blue' : 'text-gray-400 hover:text-accent-blue'
          }`}
        >
          <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="flex items-center space-x-2 text-gray-400 hover:text-accent-green transition-colors"
        >
          <Share2 size={18} />
        </motion.button>

        {/* Delete button - only visible for own thoughts */}
        {currentUser && thought.user_id === currentUser.id && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(thought.id)}
            className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors ml-auto"
          >
            <Trash2 size={18} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

export default Feed
