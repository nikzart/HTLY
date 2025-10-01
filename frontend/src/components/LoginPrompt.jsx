import { useState, useContext } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, UserPlus } from 'lucide-react'
import { UserContext } from '../context/UserContext'

const LoginPrompt = () => {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useContext(UserContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    try {
      await login(username.trim())
    } catch (error) {
      console.error('Login error:', error)
      alert('Failed to login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full mb-4"
          >
            <Sparkles size={32} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent mb-2">
            HTLY
          </h1>
          <p className="text-gray-400">Who Thinks Like You</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-card border border-dark-border rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold mb-2">Welcome!</h2>
          <p className="text-sm text-gray-400 mb-6">
            Enter your username to start finding people who think like you
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue transition-colors"
                disabled={loading}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || !username.trim()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={18} />
                  </motion.div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Get Started</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Features */}
        <div className="mt-8 space-y-3">
          <FeatureItem text="Share your thoughts and ideas" />
          <FeatureItem text="Find people with similar thinking" />
          <FeatureItem text="Connect with your thoughtmates" />
        </div>
      </motion.div>
    </div>
  )
}

const FeatureItem = ({ text }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center space-x-2 text-sm text-gray-400"
  >
    <div className="w-1.5 h-1.5 bg-accent-blue rounded-full" />
    <span>{text}</span>
  </motion.div>
)

export default LoginPrompt
