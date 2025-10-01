import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Sparkles } from 'lucide-react'
import axios from 'axios'
import { UserContext } from '../context/UserContext'
import { useSocket } from '../context/SocketContext'

const API_BASE = 'http://localhost:5001/api'

const ChatList = ({ onSelectChat }) => {
  const { currentUser } = useContext(UserContext)
  const { socket } = useSocket()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (currentUser) {
      fetchConversations()

      // Poll for conversation updates every 5 seconds as fallback for WebSocket
      const pollInterval = setInterval(() => {
        fetchConversations()
      }, 5000)

      return () => clearInterval(pollInterval)
    }
  }, [currentUser])

  // Real-time message listener
  useEffect(() => {
    if (!socket) return

    const handleMessageSent = (data) => {
      // Update conversations list with new message
      fetchConversations()
    }

    socket.on('message_sent', handleMessageSent)

    return () => {
      socket.off('message_sent', handleMessageSent)
    }
  }, [socket])

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/users/${currentUser.id}/conversations`)

      // Only update state if conversations actually changed (prevent unnecessary re-renders)
      setConversations(prevConversations => {
        const newConversations = response.data
        if (JSON.stringify(prevConversations) === JSON.stringify(newConversations)) {
          return prevConversations
        }
        return newConversations
      })
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-dark-bg border-b border-dark-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="text-xs text-gray-400">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="p-2 rounded-full hover:bg-dark-hover transition-colors">
            <Search size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Conversations List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="p-4 bg-dark-card rounded-full mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-400 text-center mb-2">No messages yet</p>
            <p className="text-sm text-gray-500 text-center">
              Start chatting with your thoughtmates
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              onClick={() => onSelectChat({
                conversation_id: conversation.id,
                other_user_id: conversation.other_user_id,
                other_user_username: conversation.other_username,
                other_user_avatar: conversation.other_avatar_url
              })}
            />
          ))
        )}
      </div>
    </div>
  )
}

const ConversationItem = ({ conversation, onClick }) => {
  const hasUnread = conversation.unread_count > 0

  return (
    <div
      onClick={onClick}
      className="p-4 hover:bg-dark-hover active:bg-dark-card transition-colors cursor-pointer border-b border-dark-border last:border-b-0"
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="relative">
          <img
            src={conversation.other_avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.other_username}`}
            alt={conversation.other_username}
            className="w-12 h-12 rounded-full"
          />
          {hasUnread && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-blue rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{conversation.unread_count}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`font-semibold ${hasUnread ? 'text-white' : 'text-gray-200'}`}>
              {conversation.other_username}
            </span>
            <span className="text-xs text-gray-400">
              {conversation.last_message_at ? formatTime(conversation.last_message_at) : ''}
            </span>
          </div>
          {conversation.last_message && (
            <p className={`text-sm truncate ${hasUnread ? 'text-white font-medium' : 'text-gray-400'}`}>
              {conversation.last_message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // Less than 24 hours ago
  if (diff < 86400000) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Less than 7 days ago
  if (diff < 604800000) {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  // Older
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default ChatList
