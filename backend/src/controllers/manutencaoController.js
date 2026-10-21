const db = require('../config/database');

// Abrir ordem de manutenção
exports.criarManutencao = async (req, res) => {
  const { id_fone, descricao_defeito } = req.body;

  if (!id_fone || !descricao_defeito) {
    return res.status(400).json({ mensagem: 'ID do fone e descrição do defeito são obrigatórios.' });
  }

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

    const query = 'INSERT INTO manutencao (id_fone, descricao_defeito, status, data_entrada) VALUES (?, ?, ?, NOW()) RETURNING id_manutencao';
    const [resultado] = await db.query(query, [id_fone, descricao_defeito, 'Pendente']);

    res.status(201).json({
      mensagem: 'Ordem de manutenção aberta com sucesso!',
      id_manutencao: resultado.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao abrir ordem de manutenção.' });
  }
};

// Listar fones na fila de manutenção
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
    res.json(fila);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar fila de manutenção.' });
  }
};

// Atualizar status, defeito e ação corretiva da manutenção (atômico)
exports.atualizarManutencao = async (req, res) => {
  const { id } = req.params;
  const { acao_corretiva, status, descricao_defeito } = req.body;

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

      // Normaliza status estritamente ('Pendente', 'Em Manutencao', 'Concluido')
      const s = String(status !== undefined ? status : itemAtual.status).toLowerCase();
      if (s.includes('conclui')) {
        statusDb = 'Concluido';
      } else if (s.includes('manuten')) {
        statusDb = 'Em Manutencao';
      } else {
        statusDb = 'Pendente';
      }

      const dataConclusao = statusDb === 'Concluido' ? new Date() : (statusDb === 'Pendente' ? null : itemAtual.data_conclusao);
      const descDefeito = descricao_defeito !== undefined ? descricao_defeito : itemAtual.descricao_defeito;
      const acaoCorretiva = acao_corretiva !== undefined ? acao_corretiva : itemAtual.acao_corretiva;

      await tx.query(
        `UPDATE manutencao 
         SET descricao_defeito = ?, acao_corretiva = ?, status = ?, data_conclusao = ? 
         WHERE id_manutencao = ?`,
        [descDefeito, acaoCorretiva, statusDb, dataConclusao, id]
      );

      // Se concluído, libera o fone para reteste na qualidade (Em Análise)
      if (statusDb === 'Concluido') {
        await tx.query("UPDATE fone SET status = 'Em Análise' WHERE id_fone = ?", [itemAtual.id_fone]);
      } else if (statusDb === 'Em Manutencao') {
        await tx.query("UPDATE fone SET status = 'Reprovado / Manutenção' WHERE id_fone = ?", [itemAtual.id_fone]);
      }
    });

    res.json({ mensagem: 'Ordem de manutenção atualizada com sucesso!', status: statusDb });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ mensagem: error.message || 'Erro ao atualizar manutenção.' });
  }
};

// Excluir ordem de manutenção
exports.excluirManutencao = async (req, res) => {
  const { id } = req.params;

  try {
    const [existentes] = await db.query('SELECT id_manutencao FROM manutencao WHERE id_manutencao = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Ordem de manutenção não encontrada.' });
    }

    await db.query('DELETE FROM manutencao WHERE id_manutencao = ?', [id]);
    res.json({ mensagem: 'Ordem de manutenção excluída com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao excluir manutenção.' });
  }
};