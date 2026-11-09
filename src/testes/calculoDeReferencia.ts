const TETO_DO_INSS = 8475.55;
const DESCONTO_SIMPLIFICADO_DO_IRPF = 607.2;
const REMUNERACOES_CLT_POR_ANO = 12 + 1 + 1 / 3;
const RECEITA_SEM_ACRESCIMO_NA_PRESUNCAO = 5e6;

type FaixaDeReferencia = [limite: number, aliquota: number, deducao: number, reparticao: number[]];

const ANEXO_III: FaixaDeReferencia[] = [
  [180e3, 0.06, 0, [4, 3.5, 12.82, 2.78, 43.4, 33.5]],
  [360e3, 0.112, 9360, [4, 3.5, 14.05, 3.05, 43.4, 32]],
  [720e3, 0.135, 17640, [4, 3.5, 13.64, 2.96, 43.4, 32.5]],
  [1.8e6, 0.16, 35640, [4, 3.5, 13.64, 2.96, 43.4, 32.5]],
  [3.6e6, 0.21, 125640, [4, 3.5, 12.82, 2.78, 43.4, 33.5]],
  [4.8e6, 0.33, 648e3, [35, 15, 16.03, 3.47, 30.5, 0]],
];

const ANEXO_V: FaixaDeReferencia[] = [
  [180e3, 0.155, 0, [25, 15, 14.1, 3.05, 28.85, 14]],
  [360e3, 0.18, 4500, [23, 15, 14.1, 3.05, 27.85, 17]],
  [720e3, 0.195, 9900, [24, 15, 14.92, 3.23, 23.85, 19]],
  [1.8e6, 0.205, 17100, [21, 15, 15.74, 3.41, 23.85, 21]],
  [3.6e6, 0.23, 62100, [23, 12.5, 14.1, 3.05, 23.85, 23.5]],
  [4.8e6, 0.305, 540e3, [35, 15.5, 16.44, 3.56, 29.5, 0]],
];

export const FATIA_DE_CADA_SOCIO = 0.07 + 0.79 * 0.7 * 0.3;

export interface EntradaDeReferencia {
  vendaBrutaEmDolar: number;
  fracaoDeIva: number;
  fracaoDeReembolso: number;
  cotacaoDoDolar: number;
  taxaDaSteam: number;
  royaltyDaUnreal: number;
  fracaoDasVendasNosEua: number;
  aplicarRetencaoDosEua: boolean;
  irrf: number;
  iof: number;
  empresaPagaIrrfPorFora: boolean;
  regime: 'automatico' | 'simples' | 'presumido';
  proLaboreMensal: number;
  salariosMensais: number;
  outrosCustos: number;
  iss: number;
  vendaContaComoExportacao: boolean;
}

export const ENTRADA_PADRAO_DE_REFERENCIA: EntradaDeReferencia = {
  vendaBrutaEmDolar: 2_000_000,
  fracaoDeIva: 0.1,
  fracaoDeReembolso: 0.05,
  cotacaoDoDolar: 5.4,
  taxaDaSteam: 0.3,
  royaltyDaUnreal: 0.05,
  fracaoDasVendasNosEua: 0.35,
  aplicarRetencaoDosEua: true,
  irrf: 0.15,
  iof: 0.0038,
  empresaPagaIrrfPorFora: true,
  regime: 'automatico',
  proLaboreMensal: 5000,
  salariosMensais: 0,
  outrosCustos: 0,
  iss: 0.05,
  vendaContaComoExportacao: false,
};

function simplesDeReferencia(faturamento: number, tabela: FaixaDeReferencia[], exportacao: boolean, iss: number) {
  let indice = tabela.findIndex((faixa) => faturamento <= faixa[0]);
  if (indice < 0) indice = 5;
  const [, aliquota, deducao, reparticao] = tabela[indice]!;
  let efetiva = faturamento > 0 ? Math.max(0, (faturamento * aliquota - deducao) / faturamento) : 0;
  if (exportacao) efetiva *= 1 - (reparticao[2]! + reparticao[3]! + reparticao[5]!) / 100;
  return faturamento * efetiva + (indice === 5 && !exportacao ? faturamento * iss : 0);
}

function presumidoDeReferencia(faturamento: number, exportacao: boolean, iss: number) {
  const base = Math.min(faturamento, RECEITA_SEM_ACRESCIMO_NA_PRESUNCAO) * 0.32 + Math.max(0, faturamento - RECEITA_SEM_ACRESCIMO_NA_PRESUNCAO) * 0.352;
  return base * 0.15 + Math.max(0, base - 240e3) * 0.1 + base * 0.09 + (exportacao ? 0 : faturamento * (0.0065 + 0.03 + iss));
}

export function irpfDeReferencia(rendimento: number, inss: number) {
  const base = rendimento - Math.max(inss, DESCONTO_SIMPLIFICADO_DO_IRPF);
  let imposto =
    base <= 2428.8 ? 0 : base <= 2826.65 ? base * 0.075 - 182.16 : base <= 3751.05 ? base * 0.15 - 394.16 : base <= 4664.68 ? base * 0.225 - 675.49 : base * 0.275 - 908.73;
  imposto = Math.max(0, imposto);
  if (rendimento <= 5000) return 0;
  if (rendimento <= 7350) return Math.max(0, imposto - Math.max(0, 978.62 - 0.133145 * rendimento));
  return imposto;
}

