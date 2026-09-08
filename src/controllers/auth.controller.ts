import type { Request, Response } from "express";
import { cadastroSchema } from "../schemas/auth.schema.js";
import { cadastrarUsuario } from "../services/auth.service.js";

export async function cadastrar(
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
        const resultado = await cadastrarUsuario(
            dados.data.email,
            dados.data.senha
        );

        //Created(201)
        return res.status(201).json(resultado);

    } catch (error) {
      //Erro interno servidor (500)
        return res.status(500).json({
            message: "Erro ao cadastrar usuário"
        });
    }
}