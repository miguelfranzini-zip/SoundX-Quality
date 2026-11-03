const db = require('../config/database');

// 1. Abrir ou solicitar ordem de manutenção
exports.criarManutencao = async (req, res) => {
  const { id_fone, descricao_defeito, prioridade, status: statusInformado, solicitado_por } = req.body;

  if (!id_fone || !descricao_defeito) {
    return res.status(400).json({ mensagem: 'ID do fone e descrição do defeito são obrigatórios.' });
  }

  // Normaliza prioridade: 'Baixa', 'Media', 'Alta', 'Critica'
  const prioridadeValida = ['Baixa', 'Media', 'Alta', 'Critica'].find(
    (p) => p.toLowerCase() === String(prioridade || '').toLowerCase()
  ) || 'Media';

  // Define status inicial: se Inspetor ou Gerente solicitando sem especificar, status inicial é 'Solicitada'
  let statusInicial = 'Pendente';
  if (statusInformado) {
    const s = String(statusInformado).toLowerCase();
    if (s.includes('solicit')) statusInicial = 'Solicitada';
    else if (s.includes('manuten')) statusInicial = 'Em Manutencao';
    else if (s.includes('conclui')) statusInicial = 'Concluido';
    else statusInicial = 'Pendente';
  } else if (req.usuarioCargo === 'Inspetor' || req.usuarioCargo === 'Gerente') {
    statusInicial = 'Solicitada';
  }

  const solicitanteId = req.usuarioId || solicitado_por || null;

  try {
    // Invariante: impede mais de uma O.S. aberta para o mesmo fone
    const [abertas] = await db.query(
      "SELECT id_manutencao FROM manutencao WHERE id_fone = ? AND status != 'Concluido'",
      [id_fone]
    );

    if (abertas && abertas.length > 0) {
      return res.status(409).json({
        mensagem: 'Já existe uma ordem de manutenção aberta para este fone.',
        id_manutencao: abertas[0].id_manutencao
      });
    }

    const query = `
      INSERT INTO manutencao (id_fone, descricao_defeito, status, prioridade, solicitado_por, data_entrada)
      VALUES (?, ?, ?, ?, ?, NOW())
      RETURNING id_manutencao
    `;
    const [resultado] = await db.query(query, [
      id_fone,
      descricao_defeito,
      statusInicial,
      prioridadeValida,
      solicitanteId
    ]);

    // Atualiza status do fone para refletir que está em manutenção/reparo
    await db.query("UPDATE fone SET status = 'Reprovado / Manutenção' WHERE id_fone = ?", [id_fone]);

    res.status(201).json({
      mensagem: statusInicial === 'Solicitada' 
        ? 'Solicitação de manutenção registrada com sucesso!' 
        : 'Ordem de manutenção aberta com sucesso!',
      id_manutencao: resultado.insertId,
      status: statusInicial,
      prioridade: prioridadeValida
    });
  } catch (error) {
    console.error('Erro ao abrir ordem de manutenção:', error);
    res.status(500).json({ mensagem: 'Erro ao abrir ordem de manutenção.', detalhe: error.message });
  }
};

// 2. Listar fones na fila de manutenção (em aberto / não concluídos)
exports.listarFila = async (req, res) => {
  try {
    const query = `
      SELECT m.*, f.modelo, f.numero_serie 
      FROM manutencao m
      JOIN fone f ON m.id_fone = f.id_fone
      WHERE m.status != 'Concluido'
      ORDER BY m.data_entrada ASC
    `;
    const [fila] = await db.query(query);
    res.json(fila || []);
  } catch (error) {
    console.error('Erro ao buscar fila de manutenção:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar fila de manutenção.' });
  }
};

