import { Router } from "express";
import multer from "multer";

import { buscarRequisicoes, criarRequisicao } from "../controllers/requisicao.controller.js";
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

export default router;