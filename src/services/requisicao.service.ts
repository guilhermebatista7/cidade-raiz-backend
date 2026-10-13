import { Role, StatusRequisicao, type TipoAtendimento } from "../generated/prisma/enums.js";
import { prisma } from "../lib/prisma.js";
import {
  uploadArquivoSupabase,
  obterUrlPublica,
  obterUrlAssinada,
  type ArquivoMulter,
  excluirArquivoSupabase,
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

  return await prisma.$transaction(async (tx) => {
    // 1. Cria a requisição
    const requisicao = await tx.requisicao.create({
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

    // 2. Cria o primeiro histórico dessa requisição
    await tx.historicoRequisicao.create({
      data: {
        requisicaoId: requisicao.id,
        usuarioId: dados.criadoPorId,

        // coloque aqui o status inicial do seu sistema
        statusNovo: StatusRequisicao.SOLICITADO,
        observacao: "Requisição foi recebida com sucesso",
      },
    });

    return requisicao;
  });
}

export async function atualizarRequisicaoService(
  id: string,
  usuarioLogado: { id: string },
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

  //BUSCAR REQUISIÇÃO ATUAL
  const requisicaoAtual = await prisma.requisicao.findUnique({
    where: { id },
  });

  if (!requisicaoAtual) {
    throw new Error("Requisição não encontrada");
  }

  //MANTER OS ARQUIVOS EXISTENTES POR PADRÃO
  let fotoLocalPath =
    requisicaoAtual.fotoLocalUrl;

  let comprovanteResidenciaPath =
    requisicaoAtual.comprovanteResidenciaUrl;

  /*
   * Guardamos os arquivos antigos.
   *
   * Eles só serão excluídos depois que o novo upload
   * for concluído com sucesso.
   */

  const fotoLocalAntiga =
    requisicaoAtual.fotoLocalUrl;

  const comprovanteAntigo =
    requisicaoAtual.comprovanteResidenciaUrl;

  // NOVA FOTO

  if (arquivos.fotoLocal) {

    const foto = await uploadArquivoSupabase(
      arquivos.fotoLocal,
      "public_box",
      "locais_plantio",
      true
    );

    fotoLocalPath = foto.path;
  }

  //NOVO COMPROVANTE

  if (arquivos.comprovante) {

    const comprovante = await uploadArquivoSupabase(
      arquivos.comprovante,
      "box",
      "documentos-sensiveis",
      false
    );

    comprovanteResidenciaPath =
      comprovante.path;
  }

  const requisicaoAtualizada =
    await prisma.requisicao.update({
      where: { id },

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
        status: StatusRequisicao.SOLICITADO,

        pontoReferencia: dados.pontoReferencia ?? null,

        tipoAtendimento: dados.tipoAtendimento,

        fotoLocalUrl: fotoLocalPath,

        comprovanteResidenciaUrl: comprovanteResidenciaPath,
      },
    });

  await prisma.historicoRequisicao.create({
    data: {
      requisicaoId: requisicaoAtualizada.id,
      usuarioId: usuarioLogado.id,
      statusAnterior: requisicaoAtual.status,
      statusNovo: requisicaoAtualizada.status,
      observacao: "Requisição atualizada com sucesso",
    }
  })

  //Só excluímos se um NOVO arquivo foi enviado.
  if (
    arquivos.fotoLocal &&
    fotoLocalAntiga
  ) {
    await excluirArquivoSupabase(
      "public_box",
      fotoLocalAntiga
    );
  }

  if (
    arquivos.comprovante &&
    comprovanteAntigo
  ) {
    await excluirArquivoSupabase(
      "box",
      comprovanteAntigo
    );
  }

  return requisicaoAtualizada;
}

export const atualizarFotoPlantioService = async (id: string, usuarioLogado: { id: string, role: Role }, arquivos: { fotoPlantio?: ArquivoMulter }) => {
  const requisicao = await prisma.requisicao.findUnique({
    where: { id },
  });

  if (!requisicao) {
    throw new Error("Requisição não encontrada");
  }

  if (usuarioLogado.role === Role.CIDADAO && requisicao.criadoPorId !== usuarioLogado.id) {
    throw new Error("Ação não permitida");
  }

  let fotoPlantioPath = requisicao.fotoPlantioUrl;

  const fotoPlantioAntiga = fotoPlantioPath;

  if (arquivos.fotoPlantio) {
    const foto = await uploadArquivoSupabase(
      arquivos.fotoPlantio,
      "public_box",
      "fotos_plantio",
      true
    );

    fotoPlantioPath = foto.path;
  }

  const requisicaoAtualizada = await prisma.requisicao.update({
    where: { id },
    data: {
      fotoPlantioUrl: fotoPlantioPath,
    },
  });

  //Só excluímos se uma NOVA foto foi enviada.
  if (
    arquivos.fotoPlantio &&
    fotoPlantioAntiga
  ) {
    await excluirArquivoSupabase(
      "public_box",
      fotoPlantioAntiga
    );
  }

  return await adicionarUrlsArquivos(requisicaoAtualizada);
}

async function adicionarUrlsArquivos(requisicao: any) {
  const fotoLocalUrl = requisicao.fotoLocalUrl ? obterUrlPublica("public_box", requisicao.fotoLocalUrl) : null;

  const comprovanteResidenciaUrl = requisicao.comprovanteResidenciaUrl
    ? await obterUrlAssinada("box", requisicao.comprovanteResidenciaUrl, 300)
    : null;

  const fotoPlantioUrl = requisicao.fotoPlantioUrl ? obterUrlPublica("public_box", requisicao.fotoPlantioUrl) : null;

  return {
    ...requisicao,
    fotoLocalUrl,
    comprovanteResidenciaUrl,
    fotoPlantioUrl,
  };
}

export const listarReqService = async (usuarioLogado: { id: string, cidadeId: string | null, role: Role, email: string }, dataInicial: string, datafinal: string) => {

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
    const inicio = new Date(`${dataInicial}T00:00:00.000Z`);
    const fim = new Date(`${datafinal}T23:59:59.999Z`);

    const requisicoes = await prisma.requisicao.findMany({
      where: {
        cidadeId, 
        criadoEm: {
          gte: inicio,
          lte: fim,
        }
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

export const listarReqCidadeService = async (cidadeId: string, usuarioLogado: { id: string, cidadeId: string | null, role: Role, email: string }, dataInicial: string, datafinal: string) => {

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
    const inicio = new Date(`${dataInicial}T00:00:00.000Z`);
    const fim = new Date(`${datafinal}T23:59:59.999Z`);

    const requisicoes = await prisma.requisicao.findMany({
      where: {
        cidadeId: cidadeId,
        criadoEm: {
          gte: inicio,
          lte: fim,
        }
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

export const listarReqUsuarioService = async (usuarioLogado: { id: string }) => {

  if (!usuarioLogado.id) {
    throw new Error("Usuário não autenticado");
  }

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
    historico: {
      select: {
        id: true,
        statusAnterior: true,
        statusNovo: true,
        observacao: true,
        criadoEm: true,
      }
    }
  };

  const requisicoes = await prisma.requisicao.findMany({
    where: {
      criadoPorId: usuarioLogado.id,
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

export const recusarRequisicaoService = async (requisicaoId: string, observacaoStatus: string, usuarioLogado: { id: string, cidadeId: string | null, role: Role }) => {
  if (!usuarioLogado) {
    throw new Error("Usuário não autenticado");
  }

  if (usuarioLogado.role !== Role.GLOBAL && typeof usuarioLogado.cidadeId !== 'string') {
    throw new Error("Ação não permitida");
  }

  //BUSCAR REQUISIÇÃO ATUAL
  const requisicaoAtual = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
  });

  if (!requisicaoAtual) {
    throw new Error("Requisição não encontrada");
  }

  await prisma.requisicao.update({
    where: { id: requisicaoId },
    data: {
      status: StatusRequisicao.RECUSADO,
      observacaoStatus: observacaoStatus
    }
  })

  await prisma.historicoRequisicao.create({
    data: {
      requisicaoId: requisicaoAtual.id,
      usuarioId: usuarioLogado.id,
      statusAnterior: requisicaoAtual.status,
      statusNovo: StatusRequisicao.RECUSADO,
      observacao: "Requisição recusada com sucesso",
    }
  })
}

export const agendarRequisicaoService = async (requisicaoId: string, dataInicial: Date, dataFinal: Date, usuarioLogado: { id: string, cidadeId: string | null, role: Role }) => {
  if (!usuarioLogado) {
    throw new Error("Usuário não autenticado");
  }

  if (usuarioLogado.role !== Role.GLOBAL && typeof usuarioLogado.cidadeId !== 'string') {
    throw new Error("Ação não permitida");
  }

  //BUSCAR REQUISIÇÃO ATUAL
  const requisicaoAtual = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
  });

  if (!requisicaoAtual) {
    throw new Error("Requisição não encontrada");
  }

  await prisma.requisicao.update({
    where: { id: requisicaoId },
    data: {
      status: StatusRequisicao.AGENDADO_PLANTIO,
      dataInicial: dataInicial,
      dataFinal: dataFinal
    }
  })

  await prisma.historicoRequisicao.create({
    data: {
      requisicaoId: requisicaoAtual.id,
      usuarioId: usuarioLogado.id,
      statusAnterior: requisicaoAtual.status,
      statusNovo: StatusRequisicao.AGENDADO_PLANTIO,
      observacao: "Requisição agendada com sucesso",
    }
  })
}

export const alterarRequisicaoService = async (requisicaoId: string, status: StatusRequisicao, usuarioLogado: { id: string, cidadeId: string | null, role: Role }) => {
  if (!usuarioLogado) {
    throw new Error("Usuário não autenticado");
  }

  if (usuarioLogado.role !== Role.GLOBAL && typeof usuarioLogado.cidadeId !== 'string') {
    throw new Error("Ação não permitida");
  }

  //BUSCAR REQUISIÇÃO ATUAL
  const requisicaoAtual = await prisma.requisicao.findUnique({
    where: { id: requisicaoId },
  });

  if (!requisicaoAtual) {
    throw new Error("Requisição não encontrada");
  }

  await prisma.requisicao.update({
    where: { id: requisicaoId },
    data: {
      status
    }
  })

  await prisma.historicoRequisicao.create({
    data: {
      requisicaoId: requisicaoAtual.id,
      usuarioId: usuarioLogado.id,
      statusAnterior: requisicaoAtual.status,
      statusNovo: status,
      observacao: "Requisição atualizada com sucesso",
    }
  })
}