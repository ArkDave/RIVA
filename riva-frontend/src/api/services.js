import api from './client'

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials)
}

// ── Tokens (NPC Process) ──────────────────────────────────────
export const tokenAPI = {
  raise:       (data)        => api.post('/tokens/raise', data),
  byCounter:   (counterId)   => api.get(`/tokens/counter/${counterId}`),
  byNumber:    (tokenNumber) => api.get(`/tokens/number/${tokenNumber}`),
  startDeal:   (id, data)    => api.put(`/tokens/${id}/start-deal`, data),
  closeDeal:   (id, data)    => api.put(`/tokens/${id}/close-deal`, data),
  enterBill:   (id, data)    => api.put(`/tokens/${id}/bill`, data)
}

// ── Orders ────────────────────────────────────────────────────
export const orderAPI = {
  getAll:     ()         => api.get('/orders'),
  getOne:     (id)       => api.get(`/orders/${id}`),
  getByStatus:(status)   => api.get(`/orders/status/${status}`),
  update:     (id, data) => api.put(`/orders/${id}`, data),
  summary:    ()         => api.get('/orders/summary')
}

// ── Performance ───────────────────────────────────────────────
export const performanceAPI = {
  save:       (data)          => api.post('/performance', data),
  monthly:    (month, year)   => api.get(`/performance/monthly?month=${month}&year=${year}`),
  topBottom:  (month, year)   => api.get(`/performance/top-bottom?month=${month}&year=${year}`),
  winners:    (year)          => api.get(`/performance/winners?year=${year}`)
}

// ── Incentives ────────────────────────────────────────────────
export const incentiveAPI = {
  saveTarget: (data)        => api.post('/incentives', data),
  report:     (month, year) => api.get(`/incentives/report?month=${month}&year=${year}`)
}

// ── Telecalling ───────────────────────────────────────────────
export const telecallingAPI = {
  importContacts: (telecallerId, data)       => api.post(`/telecalling/${telecallerId}/import`, data),
  getContacts:    (telecallerId)             => api.get(`/telecalling/${telecallerId}/contacts`),
  updateStatus:   (contactId, status)        => api.put(`/telecalling/contacts/${contactId}/status?status=${encodeURIComponent(status)}`),
  dayEnd:         (telecallerId)             => api.post(`/telecalling/${telecallerId}/day-end`),
  getReport:      (telecallerId, date)       => api.get(`/telecalling/${telecallerId}/report?date=${date}`)
}

// ── Reports ───────────────────────────────────────────────────
export const reportAPI = {
  npcDaily:       (date)        => api.get(`/reports/npc/daily?date=${date}`),
  npcConsolidated:(month, year) => api.get(`/reports/npc/consolidated?month=${month}&year=${year}`),
  npcStaff:       (month, year) => api.get(`/reports/npc/staff?month=${month}&year=${year}`),
  customerVisits: (year)        => api.get(`/reports/customer-visits?year=${year}`),
  increment:      (userId, year)=> api.get(`/reports/increment/${userId}?year=${year}`)
}

// ── Admin ─────────────────────────────────────────────────────
export const adminAPI = {
  // Users
  getUsers:     ()         => api.get('/admin/users'),
  createUser:   (data)     => api.post('/admin/users', data),
  deleteUser:   (id)       => api.delete(`/admin/users/${id}`),
  // Counters
  getCounters:  ()         => api.get('/admin/counters'),
  createCounter:(name, desc) => api.post(`/admin/counters?name=${encodeURIComponent(name)}${desc ? `&description=${encodeURIComponent(desc)}` : ''}`),
  deleteCounter:(id)       => api.delete(`/admin/counters/${id}`),
  // Ticket sizes
  getTicketSizes:   ()             => api.get('/admin/ticket-sizes'),
  updateTicketSize: (metal, amt)   => api.put(`/admin/ticket-sizes/${metal}?amount=${amt}`)
}

// ── Stores (Multi-Tenant Schema Management) ───────────────────
export const storeAPI = {
  getStores:        ()           => api.get('/admin/stores'),
  getStoreByCode:   (code)       => api.get(`/admin/stores/${code}`),
  createStore:      (data)       => api.post('/admin/stores', data),
  toggleStoreStatus:(id, active) => api.put(`/admin/stores/${id}/status?active=${active}`)
}
