import { DIVIDENDOS, INSS_DO_SOCIO, IRPF, PRESUMIDO, SIMPLES, type FaixaDoSimples } from '../dados/tabelasTributarias';
import type { AnexoDoSimples } from './tipos';

const MESES_NO_ANO = 12;

export interface ResultadoDoSimples {
  imposto: number;
  faixa: number;
  aliquotaEfetiva: number;
}

function encontrarFaixa(tabela: readonly FaixaDoSimples[], faturamentoAnual: number): number {
  const indice = tabela.findIndex((faixa) => faturamentoAnual <= faixa.limiteAnual);
  return indice < 0 ? tabela.length - 1 : indice;
}

function calcularAliquotaEfetiva(faixa: FaixaDoSimples, faturamentoAnual: number, vendaContaComoExportacao: boolean): number {
  if (faturamentoAnual <= 0) return 0;
  const aliquota = Math.max(0, (faturamentoAnual * faixa.aliquotaNominal - faixa.parcelaADeduzir) / faturamentoAnual);
  if (!vendaContaComoExportacao) return aliquota;
  const { cofins, pis, iss } = faixa.reparticaoPercentual;
  return aliquota * (1 - (cofins + pis + iss) / 100);
}

export function calcularSimples(faturamentoAnual: number, anexo: AnexoDoSimples, vendaContaComoExportacao: boolean, iss: number): ResultadoDoSimples {
  const tabela = anexo === 'III' ? SIMPLES.anexoIII : SIMPLES.anexoV;
  const indiceDaFaixa = encontrarFaixa(tabela, faturamentoAnual);
  const aliquotaEfetiva = calcularAliquotaEfetiva(tabela[indiceDaFaixa]!, faturamentoAnual, vendaContaComoExportacao);
  const estaNaUltimaFaixa = indiceDaFaixa === tabela.length - 1;
  const issPagoPorFora = estaNaUltimaFaixa && !vendaContaComoExportacao ? faturamentoAnual * iss : 0;
  return { imposto: faturamentoAnual * aliquotaEfetiva + issPagoPorFora, faixa: indiceDaFaixa + 1, aliquotaEfetiva };
}

export interface ResultadoDoPresumido {
  imposto: number;
  irpj: number;
  csll: number;
  pisECofins: number;
  iss: number;
}

export function calcularBasePresumida(faturamentoAnual: number): number {
  const receitaSemAcrescimo = Math.min(faturamentoAnual, PRESUMIDO.receitaAnualSemAcrescimoNaPresuncao);
  const receitaComAcrescimo = Math.max(0, faturamentoAnual - PRESUMIDO.receitaAnualSemAcrescimoNaPresuncao);
  const percentualComAcrescimo = PRESUMIDO.percentualDePresuncao * PRESUMIDO.fatorDeAcrescimoNaPresuncao;
  return receitaSemAcrescimo * PRESUMIDO.percentualDePresuncao + receitaComAcrescimo * percentualComAcrescimo;
}

export function calcularPresumido(faturamentoAnual: number, vendaContaComoExportacao: boolean, aliquotaIss: number): ResultadoDoPresumido {
  const basePresumida = calcularBasePresumida(faturamentoAnual);
  const adicionalDeIrpj = Math.max(0, basePresumida - PRESUMIDO.baseAnualSemAdicional) * PRESUMIDO.aliquotaAdicionalIrpj;
  const irpj = basePresumida * PRESUMIDO.aliquotaIrpj + adicionalDeIrpj;
  const csll = basePresumida * PRESUMIDO.aliquotaCsll;
  const pisECofins = vendaContaComoExportacao ? 0 : faturamentoAnual * (PRESUMIDO.aliquotaPis + PRESUMIDO.aliquotaCofins);
  const iss = vendaContaComoExportacao ? 0 : faturamentoAnual * aliquotaIss;
  return { imposto: irpj + csll + pisECofins + iss, irpj, csll, pisECofins, iss };
}

export function calcularInssDoSocio(proLaboreMensal: number): number {
  return Math.min(Math.max(0, proLaboreMensal), INSS_DO_SOCIO.tetoMensal) * INSS_DO_SOCIO.aliquota;
}

function calcularReducaoDoIrpf(rendimentoMensal: number): number {
  return Math.max(0, IRPF.reducaoValorBase - IRPF.reducaoFator * rendimentoMensal);
}

