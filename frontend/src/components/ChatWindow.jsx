import { useState, useEffect, useRef, useContext } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Sparkles } from 'lucide-react'
import axios from 'axios'
import { UserContext } from '../context/UserContext'
import { useSocket } from '../context/SocketContext'

const API_BASE = 'http://localhost:5001/api'

const ChatWindow = ({ conversation, onBack }) => {
  const { currentUser } = useContext(UserContext)
  const { socket } = useSocket()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const shouldAutoScrollRef = useRef(true)

  useEffect(() => {
    fetchMessages(true) // Show loading on initial fetch

    // Poll for new messages every 3 seconds as fallback for WebSocket
    const pollInterval = setInterval(() => {
      fetchMessages(false) // Don't show loading on polling
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [conversation.conversation_id])

  // Real-time message listener
  useEffect(() => {
    if (!socket) return

    const handleMessageSent = (data) => {
      // Only add message if it's for this conversation
      if (data.conversation_id === conversation.conversation_id) {
        setMessages(prevMessages => {
          // Check if message already exists to avoid duplicates
          const exists = prevMessages.some(m => m.id === data.message.id)
          if (exists) return prevMessages
          return [...prevMessages, data.message]
        })
      }
    }

    socket.on('message_sent', handleMessageSent)

    return () => {
      socket.off('message_sent', handleMessageSent)
    }
  }, [socket, conversation.conversation_id])

  // Check if user is at bottom of messages
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    return scrollHeight - scrollTop - clientHeight < 100 // Within 100px of bottom
  }

  // Update scroll position tracking
  const handleScroll = () => {
    shouldAutoScrollRef.current = checkIfAtBottom()
  }

  // Auto-scroll to bottom when new messages arrive (only if user was at bottom)
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom()
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    shouldAutoScrollRef.current = true
  }

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const response = await axios.get(
        `${API_BASE}/conversations/${conversation.conversation_id}/messages?user_id=${currentUser.id}`
      )

      // Only update state if messages actually changed (prevent unnecessary re-renders)
      setMessages(prevMessages => {
        const newMessages = response.data
        if (JSON.stringify(prevMessages) === JSON.stringify(newMessages)) {
          return prevMessages
        }
        return newMessages
      })
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX

    try {
      await axios.post(`${API_BASE}/conversations/${conversation.conversation_id}/messages`, {
        sender_id: currentUser.id,
        content: messageContent
      })

      // Fetch messages immediately after sending
      fetchMessages(false)

      // Force scroll to bottom after sending
      setTimeout(() => {
        shouldAutoScrollRef.current = true
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
      setNewMessage(messageContent) // Restore message on error
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 bg-dark-bg border-b border-dark-border">
        <div className="flex items-center space-x-3 p-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2 hover:bg-dark-hover rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <img
            src={conversation.other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation.other_user_username}`}
            alt={conversation.other_user_username}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <h2 className="font-semibold">{conversation.other_user_username}</h2>
            <p className="text-xs text-gray-400">Active now</p>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ overscrollBehavior: 'contain' }}
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="text-accent-blue" size={24} />
            </motion.div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Fixed at bottom */}
      <form onSubmit={handleSend} className="flex-shrink-0 bg-dark-bg border-t border-dark-border p-4">
        <div className="flex items-end space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoFocus
            className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 transition-all resize-none"
            disabled={sending}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="p-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-accent-blue/20"
          >
            {sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={20} />
              </motion.div>
            ) : (
              <Send size={20} />
            )}
          </motion.button>
        </div>
      </form>
    </div>
  )
}

const MessageBubble = ({ message, isOwn }) => {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isOwn
            ? 'bg-accent-blue text-white rounded-br-sm'
            : 'bg-dark-card text-white rounded-bl-sm border border-dark-border'
        }`}
      >
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 opacity-70 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
          {new Date(message.sent_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </p>
      </div>
    </div>
  )
}

export default ChatWindow
