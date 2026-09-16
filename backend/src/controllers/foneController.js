const db = require('../config/database');

// Listar todos os fones
const listarFones = async (req, res) => {
  try {
    const [fones] = await db.query('SELECT * FROM fone ORDER BY id_fone DESC');
    res.json(fones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar fones.' });
  }
};

// Cadastrar novo fone
const cadastrarFone = async (req, res) => {
  const { numero_serie, modelo, marca, tipo_conexao, data_fabricacao, status } = req.body;

  if (!numero_serie || !modelo) {
    return res.status(400).json({ mensagem: 'Número de série e modelo são obrigatórios.' });
  }

  try {
    const query = `
      INSERT INTO fone (numero_serie, modelo, marca, tipo_conexao, data_fabricacao, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [
      numero_serie,
      modelo,
      marca || 'SoundX',
      tipo_conexao || 'Bluetooth',
      data_fabricacao || new Date(),
      status || 'Aguardando inspeção'
    ];

    const [resultado] = await db.query(query, values);

    res.status(201).json({
      mensagem: 'Fone cadastrado com sucesso!',
      id_fone: resultado.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensagem: 'Já existe um fone cadastrado com este número de série.' });
    }
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar fone.' });
  }
};

// Obter histórico unificado do fone (Rastreabilidade)
const obterHistorico = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Dados do fone
    const [fones] = await db.query('SELECT * FROM fone WHERE id_fone = ?', [id]);
    if (fones.length === 0) {
      return res.status(404).json({ mensagem: 'Fone não encontrado.' });
    }

    // 2. Histórico de inspeções
    const [inspecoes] = await db.query(
      `SELECT i.*, func.nome AS inspetor 
       FROM inspecao i 
       LEFT JOIN funcionario func ON i.id_funcionario = func.id_funcionario 
       WHERE i.id_fone = ? 
       ORDER BY i.data_inspecao DESC`, 
      [id]
    );

    // 3. Histórico de testes
    const [testes] = await db.query(
      `SELECT t.* FROM teste t 
       JOIN inspecao i ON t.id_inspecao = i.id_inspecao 
       WHERE i.id_fone = ? 
       ORDER BY t.id_teste DESC`,
      [id]
    );

    // 4. Histórico de manutenções
    const [manutencoes] = await db.query(
      'SELECT * FROM manutencao WHERE id_fone = ? ORDER BY data_entrada DESC',
      [id]
    );

    res.json({
      fone: fones[0],
      total_inspecoes: inspecoes.length,
      inspecoes,
      testes,
      manutencoes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar histórico do fone.' });
  }
};

module.exports = {
  listarFones,
  cadastrarFone,
  obterHistorico
};