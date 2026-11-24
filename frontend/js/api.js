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

// Notificação visual não intrusiva de reativação / cold start do Supabase
function mostrarAvisoColdStart(tentativa, maxTentativas) {
  if (typeof document === 'undefined') return;
  let banner = document.getElementById('sxq-cold-start-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'sxq-cold-start-banner';
    banner.style.position = 'fixed';
    banner.style.top = '14px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.zIndex = '99999';
    banner.style.backgroundColor = '#0f172a';
    banner.style.color = '#f8fafc';
    banner.style.padding = '8px 18px';
    banner.style.borderRadius = '9999px';
    banner.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    banner.style.fontSize = '13px';
    banner.style.fontWeight = '500';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.gap = '10px';
    banner.style.border = '1px solid #38bdf8';
    banner.style.transition = 'opacity 0.25s ease';
    document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <span style="display:inline-block;width:12px;height:12px;border:2px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:sxq-spin 0.8s linear infinite;"></span>
    <span>O banco de dados está acordando da inatividade... Tentativa ${tentativa} de ${maxTentativas}</span>
    <style>@keyframes sxq-spin { to { transform: rotate(360deg); } }</style>
  `;
  banner.style.opacity = '1';
}

function esconderAvisoColdStart() {
  if (typeof document === 'undefined') return;
  const banner = document.getElementById('sxq-cold-start-banner');
  if (banner) {
    banner.style.opacity = '0';
    setTimeout(() => { banner.remove(); }, 300);
  }
}

// Wrapper de fetch com retry automático para cold start
async function fetchComRetryColdStart(url, opcoes, maxTentativas = 3, baseDelayMs = 2000) {
  let tentativa = 0;
  while (tentativa < maxTentativas) {
    tentativa++;
    let resposta;
    let falhaRede = false;

    try {
      resposta = await fetch(url, opcoes);
    } catch (err) {
      falhaRede = true;
    }

    // Se houve erro de conexão ou o backend retornou 503/504 (cold start em curso)
    const emColdStart = falhaRede || (resposta && (resposta.status === 503 || resposta.status === 504));

    if (emColdStart && tentativa < maxTentativas) {
      mostrarAvisoColdStart(tentativa, maxTentativas);
      const espera = baseDelayMs * tentativa;
      await new Promise(r => setTimeout(r, espera));
      continue;
    }

    esconderAvisoColdStart();

    if (falhaRede) {
      throw new Error(`Não foi possível conectar ao servidor (${API_URL}). O banco de dados pode estar inicializando.`);
    }

    return resposta;
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

  const resposta = await fetchComRetryColdStart(`${API_URL}${path}`, opcoes);

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
  return fetchComRetryColdStart(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha }),
  });
}