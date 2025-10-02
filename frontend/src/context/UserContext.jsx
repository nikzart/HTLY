import { createContext, useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'

export const UserContext = createContext()

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api'

export const UserProvider = ({ children }) => {
  const { isAuthenticated, isLoading, getAccessTokenSilently, user: auth0User, logout: auth0Logout } = useAuth0()
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

  useEffect(() => {
    const initializeUser = async () => {
      if (isLoading) {
        return
      }

      if (!isAuthenticated) {
        setCurrentUser(null)
        setLoading(false)
        setNeedsProfileSetup(false)
        return
      }

      console.log('Auth0 authenticated, user:', auth0User)

      try {
        console.log('Getting access token from Auth0...')
        // Get Auth0 access token
        let token
        try {
          token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: "openid profile email"
            }
          })
          console.log('Got token successfully')
        } catch (tokenError) {
          console.warn('Could not get access token with audience, trying without:', tokenError)
          // Try without audience as fallback
          token = await getAccessTokenSilently()
        }
        console.log('Calling backend with token...')

        // Call our backend auth callback endpoint
        const response = await axios.post(
          `${API_BASE}/auth/callback`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        console.log('Backend response:', response.data)
        const { user, is_new_user } = response.data

        // Check if profile setup is needed
        if (is_new_user || !user.profile_completed) {
          setNeedsProfileSetup(true)
          setCurrentUser(user)
        } else {
          setCurrentUser(user)
          setNeedsProfileSetup(false)
        }
      } catch (error) {
        console.error('Error initializing user:', error)
        console.error('Error details:', error.response?.data || error.message)

        // If token retrieval fails, log out
        if (error.error === 'login_required' || error.error === 'consent_required') {
          console.log('Login required, redirecting to Auth0...')
          auth0Logout({
            logoutParams: {
              returnTo: window.location.origin
            }
          })
        }

        setCurrentUser(null)
        setNeedsProfileSetup(false)
      } finally {
        setLoading(false)
      }
    }

    initializeUser()
  }, [isAuthenticated, isLoading, getAccessTokenSilently])

  const completeProfileSetup = (user) => {
    setCurrentUser(user)
    setNeedsProfileSetup(false)
  }

  const logout = () => {
    setCurrentUser(null)
    setNeedsProfileSetup(false)
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    })
  }

  const refreshUser = async () => {
    if (!isAuthenticated) return

    try {
      const token = await getAccessTokenSilently()
      const response = await axios.get(
        `${API_BASE}/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser,
      logout,
      loading,
      needsProfileSetup,
      completeProfileSetup,
      refreshUser
    }}>
      {children}
    </UserContext.Provider>
  )
}
