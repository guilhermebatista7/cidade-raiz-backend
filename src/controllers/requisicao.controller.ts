import type { Request, Response } from "express";
import { requisicaoSchema } from "../schemas/requisicao.schema.js";
import { criarRequisicaoService } from "../services/requisicao.service.js";


export async function criarRequisicao(req: Request, res: Response) {
  const validacao = requisicaoSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: validacao.error.flatten()
    });
  }

  try {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const fotoLocal = files?.fotoLocal?.[0];
    const comprovante = files?.comprovante?.[0];

    if (!fotoLocal) {
      return res.status(400).json({
        message: "A foto do local é obrigatória.",
      });
    }

    if (!comprovante) {
      return res.status(400).json({
        message: "O comprovante de residência é obrigatório.",
      });
    }

    const novaRequisicao = await criarRequisicaoService(
      validacao.data,
      {
        fotoLocal,
        comprovante,
      }
    );

    return res.status(201).json(novaRequisicao);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || "Erro ao criar árvore" });
  }
}
