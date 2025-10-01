import { createContext, useState, useEffect } from 'react'
import axios from 'axios'

export const UserContext = createContext()

const API_BASE = 'http://localhost:5001/api'

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user exists in localStorage
    const savedUser = localStorage.getItem('htly_user')
    if (savedUser) {
      const user = JSON.parse(savedUser)
      // Fetch updated user data
      axios.get(`${API_BASE}/users/${user.id}`)
        .then(res => {
          setCurrentUser(res.data)
          setLoading(false)
        })
        .catch(() => {
          // If user not found, clear localStorage
          localStorage.removeItem('htly_user')
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username) => {
    try {
      // Try to create user or get existing
      const response = await axios.post(`${API_BASE}/users`, {
        username,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      })
      const user = response.data
      setCurrentUser(user)
      localStorage.setItem('htly_user', JSON.stringify(user))
      return user
    } catch (error) {
      if (error.response?.status === 409) {
        // User exists, get user by username
        const users = await axios.get(`${API_BASE}/users`)
        const existingUser = users.data.find(u => u.username === username)
        if (existingUser) {
          setCurrentUser(existingUser)
          localStorage.setItem('htly_user', JSON.stringify(existingUser))
          return existingUser
        }
      }
      throw error
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('htly_user')
  }

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  )
}
