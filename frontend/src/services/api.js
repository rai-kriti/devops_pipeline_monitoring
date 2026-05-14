import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

// Caching Layer
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = {
  github: {},
  docker: {}
};

const getCachedData = (type, key) => {
  const entry = cache[type][key];
  if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
    return entry.data;
  }
  return null;
};

const setCachedData = (type, key, data) => {
  cache[type][key] = {
    data,
    timestamp: Date.now()
  };
};

export const getRepos = async (username, skipCache = false) => {
  if (!skipCache) {
    const cached = getCachedData('github', username);
    if (cached) return cached;
  }
  
  const response = await api.get(`/github/repos/${username}`);
  setCachedData('github', username, response.data);
  return response.data;
};

export const explainLog = async (log) => {
  const response = await api.post('/ai/explain-log', { log });
  return response.data;
};

export const autoDiagnose = async (username, repo, run_id) => {
  const response = await api.post('/ai/auto-diagnose', { username, repo, run_id });
  return response.data;
};

export const analyzePattern = async (username, repo, failedRunIds) => {
  const response = await api.post('/ai/analyze-pattern', { username, repo, failedRunIds });
  return response.data;
};

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getDockerImages = async (username, skipCache = false) => {
  if (!skipCache) {
    const cached = getCachedData('docker', username);
    if (cached) return cached;
  }

  const response = await api.get(`/docker/${username}`);
  setCachedData('docker', username, response.data);
  return response.data;
};

export const analyzeDockerImage = async (metadata) => {
  const response = await api.post('/docker/analyze', metadata);
  return response.data;
};

export default api;
