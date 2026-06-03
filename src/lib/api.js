const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (identifier, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  register: (userData) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getProfile: (userId) =>
    apiCall(`/auth/profile/${userId}`),

  updateProfile: (userId, profileData) =>
    apiCall(`/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),

  changePassword: (userId, oldPassword, newPassword) =>
    apiCall(`/auth/password/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

// Topics API
export const topicsApi = {
  getAll: () => apiCall('/topics'),

  create: (topicData) =>
    apiCall('/topics', {
      method: 'POST',
      body: JSON.stringify(topicData),
    }),

  update: (id, updates) =>
    apiCall(`/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  delete: (id) =>
    apiCall(`/topics/${id}`, {
      method: 'DELETE',
    }),

  updateSlots: (id, increment) =>
    apiCall(`/topics/${id}/slots`, {
      method: 'PUT',
      body: JSON.stringify({ increment }),
    }),
};

// Audits API
export const auditsApi = {
  getAll: () => apiCall('/audits'),

  create: (auditData) =>
    apiCall('/audits', {
      method: 'POST',
      body: JSON.stringify(auditData),
    }),

  update: (id, status) =>
    apiCall(`/audits/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id) =>
    apiCall(`/audits/${id}`, {
      method: 'DELETE',
    }),
};

// Task Books API
export const taskbooksApi = {
  getAll: () => apiCall('/taskbooks'),

  create: (taskbookData) =>
    apiCall('/taskbooks', {
      method: 'POST',
      body: JSON.stringify(taskbookData),
    }),

  update: (id, status) =>
    apiCall(`/taskbooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  delete: (id) =>
    apiCall(`/taskbooks/${id}`, {
      method: 'DELETE',
    }),
};

// Proposals API
export const proposalsApi = {
  getByStudent: (studentId) =>
    apiCall(`/proposals/${studentId}`),

  createOrUpdate: (proposalData) =>
    apiCall('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    }),

  update: (id, updates) =>
    apiCall(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// Midterm API
export const midtermApi = {
  getByStudent: (studentId, advisorName = null) => {
    const params = advisorName ? `?advisor=${encodeURIComponent(advisorName)}` : '';
    return apiCall(`/midterm/${studentId}${params}`);
  },

  createOrUpdate: (midtermData) =>
    apiCall('/midterm', {
      method: 'POST',
      body: JSON.stringify(midtermData),
    }),

  addComment: (studentId, commentData) =>
    apiCall(`/midterm/${studentId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    }),
};

// Batches API
export const batchesApi = {
  getAll: () => apiCall('/batches'),

  create: (batchData) =>
    apiCall('/batches', {
      method: 'POST',
      body: JSON.stringify(batchData),
    }),

  update: (id, updates) =>
    apiCall(`/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  delete: (id) =>
    apiCall(`/batches/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const usersApi = {
  getAll: (role) => apiCall(role ? `/users?role=${role}` : '/users'),

  getStats: () => apiCall('/users/stats'),

  create: (userData) =>
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  update: (id, updates) =>
    apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  delete: (id) =>
    apiCall(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Final API
export const finalApi = {
  getByStudent: (studentId, advisorName = null) => {
    const params = advisorName ? `?advisor=${encodeURIComponent(advisorName)}` : '';
    return apiCall(`/final/${studentId}${params}`);
  },

  createOrUpdate: (finalData) =>
    apiCall('/final', {
      method: 'POST',
      body: JSON.stringify(finalData),
    }),

  update: (id, status) =>
    apiCall(`/final/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};
