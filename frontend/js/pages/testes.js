import { api } from '../api.js';
import { guardPagina } from '../auth.js';
import { initShell, escapeHtml, emptyState, toast } from '../ui.js';

const usuario = guardPagina(['Admin', 'Gerente', 'Inspetor']);
if (usuario) {
  initShell('testes', usuario);
}

const form = document.getElementById('form-teste');
const btnSalvar = document.getElementById('btn-salvar');
const alerta = document.getElementById('alerta-form');
const selectInspecao = document.getElementById('id_inspecao');
const listaTestesEl = document.getElementById('lista-testes');

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
    return;
  }

  listaTestesEl.innerHTML = `
    <div class="skeleton skeleton--linha"></div>
    <div class="skeleton skeleton--linha"></div>
  `;

  try {
    const testes = await api(`/testes/inspecao/${idInspecao}`);

    if (!testes.length) {
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
            </tr>
          </thead>
          <tbody>
            ${testes
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