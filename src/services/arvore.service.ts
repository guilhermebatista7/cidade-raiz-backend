import { empty } from "@prisma/client/runtime/client";
import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/supabase.js";

// Tipo local para o arquivo do Multer
interface ArquivoMulter {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

// Função auxiliar para gerenciar upload de imagem para o Supabase
async function uploadImagemSupabase(file: ArquivoMulter): Promise<string> {
  const fileExt = file.originalname.split('.').pop();
  const randomString = Math.random().toString(36).substring(2, 9);
  const fileName = `${Date.now()}-${randomString}.${fileExt}`;
  const filePath = `arvores/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('box')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Erro ao enviar imagem para o Storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('publico')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function listarArvoresService() {
  return await prisma.arvore.findMany({
    orderBy: { criadoEm: 'desc' }
  });
}

export async function criarArvoreService(dados: { nome: string; descricao?: string; quantidade: number }, file?: ArquivoMulter) {
  let imagemUrl: string | null = null;

  if (file) {
    imagemUrl = await uploadImagemSupabase(file);
  }

  return await prisma.arvore.create({
    data: {
      nomePopular: dados.nome,
      descricao: dados.descricao ?? null, // Converte undefined para null
      quantidade: dados.quantidade,
      imagemUrl: imagemUrl,
    }
  });
}

export async function atualizarArvoreService(id: string, dados: { nome: string; descricao?: string; quantidade: number }, file?: ArquivoMulter) {
  const arvoreExistente = await prisma.arvore.findUnique({ where: { id } });
  if (!arvoreExistente) {
    throw new Error("Árvore não encontrada");
  }

  let imagemUrl = arvoreExistente.imagemUrl;

  if (file) {
    imagemUrl = await uploadImagemSupabase(file);
  }

  return await prisma.arvore.update({
    where: { id },
    data: {
      nomePopular: dados.nome,
      descricao: dados.descricao ?? null, // Converte undefined para null
      quantidade: dados.quantidade,
      imagemUrl: imagemUrl,
    }
  });
}

export async function excluirArvoreService(id: string) {
  const arvoreExistente = await prisma.arvore.findUnique({ where: { id } });
  if (!arvoreExistente) {
    throw new Error("Árvore não encontrada");
  }

  return await prisma.arvore.delete({
    where: { id }
  });
}