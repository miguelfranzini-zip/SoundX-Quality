const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Criar novo funcionário/usuário (apenas Admin)
exports.createUser = async (req, res) => {
  const { nome, email, senha, cargo, cpf } = req.body;

  if (!nome || !email || !senha || !cargo) {
    return res.status(400).json({ mensagem: 'Nome, e-mail, senha e cargo são obrigatórios.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ mensagem: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  const cargosValidos = ['Admin', 'Inspetor', 'Técnico', 'Gerente'];
  if (!cargosValidos.includes(cargo)) {
    return res.status(400).json({ mensagem: `Cargo inválido. Use: ${cargosValidos.join(', ')}.` });
  }

  try {
    // Verifica se já existe usuário com esse e-mail
    const [existentes] = await db.query('SELECT id_funcionario FROM funcionario WHERE email = ?', [email]);
    if (existentes && existentes.length > 0) {
      return res.status(409).json({ mensagem: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    // Verifica CPF duplicado (se fornecido)
    if (cpf) {
      const [cpfExistente] = await db.query('SELECT id_funcionario FROM funcionario WHERE cpf = ?', [cpf]);
      if (cpfExistente && cpfExistente.length > 0) {
        return res.status(409).json({ mensagem: 'Já existe um usuário cadastrado com este CPF.' });
      }
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Insere novo funcionário
    const [resultado] = await db.query(
      'INSERT INTO funcionario (nome, cpf, cargo, email, senha) VALUES (?, ?, ?, ?, ?) RETURNING id_funcionario',
      [nome.trim(), cpf || null, cargo, email.trim().toLowerCase(), senhaHash]
    );

    res.status(201).json({
      mensagem: `Usuário "${nome}" cadastrado com sucesso!`,
      id_funcionario: resultado.insertId
    });
  } catch (error) {
    // Trata erro de duplicidade do PostgreSQL (código 23505)
    if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
      if (error.constraint?.includes('email') || error.message?.includes('email')) {
        return res.status(409).json({ mensagem: 'Já existe um usuário cadastrado com este e-mail.' });
      }
      if (error.constraint?.includes('cpf') || error.message?.includes('cpf')) {
        return res.status(409).json({ mensagem: 'Já existe um usuário cadastrado com este CPF.' });
      }
      return res.status(409).json({ mensagem: 'Dado duplicado. Verifique e-mail ou CPF.' });
    }
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ mensagem: 'Erro interno ao cadastrar usuário.' });
  }
};

// Listar todos os funcionários (apenas Admin)
exports.listUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_funcionario, nome, cpf, cargo, email FROM funcionario ORDER BY nome ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ mensagem: 'Erro ao listar usuários.' });
  }
};
