import { motion } from 'framer-motion'
import { Home, Users, Bell, User } from 'lucide-react'

const BottomNav = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'thoughtmates', icon: Users, label: 'Thoughtmates' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-dark-border"
    >
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              whileTap={{ scale: 0.95 }}
            >
              <Icon
                size={24}
                className={`${
                  isActive ? 'text-accent-blue' : 'text-gray-400'
                } transition-colors`}
              />
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-accent-blue rounded-t-full"
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

export default BottomNav
