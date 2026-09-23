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
    const cargoUsuario = normalizarCargo(req.usuario?.cargo);

    // Permite acesso irrestrito para Admin/Gerente
    if (cargoUsuario === 'admin' || cargoUsuario === 'gerente') {
      return next();
    }

    const permitidosNormalizados = cargosPermitidos.map(normalizarCargo);

    const temPermissao = permitidosNormalizados.some((permitido) =>
      cargoUsuario === permitido || cargoUsuario.includes(permitido)
    );

    if (!req.usuario || !temPermissao) {
      return res.status(403).json({ mensagem: 'Acesso negado: Perfil sem permissão para esta operação.' });
    }

    next();
  };
};

module.exports = checkRole;