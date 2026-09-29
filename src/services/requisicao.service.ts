import type { Usuario } from "../generated/prisma/client.js";
import { Role, StatusRequisicao, type TipoAtendimento } from "../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";
import {
  uploadArquivoSupabase,
  obterUrlPublica,
  obterUrlAssinada,
  type ArquivoMulter,
} from "./storage.service.js";

export async function criarRequisicaoService(
  dados: {
    criadoPorId: string;
    cidadeId: string;
    arvoreId: string;
    nomeBeneficiario: string;
    telefoneBeneficiario: string;
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
      criadoPorId: dados.criadoPorId,
      cidadeId: dados.cidadeId,
      arvoreId: dados.arvoreId,
      nomeBeneficiario: dados.nomeBeneficiario,
      telefoneBeneficiario: dados.telefoneBeneficiario,

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

async function adicionarUrlsArquivos(requisicao: any) {
  const fotoLocalUrl = requisicao.fotoLocalUrl ? obterUrlPublica("public_box", requisicao.fotoLocalUrl) : null;

  const comprovanteResidenciaUrl = requisicao.comprovanteResidenciaUrl
    ? await obterUrlAssinada("box", requisicao.comprovanteResidenciaUrl, 300)
    : null;

  return {
    ...requisicao,
    fotoLocalUrl,
    comprovanteResidenciaUrl,
  };
}

export const listarReqService = async (usuarioLogado: { id: string, cidadeId: string | null, role: Role, email: string }) => {

  const include = {
    cidade: {
      select: {
        id: true,
        nome: true,
        uf: true,
      },
    },
    criadoPor: {
      select: {
        id: true,
        nome: true,
        email: true,
      }
    },
    arvore: {
      select: {
        id: true,
        nomePopular: true,
      },
    },
  };

  if (usuarioLogado.role === Role.ADMIN_LOCAL || usuarioLogado.role === Role.FUNCIONARIO) {

    if (!usuarioLogado.cidadeId) {
      throw new Error("Cidade não encontrada");
    }

    const cidadeId = usuarioLogado.cidadeId
    const requisicoes = await prisma.requisicao.findMany({
      where: { cidadeId },
      orderBy: {
        criadoEm: 'desc'
      },
      include,
    });

    return await Promise.all(
      requisicoes.map(adicionarUrlsArquivos)
    );
  }

  return [];
}

export const listarReqCidadeService = async (cidadeId: string, usuarioLogado: { id: string, cidadeId: string | null, role: Role, email: string }) => {

  const include = {
    cidade: {
      select: {
        id: true,
        nome: true,
        uf: true,
      },
    },
    criadoPor: {
      select: {
        id: true,
        nome: true,
        email: true,
      }
    },
    arvore: {
      select: {
        id: true,
        nomePopular: true,
      },
    },
  };

  if (usuarioLogado.role === Role.GLOBAL) {

    const requisicoes = await prisma.requisicao.findMany({
      where: {
        cidadeId: cidadeId,
      },
      orderBy: {
        criadoEm: 'desc'
      },
      include,
    });

    return await Promise.all(
      requisicoes.map(adicionarUrlsArquivos)
    );
  }

  return [];
}

export const recusarRequisicaoService = async (requisicaoId: string, observacaoStatus: string, usuarioLogado: {cidadeId: string | null, role: Role}) => {
  if(!usuarioLogado){
    throw new Error("Usuário não autenticado");
  }

  if(usuarioLogado.role !== Role.GLOBAL && typeof usuarioLogado.cidadeId !== 'string'){
    throw new Error("Ação não permitida");
  }

  await prisma.requisicao.update({
    where:{ id: requisicaoId },
    data:{
      status: StatusRequisicao.RECUSADO,
      observacaoStatus: observacaoStatus
    }
  })
}

export const agendarRequisicaoService = async (requisicaoId: string, dataInicial: Date, dataFinal: Date, usuarioLogado: {cidadeId: string | null, role: Role}) => {
  if(!usuarioLogado){
    throw new Error("Usuário não autenticado");
  }

  if(usuarioLogado.role !== Role.GLOBAL && typeof usuarioLogado.cidadeId !== 'string'){
    throw new Error("Ação não permitida");
  }

  await prisma.requisicao.update({
    where:{ id: requisicaoId },
    data:{
      status: StatusRequisicao.AGENDADO_PLANTIO,
      dataInical: dataInicial,
      dataFinal: dataFinal
    }
  })
}

export const alterarRequisicaoService = async (requisicaoId: string, status: StatusRequisicao, usuarioLogado: {cidadeId: string | null, role: Role}) => {
  if(!usuarioLogado){
    throw new Error("Usuário não autenticado");
  }

  if(usuarioLogado.role !== Role.GLOBAL && typeof usuarioLogado.cidadeId !== 'string'){
    throw new Error("Ação não permitida");
  }

  await prisma.requisicao.update({
    where:{ id: requisicaoId },
    data:{
      status
    }
  })
}