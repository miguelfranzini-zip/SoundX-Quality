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

// Atualizar status e ação corretiva da manutenção
exports.atualizarManutencao = async (req, res) => {
  const { id } = req.params;
  const { acao_corretiva, status } = req.body;

  try {
    // Normaliza status para o ENUM do MySQL ('Pendente', 'Em Manutencao', 'Concluido')
    const s = String(status || '').toLowerCase();
    let statusDb = 'Pendente';
    if (s.includes('conclui')) {
      statusDb = 'Concluido';
    } else if (s.includes('manuten')) {
      statusDb = 'Em Manutencao';
    }

    const dataConclusao = statusDb === 'Concluido' ? new Date() : null;

    await db.query(
      `UPDATE manutencao 
       SET acao_corretiva = ?, status = ?, data_conclusao = ? 
       WHERE id_manutencao = ?`,
      [acao_corretiva || null, statusDb, dataConclusao, id]
    );

    // Se concluído, libera o fone para reteste na qualidade
    if (statusDb === 'Concluido') {
      const [manutencao] = await db.query('SELECT id_fone FROM manutencao WHERE id_manutencao = ?', [id]);
      if (manutencao.length > 0) {
        await db.query("UPDATE fone SET status = 'Em Análise' WHERE id_fone = ?", [manutencao[0].id_fone]);
      }
    }

    res.json({ mensagem: 'Ordem de manutenção atualizada com sucesso!', status: statusDb });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao atualizar manutenção.' });
  }
};