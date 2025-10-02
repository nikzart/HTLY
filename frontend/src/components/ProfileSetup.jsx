import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Image, FileText, Sparkles, Upload } from 'lucide-react'
import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api'

const ProfileSetup = ({ onComplete }) => {
  const { getAccessTokenSilently } = useAuth0()
  const [formData, setFormData] = useState({
    username: '',
    avatar_url: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatarMode, setAvatarMode] = useState('upload') // 'upload' or 'url'
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploadError, setUploadError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.username.trim()) {
      setError('Username is required')
      return
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    setLoading(true)

    try {
      const token = await getAccessTokenSilently()

      // Upload avatar file if selected
      let finalAvatarUrl = formData.avatar_url
      if (selectedFile && avatarMode === 'upload') {
        try {
          const formDataUpload = new FormData()
          formDataUpload.append('avatar', selectedFile)

          const uploadResponse = await axios.post(
            `${API_BASE}/upload/avatar`,
            formDataUpload,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          )

          finalAvatarUrl = uploadResponse.data.avatar_url
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError)
          setError(uploadError.response?.data?.error || 'Failed to upload avatar')
          setLoading(false)
          return
        }
      }

      // Update profile with final avatar URL
      const response = await axios.put(
        `${API_BASE}/auth/profile`,
        {
          ...formData,
          avatar_url: finalAvatarUrl
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      onComplete(response.data)
    } catch (error) {
      console.error('Profile setup error:', error)
      if (error.response?.data?.error) {
        setError(error.response.data.error)
      } else {
        setError('Failed to set up profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const generateAvatar = () => {
    const seed = formData.username || Math.random().toString(36)
    setFormData({
      ...formData,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
    })
    setSelectedFile(null)
    setPreviewUrl('')
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (PNG, JPG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setUploadError('')
    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const getAvatarPreview = () => {
    if (avatarMode === 'upload' && previewUrl) {
      return previewUrl
    }
    if (avatarMode === 'url' && formData.avatar_url) {
      return formData.avatar_url
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=default`
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-blue to-accent-purple rounded-full mb-4">
            <Sparkles className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent mb-2">
            Welcome to HTLY
          </h1>
          <p className="text-gray-400">Let's set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-card rounded-2xl p-6 border border-dark-border">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Avatar Preview */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={getAvatarPreview()}
                alt="Avatar"
                className="w-24 h-24 rounded-full border-4 border-accent-blue/30 object-cover"
              />
              <button
                type="button"
                onClick={generateAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-accent-blue rounded-full hover:bg-accent-blue/80 transition-colors"
              >
                <Image size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Avatar Mode Tabs */}
          <div className="mb-4">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAvatarMode('upload')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  avatarMode === 'upload'
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-bg text-gray-400 hover:text-gray-300'
                }`}
              >
                <Upload size={16} className="inline mr-2" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => setAvatarMode('url')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  avatarMode === 'url'
                    ? 'bg-accent-blue text-white'
                    : 'bg-dark-bg text-gray-400 hover:text-gray-300'
                }`}
              >
                <Image size={16} className="inline mr-2" />
                Use URL
              </button>
            </div>

            {/* File Upload */}
            {avatarMode === 'upload' && (
              <div>
                <label className="block">
                  <div className="w-full px-4 py-8 bg-dark-bg border-2 border-dashed border-dark-border rounded-xl text-center cursor-pointer hover:border-accent-blue transition-colors">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-300 mb-1">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF or WebP (max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                {uploadError && (
                  <p className="text-xs text-red-400 mt-2">{uploadError}</p>
                )}
              </div>
            )}

            {/* URL Input */}
            {avatarMode === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Image size={16} className="inline mr-2" />
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue transition-colors"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <User size={16} className="inline mr-2" />
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Choose a unique username"
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue transition-colors"
              disabled={loading}
              maxLength={30}
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <FileText size={16} className="inline mr-2" />
              Bio (optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent-blue transition-colors resize-none"
              disabled={loading}
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.bio.length}/200
            </p>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <Sparkles size={18} />
                </motion.div>
                Setting up...
              </span>
            ) : (
              'Complete Setup'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

export default ProfileSetup
