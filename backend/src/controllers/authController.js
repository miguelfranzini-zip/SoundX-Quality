const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM funcionario WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    const funcionario = rows[0];

    // Suporta hash bcrypt com fallback para texto plano (dados de seed/legado)
    let senhaCorreta = false;
    if (funcionario.senha && (funcionario.senha.startsWith('$2a$') || funcionario.senha.startsWith('$2b$') || funcionario.senha.startsWith('$2y$'))) {
      senhaCorreta = bcrypt.compareSync(senha, funcionario.senha);
    } else {
      senhaCorreta = senha === funcionario.senha;
    }

    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não configurado nas variáveis de ambiente!');
      return res.status(500).json({ mensagem: 'Erro interno de configuração: JWT_SECRET não configurado.' });
    }

    const token = jwt.sign(
      { id: funcionario.id_funcionario, cargo: funcionario.cargo },
      secret,
      { expiresIn: '8h' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: funcionario.id_funcionario,
        nome: funcionario.nome,
        email: funcionario.email,
        cargo: funcionario.cargo
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro interno no servidor.' });
  }
};