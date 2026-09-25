import { Router } from "express";
import multer from "multer";

import { criarRequisicao } from "../controllers/requisicao.controller.js";

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

export default router;