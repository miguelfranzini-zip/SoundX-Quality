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
  const foto_url = document.getElementById('foto_url')?.value.trim() || null;

  // Coleta os testes do checklist
  const resAudio = document.getElementById('chk_audio')?.value || 'Passou';
  const resMic = document.getElementById('chk_mic')?.value || 'Passou';
  const resConexao = document.getElementById('chk_conexao')?.value || 'Passou';
  const resBateria = document.getElementById('chk_bateria')?.value || 'Passou';

  const testes = [
    { tipo_teste: 'Áudio L/R', parametro_medido: 'Frequência 20Hz-20kHz', resultado: resAudio, observacao: resAudio === 'Passou' ? 'Canais estéreo equilibrados' : 'Falha em driver' },
    { tipo_teste: 'Microfone', parametro_medido: 'Captação e Ruído', resultado: resMic, observacao: resMic === 'Passou' ? 'Voz clara sem ruído' : 'Chiado/mudo' },
    { tipo_teste: 'Conectividade', parametro_medido: 'Pareamento Bluetooth/Cabo', resultado: resConexao, observacao: resConexao === 'Passou' ? 'Pareamento rápido e estável' : 'Perda de conexão' },
    { tipo_teste: 'Bateria', parametro_medido: 'Tensão e Consumo', resultado: resBateria, observacao: resBateria === 'Passou' ? 'Consumo dentro do nominal' : 'Descarga anormal' }
  ];

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
      body: { id_fone, resultado_final, observacao, foto_url, testes },
    });

    toast(dados.mensagem || 'Inspeção e checklist registrados com sucesso!', 'sucesso');
    setTimeout(() => {
      window.location.href = 'inspecoes.html';
    }, 600);
  } catch (erro) {
    exibirAlerta(erro.message);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Registrar Inspeção';
  }
});

// Ajusta automaticamente o parecer se algum item do checklist for reprovado
['chk_audio', 'chk_mic', 'chk_conexao', 'chk_bateria'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      const temReprovado = ['chk_audio', 'chk_mic', 'chk_conexao', 'chk_bateria'].some(i => {
        return document.getElementById(i)?.value === 'Não passou';
      });
      const resFinalEl = document.getElementById('resultado_final');
      if (temReprovado && resFinalEl) {
        resFinalEl.value = 'Reprovado / Manutenção';
      }
    });
  }
});

carregarFones();