import { api } from '../api.js';
import { guardPagina, isAdminGerente } from '../auth.js';
import { initShell, badgeStatus, formatarDataCurta, escapeHtml, toast, confirmarAcao } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('fones', usuario);
}

const corpoTabela = document.getElementById('corpo-tabela');
const buscaInput = document.getElementById('busca-fones');
const btnNovoFone = document.getElementById('btn-novo-fone');

// Elementos do Modal de Edição
const modalEditarFone = document.getElementById('modal-editar-fone');
const formEditarFone = document.getElementById('form-editar-fone');
const btnFecharModalFone = document.getElementById('btn-fechar-modal-fone');
const btnCancelarModalFone = document.getElementById('btn-cancelar-modal-fone');
const alertaModalFone = document.getElementById('alerta-modal-fone');

let fones = [];
let foneEmEdicao = null;

const podeEditar = usuario && (isAdminGerente(usuario.cargo) || String(usuario.cargo).toLowerCase().includes('inspetor'));
const podeExcluir = usuario && isAdminGerente(usuario.cargo);

function renderizar(lista) {
  if (!lista.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <h3>Nenhum fone encontrado</h3>
            <p>Nenhum fone cadastrado no sistema ou ajuste o termo de busca.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  corpoTabela.innerHTML = lista
    .map(
      (fone, i) => `
      <tr style="animation: fadeIn 0.35s ease ${i * 0.04}s both;">
        <td><strong>${escapeHtml(fone.numero_serie || '—')}</strong></td>
        <td>${escapeHtml(fone.modelo || '—')}</td>
        <td>${escapeHtml(fone.marca || '—')}</td>
        <td>${escapeHtml(fone.tipo_conexao || '—')}</td>
        <td>${badgeStatus(fone.status)}</td>
        <td>${formatarDataCurta(fone.data_fabricacao)}</td>
        <td>
          <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
            <button
              class="btn btn--ghost btn--pequeno"
              data-ver-historico="${fone.id_fone}"
              title="Ver histórico do fone"
            >Histórico</button>

            ${podeEditar ? `
              <button
                class="btn btn--secundario btn--pequeno"
                data-editar-fone="${fone.id_fone}"
                title="Editar dados do fone"
              >Editar</button>
            ` : ''}

            ${podeExcluir ? `
              <button
                class="btn btn--danger btn--pequeno"
                data-excluir-fone="${fone.id_fone}"
                data-serie="${escapeHtml(fone.numero_serie || '')}"
                title="Excluir fone do sistema"
              >Excluir</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

function filtrar(termo) {
  const t = termo.toLowerCase();
  const resultado = fones.filter((fone) =>
    String(fone.numero_serie || '').toLowerCase().includes(t) ||
    String(fone.modelo || '').toLowerCase().includes(t) ||
    String(fone.marca || '').toLowerCase().includes(t) ||
    String(fone.tipo_conexao || '').toLowerCase().includes(t)
  );
  renderizar(resultado);
}

// Modal Helpers
function abrirModalEdicao(fone) {
  foneEmEdicao = fone;
  if (alertaModalFone) {
    alertaModalFone.classList.add('hidden');
    alertaModalFone.textContent = '';
  }

  document.getElementById('edit-fone-serie').value = fone.numero_serie || '';
  document.getElementById('edit-fone-modelo').value = fone.modelo || '';
  document.getElementById('edit-fone-marca').value = fone.marca || 'SoundX';
  document.getElementById('edit-fone-conexao').value = fone.tipo_conexao || 'Bluetooth';
  document.getElementById('edit-fone-status').value = fone.status || 'Aguardando inspeção';

  if (fone.data_fabricacao) {
    const d = new Date(fone.data_fabricacao);
    document.getElementById('edit-fone-data').value = d.toISOString().slice(0, 10);
  } else {
    document.getElementById('edit-fone-data').value = '';
  }

  modalEditarFone.classList.add('modal-overlay--aberta');
}

function fecharModalEdicao() {
  modalEditarFone.classList.remove('modal-overlay--aberta');
  foneEmEdicao = null;
}

if (btnFecharModalFone) btnFecharModalFone.addEventListener('click', fecharModalEdicao);
if (btnCancelarModalFone) btnCancelarModalFone.addEventListener('click', fecharModalEdicao);
if (modalEditarFone) {
  modalEditarFone.addEventListener('click', (e) => {
    if (e.target === modalEditarFone) fecharModalEdicao();
  });
}

if (formEditarFone) {
  formEditarFone.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertaModalFone) alertaModalFone.classList.add('hidden');

    if (!foneEmEdicao) return;

    const btnSalvar = document.getElementById('btn-salvar-modal-fone');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    const dados = {
      numero_serie: document.getElementById('edit-fone-serie').value.trim(),
      modelo: document.getElementById('edit-fone-modelo').value.trim(),
      marca: document.getElementById('edit-fone-marca').value.trim(),
      tipo_conexao: document.getElementById('edit-fone-conexao').value,
      status: document.getElementById('edit-fone-status').value,
      data_fabricacao: document.getElementById('edit-fone-data').value || null,
    };

    try {
      await api(`/fones/${foneEmEdicao.id_fone}`, {
        method: 'PUT',
        body: dados,
      });

      toast('Fone atualizado com sucesso!', 'sucesso');
      fecharModalEdicao();
      await carregar();
    } catch (erro) {
      if (alertaModalFone) {
        alertaModalFone.textContent = erro.message;
        alertaModalFone.classList.remove('hidden');
      } else {
        toast(erro.message, 'erro');
      }
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar alterações';
    }
  });
}