const aliquotaMinimaDeReferencia = (renda: number) => (renda <= 6e5 ? 0 : renda >= 1.2e6 ? 0.1 : (renda / 6e4 - 10) / 100);

export function calcularEmpresaDeReferencia(entrada: EntradaDeReferencia, proLaboreMensal: number) {
  const iva = entrada.vendaBrutaEmDolar * entrada.fracaoDeIva;
  const reembolsos = (entrada.vendaBrutaEmDolar - iva) * entrada.fracaoDeReembolso;
  const liquido = entrada.vendaBrutaEmDolar - iva - reembolsos;
  const taxaDaSteam = liquido * entrada.taxaDaSteam;
  const repasseEmDolar = liquido - taxaDaSteam;
  const faturamento = repasseEmDolar * entrada.cotacaoDoDolar;
  const retencaoDosEua = entrada.aplicarRetencaoDosEua ? repasseEmDolar * entrada.fracaoDasVendasNosEua * 0.3 * entrada.cotacaoDoDolar : 0;
  const royaltyEmDolar = Math.max(0, liquido - 1e6) * entrada.royaltyDaUnreal;
  const royalty = royaltyEmDolar * entrada.cotacaoDoDolar;
  const irrf = entrada.empresaPagaIrrfPorFora ? (royalty * entrada.irrf) / (1 - entrada.irrf) : 0;
  const iof = (entrada.empresaPagaIrrfPorFora ? royalty : royalty * (1 - entrada.irrf)) * entrada.iof;
  const salariosAnuais = entrada.salariosMensais * REMUNERACOES_CLT_POR_ANO;
  const fgts = salariosAnuais * 0.08;
  const folha = proLaboreMensal * 3 * 12 + salariosAnuais + fgts;
  const fatorR = faturamento ? folha / faturamento : 0;
  const anexo = fatorR >= 0.28 ? 'III' : 'V';
  const regime = entrada.regime === 'automatico' ? (faturamento > 4.8e6 ? 'presumido' : 'simples') : entrada.regime;
  let imposto: number;
  let contribuicaoPatronal = 0;
  if (regime === 'simples') {
    imposto = simplesDeReferencia(faturamento, anexo === 'III' ? ANEXO_III : ANEXO_V, entrada.vendaContaComoExportacao, entrada.iss);
  } else {
    imposto = presumidoDeReferencia(faturamento, entrada.vendaContaComoExportacao, entrada.iss);
    contribuicaoPatronal = proLaboreMensal * 36 * 0.2 + salariosAnuais * 0.278;
  }
  const proLaboreAnual = proLaboreMensal * 36;
  const custoComSalarios = salariosAnuais + fgts + contribuicaoPatronal;
  const lucro = faturamento - retencaoDosEua - royalty - irrf - iof - imposto - proLaboreAnual - custoComSalarios - entrada.outrosCustos;
  return {
    iva, reembolsos, liquido, taxaDaSteam, repasseEmDolar, faturamento, retencaoDosEua, royaltyEmDolar, royalty, irrf, iof,
    fatorR, anexo, regime, imposto, contribuicaoPatronal, proLaboreAnual, custoComSalarios, lucro, lucroDistribuivel: Math.max(0, lucro),
  };
}

export function calcularSocioDeReferencia(proLaboreMensal: number, dividendos: number) {
  const inss = Math.min(proLaboreMensal, TETO_DO_INSS) * 0.11;
  const irpfMensal = irpfDeReferencia(proLaboreMensal, inss);
  const proLaboreLiquido = (proLaboreMensal - inss - irpfMensal) * 12;
  const retencao = dividendos / 12 > 5e4 ? dividendos * 0.1 : 0;
  const renda = proLaboreMensal * 12 + dividendos;
  const aliquota = aliquotaMinimaDeReferencia(renda);
  const diferenca = aliquota * renda - (irpfMensal * 12 + retencao);
  const complemento = Math.max(0, diferenca);
  return {
    inss: inss * 12,
    irpf: irpfMensal * 12,
    dividendos,
    retencao,
    aliquota,
    complemento,
    credito: Math.max(0, Math.min(retencao, -diferenca)),
    liquido: proLaboreLiquido + dividendos - retencao - complemento,
  };
}

export function calcularTudoComoProLaboreDeReferencia(entrada: EntradaDeReferencia) {
  const semProLabore = calcularEmpresaDeReferencia(entrada, 0);
  const bruto = semProLabore.lucroDistribuivel * FATIA_DE_CADA_SOCIO;
  const mensal = bruto / 12;
  const inss = Math.min(mensal, TETO_DO_INSS) * 0.11;
  const irpf = irpfDeReferencia(mensal, inss);
  const complemento = Math.max(0, aliquotaMinimaDeReferencia(bruto) * bruto - irpf * 12);
  return {
    bruto,
    liquido: bruto - inss * 12 - irpf * 12 - complemento,
    inssPatronal: semProLabore.regime === 'presumido' ? bruto * 0.2 : 0,
  };
}
