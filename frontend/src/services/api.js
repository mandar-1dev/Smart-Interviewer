import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, try guest re-login silently instead of redirecting to login page
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true
      try {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        const res = await axios.post(
          `${api.defaults.baseURL}/auth/guest-login`
        )
        const { access_token, user } = res.data
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))
        error.config.headers.Authorization = `Bearer ${access_token}`
        return api(error.config)
      } catch {
        // Guest login failed - backend might be down
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
