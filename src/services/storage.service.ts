import { supabase } from "../lib/supabase.js";

export interface ArquivoMulter {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

export async function uploadArquivoSupabase(
  file: ArquivoMulter,
  bucket: string,
  pasta: string
): Promise<{
  bucket: string;
  path: string;
  publicUrl: string;
}> {
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

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    bucket,
    path: filePath,
    publicUrl: data.publicUrl,
  };
}

export async function excluirArquivoSupabase(
  imagemUrl: string
): Promise<void> {
  try {
    const url = new URL(imagemUrl);

    const prefixo = "storage/v1/object/public/public_box/";

    if (!url.pathname.includes(prefixo)) {
      console.warn(
        "URL da imagem não pertence ao bucket esperado:",
        imagemUrl
      );
      return;
    }

    const filePath = decodeURIComponent(
      url.pathname.split(prefixo)[1] ?? ""
    );

    if (!filePath) {
      return;
    }

    const { error } = await supabase.storage
      .from("public_box")
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
