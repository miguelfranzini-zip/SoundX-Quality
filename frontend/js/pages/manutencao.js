import { api } from '../api.js';
import { guardPagina, isAdminGerente } from '../auth.js';
import { initShell, badgeStatus, formatarData, escapeHtml, toast, confirmarAcao } from '../ui.js?v=3';

const usuario = guardPagina(['Admin', 'Gerente', 'Técnico', 'Inspetor']);
if (usuario) {
  initShell('manutencao', usuario);
}

const corpoTabela = document.getElementById('corpo-tabela');
const modal = document.getElementById('modal-atualizar');
const form = document.getElementById('form-manutencao');
const alerta = document.getElementById('alerta-manutencao');
const filtroBusca = document.getElementById('filtro-busca');
const filtroPrioridade = document.getElementById('filtro-prioridade');
const infoTotal = document.getElementById('info-total-exibido');

const cntSolicitacoes = document.getElementById('cnt-solicitacoes');
const cntEmAberto = document.getElementById('cnt-em-aberto');
const cntConcluidas = document.getElementById('cnt-concluidas');
const cntTodas = document.getElementById('cnt-todas');

const tabs = document.querySelectorAll('.tab');

let manutencaoAtual = null;
let todasManutencoes = [];
let abaAtiva = 'solicitacoes';

const podeExcluir = usuario && isAdminGerente(usuario.cargo);
const isTecnicoOuGerente = usuario && (
  String(usuario.cargo || '').toLowerCase().includes('tecnico') ||
  isAdminGerente(usuario.cargo)
);

function exibirAlerta(mensagem) {
  alerta.textContent = mensagem;
  alerta.classList.remove('hidden');
}

function esconderAlerta() {
  alerta.classList.add('hidden');
  alerta.textContent = '';
}

function badgePrioridade(p) {
  const norm = String(p || 'Media').toLowerCase();
  if (norm.includes('crit')) {
    return '<span class="badge badge--perigo" title="Prioridade Crítica">🔴 Crítica</span>';
  }
  if (norm.includes('alt')) {
    return '<span class="badge badge--alerta" title="Prioridade Alta">🟠 Alta</span>';
  }
  if (norm.includes('baix')) {
    return '<span class="badge badge--sucesso" title="Prioridade Baixa">🟢 Baixa</span>';
  }
  return '<span class="badge badge--neutro" title="Prioridade Média">🟡 Média</span>';
}

function abrirModal(m) {
  manutencaoAtual = m;
  document.getElementById('manutencao-defeito').value = m.descricao_defeito || '';
  document.getElementById('manutencao-status').value = m.status || 'Pendente';
  document.getElementById('manutencao-prioridade').value = m.prioridade || 'Media';
  document.getElementById('acao_corretiva').value = m.acao_corretiva || '';
  esconderAlerta();
  modal.classList.add('modal-overlay--aberta');
}

function fecharModal() {
  modal.classList.remove('modal-overlay--aberta');
  manutencaoAtual = null;
}

function atualizarContadores() {
  const solicitadas = todasManutencoes.filter((m) => String(m.status || '').toLowerCase() === 'solicitada').length;
  const emAberto = todasManutencoes.filter((m) => {
    const s = String(m.status || '').toLowerCase();
    return s === 'pendente' || s === 'em manutencao';
  }).length;
  const concluidas = todasManutencoes.filter((m) => String(m.status || '').toLowerCase() === 'concluido').length;
  const total = todasManutencoes.length;

  if (cntSolicitacoes) cntSolicitacoes.textContent = String(solicitadas);
  if (cntEmAberto) cntEmAberto.textContent = String(emAberto);
  if (cntConcluidas) cntConcluidas.textContent = String(concluidas);
  if (cntTodas) cntTodas.textContent = String(total);
}

