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
    throw new Error('Não foi possível conectar ao servidor.');
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