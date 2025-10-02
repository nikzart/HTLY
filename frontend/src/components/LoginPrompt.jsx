import { motion } from 'framer-motion'
import { Sparkles, LogIn, UserPlus } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'

const LoginPrompt = () => {
  const { loginWithRedirect, isLoading } = useAuth0()

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'login'
      }
    })
  }

  const handleSignup = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup'
      }
    })
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
            Sign up or log in to start finding people who think like you
          </p>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-accent-blue to-accent-purple text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={18} />
              <span>Sign Up</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-dark-bg border border-dark-border text-white rounded-xl font-medium hover:border-accent-blue/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn size={18} />
              <span>Log In</span>
            </motion.button>
          </div>
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
