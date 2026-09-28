import type { Request, Response } from "express";
import { requisicaoSchema } from "../schemas/requisicao.schema.js";
import { criarRequisicaoService, listarReqCidadeService, listarReqService } from "../services/requisicao.service.js";


export async function criarRequisicao(req: Request, res: Response) {
  console.log("BODY RECEBIDO:");
  console.log(req.body);

  console.log("FILES RECEBIDOS:");
  console.log(req.files);

  const validacao = requisicaoSchema.safeParse(req.body);

  if (!validacao.success) {
    console.log("ERRO ZOD:");
    console.dir(validacao.error.flatten(), {
      depth: null,
    });

    return res.status(400).json({
      message: "Dados inválidos",
      errors: validacao.error.flatten(),
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
    return res.status(500).json({ message: error.message || "Erro ao criar requisição" });
  }
}

export const buscarRequisicoes = async (req: Request, res: Response) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({
        message: "Usuário não autencticado"
      });
    }
    const requisicoes = await listarReqService(req.usuario);
    return res.status(200).json(requisicoes);
  } catch (error) {
    return res.status(500).json({ message: `Erro ao listar requisições ${error}` })
  }
}

export const buscarRequisicoesPorCidade = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({ message: "ID da cidade inválido" });
  }

  try {
    if (!req.usuario) {
      return res.status(401).json({
        message: "Usuário não autencticado"
      });
    }
    const requisicoes = await listarReqCidadeService(id, req.usuario);
    return res.status(200).json(requisicoes);

  } catch (error) {
    return res.status(500).json({ message: `Erro ao listar requisições ${error}` })
  }
}
