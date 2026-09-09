import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT and Tenant Schema to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('riva_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const tenantSchema = localStorage.getItem('riva_tenant_schema')
  if (tenantSchema) {
    config.headers['X-Store-Schema'] = tenantSchema
  }
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Do not force redirect if the 401 came from the login request itself
      const isLoginRequest = err.config?.url?.includes('/auth/login')
      if (!isLoginRequest) {
        localStorage.removeItem('riva_token')
        localStorage.removeItem('riva_user')
        localStorage.removeItem('riva_store_code')
        localStorage.removeItem('riva_tenant_schema')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
