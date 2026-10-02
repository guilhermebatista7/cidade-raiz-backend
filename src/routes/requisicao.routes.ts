import { Router } from "express";
import multer from "multer";

import { agendarPlantio, alterarSituacao, atualizarRequisicao, buscarRequisicoes, buscarRequisicoesPorCidade, buscarRequisicoesPorUsuario, criarRequisicao, recusarRequisicao } from "../controllers/requisicao.controller.js";
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

router.put(
  "/:id",
  upload.fields([
    { name: "fotoLocal", maxCount: 1 },
    { name: "comprovante", maxCount: 1 },
  ]),
   atualizarRequisicao
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

// Passamos todos os roles, para fazer uma busca pelo usuário logado.
router.get(
  "/usuario",
  verificarRole([Role.ADMIN_LOCAL, Role.FUNCIONARIO, Role.GLOBAL, Role.CIDADAO]),
  buscarRequisicoesPorUsuario
)

router.put(
  "/recusar/:id",
  verificarRole([Role.FUNCIONARIO, Role.ADMIN_LOCAL, Role.GLOBAL]),
  recusarRequisicao
)

router.put(
  "/agendar/:id",
  verificarRole([Role.FUNCIONARIO, Role.ADMIN_LOCAL, Role.GLOBAL]),
  agendarPlantio
)

router.put(
  "/alterarSituacao/:id",
  verificarRole([Role.FUNCIONARIO, Role.ADMIN_LOCAL, Role.GLOBAL]),
  alterarSituacao
)

export default router;