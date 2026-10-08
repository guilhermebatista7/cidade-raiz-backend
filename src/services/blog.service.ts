import { prisma } from "../lib/prisma.js";

export async function criarPublicacaoService(
  dados: {
    idRequisicao: string;
    titulo: string;
    descricao?: string;
  },
) {

  const publicacaoExistente = await prisma.publicacao.findUnique({
    where: {requisicaoId: dados.idRequisicao}
  })

  if(publicacaoExistente){
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