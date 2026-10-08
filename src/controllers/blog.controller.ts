import type { Request, Response } from "express";
import { publicacaoSchema } from "../schemas/publicacao.schema.js";
import { buscarPublicacaoService, criarPublicacaoService } from "../services/blog.service.js";

export async function criarPublicacao(req: Request, res: Response) {
  const validacao = publicacaoSchema.safeParse(req.body);

  if (!validacao.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: validacao.error.flatten()
    });
  }

  try {
    const novaPublicacao = await criarPublicacaoService(validacao.data);
    return res.status(201).json(novaPublicacao);
  } catch (error: any) {
    console.error("ERRO AO CRIAR PUBLICAÇÂO:", error);
    return res.status(500).json({ message: error.message || "Erro ao criar publicação" });
  }
}

export async function buscarPublicacao(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== "string") {
    return res.status(400).json({ message: "ID inválido" });
  }

  try {
    const publicacao = await buscarPublicacaoService(id);
    return res.status(200).json(publicacao);
  } catch (error: any) {
    console.error("ERRO AO LISTAR PUBLICAÇÂO:", error);
    return res.status(500).json({ message: "Erro ao listar publicação" });
  }
}