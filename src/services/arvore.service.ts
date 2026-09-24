import { prisma } from "../lib/prisma.js";
import { Role } from "../generated/prisma/enums.js";
import {
  excluirArquivoSupabase,
  uploadArquivoSupabase,
  type ArquivoMulter,
} from "./storage.service.js";

export async function listarArvoresService(
  usuarioLogado: {
    role: Role;
    cidadeId: string | null;
  }
) {
  if (usuarioLogado.role === Role.GLOBAL) {
    return await prisma.arvore.findMany({
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  if (
    usuarioLogado.role === Role.ADMIN_LOCAL ||
    usuarioLogado.role === Role.FUNCIONARIO
  ) {
    const cidadeId = usuarioLogado.cidadeId;

    return await prisma.arvore.findMany({
      where: {
        cidadeId,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  return [];
}

export async function listarArvoresCidadeService(cidadeId: string) {
  return await prisma.arvore.findMany({
    where: {
      cidadeId,
    },
    orderBy: {
      criadoEm: "desc",
    },
  });
}

export async function criarArvoreService(
  dados: {
    nome: string;
    descricao?: string;
    quantidade: number;
    cidadeId: string;
  },
  file?: ArquivoMulter
) {
  let imagemUrl: string | null = null;

  if (file) {
    const imagem = await uploadArquivoSupabase(
      file,
      "public_box",
      "arvores"
    );

    imagemUrl = imagem.publicUrl;
  }

  return await prisma.arvore.create({
    data: {
      nomePopular: dados.nome,
      descricao: dados.descricao ?? null,
      quantidade: dados.quantidade,
      cidadeId: dados.cidadeId,
      imagemUrl,
    },
  });
}

export async function atualizarArvoreService(
  id: string,
  dados: {
    nome: string;
    descricao?: string;
    quantidade: number;
    cidadeId: string;
  },
  file?: ArquivoMulter
) {
  const arvoreExistente = await prisma.arvore.findUnique({
    where: {
      id,
    },
  });

  if (!arvoreExistente) {
    throw new Error("Árvore não encontrada");
  }

  let imagemUrl = arvoreExistente.imagemUrl;

  if (file) {
    if (arvoreExistente.imagemUrl) {
      await excluirArquivoSupabase(
        "public_box",
        arvoreExistente.imagemUrl
      );
    }

    const imagem = await uploadArquivoSupabase(
      file,
      "public_box",
      "arvores"
    );

    imagemUrl = imagem.publicUrl;
  }

  return await prisma.arvore.update({
    where: {
      id,
    },
    data: {
      nomePopular: dados.nome,
      descricao: dados.descricao ?? null,
      quantidade: dados.quantidade,
      cidadeId: dados.cidadeId,
      imagemUrl,
    },
  });
}

export async function excluirArvoreService(id: string) {
  const arvoreExistente = await prisma.arvore.findUnique({
    where: {
      id,
    },
  });

  if (!arvoreExistente) {
    throw new Error("Árvore não encontrada");
  }

  if (arvoreExistente.imagemUrl) {
    await excluirArquivoSupabase(
      "public_box",
      arvoreExistente.imagemUrl
    );
  }

  return await prisma.arvore.delete({
    where: {
      id,
    },
  });
}
