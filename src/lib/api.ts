import axios from 'axios'
import Cookies from 'js-cookie'

const TOKEN_COOKIE = 'helm_token'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_COOKIE)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove(TOKEN_COOKIE)
      Cookies.remove('helm_role')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export { TOKEN_COOKIE }
export default api
