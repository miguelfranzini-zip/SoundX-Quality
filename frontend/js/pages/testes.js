import { api } from '../api.js';
import { guardPagina, isAdminGerente } from '../auth.js';
import { initShell, escapeHtml, emptyState, toast, confirmarAcao } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('testes', usuario);
}

const form = document.getElementById('form-teste');
const btnSalvar = document.getElementById('btn-salvar');
const alerta = document.getElementById('alerta-form');
const selectInspecao = document.getElementById('id_inspecao');
const listaTestesEl = document.getElementById('lista-testes');

// Elementos do Modal de Edição de Teste
const modalEditarTeste = document.getElementById('modal-editar-teste');
const formEditarTeste = document.getElementById('form-editar-teste');
const btnFecharModalTeste = document.getElementById('btn-fechar-modal-teste');
const btnCancelarModalTeste = document.getElementById('btn-cancelar-modal-teste');
const alertaModalTeste = document.getElementById('alerta-modal-teste');

let testesCache = [];
let testeEmEdicao = null;

const inspecaoPreselecionada = new URLSearchParams(window.location.search).get('inspecao');

document.getElementById('btn-voltar').addEventListener('click', () => {
  if (inspecaoPreselecionada) {
    window.location.href = 'inspecoes.html';
  } else {
    window.location.href = 'dashboard.html';
  }
});

function exibirAlerta(mensagem) {
  alerta.textContent = mensagem;
  alerta.classList.remove('hidden');
}

function esconderAlerta() {
  alerta.classList.add('hidden');
  alerta.textContent = '';
}

async function carregarInspecoes() {
  try {
    const inspecoes = await api('/inspecoes');

    if (!inspecoes.length) {
      selectInspecao.innerHTML = '<option value="">Nenhuma inspeção disponível</option>';
      return;
    }

    selectInspecao.innerHTML = `
      <option value="">Selecione uma inspeção...</option>
      ${inspecoes
        .map(
          (i) => `
          <option value="${i.id_inspecao}" ${
            inspecaoPreselecionada && String(i.id_inspecao) === inspecaoPreselecionada ? 'selected' : ''
          }>
            #${i.id_inspecao} — ${escapeHtml(i.fone_modelo || '')} (${escapeHtml(i.resultado_final || '')})
          </option>
        `
        )
        .join('')}
    `;
  } catch (erro) {
    selectInspecao.innerHTML = '<option value="">Erro ao carregar inspeções</option>';
    toast(erro.message, 'erro');
  }
}

