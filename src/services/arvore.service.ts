import { string } from "zod";
import { prisma } from "../lib/prisma.js";
import { supabase } from "../lib/supabase.js";
import { Role } from "../generated/prisma/enums.js";

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
    .from('public_box')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Erro ao enviar imagem para o Storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('public_box')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function listarArvoresService(usuarioLogado : {role: Role, cidadeId: string | null}) {
  if(usuarioLogado.role === Role.GLOBAL){
    return await prisma.arvore.findMany({
      orderBy: { criadoEm: 'desc' }
    });
  }

  if(usuarioLogado.role === Role.ADMIN_LOCAL || usuarioLogado.role === Role.FUNCIONARIO){
    const cidadeId = usuarioLogado.cidadeId
    return await prisma.arvore.findMany({
      where: { cidadeId },
      orderBy: { criadoEm: 'desc' }
    })
  }

  //montar select com id da cidade escolhida na solicitação do cidadao e verificar role do cidadao
  return [];
}

export async function criarArvoreService(dados: { nome: string; descricao?: string; quantidade: number, cidadeId: string }, file?: ArquivoMulter) {
  let imagemUrl: string | null = null;

  if (file) {
    imagemUrl = await uploadImagemSupabase(file);
  }

  return await prisma.arvore.create({
    data: {
      nomePopular: dados.nome,
      descricao: dados.descricao ?? null, // Converte undefined para null
      quantidade: dados.quantidade,
      cidadeId: dados.cidadeId,
      imagemUrl: imagemUrl,
    }
  });
}

export async function atualizarArvoreService(id: string, dados: { nome: string; descricao?: string; quantidade: number; cidadeId: string }, file?: ArquivoMulter) {
  const arvoreExistente = await prisma.arvore.findUnique({ where: { id } });
  if (!arvoreExistente) {
    throw new Error("Árvore não encontrada");
  }

  let imagemUrl = arvoreExistente.imagemUrl;

  if (file) {

    if (arvoreExistente.imagemUrl) {
      await excluirImagemSupabase(arvoreExistente.imagemUrl);
    }

    imagemUrl = await uploadImagemSupabase(file);
  }

  return await prisma.arvore.update({
    where: { id },
    data: {
      nomePopular: dados.nome,
      descricao: dados.descricao ?? null, // Converte undefined para null
      quantidade: dados.quantidade,
      cidadeId: dados.cidadeId,
      imagemUrl: imagemUrl,
    }
  });
}

async function excluirImagemSupabase(imagemUrl: string){
  try {
    const url = new URL(imagemUrl);
    const prefixo = `storage/v1/object/public/public_box/`;

    if(!url.pathname.includes(prefixo)){
      console.warn("URL da imagem não pertence ao bucket esperado:", imagemUrl);
      return;
    }

    const filePath = decodeURIComponent(
      url.pathname.split(prefixo)[1] ?? ''
    );

    if (!filePath) {
      return;
    }

    const { error } = await supabase.storage
      .from('public_box')
      .remove([filePath]);

    if (error) {
      throw new Error(
        `Erro ao excluir imagem do Storage: ${error.message}`
      );
    }
  } catch (error) {
    console.error("Erro ao excluir imagem antiga:", error);
    throw error;
  }
}

export async function excluirArvoreService(id: string) {
  const arvoreExistente = await prisma.arvore.findUnique({ where: { id } });

  if (!arvoreExistente) {
    throw new Error("Árvore não encontrada");
  }

  // Remove a imagem do Storage
  if (arvoreExistente.imagemUrl) {
    await excluirImagemSupabase(arvoreExistente.imagemUrl);
  }

  return await prisma.arvore.delete({
    where: { id }
  });
}