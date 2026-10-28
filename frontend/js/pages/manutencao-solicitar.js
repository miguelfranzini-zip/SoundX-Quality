import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, toast } from '../ui.js?v=3';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor', 'Técnico']);
if (usuario) {
  initShell('manutencao', usuario);
}

const form = document.getElementById('form-solicitar-manutencao');
const selectFone = document.getElementById('select-fone');
const selectPrioridade = document.getElementById('select-prioridade');
const descricaoDefeito = document.getElementById('descricao_defeito');
const campoSolicitante = document.getElementById('campo-solicitante');
const foneInfoDetalhe = document.getElementById('fone-info-detalhe');
const alerta = document.getElementById('alerta-solicitacao');
const btnVoltar = document.getElementById('btn-voltar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnEnviar = document.getElementById('btn-enviar-solicitacao');

if (campoSolicitante && usuario) {
  campoSolicitante.value = `${usuario.nome || 'Usuário'} (${usuario.cargo || 'Operador'})`;
}

function exibirErro(msg) {
  if (alerta) {
    alerta.textContent = msg;
    alerta.classList.remove('hidden');
  }
}

function limparErro() {
  if (alerta) {
    alerta.classList.add('hidden');
    alerta.textContent = '';
  }
}

let listaFones = [];

async function carregarFones() {
  try {
    const fones = await api('/fones');
    listaFones = fones || [];

    if (!listaFones.length) {
      selectFone.innerHTML = '<option value="">Nenhum fone cadastrado</option>';
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const fonePreId = params.get('id_fone');
    const defeitoPre = params.get('defeito');

    if (defeitoPre && descricaoDefeito) {
      descricaoDefeito.value = decodeURIComponent(defeitoPre);
    }

    const options = [
      '<option value="">Selecione o fone...</option>',
      ...listaFones.map((f) => {
        const sel = String(f.id_fone) === String(fonePreId) ? 'selected' : '';
        const lote = f.lote ? ` [${f.lote}]` : '';
        return `<option value="${f.id_fone}" ${sel}>${f.numero_serie} — ${f.modelo}${lote} (${f.status})</option>`;
      })
    ].join('');

    selectFone.innerHTML = options;

    if (fonePreId) {
      atualizarDetalheFone(fonePreId);
    }
  } catch (err) {
    selectFone.innerHTML = '<option value="">Erro ao carregar fones</option>';
    toast(err.message, 'erro');
  }
}

function atualizarDetalheFone(idFone) {
  if (!foneInfoDetalhe) return;
  const fone = listaFones.find((f) => String(f.id_fone) === String(idFone));
  if (fone) {
    foneInfoDetalhe.textContent = `Status atual: ${fone.status} | Lote: ${fone.lote || 'LT-2026-A'} | Conexão: ${fone.tipo_conexao || 'Bluetooth'}`;
  } else {
    foneInfoDetalhe.textContent = '';
  }
}

selectFone?.addEventListener('change', (e) => {
  atualizarDetalheFone(e.target.value);
});

btnVoltar?.addEventListener('click', () => {
  window.history.back();
});

btnCancelar?.addEventListener('click', () => {
  window.history.back();
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  limparErro();

  const idFone = selectFone.value;
  const defeito = (descricaoDefeito.value || '').trim();
  const prioridade = selectPrioridade.value;

  if (!idFone) {
    exibirErro('Por favor, selecione o fone para manutenção.');
    selectFone.focus();
    return;
  }

  if (!defeito || defeito.length < 5) {
    exibirErro('Por favor, forneça uma descrição detalhada do defeito (ao menos 5 caracteres).');
    descricaoDefeito.focus();
    return;
  }

  try {
    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Enviando...';

    const payload = {
      id_fone: Number(idFone),
      descricao_defeito: defeito,
      prioridade: prioridade,
      status: 'Solicitada'
    };

    const resposta = await api('/manutencao', {
      method: 'POST',
      body: payload
    });

    toast(resposta.mensagem || 'Solicitação de manutenção registrada!', 'sucesso');

    setTimeout(() => {
      window.location.href = 'manutencao.html';
    }, 1200);
  } catch (err) {
    exibirErro(err.message || 'Erro ao registrar solicitação.');
    toast(err.message || 'Erro ao registrar solicitação.', 'erro');
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar Solicitação';
  }
});

carregarFones();
