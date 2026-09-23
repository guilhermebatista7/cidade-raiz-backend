import type { Request, Response } from "express";
import { listarRolesService } from "../services/usuario.service.js";

export async function listarRoles(req: Request, res: Response) {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        message: "Usuário não autenticado."
      });
    }
    const roles = await listarRolesService(req.usuario);
    return res.status(200).json(roles);
  } catch (error) {
    return res.status(500).json({ message: "Erro ao listar tipos" });
  }
}