import type { TipoAtendimento } from "../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";
import {
  uploadArquivoSupabase,
  type ArquivoMulter,
} from "./storage.service.js";

export async function criarRequisicaoService(
  dados: {
    cidadaoId: string;
    cidadeId: string;
    arvoreId: string;
    rua: string;
    numero: string;
    bairro: string;
    cidadeEndereco: string;
    cep: string;
    estado: string;
    pontoReferencia?: string | undefined;
    tipoAtendimento: TipoAtendimento;
  },
  arquivos: {
    fotoLocal?: ArquivoMulter;
    comprovante?: ArquivoMulter;
  }
) {
  let fotoLocalPath: string | null = null;
  let comprovanteResidenciaPath: string | null = null;

  if (arquivos.fotoLocal) {
    const foto = await uploadArquivoSupabase(
      arquivos.fotoLocal,
      "public_box",
      "locais_plantio",
      true
    );

    fotoLocalPath = foto.path;
  }

  if (arquivos.comprovante) {
    const comprovante = await uploadArquivoSupabase(
      arquivos.comprovante,
      "box",
      "documentos-sensiveis",
      false
    );

    comprovanteResidenciaPath = comprovante.path;
  }

  return await prisma.requisicao.create({
    data: {
      cidadaoId: dados.cidadaoId,
      cidadeId: dados.cidadeId,
      arvoreId: dados.arvoreId,

      rua: dados.rua,
      numero: dados.numero,
      bairro: dados.bairro,
      cidadeEndereco: dados.cidadeEndereco,
      cep: dados.cep,
      estado: dados.estado,

      pontoReferencia: dados.pontoReferencia ?? null,

      tipoAtendimento: dados.tipoAtendimento,

      fotoLocalUrl: fotoLocalPath,
      comprovanteResidenciaUrl: comprovanteResidenciaPath,
    },
  });
}