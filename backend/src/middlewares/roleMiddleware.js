function normalizarCargo(cargo) {
  if (!cargo) return '';
  return String(cargo)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

const checkRole = (...cargosPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.cargo) {
      return res.status(401).json({ mensagem: 'Acesso negado: Usuário não autenticado.' });
    }

    const cargoUsuario = normalizarCargo(req.usuario.cargo);
    const permitidosNormalizados = new Set(cargosPermitidos.map(normalizarCargo));

    // Admin possui acesso geral operacional e administrativo
    if (cargoUsuario === 'admin') {
      return next();
    }

    // Validação estrita por igualdade (sem correspondência por substring)
    if (permitidosNormalizados.has(cargoUsuario)) {
      return next();
    }

    return res.status(403).json({ mensagem: 'Acesso negado: Perfil sem permissão para esta operação.' });
  };
};

module.exports = checkRole;