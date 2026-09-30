import { API_URL, SESSION_KEY } from './config.js';

function getToken() {
  try {
    const sessao = JSON.parse(localStorage.getItem(SESSION_KEY));
    return sessao?.token || null;
  } catch {
    return null;
  }
}

export function logoutRedireciona() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'index.html';
}

export async function testarStatusApi(urlAlvo) {
  const base = urlAlvo ? urlAlvo.replace(/\/+$/, '') : API_URL;
  const statusEndpoint = base.endsWith('/api') ? `${base}/status` : `${base}/api/status`;
  
  try {
    const res = await fetch(statusEndpoint, { method: 'GET' });
    const cType = res.headers.get('content-type') || '';
    if (!cType.includes('application/json')) {
      return { ok: false, mensagem: 'Servidor respondeu, mas retornou HTML em vez de JSON.' };
    }
    const json = await res.json();
    return { ok: res.ok, dados: json, endpoint: statusEndpoint };
  } catch (err) {
    return { ok: false, mensagem: err.message || 'Falha de rede ou CORS.' };
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();

  const opcoes = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (token) opcoes.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) opcoes.body = JSON.stringify(body);

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${path}`, opcoes);
  } catch {
    throw new Error(`Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend no Vercel está ativo.`);
  }

  // Se o servidor retornou HTML (fallback padrão do Netlify para rotas não encontradas)
  const contentType = resposta.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error('A API retornou HTML em vez de JSON. A URL do backend não está configurada corretamente no Netlify.');
  }

  if (resposta.status === 401) {
    localStorage.removeItem(SESSION_KEY);
    if (!window.location.pathname.includes('index.html')) {
      window.location.href = 'index.html';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (resposta.status === 403) {
    window.location.href = 'acesso-negado.html';
    throw new Error('Acesso negado.');
  }

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.mensagem || 'Erro na requisição.');
  }

  return dados;
}

export function loginRequisicao(email, senha) {
  return fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
}