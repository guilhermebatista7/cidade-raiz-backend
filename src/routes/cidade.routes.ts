import { ativarCidade, atualizarCidade, criarCidade, desativarCidade, listarCidades, listarCidadesAtivas } from "../controllers/cidade.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { verificarRole } from "../middlewares/auth.middlewares.js";
import router from "./auth.routes.js";

router.get(
  "/", 
  verificarRole([Role.GLOBAL]), 
  listarCidades
);

router.get(
  "/ativas", 
  listarCidadesAtivas
);

router.post(
  "/", 
  verificarRole([Role.GLOBAL]),  
  criarCidade
);

router.put(
  "/:id",
  verificarRole([Role.GLOBAL]),
  atualizarCidade
)

router.put(
  "/ativar/:id",
  verificarRole([Role.GLOBAL]),
  ativarCidade
);

router.put(
  "/desativar/:id",
  verificarRole([Role.GLOBAL]),
  desativarCidade
);

export default router;
