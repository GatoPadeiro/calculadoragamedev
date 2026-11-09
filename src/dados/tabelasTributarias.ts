import type { Fonte } from './fonte';

export interface ReparticaoDoSimples {
  irpj: number;
  csll: number;
  cofins: number;
  pis: number;
  cpp: number;
  iss: number;
}

export interface FaixaDoSimples {
  limiteAnual: number;
  aliquotaNominal: number;
  parcelaADeduzir: number;
  reparticaoPercentual: ReparticaoDoSimples;
}

type PercentuaisDaReparticao = [irpj: number, csll: number, cofins: number, pis: number, cpp: number, iss: number];

function criarFaixa(limiteAnual: number, aliquotaNominal: number, parcelaADeduzir: number, percentuais: PercentuaisDaReparticao): FaixaDoSimples {
  const [irpj, csll, cofins, pis, cpp, iss] = percentuais;
  return { limiteAnual, aliquotaNominal, parcelaADeduzir, reparticaoPercentual: { irpj, csll, cofins, pis, cpp, iss } };
}

export const SIMPLES = {
  limiteAnual: 4_800_000,
  sublimiteDoIss: 3_600_000,
  fatorRMinimoParaAnexoIII: 0.28,
  anexoIII: [
    criarFaixa(180_000, 0.06, 0, [4, 3.5, 12.82, 2.78, 43.4, 33.5]),
    criarFaixa(360_000, 0.112, 9_360, [4, 3.5, 14.05, 3.05, 43.4, 32]),
    criarFaixa(720_000, 0.135, 17_640, [4, 3.5, 13.64, 2.96, 43.4, 32.5]),
    criarFaixa(1_800_000, 0.16, 35_640, [4, 3.5, 13.64, 2.96, 43.4, 32.5]),
    criarFaixa(3_600_000, 0.21, 125_640, [4, 3.5, 12.82, 2.78, 43.4, 33.5]),
    criarFaixa(4_800_000, 0.33, 648_000, [35, 15, 16.03, 3.47, 30.5, 0]),
  ],
  anexoV: [
    criarFaixa(180_000, 0.155, 0, [25, 15, 14.1, 3.05, 28.85, 14]),
    criarFaixa(360_000, 0.18, 4_500, [23, 15, 14.1, 3.05, 27.85, 17]),
    criarFaixa(720_000, 0.195, 9_900, [24, 15, 14.92, 3.23, 23.85, 19]),
    criarFaixa(1_800_000, 0.205, 17_100, [21, 15, 15.74, 3.41, 23.85, 21]),
    criarFaixa(3_600_000, 0.23, 62_100, [23, 12.5, 14.1, 3.05, 23.85, 23.5]),
    criarFaixa(4_800_000, 0.305, 540_000, [35, 15.5, 16.44, 3.56, 29.5, 0]),
  ],
  fonte: {
    referencia: 'Lei Complementar 123/2006, Anexos III e V, com redação da LC 155/2016',
    vigencia: 'desde 01/01/2018',
    conferido: false,
    nota: 'Na exportação de serviços, PIS, COFINS e ISS saem da alíquota efetiva (LC 123/2006, art. 18, § 14). Se a venda em loja estrangeira conta como exportação de serviço precisa ser confirmado com contador.',
  } satisfies Fonte,
} as const;

export const PRESUMIDO = {
  percentualDePresuncao: 0.32,
  receitaAnualSemAcrescimoNaPresuncao: 5_000_000,
  fatorDeAcrescimoNaPresuncao: 1.1,
  aliquotaIrpj: 0.15,
  aliquotaAdicionalIrpj: 0.1,
  baseAnualSemAdicional: 240_000,
  aliquotaCsll: 0.09,
  aliquotaPis: 0.0065,
  aliquotaCofins: 0.03,
  contribuicaoPatronalSobreProLabore: 0.2,
  encargosSobreSalarios: 0.278,
  fonte: {
    referencia:
      'Lei 9.249/1995 (presunção e IRPJ), Lei 9.718/1998 (PIS e COFINS cumulativos), Lei 8.212/1991 (contribuição patronal); LC 224/2025 e Decreto 12.808/2025 (presunção 10% maior na receita acima de R$ 5 mi por ano)',
    vigencia: '2026 (acréscimo da LC 224: IRPJ desde 01/01/2026, CSLL desde 01/04/2026)',
    conferido: false,
    nota: 'O acréscimo da LC 224/2025 é contestado na Justiça (liminares individuais e ADI 7.920) e aqui vale para o ano inteiro. Encargos sobre salários (27,8%) são uma média; RAT e terceiros variam por atividade.',
  } satisfies Fonte,
} as const;

