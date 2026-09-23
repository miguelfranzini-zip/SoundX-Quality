import { setSessao } from '../auth.js';
import { loginRequisicao } from '../api.js';
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
    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(dados.mensagem || 'Falha no login. Verifique suas credenciais.');
    }

    setSessao({ token: dados.token, usuario: dados.usuario });

    toast(`Bem-vindo, ${escapeHtml(dados.usuario?.nome || 'usuário')}!`, 'sucesso');

    setTimeout(() => {
      window.location.href = paginaInicialPorCargo(dados.usuario?.cargo);
    }, 800);
  } catch (erro) {
    exibirAlerta(erro.message);
  } finally {
    btnEntrar.disabled = false;
    btnEntrar.textContent = 'Entrar';
  }
});

// Acesso rápido por persona para testes e demonstrações
document.querySelectorAll('.demo-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    emailInput.value = btn.dataset.email || '';
    senhaInput.value = btn.dataset.senha || '';
    esconderAlerta();
    form.requestSubmit();
  });
});