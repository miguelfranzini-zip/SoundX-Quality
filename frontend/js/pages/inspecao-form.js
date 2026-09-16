import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, escapeHtml, toast } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('inspecoes', usuario);
}

const form = document.getElementById('form-inspecao');
const btnSalvar = document.getElementById('btn-salvar');
const alerta = document.getElementById('alerta-form');
const selectFone = document.getElementById('id_fone');

document.getElementById('btn-voltar').addEventListener('click', () => {
  window.location.href = 'inspecoes.html';
});

function exibirAlerta(mensagem) {
  alerta.textContent = mensagem;
  alerta.classList.remove('hidden');
}

function esconderAlerta() {
  alerta.classList.add('hidden');
  alerta.textContent = '';
}

async function carregarFones() {
  try {
    const fones = await api('/fones');

    if (!fones.length) {
      selectFone.innerHTML = '<option value="">Nenhum fone cadastrado</option>';
      return;
    }

    selectFone.innerHTML = `
      <option value="">Selecione um fone...</option>
      ${fones
        .map(
          (fone) => `
          <option value="${fone.id_fone}">
            ${escapeHtml(fone.numero_serie || '')} — ${escapeHtml(fone.modelo || '')}
          </option>
        `
        )
        .join('')}
    `;
  } catch (erro) {
    selectFone.innerHTML = '<option value="">Erro ao carregar fones</option>';
    toast(erro.message, 'erro');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderAlerta();

  const id_fone = selectFone.value;
  const resultado_final = document.getElementById('resultado_final').value;
  const observacao = document.getElementById('observacao').value.trim();

  if (!id_fone) {
    exibirAlerta('Selecione um fone para inspecionar.');
    return;
  }

  if (!resultado_final) {
    exibirAlerta('Informe o resultado final da inspeção.');
    return;
  }

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Registrando...';

  try {
    const dados = await api('/inspecoes', {
      method: 'POST',
      body: { id_fone, resultado_final, observacao },
    });

    toast(dados.mensagem || 'Inspeção registrada com sucesso!', 'sucesso');

    if (confirm('Deseja associar testes técnicos a esta inspeção?')) {
      window.location.href = `testes.html?inspecao=${dados.id_inspecao}`;
    } else {
      window.location.href = 'inspecoes.html';
    }
  } catch (erro) {
    exibirAlerta(erro.message);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Registrar Inspeção';
  }
});

carregarFones();