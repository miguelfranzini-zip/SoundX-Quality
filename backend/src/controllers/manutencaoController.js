const db = require('../config/database');

// Abrir ordem de manutenção
exports.criarManutencao = async (req, res) => {
  const { id_fone, descricao_defeito } = req.body;

  if (!id_fone || !descricao_defeito) {
    return res.status(400).json({ mensagem: 'ID do fone e descrição do defeito são obrigatórios.' });
  }

  try {
    const query = 'INSERT INTO manutencao (id_fone, descricao_defeito) VALUES (?, ?)';
    const [resultado] = await db.query(query, [id_fone, descricao_defeito]);

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

// Atualizar status, defeito e ação corretiva da manutenção
exports.atualizarManutencao = async (req, res) => {
  const { id } = req.params;
  const { acao_corretiva, status, descricao_defeito } = req.body;

  try {
    const [existentes] = await db.query('SELECT * FROM manutencao WHERE id_manutencao = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Ordem de manutenção não encontrada.' });
    }

    const itemAtual = existentes[0];

    // Normaliza status para o ENUM do MySQL ('Pendente', 'Em Manutencao', 'Concluido')
    const s = String(status !== undefined ? status : itemAtual.status).toLowerCase();
    let statusDb = 'Pendente';
    if (s.includes('conclui')) {
      statusDb = 'Concluido';
    } else if (s.includes('manuten')) {
      statusDb = 'Em Manutencao';
    }

    const dataConclusao = statusDb === 'Concluido' ? new Date() : null;
    const descDefeito = descricao_defeito !== undefined ? descricao_defeito : itemAtual.descricao_defeito;
    const acaoCorretiva = acao_corretiva !== undefined ? acao_corretiva : itemAtual.acao_corretiva;

    await db.query(
      `UPDATE manutencao 
       SET descricao_defeito = ?, acao_corretiva = ?, status = ?, data_conclusao = ? 
       WHERE id_manutencao = ?`,
      [descDefeito, acaoCorretiva, statusDb, dataConclusao, id]
    );

    // Se concluído, libera o fone para reteste na qualidade
    if (statusDb === 'Concluido') {
      await db.query("UPDATE fone SET status = 'Em Análise' WHERE id_fone = ?", [itemAtual.id_fone]);
    }

    res.json({ mensagem: 'Ordem de manutenção atualizada com sucesso!', status: statusDb });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao atualizar manutenção.' });
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