// 3. Listar manutenções com filtros avançados e paginação (Histórico e Painéis)
exports.listarManutencoes = async (req, res) => {
  try {
    const { de, ate, status, id_fone, id_tecnico, prioridade, limite, pagina } = req.query;
    const hasPagination = Boolean(limite || pagina);

    const lim = Math.max(1, parseInt(limite, 10) || 20);
    const pag = Math.max(1, parseInt(pagina, 10) || 1);
    const off = (pag - 1) * lim;

    const countQuery = `
      SELECT count(*) as total 
      FROM manutencao m 
      JOIN fone f ON m.id_fone = f.id_fone
    `;
    const [countRes] = await db.query(countQuery, [
      de || null,
      ate || null,
      status || null,
      id_fone ? Number(id_fone) : null,
      id_tecnico ? Number(id_tecnico) : null,
      prioridade || null
    ]);
    const total = Number(countRes[0]?.total || countRes[0]?.['count(*)'] || 0);

    const query = `
      SELECT m.*, f.modelo, f.numero_serie
      FROM manutencao m
      JOIN fone f ON m.id_fone = f.id_fone
      WHERE 1=1
      ORDER BY m.data_entrada DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(query, [
      de || null,
      ate || null,
      status || null,
      id_fone ? Number(id_fone) : null,
      id_tecnico ? Number(id_tecnico) : null,
      prioridade || null,
      lim,
      off
    ]);

    if (hasPagination) {
      return res.json({
        dados: rows || [],
        total,
        pagina: pag,
        limite: lim,
        total_paginas: Math.ceil(total / lim)
      });
    }

    res.json(rows || []);
  } catch (error) {
    console.error('Erro ao listar manutenções:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar manutenções.', detalhe: error.message });
  }
};

// 4. Assumir solicitação/ordem de manutenção (Técnico se vincula à O.S.)
exports.assumirManutencao = async (req, res) => {
  const { id } = req.params;
  const tecnicoId = req.usuarioId;

  try {
    const [existentes] = await db.query('SELECT * FROM manutencao WHERE id_manutencao = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Ordem de manutenção não encontrada.' });
    }

    await db.query(
      "UPDATE manutencao SET status = 'Em Manutencao', concluido_por = ? WHERE id_manutencao = ?",
      [tecnicoId, id]
    );

    // Garante que o status do fone reflita manutenção
    await db.query("UPDATE fone SET status = 'Reprovado / Manutenção' WHERE id_fone = ?", [existentes[0].id_fone]);

    res.json({
      mensagem: 'Manutenção assumida com sucesso! Bom trabalho.',
      status: 'Em Manutencao',
      concluido_por: tecnicoId
    });
  } catch (error) {
    console.error('Erro ao assumir manutenção:', error);
    res.status(500).json({ mensagem: 'Erro ao assumir manutenção.', detalhe: error.message });
  }
};

// 5. Atualizar status, defeito, ação corretiva e prioridade da manutenção (atômico)
exports.atualizarManutencao = async (req, res) => {
  const { id } = req.params;
  const { acao_corretiva, status, descricao_defeito, prioridade, concluido_por } = req.body;

  try {
    let statusDb = 'Pendente';

    await db.withTransaction(async (tx) => {
      const [existentes] = await tx.query('SELECT * FROM manutencao WHERE id_manutencao = ?', [id]);
      if (!existentes || existentes.length === 0) {
        const err = new Error('Ordem de manutenção não encontrada.');
        err.status = 404;
        throw err;
      }

      const itemAtual = existentes[0];

      // Normaliza status ('Solicitada', 'Pendente', 'Em Manutencao', 'Concluido')
      const s = String(status !== undefined ? status : itemAtual.status).toLowerCase();
      if (s.includes('conclui')) {
        statusDb = 'Concluido';
      } else if (s.includes('manuten')) {
        statusDb = 'Em Manutencao';
      } else if (s.includes('solicit')) {
        statusDb = 'Solicitada';
      } else {
        statusDb = 'Pendente';
      }

      const dataConclusao = statusDb === 'Concluido' 
        ? new Date() 
        : (statusDb === 'Pendente' || statusDb === 'Solicitada' ? null : itemAtual.data_conclusao);
      const descDefeito = descricao_defeito !== undefined ? descricao_defeito : itemAtual.descricao_defeito;
      const acaoCorretiva = acao_corretiva !== undefined ? acao_corretiva : itemAtual.acao_corretiva;
      const prioridadeDb = prioridade !== undefined ? prioridade : (itemAtual.prioridade || 'Media');
      
      let responsavelConclusao = itemAtual.concluido_por;
      if (statusDb === 'Concluido') {
        responsavelConclusao = concluido_por || req.usuarioId || itemAtual.concluido_por;
      } else if (concluido_por !== undefined) {
        responsavelConclusao = concluido_por;
      }

      await tx.query(
        `UPDATE manutencao 
         SET descricao_defeito = ?, acao_corretiva = ?, status = ?, data_conclusao = ?, concluido_por = ?, prioridade = ?
         WHERE id_manutencao = ?`,
        [descDefeito, acaoCorretiva, statusDb, dataConclusao, responsavelConclusao, prioridadeDb, id]
      );

      // Se concluído, libera o fone para reteste na qualidade (Em Análise)
      if (statusDb === 'Concluido') {
        await tx.query("UPDATE fone SET status = 'Em Análise' WHERE id_fone = ?", [itemAtual.id_fone]);
      } else if (statusDb === 'Em Manutencao' || statusDb === 'Solicitada' || statusDb === 'Pendente') {
        await tx.query("UPDATE fone SET status = 'Reprovado / Manutenção' WHERE id_fone = ?", [itemAtual.id_fone]);
      }
    });

    res.json({ mensagem: 'Ordem de manutenção atualizada com sucesso!', status: statusDb });
  } catch (error) {
    console.error('Erro ao atualizar manutenção:', error);
    res.status(error.status || 500).json({ mensagem: error.message || 'Erro ao atualizar manutenção.' });
  }
};

// 6. Excluir ordem de manutenção
exports.excluirManutencao = async (req, res) => {
  const { id } = req.params;

  try {
    const [existentes] = await db.query('SELECT id_manutencao, id_fone FROM manutencao WHERE id_manutencao = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Ordem de manutenção não encontrada.' });
    }
    const idFone = existentes[0].id_fone;

    await db.query('DELETE FROM manutencao WHERE id_manutencao = ?', [id]);

    // Reconcilia status do fone se não restarem outras manutenções abertas
    if (idFone) {
      const [abertas] = await db.query(
        "SELECT id_manutencao FROM manutencao WHERE id_fone = ? AND status != 'Concluido'",
        [idFone]
      );
      if (!abertas || abertas.length === 0) {
        const [ultInspecao] = await db.query(
          'SELECT resultado_final FROM inspecao WHERE id_fone = ? ORDER BY data_inspecao DESC, id_inspecao DESC LIMIT 1',
          [idFone]
        );
        let novoStatus = 'Aguardando inspeção';
        if (ultInspecao && ultInspecao.length > 0) {
          const resUlt = String(ultInspecao[0].resultado_final || '').toLowerCase();
          novoStatus = resUlt.includes('aprovado') ? 'Aprovado' : 'Reprovado / Manutenção';
        }
        await db.query('UPDATE fone SET status = ? WHERE id_fone = ?', [novoStatus, idFone]);
      }
    }

    res.json({ mensagem: 'Ordem de manutenção excluída com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir manutenção:', error);
    res.status(500).json({ mensagem: 'Erro ao excluir manutenção.' });
  }
};
