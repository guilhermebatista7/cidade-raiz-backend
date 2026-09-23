import { Role } from "../generated/prisma/enums.js";

export async function listarRolesService(usuario: { role: Role }) {
  if (usuario.role === Role.GLOBAL) {
    return Object.values(Role);
  }

  if (usuario.role === Role.ADMIN_LOCAL) {
    return [Role.FUNCIONARIO];
  }

  return [];
}