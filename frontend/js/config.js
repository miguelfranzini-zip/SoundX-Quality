// Detecta automaticamente a URL da API:
// Se aberto via Live Server (portas 5500, 5501, 8080, etc.) ou file://,
// direciona as requisições para a porta do backend (http://localhost:3001/api).
const BACKEND_PORT = '3001';
const isExternalDevServer =
  (window.location.port && window.location.port !== BACKEND_PORT) ||
  window.location.protocol === 'file:';

export const API_URL = isExternalDevServer
  ? `http://localhost:${BACKEND_PORT}/api`
  : `${window.location.origin}/api`;

export const SESSION_KEY = 'sxq_session';