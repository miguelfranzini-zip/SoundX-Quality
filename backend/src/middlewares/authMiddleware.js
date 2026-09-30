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

  jwt.verify(token, process.env.JWT_SECRET || 'soundx_secret_key_2026', (err, decoded) => {
    if (err) {
      return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
    }

    req.usuario = { id: decoded.id, cargo: decoded.cargo };
    req.usuarioId = decoded.id;
    req.usuarioCargo = decoded.cargo;
    return next();
  });
};