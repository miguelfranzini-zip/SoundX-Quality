import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, toast } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('fones', usuario);
}

const form = document.getElementById('form-fone');
const btnSalvar = document.getElementById('btn-salvar');
const alerta = document.getElementById('alerta-form');

document.getElementById('btn-voltar').addEventListener('click', () => {
  window.location.href = 'fones.html';
});

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

  const numero_serie = document.getElementById('numero_serie').value.trim();
  const modelo = document.getElementById('modelo').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const tipo_conexao = document.getElementById('tipo_conexao').value;
  const data_fabricacao = document.getElementById('data_fabricacao').value;
  const status = document.getElementById('status').value;

  if (!numero_serie || !modelo) {
    exibirAlerta('Número de série e modelo são obrigatórios.');
    return;
  }

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando...';

  try {
    await api('/fones', {
      method: 'POST',
      body: {
        numero_serie,
        modelo,
        marca,
        tipo_conexao,
        data_fabricacao: data_fabricacao || new Date().toISOString().slice(0, 10),
        status,
      },
    });

    toast('Fone cadastrado com sucesso!', 'sucesso');
    setTimeout(() => {
      window.location.href = 'fones.html';
    }, 500);
  } catch (erro) {
    exibirAlerta(erro.message);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar Fone';
  }
});