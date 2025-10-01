import { motion } from 'framer-motion'
import { Home, Users, MessageCircle, User, Sparkles } from 'lucide-react'

const BottomNav = ({ currentView, setCurrentView, onShareThought }) => {
  const navItems = [
    { id: 'feed', icon: Home, label: 'Home' },
    { id: 'thoughtmates', icon: Users, label: 'Mates' },
    { id: 'share', icon: Sparkles, label: 'Share', isAction: true },
    { id: 'messages', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 left-0 right-0 z-50 px-6"
    >
      <div className="max-w-md mx-auto">
        <div
          className="bg-dark-card/70 rounded-full px-3 py-3 shadow-2xl border border-dark-border/30"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
        >
          <div className="flex justify-around items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id

              // Special handling for Share action button
              if (item.isAction) {
                return (
                  <motion.button
                    key={item.id}
                    onClick={onShareThought}
                    className="relative flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                  >
                    <div className="p-2 bg-gradient-to-r from-accent-blue to-accent-purple rounded-full">
                      <Icon
                        size={22}
                        className="text-white"
                        strokeWidth={2}
                      />
                    </div>
                  </motion.button>
                )
              }

              return (
                <motion.button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className="relative flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="activeTab"
                      className="flex items-center gap-2 bg-white text-dark-bg px-4 py-2 rounded-full"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </motion.div>
                  ) : (
                    <div className="p-2">
                      <Icon
                        size={22}
                        className="text-gray-400"
                        strokeWidth={2}
                      />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BottomNav
