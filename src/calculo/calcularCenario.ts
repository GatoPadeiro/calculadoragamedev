import { PAIS_POR_CODIGO } from '../dados/paises';
import { ENGINES } from '../dados/engines';
import { LOJAS, type IdLoja } from '../dados/lojas';
import { FGTS, PRESUMIDO, REMUNERACAO_CLT, RETENCAO_DOS_EUA, SIMPLES } from '../dados/tabelasTributarias';
import { dividirLucro, type ResultadoDaDivisao } from './divisaoDoLucro';
import { calcularPresumido, calcularRendaDoSocio, calcularRendaTodaComoProLabore, calcularSimples, type RendaDoSocio } from './impostosDoBrasil';
import { calcularTaxaDaLoja } from './taxasDasLojas';
import type { AnexoDoSimples, Cenario, Estudio, LinhaDeVenda, Regime, Socio, TipoDeSocio } from './tipos';

const MESES_NO_ANO = 12;

export interface ResultadoDaLinha {
  id: string;
  pais: string;
  loja: IdLoja;
  moeda: string;
  copias: number;
  brutoNaMoeda: number;
  brutoEmReais: number;
  brutoEmDolar: number;
  impostoConsumoEmDolar: number;
  reembolsosEmDolar: number;
  liquidoEmDolar: number;
  taxaDaLojaEmDolar: number;
  repasseEmDolar: number;
  retencaoDosEuaEmDolar: number;
  royaltyEmDolar: number;
  repasseEmReais: number;
}

export interface TotalDaLoja {
  loja: IdLoja;
  liquidoEmDolar: number;
  taxaEmDolar: number;
  taxaEfetiva: number;
}

export interface Totais {
  copias: number;
  brutoEmReais: number;
  brutoEmDolar: number;
  impostoConsumoEmDolar: number;
  reembolsosEmDolar: number;
  liquidoEmDolar: number;
  taxaDasLojasEmDolar: number;
  repasseEmDolar: number;
}

export type Alerta =
  | { codigo: 'acima-do-limite-do-simples'; faturamento: number }
  | { codigo: 'saiu-do-simples'; faturamento: number }
  | { codigo: 'iss-fora-da-guia' }
  | { codigo: 'anexo-v'; fatorR: number; folhaNecessaria: number }
  | { codigo: 'pro-labore-zero'; idsDosSocios: string[] }
  | { codigo: 'prejuizo'; deficit: number }
  | { codigo: 'divisao-invalida'; idGrupo: string; nomeDoGrupo: string; soma: number }
  | { codigo: 'cotacao-ausente'; moeda: string };

export interface ComparacaoComTudoComoProLabore {
  brutoAnual: number;
  liquidoAnual: number;
  inssPatronalNaComparacao: number;
  inssPatronalAtual: number;
}

export interface ResultadoDoSocio {
  idSocio: string;
  nome: string;
  tipo: TipoDeSocio;
  fatia: number;
  dividendos: number;
  renda?: RendaDoSocio;
  liquidoAnual: number;
  comparacao?: ComparacaoComTudoComoProLabore;
}

export interface ResultadoDaEmpresa {
  faturamento: number;
  regime: Regime;
  anexo: AnexoDoSimples;
  faixaDoSimples?: number;
  fatorR: number;
  impostoDaEmpresa: number;
  contribuicaoPatronalNoPresumido: number;
  folhaAnual: number;
  proLaboreAnual: number;
  salariosAnuais: number;
  fgts: number;
  custoComSalarios: number;
  outrosCustos: number;
  retencaoDosEua: number;
  royalty: number;
  royaltyEmDolar: number;
  irrfDaRemessa: number;
  iofDaRemessa: number;
  lucro: number;
  lucroDistribuivel: number;
}

export interface ResultadoDoCenario {
  linhas: ResultadoDaLinha[];
  lojas: TotalDaLoja[];
  totais: Totais;
  empresa: ResultadoDaEmpresa;
  divisao: ResultadoDaDivisao;
  socios: ResultadoDoSocio[];
  alertas: Alerta[];
}

export type ResultadoDaEmpresaSemSocios = Omit<ResultadoDoCenario, 'divisao' | 'socios'>;

function cotacaoEmReais(cenario: Cenario, moeda: string): number | undefined {
  if (moeda === 'BRL') return 1;
  const cotacao = cenario.cotacoes[moeda];
  return cotacao && cotacao > 0 ? cotacao : undefined;
}

