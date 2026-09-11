import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import router from './routes/auth.routes.js';

const app = express();

app.use(helmet());

app.use(cors({
  origin: 'http://localhost:5173', //URL VITE
  credentials: true
}))

app.use(express.json());

app.use("/api/auth", router);

export default app;
