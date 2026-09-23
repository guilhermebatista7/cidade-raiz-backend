import { listarRoles } from "../controllers/usuario.controller.js";
import { Role } from "../generated/prisma/enums.js";
import { verificarRole } from "../middlewares/auth.middlewares.js";
import router from "./auth.routes.js";

router.get(
  "/roles", 
  verificarRole([Role.GLOBAL]),
  listarRoles
);

export default router;
