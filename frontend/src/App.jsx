import { useState, useEffect } from 'react'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Thoughtmates from './components/Thoughtmates'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import BottomNav from './components/BottomNav'
import { UserProvider } from './context/UserContext'
import { SocketProvider } from './context/SocketContext'

function App() {
  const [currentView, setCurrentView] = useState('feed')
  const [selectedConversation, setSelectedConversation] = useState(null)

  const handleSelectChat = (conversation) => {
    setSelectedConversation(conversation)
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
  }

  const handleStartChat = (conversationData) => {
    setSelectedConversation(conversationData)
    setCurrentView('messages')
  }

  return (
    <UserProvider>
      <SocketProvider>
        <div className="min-h-screen bg-dark-bg text-white pb-20">
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
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
        </div>
      </SocketProvider>
    </UserProvider>
  )
}

export default App
