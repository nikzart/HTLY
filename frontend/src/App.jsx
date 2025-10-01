import { useState, useEffect } from 'react'
import Feed from './components/Feed'
import Profile from './components/Profile'
import Thoughtmates from './components/Thoughtmates'
import BottomNav from './components/BottomNav'
import { UserProvider } from './context/UserContext'
import { SocketProvider } from './context/SocketContext'

function App() {
  const [currentView, setCurrentView] = useState('feed')

  return (
    <UserProvider>
      <SocketProvider>
        <div className="min-h-screen bg-dark-bg text-white pb-20">
          <div className="max-w-md mx-auto">
            {currentView === 'feed' && <Feed />}
            {currentView === 'thoughtmates' && <Thoughtmates />}
            {currentView === 'profile' && <Profile />}
          </div>
          <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
        </div>
      </SocketProvider>
    </UserProvider>
  )
}

export default App
