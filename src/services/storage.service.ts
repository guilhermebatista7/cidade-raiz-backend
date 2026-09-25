import { supabase } from "../lib/supabase.js";

export interface ArquivoMulter {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export interface ArquivoStorage {
  bucket: string;
  path: string;
  publicUrl: string | null;
}

export async function uploadArquivoSupabase(
  file: ArquivoMulter,
  bucket: string,
  pasta: string,
  publico: boolean = false
): Promise<ArquivoStorage> {
  const fileExt =
    file.originalname.split(".").pop()?.toLowerCase() || "bin";

  const randomString = Math.random()
    .toString(36)
    .substring(2, 9);

  const fileName = `${Date.now()}-${randomString}.${fileExt}`;

  const filePath = `${pasta}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Erro ao enviar arquivo para o Storage: ${error.message}`
    );
  }

  let publicUrl: string | null = null;

  if (publico) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    publicUrl = data.publicUrl;
  }

  return {
    bucket,
    path: filePath,
    publicUrl,
  };
}

export async function excluirArquivoSupabase(
  bucket: string,
  filePath: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(
      `Erro ao excluir arquivo do Storage: ${error.message}`
    );
  }
}

export function obterUrlPublica(
  bucket: string,
  filePath: string
): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function obterUrlAssinada(
  bucket: string,
  filePath: string,
  expiresIn: number = 60
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw new Error(
      `Erro ao gerar URL assinada: ${error.message}`
    );
  }

  return data.signedUrl;
}