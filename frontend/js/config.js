// Detecta automaticamente a URL da API:
// Se aberto via Live Server (portas 5500, 5501, 8080, etc.) ou file://,
// direciona as requisições para a porta padrão da API backend (http://localhost:3000/api).
const isExternalDevServer =
  (window.location.port && window.location.port !== '3000') ||
  window.location.protocol === 'file:';

export const API_URL = isExternalDevServer
  ? 'http://localhost:3000/api'
  : `${window.location.origin}/api`;

export const SESSION_KEY = 'sxq_session';