export const FGTS = {
  aliquota: 0.08,
  fonte: { referencia: 'Lei 8.036/1990, art. 15', vigencia: 'vigente', conferido: false } satisfies Fonte,
} as const;

export const REMUNERACAO_CLT = {
  remuneracoesPorAno: 12 + 1 + 1 / 3,
  fonte: {
    referencia: 'Lei 4.090/1962 (13º salário); Constituição Federal, art. 7º, XVII, e CLT, art. 129 (férias com um terço a mais)',
    vigencia: 'vigente',
    conferido: false,
    nota: 'Cada salário mensal custa 13,33 salários por ano (12 + 13º + 1/3 de férias), com FGTS e encargos sobre o total.',
  } satisfies Fonte,
} as const;

export const SALARIO_MINIMO = {
  valorMensal: 1_621,
  fonte: { referencia: 'Decreto 12.797/2025', vigencia: 'desde 01/01/2026', conferido: false } satisfies Fonte,
} as const;

export const INSS_DO_SOCIO = {
  aliquota: 0.11,
  tetoMensal: 8_475.55,
  fonte: {
    referencia: 'Lei 8.212/1991, art. 21 (contribuinte individual, 11%); teto pela Portaria Interministerial MPS/MF nº 13/2026',
    vigencia: 'desde 01/01/2026',
    conferido: false,
  } satisfies Fonte,
} as const;

export const IRPF = {
  tabelaMensal: [
    { baseAte: 2_428.8, aliquota: 0, parcelaADeduzir: 0 },
    { baseAte: 2_826.65, aliquota: 0.075, parcelaADeduzir: 182.16 },
    { baseAte: 3_751.05, aliquota: 0.15, parcelaADeduzir: 394.16 },
    { baseAte: 4_664.68, aliquota: 0.225, parcelaADeduzir: 675.49 },
    { baseAte: Infinity, aliquota: 0.275, parcelaADeduzir: 908.73 },
  ],
  descontoSimplificadoMensal: 607.2,
  rendaIsentaAte: 5_000,
  reducaoAte: 7_350,
  reducaoValorBase: 978.62,
  reducaoFator: 0.133145,
  fonte: {
    referencia: 'Lei 15.270/2025 (isenção até R$ 5 mil e redução até R$ 7.350); tabela progressiva e desconto simplificado mensal de R$ 607,20 da Lei 15.191/2025',
    vigencia: 'a partir de 01/01/2026',
    conferido: false,
    nota: 'Usa a maior dedução entre o INSS do mês e o desconto simplificado de R$ 607,20. Dependentes e outras deduções não entram.',
  } satisfies Fonte,
} as const;

export const DIVIDENDOS = {
  retencaoAcimaDeMensal: 50_000,
  aliquotaDeRetencao: 0.1,
  impostoMinimoAPartirDeAnual: 600_000,
  impostoMinimoCheioEmAnual: 1_200_000,
  aliquotaMinimaCheia: 0.1,
  fonte: {
    referencia: 'Lei 15.270/2025 (retenção de 10% sobre lucros acima de R$ 50 mil/mês e imposto mínimo da alta renda)',
    vigencia: 'lucros pagos a partir de 01/01/2026',
    conferido: false,
    nota: 'A calculadora usa a média mensal (lucro anual ÷ 12) para decidir a retenção. Na prática ela depende de quanto é pago em cada mês.',
  } satisfies Fonte,
} as const;

export const REMESSA_AO_EXTERIOR = {
  irrfPadrao: 0.15,
  iofPadrao: 0.035,
  fonte: {
    referencia:
      'Decreto 9.580/2018 (RIR), art. 767 (IRRF de 15% sobre royalties); Decreto 6.306/2007, art. 15-B, XXIV, na redação do Decreto 12.499/2025 (IOF de 3,5% nas remessas ao exterior sem alíquota própria)',
    vigencia: 'IOF de 3,5% desde 11/06/2025',
    conferido: false,
    nota: 'O enquadramento do royalty no IOF de 3,5% e a incidência de PIS/COFINS-Importação e ISS sobre a licença da Unreal precisam ser confirmados com contador.',
  } satisfies Fonte,
} as const;

export const RETENCAO_DOS_EUA = {
  aliquota: 0.3,
  fonte: {
    referencia: 'Internal Revenue Code, §§ 1441 e 1442 (retenção de 30% sobre renda de fonte americana); Brasil e EUA não têm acordo para evitar bitributação',
    vigencia: 'vigente',
    conferido: false,
  } satisfies Fonte,
} as const;