interface VendaLiquida {
  linha: LinhaDeVenda;
  brutoNaMoeda: number;
  brutoEmReais: number;
  brutoEmDolar: number;
  impostoConsumoEmDolar: number;
  reembolsosEmDolar: number;
  liquidoEmDolar: number;
}

function calcularVendaLiquida(cenario: Cenario, linha: LinhaDeVenda, cotacaoDoDolar: number): VendaLiquida {
  const brutoNaMoeda = linha.precoPorCopia * linha.copias;
  const brutoEmReais = brutoNaMoeda * (cotacaoEmReais(cenario, linha.moeda) ?? 0);
  const brutoEmDolar = cotacaoDoDolar ? brutoEmReais / cotacaoDoDolar : 0;
  const impostoConsumoEmDolar = brutoEmDolar * (linha.impostoConsumoNoPreco / (1 + linha.impostoConsumoNoPreco));
  const reembolsosEmDolar = (brutoEmDolar - impostoConsumoEmDolar) * linha.taxaDeReembolso;
  const liquidoEmDolar = brutoEmDolar - impostoConsumoEmDolar - reembolsosEmDolar;
  return { linha, brutoNaMoeda, brutoEmReais, brutoEmDolar, impostoConsumoEmDolar, reembolsosEmDolar, liquidoEmDolar };
}

function listarMoedasSemCotacao(cenario: Cenario): string[] {
  const moedas = new Set(['USD', ...cenario.vendas.map((linha) => linha.moeda)]);
  return [...moedas].filter((moeda) => cotacaoEmReais(cenario, moeda) === undefined);
}

function somarLiquidoPorLoja(vendas: VendaLiquida[]): Map<IdLoja, number> {
  const liquidoPorLoja = new Map<IdLoja, number>();
  for (const venda of vendas) {
    liquidoPorLoja.set(venda.linha.loja, (liquidoPorLoja.get(venda.linha.loja) ?? 0) + venda.liquidoEmDolar);
  }
  return liquidoPorLoja;
}

function calcularTaxaDaLojaNaLinha(venda: VendaLiquida, liquidoDaLojaEmDolar: number, estudio: Estudio): number {
  if (liquidoDaLojaEmDolar <= 0) return 0;
  const { loja, pais } = venda.linha;
  const taxaNasFaixasDoMercado = calcularTaxaDaLoja(loja, liquidoDaLojaEmDolar, estudio.appStorePequenoDesenvolvedor, pais);
  return taxaNasFaixasDoMercado * (venda.liquidoEmDolar / liquidoDaLojaEmDolar);
}

function totalizarPorLoja(linhas: ResultadoDaLinha[]): TotalDaLoja[] {
  const totais = new Map<IdLoja, { liquidoEmDolar: number; taxaEmDolar: number }>();
  for (const linha of linhas) {
    const total = totais.get(linha.loja) ?? { liquidoEmDolar: 0, taxaEmDolar: 0 };
    total.liquidoEmDolar += linha.liquidoEmDolar;
    total.taxaEmDolar += linha.taxaDaLojaEmDolar;
    totais.set(linha.loja, total);
  }
  return [...totais].map(([loja, { liquidoEmDolar, taxaEmDolar }]) => ({
    loja,
    liquidoEmDolar,
    taxaEmDolar,
    taxaEfetiva: liquidoEmDolar > 0 ? taxaEmDolar / liquidoEmDolar : 0,
  }));
}

function aliquotaDeRoyalty(estudio: Estudio): number {
  const engine = ENGINES[estudio.engine];
  if (estudio.lancadoTambemNaEpic && engine.royaltyNoLancamentoNaEpic !== undefined) return engine.royaltyNoLancamentoNaEpic;
  return engine.royalty;
}

function vendaPagaRoyalty(venda: VendaLiquida): boolean {
  return !LOJAS[venda.linha.loja].isentaDeRoyaltyDaUnreal;
}

function calcularRoyaltyEmDolar(vendas: VendaLiquida[], estudio: Estudio): { royaltyEmDolar: number; baseEmDolar: number } {
  const baseEmDolar = vendas.filter(vendaPagaRoyalty).reduce((soma, venda) => soma + venda.liquidoEmDolar, 0);
  const isencao = ENGINES[estudio.engine].isencaoEmDolar;
  return { royaltyEmDolar: Math.max(0, baseEmDolar - isencao) * aliquotaDeRoyalty(estudio), baseEmDolar };
}