async function listarTestes(idInspecao) {
  if (!idInspecao) {
    listaTestesEl.innerHTML = '';
    testesCache = [];
    return;
  }

  listaTestesEl.innerHTML = `
    <div class="skeleton skeleton--linha"></div>
    <div class="skeleton skeleton--linha"></div>
  `;

  try {
    testesCache = await api(`/testes/inspecao/${idInspecao}`);

    if (!testesCache.length) {
      emptyState(listaTestesEl, 'Nenhum teste registrado', 'Use o formulário acima para associar testes a esta inspeção.');
      return;
    }

    listaTestesEl.innerHTML = `
      <div class="tabela-wrapper">
        <table class="tabela">
          <thead>
            <tr>
              <th>Teste</th>
              <th>Parâmetro</th>
              <th>Resultado</th>
              <th>Observação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${testesCache
              .map(
                (t) => `
                <tr>
                  <td><strong>${escapeHtml(t.tipo_teste || '—')}</strong></td>
                  <td>${escapeHtml(t.parametro_medido || '—')}</td>
                  <td>
                    <span class="badge badge--${String(t.resultado || '').toLowerCase().includes('pass') ? 'sucesso' : 'erro'}">
                      ${escapeHtml(t.resultado || '—')}
                    </span>
                  </td>
                  <td>${escapeHtml(t.observacao || '—')}</td>
                  <td>
                    <div style="display: flex; gap: var(--space-2);">
                      <button
                        class="btn btn--secundario btn--pequeno"
                        data-editar-teste="${t.id_teste}"
                        title="Editar teste"
                      >Editar</button>
                      <button
                        class="btn btn--danger btn--pequeno"
                        data-excluir-teste="${t.id_teste}"
                        title="Excluir teste"
                      >Excluir</button>
                    </div>
                  </td>
                </tr>
              `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (erro) {
    listaTestesEl.innerHTML = '';
    toast(erro.message, 'erro');
  }
}

// Modal Helpers para Edição de Teste
function abrirModalEdicao(teste) {
  testeEmEdicao = teste;
  if (alertaModalTeste) {
    alertaModalTeste.classList.add('hidden');
    alertaModalTeste.textContent = '';
  }

  document.getElementById('edit-tipo_teste').value = teste.tipo_teste || 'Áudio L/R';
  document.getElementById('edit-parametro_medido').value = teste.parametro_medido || '';
  document.getElementById('edit-resultado').value = teste.resultado || 'Passou';
  document.getElementById('edit-observacao').value = teste.observacao || '';

  modalEditarTeste.classList.add('modal-overlay--aberta');
}

function fecharModalEdicao() {
  modalEditarTeste.classList.remove('modal-overlay--aberta');
  testeEmEdicao = null;
}

if (btnFecharModalTeste) btnFecharModalTeste.addEventListener('click', fecharModalEdicao);
if (btnCancelarModalTeste) btnCancelarModalTeste.addEventListener('click', fecharModalEdicao);
if (modalEditarTeste) {
  modalEditarTeste.addEventListener('click', (e) => {
    if (e.target === modalEditarTeste) fecharModalEdicao();
  });
}

if (formEditarTeste) {
  formEditarTeste.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertaModalTeste) alertaModalTeste.classList.add('hidden');

    if (!testeEmEdicao) return;

    const btnSalvarEdicao = document.getElementById('btn-salvar-modal-teste');
    btnSalvarEdicao.disabled = true;
    btnSalvarEdicao.textContent = 'Salvando...';

    const dados = {
      tipo_teste: document.getElementById('edit-tipo_teste').value,
      parametro_medido: document.getElementById('edit-parametro_medido').value.trim(),
      resultado: document.getElementById('edit-resultado').value,
      observacao: document.getElementById('edit-observacao').value.trim(),
    };

    try {
      await api(`/testes/${testeEmEdicao.id_teste}`, {
        method: 'PUT',
        body: dados,
      });

      toast('Teste atualizado com sucesso!', 'sucesso');
      fecharModalEdicao();
      await listarTestes(selectInspecao.value);
    } catch (erro) {
      if (alertaModalTeste) {
        alertaModalTeste.textContent = erro.message;
        alertaModalTeste.classList.remove('hidden');
      } else {
        toast(erro.message, 'erro');
      }
    } finally {
      btnSalvarEdicao.disabled = false;
      btnSalvarEdicao.textContent = 'Salvar alterações';
    }
  });
}

// Ações na tabela de testes (Editar e Excluir)
listaTestesEl.addEventListener('click', async (e) => {
  const btnEditar = e.target.closest('[data-editar-teste]');
  if (btnEditar) {
    const teste = testesCache.find((t) => String(t.id_teste) === btnEditar.dataset.editarTeste);
    if (teste) abrirModalEdicao(teste);
    return;
  }

  const btnExcluir = e.target.closest('[data-excluir-teste]');
  if (btnExcluir) {
    const id = btnExcluir.dataset.excluirTeste;

    const confirmou = await confirmarAcao({
      titulo: 'Excluir Teste',
      mensagem: `Deseja realmente excluir este teste #${id}?`,
      textoBotao: 'Excluir definitivamente',
      perigoso: true,
    });

    if (confirmou) {
      try {
        await api(`/testes/${id}`, { method: 'DELETE' });
        toast('Teste excluído com sucesso!', 'sucesso');
        await listarTestes(selectInspecao.value);
      } catch (erro) {
        toast(erro.message, 'erro');
      }
    }
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  esconderAlerta();

  const id_inspecao = selectInspecao.value;
  const tipo_teste = document.getElementById('tipo_teste').value;
  const parametro_medido = document.getElementById('parametro_medido').value.trim();
  const resultado = document.getElementById('resultado').value;
  const observacao = document.getElementById('observacao').value.trim();

  if (!id_inspecao) {
    exibirAlerta('Selecione uma inspeção.');
    return;
  }

  if (!tipo_teste || !resultado) {
    exibirAlerta('Informe o tipo de teste e o resultado.');
    return;
  }

  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Registrando...';

  try {
    await api('/testes', {
      method: 'POST',
      body: { id_inspecao, tipo_teste, parametro_medido, resultado, observacao },
    });

    toast('Teste registrado com sucesso!', 'sucesso');
    form.reset();
    selectInspecao.value = id_inspecao;
    await listarTestes(id_inspecao);
  } catch (erro) {
    exibirAlerta(erro.message);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Registrar Teste';
  }
});

selectInspecao.addEventListener('change', () => {
  listarTestes(selectInspecao.value);
});

carregarInspecoes();

if (inspecaoPreselecionada) {
  listarTestes(inspecaoPreselecionada);
}