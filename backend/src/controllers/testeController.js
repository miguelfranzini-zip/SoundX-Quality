const db = require('../config/database');

// Registrar teste individual para uma inspeção
exports.cadastrarTeste = async (req, res) => {
  const { id_inspecao, tipo_teste, parametro_medido, resultado, observacao } = req.body;

  if (!id_inspecao || !tipo_teste || !resultado) {
    return res.status(400).json({ 
      mensagem: 'O ID da inspeção, o tipo de teste e o resultado são obrigatórios.' 
    });
  }

  try {
    const query = `
      INSERT INTO teste (id_inspecao, tipo_teste, parametro_medido, resultado, observacao)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [resDb] = await db.query(query, [
      id_inspecao, 
      tipo_teste, 
      parametro_medido || '', 
      resultado, 
      observacao || ''
    ]);

    res.status(201).json({
      mensagem: 'Teste de qualidade registrado com sucesso!',
      id_teste: resDb.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao registrar teste de qualidade.' });
  }
};

// Listar todos os testes associados a uma inspeção específica
exports.listarTestesPorInspecao = async (req, res) => {
  const { id_inspecao } = req.params;

  try {
    const [testes] = await db.query(
      'SELECT * FROM teste WHERE id_inspecao = ? ORDER BY id_teste ASC', 
      [id_inspecao]
    );
    res.json(testes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar testes da inspeção.' });
  }
};

// Atualizar teste de qualidade
exports.atualizarTeste = async (req, res) => {
  const { id } = req.params;
  const { tipo_teste, parametro_medido, resultado, observacao } = req.body;

  if (!tipo_teste || !resultado) {
    return res.status(400).json({ mensagem: 'Tipo de teste e resultado são obrigatórios.' });
  }

  try {
    const [existentes] = await db.query('SELECT * FROM teste WHERE id_teste = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Teste não encontrado.' });
    }

    const query = `
      UPDATE teste 
      SET tipo_teste = ?, parametro_medido = ?, resultado = ?, observacao = ?
      WHERE id_teste = ?
    `;
    await db.query(query, [tipo_teste, parametro_medido || '', resultado, observacao || '', id]);

    res.json({ mensagem: 'Teste atualizado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao atualizar teste.' });
  }
};

// Excluir teste de qualidade
exports.excluirTeste = async (req, res) => {
  const { id } = req.params;

  try {
    const [existentes] = await db.query('SELECT id_teste FROM teste WHERE id_teste = ?', [id]);
    if (!existentes || existentes.length === 0) {
      return res.status(404).json({ mensagem: 'Teste não encontrado.' });
    }

    await db.query('DELETE FROM teste WHERE id_teste = ?', [id]);
    res.json({ mensagem: 'Teste excluído com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao excluir teste.' });
  }
};