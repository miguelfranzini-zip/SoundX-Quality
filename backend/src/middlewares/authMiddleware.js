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

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
    }

    req.usuario = { id: decoded.id, cargo: decoded.cargo };
    req.usuarioId = decoded.id;
    req.usuarioCargo = decoded.cargo;
    return next();
  });
};