import { prisma } from "../lib/prisma.js";

export async function listarCidadesService() {
  return await prisma.cidade.findMany({
    orderBy: { criadoEm: 'desc' }
  });
}

export async function criarCidadeService(dados: { nome: string; uf: string;}) {

  return await prisma.cidade.create({
    data: {
      nome: dados.nome,
      uf: dados.uf,
      ativa: true,
    }
  });
}

export async function atualizarCidadeService(id: string, dados: { nome: string; uf: string; }) {
  const cidadeExistente = await prisma.cidade.findUnique({ where: { id } });
  if (!cidadeExistente) {
    throw new Error("Cidade não encontrada");
  }

  return await prisma.cidade.update({
    where: { id },
    data: {
      nome: dados.nome,
      uf: dados.uf
    }
  });
}

export async function desativarCidadeService(id: string){
  const cidadeExistente = await prisma.cidade.findUnique({where: {id}});
  if(!cidadeExistente){
    throw new Error("Cidade não encontrada");
  }

  return await prisma.cidade.update({
    where: {id},
    data: {
      ativa: false,
    }
  });
}

export async function ativarCidadeService(id: string){
  const cidadeExistente = await prisma.cidade.findUnique({where: {id}});
  if(!cidadeExistente){
    throw new Error("Cidade não encontrada");
  }

  return await prisma.cidade.update({
    where: {id},
    data: {
      ativa: true,
    }
  });
}