function sofreRetencaoDosEua(estudio: Estudio, pais: string): boolean {
  return estudio.aplicarRetencaoDosEua && PAIS_POR_CODIGO[pais]?.sofreRetencaoDosEua === true;
}

function montarResultadoDaLinha(
  venda: VendaLiquida,
  liquidoPorLoja: Map<IdLoja, number>,
  royalty: { royaltyEmDolar: number; baseEmDolar: number },
  estudio: Estudio,
  cotacaoDoDolar: number,
): ResultadoDaLinha {
  const taxaDaLojaEmDolar = calcularTaxaDaLojaNaLinha(venda, liquidoPorLoja.get(venda.linha.loja) ?? 0, estudio);
  const repasseEmDolar = venda.liquidoEmDolar - taxaDaLojaEmDolar;
  const participacaoNoRoyalty = vendaPagaRoyalty(venda) && royalty.baseEmDolar > 0 ? venda.liquidoEmDolar / royalty.baseEmDolar : 0;
  return {
    id: venda.linha.id,
    pais: venda.linha.pais,
    loja: venda.linha.loja,
    moeda: venda.linha.moeda,
    copias: venda.linha.copias,
    brutoNaMoeda: venda.brutoNaMoeda,
    brutoEmReais: venda.brutoEmReais,
    brutoEmDolar: venda.brutoEmDolar,
    impostoConsumoEmDolar: venda.impostoConsumoEmDolar,
    reembolsosEmDolar: venda.reembolsosEmDolar,
    liquidoEmDolar: venda.liquidoEmDolar,
    taxaDaLojaEmDolar,
    repasseEmDolar,
    retencaoDosEuaEmDolar: sofreRetencaoDosEua(estudio, venda.linha.pais) ? repasseEmDolar * RETENCAO_DOS_EUA.aliquota : 0,
    royaltyEmDolar: royalty.royaltyEmDolar * participacaoNoRoyalty,
    repasseEmReais: repasseEmDolar * cotacaoDoDolar,
  };
}

function somarTotais(linhas: ResultadoDaLinha[]): Totais {
  const somar = (campo: (linha: ResultadoDaLinha) => number) => linhas.reduce((soma, linha) => soma + campo(linha), 0);
  return {
    copias: somar((linha) => linha.copias),
    brutoEmReais: somar((linha) => linha.brutoEmReais),
    brutoEmDolar: somar((linha) => linha.brutoEmDolar),
    impostoConsumoEmDolar: somar((linha) => linha.impostoConsumoEmDolar),
    reembolsosEmDolar: somar((linha) => linha.reembolsosEmDolar),
    liquidoEmDolar: somar((linha) => linha.liquidoEmDolar),
    taxaDasLojasEmDolar: somar((linha) => linha.taxaDaLojaEmDolar),
    repasseEmDolar: somar((linha) => linha.repasseEmDolar),
  };
}

function calcularRemessa(royalty: number, estudio: Estudio): { irrf: number; iof: number } {
  const { irrf, iof, empresaPagaIrrfPorFora } = estudio.remessa;
  if (empresaPagaIrrfPorFora) return { irrf: (royalty * irrf) / (1 - irrf), iof: royalty * iof };
  return { irrf: 0, iof: royalty * (1 - irrf) * iof };
}

function escolherRegime(estudio: Estudio, faturamento: number): Regime {
  if (estudio.regime !== 'automatico') return estudio.regime;
  return faturamento > SIMPLES.limiteAnual ? 'presumido' : 'simples';
}

function somarProLaboreMensal(socios: Socio[]): number {
  return socios.filter((socio) => socio.tipo === 'pessoaFisica').reduce((soma, socio) => soma + Math.max(0, socio.proLaboreMensal), 0);
}

interface CalculoDoImposto {
  impostoDaEmpresa: number;
  faixaDoSimples?: number;
  contribuicaoPatronalNoPresumido: number;
}