function filtrarLista() {
  const busca = (filtroBusca?.value || '').trim().toLowerCase();
  const prioridade = filtroPrioridade?.value || '';

  let lista = todasManutencoes;

  // Filtro da aba
  if (abaAtiva === 'solicitacoes') {
    lista = lista.filter((m) => String(m.status || '').toLowerCase() === 'solicitada');
  } else if (abaAtiva === 'em-aberto') {
    lista = lista.filter((m) => {
      const s = String(m.status || '').toLowerCase();
      return s === 'pendente' || s === 'em manutencao';
    });
  } else if (abaAtiva === 'concluidas') {
    lista = lista.filter((m) => String(m.status || '').toLowerCase() === 'concluido');
  }

  // Filtro de texto
  if (busca) {
    lista = lista.filter((m) =>
      String(m.numero_serie || '').toLowerCase().includes(busca) ||
      String(m.modelo || '').toLowerCase().includes(busca) ||
      String(m.descricao_defeito || '').toLowerCase().includes(busca) ||
      String(m.acao_corretiva || '').toLowerCase().includes(busca)
    );
  }

  // Filtro de prioridade
  if (prioridade) {
    lista = lista.filter((m) => String(m.prioridade || '').toLowerCase() === prioridade.toLowerCase());
  }

  return lista;
}

function renderizar() {
  const lista = filtrarLista();

  if (infoTotal) {
    infoTotal.textContent = `Exibindo ${lista.length} de ${todasManutencoes.length} ordens de serviço`;
  }

  if (!lista.length) {
    corpoTabela.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <h3>Nenhuma ordem encontrada</h3>
            <p>Não há manutenções para os filtros selecionados nesta aba.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  corpoTabela.innerHTML = lista
    .map((m) => {
      const statusLower = String(m.status || '').toLowerCase();
      const podeAssumir = isTecnicoOuGerente && (statusLower === 'solicitada' || statusLower === 'pendente');
      
      const solicitante = m.solicitado_por_nome && m.solicitado_por_nome !== '—'
        ? `Por: ${escapeHtml(m.solicitado_por_nome)}`
        : '';
      const tecnico = m.concluido_por_nome && m.concluido_por_nome !== '—'
        ? `Téc: ${escapeHtml(m.concluido_por_nome)}`
        : '';
      const responsaveis = [solicitante, tecnico].filter(Boolean).join('<br>') || '—';

      return `
        <tr>
          <td>
            <strong>${escapeHtml(m.numero_serie || '—')}</strong>
            <div style="font-size: 0.75rem; color: var(--text-suave);">#${m.id_manutencao}</div>
          </td>
          <td>${escapeHtml(m.modelo || '—')}</td>
          <td>
            <div style="max-width: 260px; line-height: 1.35;" title="${escapeHtml(m.descricao_defeito || '')}">
              ${escapeHtml(m.descricao_defeito || '—')}
            </div>
            ${m.acao_corretiva ? `
              <div style="font-size: 0.78rem; color: var(--sucesso); margin-top: 4px; font-style: italic;">
                ↳ Reparo: ${escapeHtml(m.acao_corretiva)}
              </div>
            ` : ''}
          </td>
          <td>${badgePrioridade(m.prioridade)}</td>
          <td style="font-size: 0.82rem;">${responsaveis}</td>
          <td style="font-size: 0.85rem;">
            ${formatarData(m.data_entrada)}
            ${m.data_conclusao ? `<div style="font-size: 0.75rem; color: var(--sucesso);">Concl: ${formatarData(m.data_conclusao)}</div>` : ''}
          </td>
          <td>${badgeStatus(m.status)}</td>
          <td>
            <div style="display: flex; gap: var(--space-1); flex-wrap: wrap;">
              ${podeAssumir ? `
                <button class="btn btn--primario btn--pequeno" data-assumir="${m.id_manutencao}" title="Assumir esta ordem de serviço na bancada">
                  Assumir
                </button>
              ` : ''}
              ${isTecnicoOuGerente ? `
                <button class="btn btn--secundario btn--pequeno" data-atualizar="${m.id_manutencao}" title="Editar status e reparo">
                  Atualizar
                </button>
              ` : ''}
              ${podeExcluir ? `
                <button class="btn btn--danger btn--pequeno" data-excluir="${m.id_manutencao}" title="Excluir O.S. definitivamente">
                  Excluir
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

async function carregar() {
  try {
    const dados = await api('/manutencao');
    todasManutencoes = Array.isArray(dados) ? dados : (dados.dados || []);
    atualizarContadores();
    renderizar();
  } catch (err) {
    toast(err.message || 'Erro ao carregar manutenções.', 'erro');
  }
}

// Alternar abas
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      t.classList.remove('tab--ativa');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('tab--ativa');
    tab.setAttribute('aria-selected', 'true');
    abaAtiva = tab.dataset.aba;
    renderizar();
  });
});

