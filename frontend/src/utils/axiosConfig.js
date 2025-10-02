import axios from 'axios'

let getAccessToken = null

// Configure axios to automatically add Auth0 token to requests
export const setupAxiosInterceptors = (getAccessTokenSilently) => {
  getAccessToken = getAccessTokenSilently

  // Request interceptor
  axios.interceptors.request.use(
    async (config) => {
      // Only add token for requests to our API
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api'

      if (config.url?.startsWith(apiBase) || config.url?.startsWith('/api')) {
        try {
          const token = await getAccessToken()
          config.headers.Authorization = `Bearer ${token}`
        } catch (error) {
          // Token refresh failed or user not authenticated
          console.error('Failed to get access token:', error)
        }
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for handling auth errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        console.error('Authentication error:', error)
        // Could trigger logout or token refresh here
      }
      return Promise.reject(error)
    }
  )
}
