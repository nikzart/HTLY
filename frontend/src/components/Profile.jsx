import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { UserCircle, FileText, Bell, Settings, LogOut, Users, Sparkles, Edit2, Heart, MessageCircle, Trash2 } from 'lucide-react'
import axios from 'axios'
import { UserContext } from '../context/UserContext'
import { useSocket } from '../context/SocketContext'
import LoginPrompt from './LoginPrompt'

const API_BASE = 'http://localhost:5001/api'

const Profile = () => {
  const { currentUser, logout, loading: userLoading, setCurrentUser } = useContext(UserContext)
  const { socket } = useSocket()
  const [thoughtmates, setThoughtmates] = useState([])
  const [myThoughts, setMyThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState('')
  const [activeSection, setActiveSection] = useState('thoughts')
  const [showPersonalInfo, setShowPersonalInfo] = useState(false)

  useEffect(() => {
    if (currentUser) {
      fetchData()
      setBio(currentUser.bio || '')
    }
  }, [currentUser])

  // Listen for real-time thought deletions
  useEffect(() => {
    if (!socket || !currentUser) return

    const handleThoughtDeleted = (data) => {
      // Only update if viewing own profile
      setMyThoughts(prevThoughts => prevThoughts.filter(t => t.id !== data.thought_id))
    }

    const handleThoughtsBulkDeleted = (data) => {
      // Only clear thoughts if they belong to current user
      if (data.user_id === currentUser.id) {
        setMyThoughts([])
      }
    }

    socket.on('thought_deleted', handleThoughtDeleted)
    socket.on('thoughts_bulk_deleted', handleThoughtsBulkDeleted)

    return () => {
      socket.off('thought_deleted', handleThoughtDeleted)
      socket.off('thoughts_bulk_deleted', handleThoughtsBulkDeleted)
    }
  }, [socket, currentUser])

  const fetchData = async () => {
    try {
      const [thoughtmatesRes, thoughtsRes] = await Promise.all([
        axios.get(`${API_BASE}/users/${currentUser.id}/thoughtmates?limit=10`),
        axios.get(`${API_BASE}/users/${currentUser.id}/thoughts`)
      ])
      setThoughtmates(thoughtmatesRes.data)
      setMyThoughts(thoughtsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBio = async () => {
    try {
      await axios.put(`${API_BASE}/users/${currentUser.id}/bio`, { bio })
      setCurrentUser({ ...currentUser, bio })
      setEditingBio(false)
    } catch (error) {
      console.error('Error updating bio:', error)
    }
  }

  const handleDeleteThought = async (thoughtId) => {
    if (!window.confirm('Are you sure you want to delete this thought? This action cannot be undone.')) {
      return
    }

    try {
      await axios.delete(`${API_BASE}/thoughts/${thoughtId}`, {
        data: { user_id: currentUser.id }
      })

      // Remove from local state
      setMyThoughts(myThoughts.filter(t => t.id !== thoughtId))
    } catch (error) {
      console.error('Error deleting thought:', error)
      alert('Failed to delete thought')
    }
  }

  const handleDeleteAllThoughts = async () => {
    if (!window.confirm(`⚠️ WARNING: This will permanently delete ALL ${myThoughts.length} of your thoughts. This action cannot be undone. Are you absolutely sure?`)) {
      return
    }

    // Double confirmation for safety
    if (!window.confirm('This is your final warning. Type "DELETE ALL" in the next dialog to confirm.')) {
      return
    }

    try {
      const response = await axios.delete(`${API_BASE}/users/${currentUser.id}/thoughts`, {
        data: { user_id: currentUser.id }
      })

      // Clear from local state
      setMyThoughts([])
      alert(`Successfully deleted ${response.data.count} thoughts`)

      // Switch back to thoughts tab to show empty state
      setActiveSection('thoughts')
      setShowPersonalInfo(false)
    } catch (error) {
      console.error('Error deleting all thoughts:', error)
      alert('Failed to delete thoughts')
    }
  }

  if (userLoading) {
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

  if (!currentUser) {
    return <LoginPrompt />
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-accent-blue to-accent-purple" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="relative"
          >
            <img
              src={currentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
              alt={currentUser.username}
              className="w-24 h-24 rounded-full border-4 border-dark-bg"
            />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-accent-green rounded-full border-2 border-dark-bg" />
          </motion.div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="text-center mt-14 px-4">
        <h2 className="text-2xl font-bold">{currentUser.username}</h2>
        <div className="inline-flex items-center px-3 py-1 bg-dark-card border border-accent-blue/30 rounded-full mt-2">
          <Sparkles size={12} className="text-accent-blue mr-1" />
          <span className="text-xs font-medium text-accent-blue">Standard Member</span>
        </div>

        {/* Bio */}
        <div className="mt-4 max-w-md mx-auto">
          {editingBio ? (
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 bg-dark-card border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue transition-colors resize-none"
                rows={3}
                maxLength={150}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setBio(currentUser.bio || '')
                    setEditingBio(false)
                  }}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  className="px-3 py-1 text-sm bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-center space-x-2">
              <p className="text-sm text-gray-400">
                {currentUser.bio || 'No bio yet. Click edit to add one!'}
              </p>
              <button
                onClick={() => setEditingBio(true)}
                className="p-1 text-gray-400 hover:text-accent-blue transition-colors"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-4 mt-6">
        <div className="bg-dark-card rounded-xl p-3 text-center border border-dark-border">
          <p className="text-2xl font-bold text-accent-blue">{currentUser.thoughts_count || myThoughts.length}</p>
          <p className="text-xs text-gray-400 mt-1">Thoughts</p>
        </div>
        <div className="bg-dark-card rounded-xl p-3 text-center border border-dark-border">
          <p className="text-2xl font-bold text-accent-purple">{currentUser.thoughtmates_count || thoughtmates.length}</p>
          <p className="text-xs text-gray-400 mt-1">Thoughtmates</p>
        </div>
        <div className="bg-dark-card rounded-xl p-3 text-center border border-dark-border">
          <p className="text-2xl font-bold text-accent-green">{currentUser.followers_count || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Followers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-4 mt-6 space-x-6 border-b border-dark-border">
        <button
          onClick={() => setActiveSection('thoughts')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeSection === 'thoughts' ? 'text-white' : 'text-gray-400'
          }`}
        >
          My Thoughts
          {activeSection === 'thoughts' && (
            <motion.div
              layoutId="profileTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue"
            />
          )}
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`pb-2 text-sm font-medium transition-colors relative ${
            activeSection === 'settings' ? 'text-white' : 'text-gray-400'
          }`}
        >
          Settings
          {activeSection === 'settings' && (
            <motion.div
              layoutId="profileTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue"
            />
          )}
        </button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 mt-4 pb-28" style={{ overscrollBehavior: 'contain' }}>
        {activeSection === 'thoughts' && (
          <div className="space-y-4">
            {myThoughts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">You haven't posted any thoughts yet</p>
              </div>
            ) : (
              myThoughts.map((thought) => (
                <ThoughtItem key={thought.id} thought={thought} onDelete={handleDeleteThought} />
              ))
            )}
          </div>
        )}

        {activeSection === 'settings' && !showPersonalInfo && (
          <div className="space-y-2">
            <MenuItem icon={UserCircle} label="Personal information" onClick={() => setShowPersonalInfo(true)} />
            <MenuItem icon={Bell} label="Notification settings" />
            <MenuItem icon={Settings} label="App settings" />
            <MenuItem icon={FileText} label="Privacy policy" />
          </div>
        )}

        {activeSection === 'settings' && showPersonalInfo && (
          <div className="space-y-4">
            {/* Back button */}
            <motion.button
              whileHover={{ x: -4 }}
              onClick={() => setShowPersonalInfo(false)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <span>←</span>
              <span className="text-sm">Back to Settings</span>
            </motion.button>

            {/* Personal Information Section */}
            <div className="bg-dark-card rounded-xl border border-dark-border p-4">
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <p className="text-sm text-gray-400 mb-4">Manage your account and data</p>

              <div className="space-y-2">
                <div className="p-3 bg-dark-bg rounded-lg">
                  <p className="text-xs text-gray-400">Username</p>
                  <p className="text-sm font-medium">{currentUser.username}</p>
                </div>
                <div className="p-3 bg-dark-bg rounded-lg">
                  <p className="text-xs text-gray-400">Total Thoughts</p>
                  <p className="text-sm font-medium">{myThoughts.length}</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Danger Zone</h3>
              <p className="text-sm text-gray-400 mb-4">
                Irreversible actions that will permanently delete your data
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteAllThoughts}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-colors"
                disabled={myThoughts.length === 0}
              >
                <Trash2 size={18} />
                <span className="font-medium">Delete All Thoughts ({myThoughts.length})</span>
              </motion.button>

              {myThoughts.length === 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">No thoughts to delete</p>
              )}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="mt-6 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

const MenuItem = ({ icon: Icon, label, badge, onClick }) => (
  <motion.button
    whileHover={{ x: 4 }}
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-dark-card rounded-xl border border-dark-border hover:border-accent-blue/30 transition-colors"
  >
    <div className="flex items-center space-x-3">
      <Icon size={20} className="text-gray-400" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="flex items-center space-x-2">
      {badge !== undefined && (
        <span className="px-2 py-0.5 bg-accent-blue/20 text-accent-blue text-xs rounded-full font-medium">
          {badge}
        </span>
      )}
      <span className="text-gray-400">→</span>
    </div>
  </motion.button>
)

const ThoughtItem = ({ thought, onDelete }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-dark-card rounded-xl border border-dark-border p-4"
  >
    <div className="flex items-start justify-between mb-3">
      <p className="text-white leading-relaxed flex-1">{thought.content}</p>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(thought.id)}
        className="ml-3 p-2 text-gray-400 hover:text-red-400 transition-colors"
      >
        <Trash2 size={16} />
      </motion.button>
    </div>
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center space-x-4 text-gray-400">
        <div className="flex items-center space-x-1">
          <Heart size={16} />
          <span>{thought.like_count || 0}</span>
        </div>
        <div className="flex items-center space-x-1">
          <MessageCircle size={16} />
          <span>{thought.comment_count || 0}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400">
        {new Date(thought.created_at).toLocaleDateString()}
      </span>
    </div>
  </motion.div>
)

const ThoughtmateCard = ({ thoughtmate }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="flex items-center space-x-3 p-3 bg-dark-card rounded-xl border border-dark-border hover:border-accent-blue/30 transition-colors"
  >
    <img
      src={thoughtmate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${thoughtmate.username}`}
      alt={thoughtmate.username}
      className="w-12 h-12 rounded-full"
    />
    <div className="flex-1">
      <p className="font-medium">{thoughtmate.username}</p>
      <p className="text-xs text-gray-400">
        {thoughtmate.thoughts_count || 0} thoughts
      </p>
    </div>
    <span className="text-sm font-medium text-accent-green">
      {Math.round(thoughtmate.similarity_score * 100)}%
    </span>
  </motion.div>
)

export default Profile
