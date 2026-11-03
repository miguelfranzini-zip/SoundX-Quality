const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ mensagem: 'Erro no formato do Token (esperado: Bearer <token>).' });
  }

  const token = parts[1];

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET não configurado nas variáveis de ambiente!');
    return res.status(500).json({ mensagem: 'Erro interno de configuração: JWT_SECRET não configurado.' });
  }

  jwt.verify(token, secret, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
    }

    try {
      const db = require('../config/database');
      const [rows] = await db.query('SELECT id_funcionario, cargo, ativo FROM funcionario WHERE id_funcionario = ?', [decoded.id]);
      const user = rows && rows[0];

      if (!user) {
        req.usuario = { id: decoded.id, cargo: decoded.cargo };
        req.usuarioId = decoded.id;
        req.usuarioCargo = decoded.cargo;
        return next();
      }
      if (user.ativo === false || user.ativo === 0) {
        return res.status(401).json({ mensagem: 'Usuário inativo ou inexistente.' });
      }

      req.usuario = { id: user.id_funcionario, cargo: user.cargo };
      req.usuarioId = user.id_funcionario;
      req.usuarioCargo = user.cargo;
      return next();
    } catch (dbErr) {
      req.usuario = { id: decoded.id, cargo: decoded.cargo };
      req.usuarioId = decoded.id;
      req.usuarioCargo = decoded.cargo;
      return next();
    }
  });
};
