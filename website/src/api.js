const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Auth Token Management
export const getAuthToken = () => localStorage.getItem('rf_auth_token');
export const setAuthToken = (token) => localStorage.setItem('rf_auth_token', token);
export const clearAuthToken = () => localStorage.removeItem('rf_auth_token');

const getHeaders = (extra = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Health Check
export const checkHealth = () =>
  fetch(`${API}/api/health`)
    .then((r) => r.json())
    .then((d) => d.status === 'ok')
    .catch(() => false);

// Core Optimization (with Redis caching and user preference awareness)
export const optimizePortfolio = async (tickers, options = {}) => {
  const res = await fetch(`${API}/api/optimize`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      tickers,
      max_weight: options.maxWeight,
      risk_free_rate: options.riskFreeRate,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Backend Error: ${res.statusText}`);
  }
  return res.json();
};

// 15-Day Historical Prices (Redis cached)
export const fetchPrices = async (ticker) => {
  const res = await fetch(`${API}/api/prices?ticker=${ticker}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Backend Error: ${res.statusText}`);
  return res.json();
};

// Cache Telemetry
export const getCacheStats = async () => {
  const res = await fetch(`${API}/api/cache/stats`, { headers: getHeaders() });
  if (!res.ok) return null;
  return res.json();
};

// Authentication Endpoints
export const login = async (email, password) => {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  if (data.token) setAuthToken(data.token);
  return data;
};

export const register = async (name, email, password, preferences = {}) => {
  const res = await fetch(`${API}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, preferences }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  if (data.token) setAuthToken(data.token);
  return data;
};

export const getProfile = async () => {
  const res = await fetch(`${API}/api/auth/me`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
};

export const updatePreferences = async (preferences) => {
  const res = await fetch(`${API}/api/auth/preferences`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error('Failed to update preferences');
  return res.json();
};

export const updateUserPortfolio = async (portfolioData) => {
  const token = getAuthToken();
  if (!token) return null;
  const res = await fetch(`${API}/api/auth/portfolio`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(portfolioData),
  });
  if (!res.ok) return null;
  return res.json();
};

// User Portfolio Management (MongoDB)
export const fetchSavedPortfolios = async () => {
  const res = await fetch(`${API}/api/portfolios`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch portfolios');
  return res.json();
};

export const savePortfolio = async (portfolioData) => {
  const res = await fetch(`${API}/api/portfolios`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(portfolioData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save portfolio');
  return data;
};

export const rebalancePortfolio = async (id, reason = 'Manual rebalance') => {
  const res = await fetch(`${API}/api/portfolios/${id}/rebalance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to rebalance');
  return data;
};

export const deletePortfolio = async (id) => {
  const res = await fetch(`${API}/api/portfolios/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete portfolio');
  return res.json();
};

// Agentic Co-Pilot API
export const sendAgentMessage = async (message, sessionId = null) => {
  const res = await fetch(`${API}/api/agent/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message, sessionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Agent request failed');
  return data;
};
