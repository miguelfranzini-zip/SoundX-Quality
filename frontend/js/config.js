// Detecta automaticamente a URL da API:
// 1. Em desenvolvimento (Live Server, file://): usa localhost:3001
// 2. Em produção no Netlify:
//    - Primeiro checa se há uma URL customizada salva no navegador (localStorage: sxq_custom_api_url)
//    - Em seguida checa a variável injetada no build (window.__ENV_API_URL)
//    - Por fim, tenta same-origin (/api)
const BACKEND_PORT = '3001';
export const isLocalDev = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.protocol === 'file:';

export function normalizeApiUrl(url) {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) clean += '/api';
  return clean;
}

export function getResolvedApiUrl() {
  if (isLocalDev) {
    return `http://localhost:${BACKEND_PORT}/api`;
  }

  // 1. Configuração salva manualmente no navegador (permite conectar na hora sem novo deploy)
  try {
    const custom = localStorage.getItem('sxq_custom_api_url');
    if (custom && custom.trim()) {
      return normalizeApiUrl(custom);
    }
  } catch (e) {}

  // 2. Injetada no build do Netlify via VITE_API_URL / API_URL / BACKEND_URL
  if (window.__ENV_API_URL && window.__ENV_API_URL.trim()) {
    return normalizeApiUrl(window.__ENV_API_URL);
  }

  // 3. Fallback same-origin
  return `${window.location.origin}/api`;
}

export const API_URL = getResolvedApiUrl();
export const SESSION_KEY = 'sxq_session';

// Utilitário global para alterar ou redefinir a URL da API pelo console ou interface
if (typeof window !== 'undefined') {
  window.setBackendUrl = function (novaUrl) {
    if (!novaUrl) {
      localStorage.removeItem('sxq_custom_api_url');
      console.log('🔄 URL customizada removida. Recarregando...');
    } else {
      const normalizada = normalizeApiUrl(novaUrl);
      localStorage.setItem('sxq_custom_api_url', normalizada);
      console.log('✅ Nova URL da API salva:', normalizada);
    }
    window.location.reload();
  };
}