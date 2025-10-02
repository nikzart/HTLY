import { useState, useEffect, useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth0 } from '@auth0/auth0-react'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Thoughtmates from './components/Thoughtmates'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import BottomNav from './components/BottomNav'
import ThoughtComposer from './components/ThoughtComposer'
import ProfileSetup from './components/ProfileSetup'
import { UserProvider, UserContext } from './context/UserContext'
import { SocketProvider, useSocket } from './context/SocketContext'
import { setupAxiosInterceptors } from './utils/axiosConfig'

const pageVariants = {
  initial: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  exit: (direction) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeIn"
    }
  })
}

function AppContent() {
  const { getAccessTokenSilently } = useAuth0()
  const { currentUser, needsProfileSetup, completeProfileSetup } = useContext(UserContext)
  const { socket } = useSocket()
  const [currentView, setCurrentView] = useState('feed')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [direction, setDirection] = useState(0)
  const [prevView, setPrevView] = useState('feed')
  const [showComposer, setShowComposer] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mountCounter, setMountCounter] = useState(0)

  const views = ['feed', 'thoughtmates', 'messages', 'profile']

  // Setup axios interceptor
  useEffect(() => {
    setupAxiosInterceptors(getAccessTokenSilently)
  }, [getAccessTokenSilently])

  // Fetch initial unread count from conversations
  useEffect(() => {
    if (!currentUser) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/users/${currentUser.id}/conversations`)
        const conversations = await response.json()
        const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
        setUnreadCount(totalUnread)
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()
  }, [currentUser?.id])

  // Listen for new messages and update unread count
  useEffect(() => {
    if (!socket || !currentUser) return

    const handleMessageSent = (data) => {
      // Only increment if message is not from current user and not in currently open conversation
      if (data.message.sender_id !== currentUser.id) {
        // If we're in messages view and viewing this conversation, don't increment
        if (currentView === 'messages' && selectedConversation?.conversation_id === data.conversation_id) {
          return
        }
        setUnreadCount(prev => prev + 1)
      }
    }

    socket.on('message_sent', handleMessageSent)

    return () => {
      socket.off('message_sent', handleMessageSent)
    }
  }, [socket, currentUser, currentView, selectedConversation])

  const handleViewChange = (newView) => {
    const currentIndex = views.indexOf(currentView)
    const newIndex = views.indexOf(newView)
    setDirection(newIndex > currentIndex ? 1 : -1)
    setPrevView(currentView)
    setCurrentView(newView)
    setMountCounter(prev => prev + 1)
  }

  const handleSelectChat = (conversation) => {
    setSelectedConversation(conversation)
    // Decrement unread count when opening a conversation with unread messages
    if (conversation.unread_count > 0) {
      setUnreadCount(prev => Math.max(0, prev - conversation.unread_count))
    }
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
  }

  const handleStartChat = (conversationData) => {
    setSelectedConversation(conversationData)
    handleViewChange('messages')
    // Decrement unread count if this conversation has unread messages
    if (conversationData.unread_count > 0) {
      setUnreadCount(prev => Math.max(0, prev - conversationData.unread_count))
    }
  }

  const handleThoughtPosted = () => {
    setShowComposer(false)
    // If not on feed, navigate to feed to show the new thought
    if (currentView !== 'feed') {
      handleViewChange('feed')
    }
  }

  // Show profile setup if needed
  if (needsProfileSetup) {
    return <ProfileSetup onComplete={completeProfileSetup} />
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
          <div className="max-w-md mx-auto">
              {currentView === 'feed' && <Feed />}
              {currentView === 'thoughtmates' && <Thoughtmates onStartChat={handleStartChat} />}
              {currentView === 'messages' && (
                selectedConversation ? (
                  <ChatWindow
                    conversation={selectedConversation}
                    onBack={handleBackToList}
                  />
                ) : (
                  <ChatList onSelectChat={handleSelectChat} />
                )
              )}
              {currentView === 'profile' && <Profile />}
          </div>

          {/* Only show navbar when user is logged in */}
          {currentUser && (
            <BottomNav
              currentView={currentView}
              setCurrentView={handleViewChange}
              onShareThought={() => setShowComposer(true)}
              unreadCount={unreadCount}
            />
          )}

          {/* Global Thought Composer - Available from any page */}
          <AnimatePresence>
            {showComposer && (
              <ThoughtComposer
                onClose={() => setShowComposer(false)}
                onSuccess={handleThoughtPosted}
              />
            )}
          </AnimatePresence>
        </div>
  )
}

function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </UserProvider>
  )
}

export default App