function calcularImpostoDaEmpresa(regime: Regime, anexo: AnexoDoSimples, faturamento: number, estudio: Estudio, proLaboreMensal: number, salariosMensais: number): CalculoDoImposto {
  if (regime === 'simples') {
    const simples = calcularSimples(faturamento, anexo, estudio.vendaContaComoExportacao, estudio.iss);
    return { impostoDaEmpresa: simples.imposto, faixaDoSimples: simples.faixa, contribuicaoPatronalNoPresumido: 0 };
  }
  const contribuicaoPatronal =
    proLaboreMensal * MESES_NO_ANO * PRESUMIDO.contribuicaoPatronalSobreProLabore + salariosMensais * REMUNERACAO_CLT.remuneracoesPorAno * PRESUMIDO.encargosSobreSalarios;
  return { impostoDaEmpresa: calcularPresumido(faturamento, estudio.vendaContaComoExportacao, estudio.iss).imposto, contribuicaoPatronalNoPresumido: contribuicaoPatronal };
}

function calcularResultadoDaEmpresa(cenario: Cenario, totais: Totais, linhas: ResultadoDaLinha[], royaltyEmDolar: number, cotacaoDoDolar: number): ResultadoDaEmpresa {
  const { estudio, custos } = cenario;
  const faturamento = totais.repasseEmDolar * cotacaoDoDolar;
  const retencaoDosEua = linhas.reduce((soma, linha) => soma + linha.retencaoDosEuaEmDolar, 0) * cotacaoDoDolar;
  const royalty = royaltyEmDolar * cotacaoDoDolar;
  const remessa = calcularRemessa(royalty, estudio);

  const proLaboreMensal = somarProLaboreMensal(cenario.socios);
  const salariosMensais = Math.max(0, custos.salariosMensais);
  const proLaboreAnual = proLaboreMensal * MESES_NO_ANO;
  const salariosAnuais = salariosMensais * REMUNERACAO_CLT.remuneracoesPorAno;
  const fgts = salariosAnuais * FGTS.aliquota;
  const folhaAnual = proLaboreAnual + salariosAnuais + fgts;
  const fatorR = faturamento ? folhaAnual / faturamento : 0;
  const anexo: AnexoDoSimples = fatorR >= SIMPLES.fatorRMinimoParaAnexoIII ? 'III' : 'V';
  const regime = escolherRegime(estudio, faturamento);
  const imposto = calcularImpostoDaEmpresa(regime, anexo, faturamento, estudio, proLaboreMensal, salariosMensais);

  const custoComSalarios = salariosAnuais + fgts + imposto.contribuicaoPatronalNoPresumido;
  const outrosCustos = Math.max(0, custos.outrosCustosAnuais);
  const lucro = faturamento - retencaoDosEua - royalty - remessa.irrf - remessa.iof - imposto.impostoDaEmpresa - proLaboreAnual - custoComSalarios - outrosCustos;

  return {
    faturamento,
    regime,
    anexo,
    faixaDoSimples: imposto.faixaDoSimples,
    fatorR,
    impostoDaEmpresa: imposto.impostoDaEmpresa,
    contribuicaoPatronalNoPresumido: imposto.contribuicaoPatronalNoPresumido,
    folhaAnual,
    proLaboreAnual,
    salariosAnuais,
    fgts,
    custoComSalarios,
    outrosCustos,
    retencaoDosEua,
    royalty,
    royaltyEmDolar,
    irrfDaRemessa: remessa.irrf,
    iofDaRemessa: remessa.iof,
    lucro,
    lucroDistribuivel: Math.max(0, lucro),
  };
}

function listarAlertasDaEmpresa(empresa: ResultadoDaEmpresa, estudio: Estudio): Alerta[] {
  const alertas: Alerta[] = [];
  const { faturamento, regime, anexo, fatorR, lucro } = empresa;
  const passouDoLimite = faturamento > SIMPLES.limiteAnual;
  if (passouDoLimite && regime === 'simples') alertas.push({ codigo: 'acima-do-limite-do-simples', faturamento });
  if (passouDoLimite && estudio.regime === 'automatico') alertas.push({ codigo: 'saiu-do-simples', faturamento });
  if (regime === 'simples' && faturamento > SIMPLES.sublimiteDoIss && !passouDoLimite) alertas.push({ codigo: 'iss-fora-da-guia' });
  if (regime === 'simples' && anexo === 'V') alertas.push({ codigo: 'anexo-v', fatorR, folhaNecessaria: faturamento * SIMPLES.fatorRMinimoParaAnexoIII });
  if (lucro < 0) alertas.push({ codigo: 'prejuizo', deficit: -lucro });
  return alertas;
}

