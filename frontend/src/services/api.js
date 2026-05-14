import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

export const getRepos = async (username) => {
  const response = await api.get(`/github/repos/${username}`);
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

export default api;
