import type { Request, Response } from "express";
import { cadastroSchema } from "../schemas/auth.schema.js";
import { autenticarUsuario, cadastrarUsuario } from "../services/auth.service.js";

export async function cadastrar(
  req: Request,
  res: Response
) {
  const dados = cadastroSchema.safeParse(req.body);

  if (!dados.success) {
    return res.status(400).json({
      message: "Dados inválidos",
      errors: dados.error.flatten()
    });
  }

  try {
    const resultado = await cadastrarUsuario(
      dados.data.nome,
      dados.data.email,
      dados.data.senha
    );

    return res.status(201).json(resultado);

  } catch (error) {
    console.error("ERRO AO CADASTRAR USUÁRIO:", error);

    return res.status(500).json({
      message: "Erro ao cadastrar usuário"
    });
  }
}


export async function login(
    req: Request,
    res: Response
) {
    //verifica se são dados válidos com zod (em schemas)
    const dados = cadastroSchema.safeParse(req.body);

    if (!dados.success) {
      //Bad request (400)
        return res.status(400).json({
            message: "Dados inválidos",
            errors: dados.error.flatten()
        });
    }

    try {
        const resultado = await autenticarUsuario(
            dados.data.email,
            dados.data.senha
        );

        //Success(200)
        return res.status(200).json(resultado);

    } catch (error) {
      //Erro interno servidor (401)
        return res.status(401).json({
            message: "Email ou senha incorretos"
        });
    }
}