export function calcularIrpfMensal(rendimentoMensal: number, inssMensal: number): number {
  if (rendimentoMensal <= IRPF.rendaIsentaAte) return 0;
  const deducaoMaisVantajosa = Math.max(inssMensal, IRPF.descontoSimplificadoMensal);
  const base = rendimentoMensal - deducaoMaisVantajosa;
  const faixa = IRPF.tabelaMensal.find((linha) => base <= linha.baseAte)!;
  const impostoPelaTabela = Math.max(0, base * faixa.aliquota - faixa.parcelaADeduzir);
  if (rendimentoMensal > IRPF.reducaoAte) return impostoPelaTabela;
  return Math.max(0, impostoPelaTabela - calcularReducaoDoIrpf(rendimentoMensal));
}

export function calcularAliquotaMinima(rendaAnual: number): number {
  const inicio = DIVIDENDOS.impostoMinimoAPartirDeAnual;
  const cheio = DIVIDENDOS.impostoMinimoCheioEmAnual;
  if (rendaAnual <= inicio) return 0;
  if (rendaAnual >= cheio) return DIVIDENDOS.aliquotaMinimaCheia;
  return ((rendaAnual - inicio) / (cheio - inicio)) * DIVIDENDOS.aliquotaMinimaCheia;
}

function calcularRetencaoDeDividendos(dividendosAnuais: number): number {
  const mediaMensal = dividendosAnuais / MESES_NO_ANO;
  return mediaMensal > DIVIDENDOS.retencaoAcimaDeMensal ? dividendosAnuais * DIVIDENDOS.aliquotaDeRetencao : 0;
}

export interface RendaDoSocio {
  proLaboreBruto: number;
  inss: number;
  irpf: number;
  proLaboreLiquido: number;
  dividendos: number;
  retencaoDeDividendos: number;
  rendaAnual: number;
  aliquotaMinima: number;
  complementoDoImpostoMinimo: number;
  creditoNaDeclaracao: number;
  liquidoAnual: number;
}

export function calcularRendaDoSocio(proLaboreMensal: number, dividendosAnuais: number): RendaDoSocio {
  const inssMensal = calcularInssDoSocio(proLaboreMensal);
  const irpfMensal = calcularIrpfMensal(proLaboreMensal, inssMensal);
  const proLaboreLiquido = (proLaboreMensal - inssMensal - irpfMensal) * MESES_NO_ANO;
  const retencaoDeDividendos = calcularRetencaoDeDividendos(dividendosAnuais);
  const rendaAnual = proLaboreMensal * MESES_NO_ANO + dividendosAnuais;
  const aliquotaMinima = calcularAliquotaMinima(rendaAnual);
  const impostoJaPago = irpfMensal * MESES_NO_ANO + retencaoDeDividendos;
  const diferencaParaOMinimo = aliquotaMinima * rendaAnual - impostoJaPago;
  const complementoDoImpostoMinimo = Math.max(0, diferencaParaOMinimo);
  return {
    proLaboreBruto: proLaboreMensal * MESES_NO_ANO,
    inss: inssMensal * MESES_NO_ANO,
    irpf: irpfMensal * MESES_NO_ANO,
    proLaboreLiquido,
    dividendos: dividendosAnuais,
    retencaoDeDividendos,
    rendaAnual,
    aliquotaMinima,
    complementoDoImpostoMinimo,
    creditoNaDeclaracao: Math.max(0, Math.min(retencaoDeDividendos, -diferencaParaOMinimo)),
    liquidoAnual: proLaboreLiquido + dividendosAnuais - retencaoDeDividendos - complementoDoImpostoMinimo,
  };
}

export interface RendaTodaComoProLabore {
  inss: number;
  irpf: number;
  complementoDoImpostoMinimo: number;
  liquidoAnual: number;
}

export function calcularRendaTodaComoProLabore(brutoAnual: number): RendaTodaComoProLabore {
  const proLaboreMensal = brutoAnual / MESES_NO_ANO;
  const inssMensal = calcularInssDoSocio(proLaboreMensal);
  const irpfMensal = calcularIrpfMensal(proLaboreMensal, inssMensal);
  const complementoDoImpostoMinimo = Math.max(0, calcularAliquotaMinima(brutoAnual) * brutoAnual - irpfMensal * MESES_NO_ANO);
  return {
    inss: inssMensal * MESES_NO_ANO,
    irpf: irpfMensal * MESES_NO_ANO,
    complementoDoImpostoMinimo,
    liquidoAnual: brutoAnual - (inssMensal + irpfMensal) * MESES_NO_ANO - complementoDoImpostoMinimo,
  };
}
