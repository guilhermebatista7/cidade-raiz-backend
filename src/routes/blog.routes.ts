import { Router } from "express";
import { verificarRole } from "../middlewares/auth.middlewares.js";
import { Role } from "../generated/prisma/enums.js";
import { buscarPublicacao, criarPublicacao } from "../controllers/blog.controller.js";
const router = Router();

//Passa por todos para verificar se é cidadão comum e req é dele mesmo 
router.post(
  "/", 
  verificarRole([Role.CIDADAO, Role.FUNCIONARIO, Role.ADMIN_LOCAL, Role.GLOBAL]), 
  criarPublicacao
);

router.get(
  "/:id",
  verificarRole([Role.CIDADAO, Role.GLOBAL, Role.ADMIN_LOCAL, Role.FUNCIONARIO]),
  buscarPublicacao
);

export default router;