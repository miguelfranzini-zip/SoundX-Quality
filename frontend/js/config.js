// Detecta automaticamente a URL da API:
// - Em desenvolvimento (Live Server, file://): usa localhost:3001
// - Em produção (Netlify): usa variável de build ou same-origin
const BACKEND_PORT = '3001';
const isLocalDev = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.protocol === 'file:';

// Em produção no Netlify, a variável VITE_API_URL é injetada no build
// Se não definida, assume same-origin (backend no mesmo domínio via proxy)
export const API_URL = isLocalDev
  ? `http://localhost:${BACKEND_PORT}/api`
  : (window.__ENV_API_URL || `${window.location.origin}/api`);

export const SESSION_KEY = 'sxq_session';