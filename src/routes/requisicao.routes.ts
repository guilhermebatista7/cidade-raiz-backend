import { Router } from "express";
import multer from "multer";

import { agendarPlantio, alterarStatus, atualizarFotoPlantio, atualizarRequisicao, buscarRequisicoes, buscarRequisicoesPorCidade, buscarRequisicoesPorUsuario, criarRequisicao, recusarRequisicao } from "../controllers/requisicao.controller.js";
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

//Passa todos os roles, pois é preciso validar se usuário está alterando uma requisição criada por ele mesmo
router.put(
  "/:id",
  upload.fields([
    { name: "fotoLocal", maxCount: 1 },
    { name: "comprovante", maxCount: 1 },
  ]),
  verificarRole([Role.ADMIN_LOCAL, Role.FUNCIONARIO, Role.GLOBAL, Role.CIDADAO]),
  atualizarRequisicao
);

//Passa todos os roles, e verifica se caso o usuário seja cidadão, se ele é o dono da requisição 
router.put(
  "/fotoPlantio/:id",
  upload.fields([
    { name: "fotoPlantio", maxCount: 1 },
  ]),
  verificarRole([Role.ADMIN_LOCAL, Role.FUNCIONARIO, Role.GLOBAL, Role.CIDADAO]),
  atualizarFotoPlantio
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
  "/alterarStatus/:id",
  verificarRole([Role.FUNCIONARIO, Role.ADMIN_LOCAL, Role.GLOBAL]),
  alterarStatus
)

export default router;