import { Router } from "express";
import { cadastrar } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", cadastrar);

export default router;