const API_BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
  }

  const token = getToken()
  if (token) {
    opts.headers.Authorization = `Bearer ${token}`
  }

  if (body !== undefined) {
    opts.body = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, opts)
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.message || `Request failed (${res.status})`)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

function upload(path, formData) {
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`

  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  }).then(async (res) => {
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const error = new Error(data.message || `Upload failed (${res.status})`)
      error.status = res.status
      throw error
    }
    return data
  })
}

export const api = {
  request,
  upload,
  getToken,
  setToken,

  // Auth
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body }),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', body }),
    resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),
  },

  // Members
  members: {
    list: () => request('/members'),
    me: () => request('/members/me'),
    getById: (id) => request(`/members/${id}`),
    update: (id, body) => request(`/members/${id}`, { method: 'PUT', body }),
    updateMe: (body) => request(`/members/me`, { method: 'PUT', body }),
    changePassword: (body) => request('/members/me/password', { method: 'PUT', body }),
    remove: (id) => request(`/members/${id}`, { method: 'DELETE' }),
  },

  // Meetings
  meetings: {
    list: () => request('/meetings'),
    upcoming: (limit = 5) => request(`/meetings/upcoming?limit=${limit}`),
    get: (id) => request(`/meetings/${id}`),
    create: (body) => request('/meetings', { method: 'POST', body }),
    update: (id, body) => request(`/meetings/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/meetings/${id}`, { method: 'DELETE' }),
  },

  // Attendance
  attendance: {
    mine: () => request('/attendance/me'),
    myStats: () => request('/attendance/me/stats'),
    byMeeting: (id) => request(`/attendance/meeting/${id}`),
    byMember: (id) => request(`/attendance/member/${id}`),
    record: (body) => request('/attendance', { method: 'POST', body }),
    bulkRecord: (meetingId, records) => request(`/attendance/meeting/${meetingId}/bulk`, { method: 'POST', body: { records } }),
    update: (id, body) => request(`/attendance/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),
  },

  // Participation
  participation: {
    types: () => request('/participation/types'),
    mine: () => request('/participation/me'),
    myPoints: () => request('/participation/me/points'),
    byMeeting: (id) => request(`/participation/meeting/${id}`),
    byMember: (id) => request(`/participation/member/${id}`),
    record: (body) => request('/participation', { method: 'POST', body }),
    update: (id, body) => request(`/participation/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/participation/${id}`, { method: 'DELETE' }),
  },

  // Events
  events: {
    list: () => request('/events'),
    upcoming: (limit = 5) => request(`/events/upcoming?limit=${limit}`),
    get: (id) => request(`/events/${id}`),
    create: (body) => request('/events', { method: 'POST', body }),
    update: (id, body) => request(`/events/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/events/${id}`, { method: 'DELETE' }),
    register: (id) => request(`/events/${id}/register`, { method: 'POST' }),
    unregister: (id) => request(`/events/${id}/unregister`, { method: 'POST' }),
    registrations: (id) => request(`/events/${id}/registrations`),
  },

  // Projects
  projects: {
    list: () => request('/projects'),
    mine: () => request('/projects/mine'),
    get: (id) => request(`/projects/${id}`),
    members: (id) => request(`/projects/${id}/members`),
    create: (body) => request('/projects', { method: 'POST', body }),
    update: (id, body) => request(`/projects/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
    addMember: (id, body) => request(`/projects/${id}/members`, { method: 'POST', body }),
    removeMember: (id, memberId) => request(`/projects/${id}/members/${memberId}`, { method: 'DELETE' }),
  },

  // Announcements
  announcements: {
    list: () => request('/announcements'),
    recent: (limit = 5) => request(`/announcements/recent?limit=${limit}`),
    get: (id) => request(`/announcements/${id}`),
    create: (body) => request('/announcements', { method: 'POST', body }),
    update: (id, body) => request(`/announcements/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),
  },

  // Resources
  resources: {
    list: () => request('/resources'),
    get: (id) => request(`/resources/${id}`),
    create: (body) => upload('/resources', body),
    update: (id, body) => request(`/resources/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/resources/${id}`, { method: 'DELETE' }),
  },

  // GitHub
  github: {
    myStats: () => request('/github/me'),
    myActivity: () => request('/github/me/activity'),
    refreshMy: () => request('/github/me/refresh', { method: 'POST' }),
    memberStats: (id) => request(`/github/member/${id}`),
    memberActivity: (id) => request(`/github/member/${id}/activity`),
    refreshMember: (id) => request(`/github/member/${id}/refresh`, { method: 'POST' }),
  },

  // Leaderboard
  leaderboard: {
    all: () => request('/leaderboard'),
    myProgress: () => request('/leaderboard/me/progress'),
    myDashboard: () => request('/leaderboard/me/dashboard'),
  },

  // Notifications
  notifications: {
    list: () => request('/notifications'),
    unread: () => request('/notifications/unread'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
  },

  // Admin
  admin: {
    pending: () => request('/admin/pending'),
    approve: (id) => request(`/admin/pending/${id}/approve`, { method: 'POST' }),
    reject: (id) => request(`/admin/pending/${id}/reject`, { method: 'POST' }),
  },
}