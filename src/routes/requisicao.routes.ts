import { Router } from "express";
import multer from "multer";

import { criarRequisicao } from "../controllers/solicitacao.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post(
  "/", 
  upload.single("imagem"), 
  criarRequisicao
);

export default router;