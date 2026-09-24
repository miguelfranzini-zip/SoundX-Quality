import { setSessao } from '../auth.js';
import { loginRequisicao, testarStatusApi } from '../api.js';
import { API_URL, normalizeApiUrl } from '../config.js';
import { paginaInicialPorCargo } from '../auth.js';
import { toast, escapeHtml } from '../ui.js';

const form = document.getElementById('form-login');
const btnEntrar = document.getElementById('btn-entrar');
const alerta = document.getElementById('alerta-login');

function exibirAlerta(mensagem) {
  alerta.textContent = mensagem;
  alerta.classList.remove('hidden');
}

function esconderAlerta() {
  alerta.classList.add('hidden');
  alerta.textContent = '';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderAlerta();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;

  if (!email || !senha) {
    exibirAlerta('Preencha e-mail e senha para entrar.');
    return;
  }

  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';

  try {
    const resposta = await loginRequisicao(email, senha);
    const contentType = resposta.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      throw new Error(
        'A requisição retornou HTML em vez de JSON. ' +
        'O frontend no Netlify não está conectado ao backend no Vercel. ' +
        'Clique em "Configurar URL do Backend" abaixo para informar o endereço da API.'
      );
    }

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(dados.mensagem || 'Falha no login. Verifique suas credenciais.');
    }

    if (!dados.token) {
      throw new Error('Falha no login: nenhum token recebido do servidor.');
    }

    setSessao({ token: dados.token, usuario: dados.usuario });

    toast(`Bem-vindo, ${escapeHtml(dados.usuario?.nome || 'usuário')}!`, 'sucesso');

    setTimeout(() => {
      window.location.href = paginaInicialPorCargo(dados.usuario?.cargo);
    }, 800);
  } catch (erro) {
    exibirAlerta(erro.message || 'Não foi possível conectar ao servidor.');
  } finally {
    btnEntrar.disabled = false;
    btnEntrar.textContent = 'Entrar';
  }
});

// ============================================================
// Monitoramento e Configuração da Conexão com o Backend
// ============================================================
const statusDot = document.getElementById('api-status-dot');
const statusText = document.getElementById('api-status-text');
const btnConfigApi = document.getElementById('btn-config-api');
const modalConfig = document.getElementById('modal-config-api');
const inputApiUrl = document.getElementById('input-api-url');
const modalFeedback = document.getElementById('modal-api-feedback');
const btnTestarApi = document.getElementById('btn-testar-api');
const btnSalvarApi = document.getElementById('btn-salvar-api');
const btnFecharModal = document.getElementById('btn-fechar-modal-api');

async function verificarConexaoBackend() {
  if (!statusDot || !statusText) return;

  statusDot.style.background = '#ff9800';
  statusText.textContent = `Verificando API (${API_URL})...`;

  const resultado = await testarStatusApi();
  if (resultado.ok) {
    statusDot.style.background = '#4caf50';
    statusText.textContent = `API Conectada (${API_URL})`;
    statusText.title = `Status: online via ${API_URL}`;
  } else {
    statusDot.style.background = '#f44336';
    statusText.textContent = `Backend desconectado (${resultado.mensagem || 'erro'})`;
    statusText.title = `Erro ao conectar em ${API_URL}`;
  }
}

if (btnConfigApi && modalConfig) {
  btnConfigApi.addEventListener('click', () => {
    inputApiUrl.value = localStorage.getItem('sxq_custom_api_url') || (API_URL.startsWith('http') ? API_URL : '');
    modalFeedback.style.display = 'none';
    if (typeof modalConfig.showModal === 'function') {
      modalConfig.showModal();
    } else {
      modalConfig.style.display = 'block';
    }
  });

  btnFecharModal?.addEventListener('click', () => {
    if (typeof modalConfig.close === 'function') {
      modalConfig.close();
    } else {
      modalConfig.style.display = 'none';
    }
  });

  btnTestarApi?.addEventListener('click', async () => {
    const url = inputApiUrl.value.trim();
    if (!url) {
      modalFeedback.style.display = 'block';
      modalFeedback.style.background = '#ffebee';
      modalFeedback.style.color = '#c62828';
      modalFeedback.textContent = 'Informe uma URL para testar.';
      return;
    }

    btnTestarApi.disabled = true;
    btnTestarApi.textContent = 'Testando...';
    modalFeedback.style.display = 'block';
    modalFeedback.style.background = '#fff8e1';
    modalFeedback.style.color = '#f57f17';
    modalFeedback.textContent = 'Testando endpoint de status...';

    const normalizada = normalizeApiUrl(url);
    const resultado = await testarStatusApi(normalizada);

    btnTestarApi.disabled = false;
    btnTestarApi.textContent = 'Testar';

    if (resultado.ok) {
      modalFeedback.style.background = '#e8f5e9';
      modalFeedback.style.color = '#2e7d32';
      modalFeedback.textContent = `✅ Conexão bem-sucedida! Servidor respondeu com status: online.`;
    } else {
      modalFeedback.style.background = '#ffebee';
      modalFeedback.style.color = '#c62828';
      modalFeedback.textContent = `❌ Falha ao conectar: ${resultado.mensagem}`;
    }
  });

  btnSalvarApi?.addEventListener('click', () => {
    const url = inputApiUrl.value.trim();
    if (!url) {
      localStorage.removeItem('sxq_custom_api_url');
    } else {
      const normalizada = normalizeApiUrl(url);
      localStorage.setItem('sxq_custom_api_url', normalizada);
    }
    window.location.reload();
  });
}

// Inicia verificação de conexão ao carregar a página
verificarConexaoBackend();