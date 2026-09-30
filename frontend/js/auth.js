import { SESSION_KEY } from './config.js';
export { logoutRedireciona } from './api.js';

export const CARGOS = {
  ADMIN: 'Admin',
  GERENTE: 'Gerente',
  INSPETOR: 'Inspetor',
  TECNICO: 'Técnico',
};

export function getSessao() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function setSessao(dados) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(dados));
}

export function getUsuario() {
  return getSessao()?.usuario || null;
}

export function getToken() {
  return getSessao()?.token || null;
}

export function estaAutenticado() {
  return Boolean(getToken());
}

export function normalizarCargo(cargo) {
  if (!cargo) return '';
  return String(cargo)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function isAdminGerente(cargo) {
  const c = normalizarCargo(cargo);
  return c === 'admin' || c === 'gerente';
}

export function guardPagina(cargosPermitidos = null) {
  if (!estaAutenticado()) {
    logoutRedireciona();
    return null;
  }
  const usuario = getUsuario();
  if (cargosPermitidos && !isAdminGerente(usuario.cargo)) {
    const cUser = normalizarCargo(usuario.cargo);
    const permitidosNorm = cargosPermitidos.map(normalizarCargo);
    const autorizado = permitidosNorm.some((p) => cUser === p || cUser.includes(p));
    if (!autorizado) {
      window.location.href = 'acesso-negado.html';
      return null;
    }
  }
  return usuario;
}

export function paginaInicialPorCargo(cargo) {
  const c = normalizarCargo(cargo);
  if (c.includes('tecnico')) return 'manutencao.html';
  if (c.includes('inspetor')) return 'inspecoes.html';
  return 'dashboard.html';
}

export function cargoLabel(cargo) {
  const c = normalizarCargo(cargo);
  if (c === 'admin') return 'Administrador';
  if (c.includes('gerente')) return 'Gerente de Qualidade';
  if (c.includes('inspetor')) return 'Inspetor de Qualidade';
  if (c.includes('tecnico')) return 'Técnico de Manutenção';
  return cargo || 'Usuário';
}