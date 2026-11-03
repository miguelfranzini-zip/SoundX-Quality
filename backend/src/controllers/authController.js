const db = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const emailNorm = String(email || '').trim().toLowerCase();
    const [rows] = await db.query('SELECT * FROM funcionario WHERE LOWER(TRIM(email)) = ?', [emailNorm]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    const funcionario = rows[0];

    // Exclusão lógica: usuários excluídos não podem autenticar
    const ativo = funcionario.ativo === undefined || funcionario.ativo === null
      ? true
      : Boolean(funcionario.ativo);
    if (!ativo) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    // Suporta hash bcrypt com fallback para texto plano (dados de seed/legado)
    let senhaCorreta = false;
    const isBcrypt = funcionario.senha && (funcionario.senha.startsWith('$2a$') || funcionario.senha.startsWith('$2b$') || funcionario.senha.startsWith('$2y$'));
    if (isBcrypt) {
      senhaCorreta = bcrypt.compareSync(senha, funcionario.senha);
    } else {
      senhaCorreta = senha === funcionario.senha;
    }

    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    // Se a senha ainda estava em texto plano, migra de forma transparente para hash bcrypt
    if (!isBcrypt) {
      try {
        const hash = bcrypt.hashSync(senha, 10);
        await db.query('UPDATE funcionario SET senha = ? WHERE id_funcionario = ?', [hash, funcionario.id_funcionario]);
      } catch (migErr) {
        console.warn('Não foi possível migrar senha para bcrypt:', migErr.message);
      }
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