export function calcularEmpresa(cenario: Cenario): ResultadoDaEmpresaSemSocios {
  const cotacaoDoDolar = cotacaoEmReais(cenario, 'USD') ?? 0;
  const vendas = cenario.vendas.map((linha) => calcularVendaLiquida(cenario, linha, cotacaoDoDolar));
  const liquidoPorLoja = somarLiquidoPorLoja(vendas);
  const royalty = calcularRoyaltyEmDolar(vendas, cenario.estudio);
  const linhas = vendas.map((venda) => montarResultadoDaLinha(venda, liquidoPorLoja, royalty, cenario.estudio, cotacaoDoDolar));
  const lojas = totalizarPorLoja(linhas);
  const totais = somarTotais(linhas);
  const empresa = calcularResultadoDaEmpresa(cenario, totais, linhas, royalty.royaltyEmDolar, cotacaoDoDolar);
  const alertasDeCotacao: Alerta[] = listarMoedasSemCotacao(cenario).map((moeda) => ({ codigo: 'cotacao-ausente', moeda }));
  return { linhas, lojas, totais, empresa, alertas: [...alertasDeCotacao, ...listarAlertasDaEmpresa(empresa, cenario.estudio)] };
}

function zerarProLabore(cenario: Cenario): Cenario {
  return { ...cenario, socios: cenario.socios.map((socio) => (socio.tipo === 'pessoaFisica' ? { ...socio, proLaboreMensal: 0 } : socio)) };
}

function inssPatronalSobre(proLaboreAnual: number, regime: Regime): number {
  return regime === 'presumido' ? proLaboreAnual * PRESUMIDO.contribuicaoPatronalSobreProLabore : 0;
}

function calcularResultadoDoSocio(socio: Socio, divisao: ResultadoDaDivisao, empresa: ResultadoDaEmpresa, empresaSemProLabore: ResultadoDaEmpresa): ResultadoDoSocio {
  const fatia = divisao.fatiaPorSocio[socio.id] ?? 0;
  const dividendos = empresa.lucroDistribuivel * fatia;
  const base = { idSocio: socio.id, nome: socio.nome, tipo: socio.tipo, fatia, dividendos };
  if (socio.tipo === 'empresa') return { ...base, liquidoAnual: dividendos };

  const proLaboreMensal = Math.max(0, socio.proLaboreMensal);
  const renda = calcularRendaDoSocio(proLaboreMensal, dividendos);
  const brutoTodoComoProLabore = empresaSemProLabore.lucroDistribuivel * fatia;
  return {
    ...base,
    renda,
    liquidoAnual: renda.liquidoAnual,
    comparacao: {
      brutoAnual: brutoTodoComoProLabore,
      liquidoAnual: calcularRendaTodaComoProLabore(brutoTodoComoProLabore).liquidoAnual,
      inssPatronalNaComparacao: inssPatronalSobre(brutoTodoComoProLabore, empresaSemProLabore.regime),
      inssPatronalAtual: inssPatronalSobre(proLaboreMensal * MESES_NO_ANO, empresa.regime),
    },
  };
}

function alertarProLaboreZero(cenario: Cenario, divisao: ResultadoDaDivisao, lucro: number): Alerta[] {
  const sociosSemProLabore = cenario.socios.filter(
    (socio) => socio.tipo === 'pessoaFisica' && socio.proLaboreMensal <= 0 && (divisao.fatiaPorSocio[socio.id] ?? 0) > 0,
  );
  if (lucro <= 0 || !sociosSemProLabore.length) return [];
  return [{ codigo: 'pro-labore-zero', idsDosSocios: sociosSemProLabore.map((socio) => socio.id) }];
}

export function calcularCenario(cenario: Cenario): ResultadoDoCenario {
  const resultado = calcularEmpresa(cenario);
  const divisao = dividirLucro(cenario.divisao, resultado.empresa.lucroDistribuivel);
  const empresaSemProLabore = calcularEmpresa(zerarProLabore(cenario)).empresa;
  const socios = cenario.socios.map((socio) => calcularResultadoDoSocio(socio, divisao, resultado.empresa, empresaSemProLabore));
  const alertasDeDivisao: Alerta[] = divisao.gruposComSomaInvalida.map((grupo) => ({ codigo: 'divisao-invalida', ...grupo }));
  return {
    ...resultado,
    divisao,
    socios,
    alertas: [...resultado.alertas, ...alertasDeDivisao, ...alertarProLaboreZero(cenario, divisao, resultado.empresa.lucro)],
  };
}
