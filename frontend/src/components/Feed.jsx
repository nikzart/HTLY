import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Heart, MessageCircle, Share2, Sparkles, Bookmark } from 'lucide-react'
import axios from 'axios'
import { UserContext } from '../context/UserContext'
import ThoughtComposer from './ThoughtComposer'
import LoginPrompt from './LoginPrompt'
import CommentsModal from './CommentsModal'

const API_BASE = 'http://localhost:5001/api'

const Feed = () => {
  const { currentUser, loading: userLoading } = useContext(UserContext)
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [activeTab, setActiveTab] = useState('trending')
  const [selectedThought, setSelectedThought] = useState(null)

  useEffect(() => {
    if (currentUser) {
      fetchThoughts()
    }
  }, [currentUser, activeTab])

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
    setShowComposer(false)
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-bg/95 backdrop-blur-sm border-b border-dark-border">
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

      {/* Onboarding Card */}
      {activeTab === 'trending' && thoughts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="m-4 p-4 bg-gradient-to-br from-dark-card to-dark-hover rounded-2xl border border-dark-border"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-accent-blue/20 rounded-full">
              <Sparkles size={20} className="text-accent-blue" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">Share your thoughts</h3>
              <p className="text-sm text-gray-400 mb-3">
                Post what's on your mind and find people who think like you
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowComposer(true)}
                className="px-4 py-2 bg-accent-blue text-white rounded-full text-sm font-medium flex items-center space-x-2"
              >
                <span>Get Started</span>
                <span>→</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Thoughts Feed */}
      <div className="space-y-4 p-4">
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
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Thought Composer Modal */}
      <AnimatePresence>
        {showComposer && (
          <ThoughtComposer
            onClose={() => setShowComposer(false)}
            onSuccess={handleNewThought}
          />
        )}
      </AnimatePresence>

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

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowComposer(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-accent-blue to-accent-purple rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Sparkles size={24} className="text-white" />
      </motion.button>
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

const ThoughtCard = ({ thought, index, currentUser, onLike, onSave, onCommentClick }) => {
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
      </div>
    </motion.div>
  )
}

export default Feed