// Ações na tabela
corpoTabela.addEventListener('click', async (e) => {
  const btnHistorico = e.target.closest('[data-ver-historico]');
  if (btnHistorico) {
    window.location.href = `fone-historico.html?id=${btnHistorico.dataset.verHistorico}`;
    return;
  }

  const btnEditar = e.target.closest('[data-editar-fone]');
  if (btnEditar) {
    const fone = fones.find((f) => String(f.id_fone) === btnEditar.dataset.editarFone);
    if (fone) abrirModalEdicao(fone);
    return;
  }

  const btnExcluir = e.target.closest('[data-excluir-fone]');
  if (btnExcluir) {
    const id = btnExcluir.dataset.excluirFone;
    const serie = btnExcluir.dataset.serie || id;

    const confirmou = await confirmarAcao({
      titulo: 'Excluir Fone de Ouvido',
      mensagem: `Deseja realmente excluir o fone de série "${serie}"? Todo o histórico de inspeções, testes e manutenções associado será apagado permanentemente.`,
      textoBotao: 'Excluir definitivamente',
      perigoso: true,
    });

    if (confirmou) {
      try {
        await api(`/fones/${id}`, { method: 'DELETE' });
        toast('Fone e histórico excluídos com sucesso!', 'sucesso');
        await carregar();
      } catch (erro) {
        toast(erro.message, 'erro');
      }
    }
  }
});

let timeoutBusca = null;
buscaInput.addEventListener('input', () => {
  clearTimeout(timeoutBusca);
  timeoutBusca = setTimeout(() => {
    filtrar(buscaInput.value);
  }, 250);
});

btnNovoFone.addEventListener('click', () => {
  window.location.href = 'fone-cadastro.html';
});

async function carregar() {
  corpoTabela.innerHTML = `
    <tr>
      <td colspan="7">
        <div class="skeleton skeleton--linha"></div>
        <div class="skeleton skeleton--linha"></div>
        <div class="skeleton skeleton--linha"></div>
      </td>
    </tr>
  `;

  try {
    fones = await api('/fones');
    renderizar(fones);
  } catch (erro) {
    corpoTabela.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

carregar();