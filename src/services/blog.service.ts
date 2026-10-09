import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

interface ListarPublicacoesParams {
  limit: number;
  cursorDate?: Date;
  cursorId?: string;
}

export async function listarPublicacoesService({
  limit,
  cursorDate,
  cursorId,
}: ListarPublicacoesParams) {
  const temCursor = cursorDate !== undefined && cursorId !== undefined;

  const where: Prisma.PublicacaoWhereInput | undefined = temCursor
    ? {
      OR: [
        {
          criadoEm: {
            lt: cursorDate,
          },
        },
        {
          criadoEm: cursorDate,
          id: {
            lt: cursorId,
          },
        },
      ],
    }
    : undefined;

  const items = await prisma.publicacao.findMany({
    ...(where !== undefined ? { where } : {}),

    orderBy: [
      { criadoEm: "desc" },
      { id: "desc" },
    ],

    take: limit + 1,

    select: {
      id: true,
      requisicaoId: true,
      titulo: true,
      descricao: true,
      criadoEm: true,
      
      requisicao: {
        select: {
          nomeBeneficiario: true,
        },
      },
    },
  });

  const hasMore = items.length > limit;
  const publicacoes = items.slice(0, limit);
  const ultima = publicacoes.at(-1);

  return {
    items: publicacoes,
    hasMore,
    nextCursor:
      hasMore && ultima
        ? {
          cursorDate: ultima.criadoEm.toISOString(),
          cursorId: ultima.id,
        }
        : null,
  };
}

export async function criarPublicacaoService(
  dados: {
    idRequisicao: string;
    titulo: string;
    descricao?: string;
  },
) {

  const publicacaoExistente = await prisma.publicacao.findUnique({
    where: { requisicaoId: dados.idRequisicao }
  })

  if (publicacaoExistente) {
    throw new Error('Publicação já realizada');
  }

  return await prisma.publicacao.create({
    data: {
      requisicaoId: dados.idRequisicao,
      titulo: dados.titulo,
      descricao: dados.descricao ?? null,
    },
  });
}

export async function buscarPublicacaoService(requisicaoId: string) {
  return await prisma.publicacao.findUnique({
    where: {
      requisicaoId: requisicaoId,
    },
  });
}