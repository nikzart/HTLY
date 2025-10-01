import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Thoughtmates from './components/Thoughtmates'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import BottomNav from './components/BottomNav'
import { UserProvider } from './context/UserContext'
import { SocketProvider } from './context/SocketContext'

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

function App() {
  const [currentView, setCurrentView] = useState('feed')
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [direction, setDirection] = useState(0)
  const [prevView, setPrevView] = useState('feed')
  const [showComposer, setShowComposer] = useState(false)

  const views = ['feed', 'thoughtmates', 'messages', 'profile']

  const handleViewChange = (newView) => {
    const currentIndex = views.indexOf(currentView)
    const newIndex = views.indexOf(newView)
    setDirection(newIndex > currentIndex ? 1 : -1)
    setPrevView(currentView)
    setCurrentView(newView)
  }

  const handleSelectChat = (conversation) => {
    setSelectedConversation(conversation)
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
  }

  const handleStartChat = (conversationData) => {
    setSelectedConversation(conversationData)
    handleViewChange('messages')
  }

  return (
    <UserProvider>
      <SocketProvider>
        <div className="min-h-screen bg-dark-bg text-white overflow-hidden">
          <div className="max-w-md mx-auto">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {currentView === 'feed' && (
                <motion.div
                  key="feed"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Feed showComposer={showComposer} setShowComposer={setShowComposer} />
                </motion.div>
              )}
              {currentView === 'thoughtmates' && (
                <motion.div
                  key="thoughtmates"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Thoughtmates onStartChat={handleStartChat} />
                </motion.div>
              )}
              {currentView === 'messages' && (
                <motion.div
                  key="messages"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {selectedConversation ? (
                    <ChatWindow
                      conversation={selectedConversation}
                      onBack={handleBackToList}
                    />
                  ) : (
                    <ChatList onSelectChat={handleSelectChat} />
                  )}
                </motion.div>
              )}
              {currentView === 'profile' && (
                <motion.div
                  key="profile"
                  custom={direction}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Profile />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <BottomNav
            currentView={currentView}
            setCurrentView={handleViewChange}
            onShareThought={() => setShowComposer(true)}
          />
        </div>
      </SocketProvider>
    </UserProvider>
  )
}

export default App
