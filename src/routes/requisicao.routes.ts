import { Router } from "express";
import multer from "multer";

import { buscarRequisicoes, buscarRequisicoesPorCidade, criarRequisicao } from "../controllers/requisicao.controller.js";
import { verificarRole } from "../middlewares/auth.middlewares.js";
import { Role } from "../generated/prisma/enums.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post(
  "/",
  upload.fields([
    { name: "fotoLocal", maxCount: 1 },
    { name: "comprovante", maxCount: 1 },
  ]),
   criarRequisicao
);

router.get(
  '/',
  verificarRole([Role.ADMIN_LOCAL, Role.FUNCIONARIO, Role.GLOBAL]),
  buscarRequisicoes
)

router.get(
  "/cidade/:id",
  verificarRole([Role.GLOBAL]),
  buscarRequisicoesPorCidade
);

export default router;