import { Router } from "express";
import multer from "multer";
import { 
  listarArvores, 
  criarArvore, 
  atualizarArvore, 
  excluirArvore 
} from "../controllers/arvore.controller.js";
import { verificarRole } from "../middlewares/auth.middlewares.js";
import { Role } from "../generated/prisma/enums.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", listarArvores);
router.post(
  "/", 
  verificarRole([Role.FUNCIONARIO, Role.ADMIN_LOCAL, Role.GLOBAL]), 
  upload.single("imagem"), 
  criarArvore
);

router.put(
  "/:id", 
  verificarRole([Role.FUNCIONARIO, Role.ADMIN_LOCAL, Role.GLOBAL]), 
  upload.single("imagem"), 
  atualizarArvore
);

router.delete(
  "/:id", 
  verificarRole([Role.ADMIN_LOCAL, Role.GLOBAL]), // Excluir restrito apenas a admins
  excluirArvore
);

export default router;