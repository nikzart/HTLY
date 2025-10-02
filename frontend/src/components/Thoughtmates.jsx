import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { Users, Sparkles, MessageCircle, UserPlus, Check } from 'lucide-react'
import axios from 'axios'
import { UserContext } from '../context/UserContext'
import LoginPrompt from './LoginPrompt'

const API_BASE = 'http://localhost:5001/api'

const Thoughtmates = ({ onStartChat }) => {
  const { currentUser, loading: userLoading } = useContext(UserContext)
  const [thoughtmates, setThoughtmates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchThoughtmates = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/users/${currentUser.id}/thoughtmates?limit=50`)
      setThoughtmates(response.data)
    } catch (error) {
      console.error('Error fetching thoughtmates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchThoughtmates()
  }, [currentUser?.id])

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
              Thoughtmates
            </h1>
            <p className="text-xs text-gray-400">People who think like you</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-dark-card rounded-full border border-accent-purple/30">
            <Users size={14} className="text-accent-purple" />
            <span className="text-sm font-medium text-accent-purple">{thoughtmates.length}</span>
          </div>
        </div>
      </div>

      {/* Thoughtmates List - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-28" style={{ overscrollBehavior: 'contain' }}>
        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-gradient-to-br from-accent-purple/10 to-accent-blue/10 rounded-2xl border border-accent-purple/20"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-accent-purple/20 rounded-full">
              <Sparkles size={20} className="text-accent-purple" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">AI-Powered Matching</h3>
              <p className="text-sm text-gray-400">
                Thoughtmates are discovered automatically based on semantic similarity of your thoughts.
                The more you post, the better the matches!
              </p>
            </div>
          </div>
        </motion.div>
        <div>
          {loading ? (
            <div className="flex justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="text-accent-blue" size={24} />
              </motion.div>
            </div>
          ) : thoughtmates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-accent-purple/20 to-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-accent-purple" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Thoughtmates Yet</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Post more thoughts to discover people who think like you. The AI will automatically find your matches!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {thoughtmates.map((mate, index) => (
                <ThoughtmateCard key={mate.id} thoughtmate={mate} index={index} onStartChat={onStartChat} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ThoughtmateCard = ({ thoughtmate, index, onStartChat }) => {
  const { currentUser } = useContext(UserContext)
  const [isFollowing, setIsFollowing] = useState(thoughtmate.is_following || false)
  const [loading, setLoading] = useState(false)
  const similarityPercent = Math.round(thoughtmate.similarity_score * 100)

  // Determine badge color based on similarity
  const getBadgeColor = (percent) => {
    if (percent >= 90) return 'bg-accent-green/20 text-accent-green border-accent-green/30'
    if (percent >= 75) return 'bg-accent-blue/20 text-accent-blue border-accent-blue/30'
    return 'bg-accent-purple/20 text-accent-purple border-accent-purple/30'
  }

  const handleFollow = async () => {
    setLoading(true)
    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow'
      await axios.post(`${API_BASE}/users/${thoughtmate.id}/${endpoint}`, {
        user_id: currentUser.id
      })
      setIsFollowing(!isFollowing)
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status')
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async () => {
    try {
      // Create or get conversation
      const response = await axios.post(`${API_BASE}/conversations`, {
        user_id: currentUser.id,
        other_user_id: thoughtmate.id
      })

      // Navigate to chat with conversation details
      if (onStartChat) {
        onStartChat({
          conversation_id: response.data.conversation_id,
          other_user_id: thoughtmate.id,
          other_user_username: thoughtmate.username,
          other_user_avatar: thoughtmate.avatar_url,
          unread_count: 0  // New conversation or existing, we'll open it fresh
        })
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      alert('Failed to start chat')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-dark-card rounded-2xl border border-dark-border p-4 hover:border-accent-purple/30 transition-all group"
    >
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={thoughtmate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thoughtmate.username}`}
            alt={thoughtmate.username}
            className="w-16 h-16 rounded-full ring-2 ring-dark-border group-hover:ring-accent-purple/30 transition-all"
          />
          {/* Match Badge Overlay */}
          <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getBadgeColor(similarityPercent)}`}>
            {similarityPercent}%
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{thoughtmate.username}</h3>
              <p className="text-sm text-gray-400">
                {thoughtmate.thoughts_count || 0} thoughts • {thoughtmate.bio || 'No bio yet'}
              </p>
            </div>
          </div>

          {/* Similarity Bar */}
          <div className="w-full bg-dark-bg rounded-full h-2 mb-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${similarityPercent}%` }}
              transition={{ duration: 1, delay: index * 0.05 }}
              className={`h-full rounded-full ${
                similarityPercent >= 90 ? 'bg-accent-green' :
                similarityPercent >= 75 ? 'bg-accent-blue' :
                'bg-accent-purple'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFollow}
              disabled={loading}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isFollowing
                  ? 'bg-accent-green/10 hover:bg-accent-green/20 text-accent-green'
                  : 'bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple'
              } disabled:opacity-50`}
            >
              <UserPlus size={16} />
              <span>{loading ? '...' : isFollowing ? 'Following' : 'Follow'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleChat}
              className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue rounded-lg text-sm font-medium transition-colors"
            >
              <MessageCircle size={16} />
              <span>Chat</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Match Level Indicator */}
      <div className="mt-3 pt-3 border-t border-dark-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Match Level:</span>
          <span className={`font-semibold ${
            similarityPercent >= 90 ? 'text-accent-green' :
            similarityPercent >= 75 ? 'text-accent-blue' :
            'text-accent-purple'
          }`}>
            {similarityPercent >= 90 ? '🔥 Exceptional' :
             similarityPercent >= 75 ? '✨ Great' :
             '💫 Good'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default Thoughtmates