filtroBusca?.addEventListener('input', () => renderizar());
filtroPrioridade?.addEventListener('change', () => renderizar());

corpoTabela?.addEventListener('click', async (e) => {
  // Ação Assumir
  const btnAssumir = e.target.closest('[data-assumir]');
  if (btnAssumir) {
    const id = btnAssumir.dataset.assumir;
    try {
      btnAssumir.disabled = true;
      btnAssumir.textContent = 'Assumindo...';
      const res = await api(`/manutencao/${id}/assumir`, { method: 'PUT' });
      toast(res.mensagem || 'Você assumiu esta ordem com sucesso!', 'sucesso');
      await carregar();
    } catch (err) {
      toast(err.message || 'Erro ao assumir ordem.', 'erro');
      btnAssumir.disabled = false;
      btnAssumir.textContent = 'Assumir';
    }
    return;
  }

  // Ação Atualizar
  const btnAtualizar = e.target.closest('[data-atualizar]');
  if (btnAtualizar) {
    const m = todasManutencoes.find((item) => String(item.id_manutencao) === btnAtualizar.dataset.atualizar);
    if (m) abrirModal(m);
    return;
  }

  // Ação Excluir
  const btnExcluir = e.target.closest('[data-excluir]');
  if (btnExcluir) {
    const id = btnExcluir.dataset.excluir;
    const confirmou = await confirmarAcao({
      titulo: 'Excluir Ordem de Manutenção',
      mensagem: `Deseja realmente excluir a ordem de manutenção #${id}? Essa ação é definitiva.`,
      textoBotao: 'Excluir definitivamente',
      perigoso: true
    });

    if (confirmou) {
      try {
        await api(`/manutencao/${id}`, { method: 'DELETE' });
        toast('Ordem de manutenção excluída com sucesso!', 'sucesso');
        await carregar();
      } catch (err) {
        toast(err.message, 'erro');
      }
    }
  }
});

document.getElementById('btn-fechar-modal')?.addEventListener('click', fecharModal);
document.getElementById('btn-cancelar-modal')?.addEventListener('click', fecharModal);
modal?.addEventListener('click', (e) => {
  if (e.target === modal) fecharModal();
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!manutencaoAtual) return;

  const defeito = document.getElementById('manutencao-defeito').value.trim();
  const status = document.getElementById('manutencao-status').value;
  const prioridade = document.getElementById('manutencao-prioridade').value;
  const acaoCorretiva = document.getElementById('acao_corretiva').value.trim();

  if (!defeito) {
    exibirAlerta('A descrição do defeito é obrigatória.');
    return;
  }

  try {
    const btnSalvar = document.getElementById('btn-salvar-manutencao');
    if (btnSalvar) {
      btnSalvar.disabled = true;
      btnSalvar.textContent = 'Salvando...';
    }

    await api(`/manutencao/${manutencaoAtual.id_manutencao}`, {
      method: 'PUT',
      body: {
        descricao_defeito: defeito,
        status: status,
        prioridade: prioridade,
        acao_corretiva: acaoCorretiva
      }
    });

    toast('Ordem de manutenção atualizada com sucesso!', 'sucesso');
    fecharModal();
    await carregar();
  } catch (err) {
    exibirAlerta(err.message || 'Erro ao atualizar manutenção.');
  } finally {
    const btnSalvar = document.getElementById('btn-salvar-manutencao');
    if (btnSalvar) {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'Salvar Alterações';
    }
  }
});

carregar();
