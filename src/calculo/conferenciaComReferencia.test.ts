import { describe, expect, it } from 'vitest';
import {
  calcularEmpresaDeReferencia,
  calcularSocioDeReferencia,
  calcularTudoComoProLaboreDeReferencia,
  ENTRADA_PADRAO_DE_REFERENCIA,
  FATIA_DE_CADA_SOCIO,
  type EntradaDeReferencia,
} from '../testes/calculoDeReferencia';
import { ESTRUTURA_DO_PROTOTIPO } from '../testes/estruturaDoPrototipo';
import { calcularCenario } from './calcularCenario';
import type { Cenario, LinhaDeVenda } from './tipos';

const ROYALTY_NO_LANCAMENTO_NA_EPIC = 0.035;
const SOCIOS_PESSOA_FISICA = ['socio-a', 'socio-b', 'socio-c'];

function esperarIgual(atual: number, esperado: number) {
  expect(Math.abs(atual - esperado)).toBeLessThanOrEqual(1e-6 * Math.max(1, Math.abs(esperado)));
}

function aliquotaEmbutidaEquivalente(fracaoDaVenda: number): number {
  return fracaoDaVenda / (1 - fracaoDaVenda);
}

function linhaEmDolar(id: string, pais: string, valor: number, entrada: EntradaDeReferencia): LinhaDeVenda {
  return {
    id,
    pais,
    loja: 'steam',
    moeda: 'USD',
    precoPorCopia: valor,
    copias: 1,
    impostoConsumoNoPreco: aliquotaEmbutidaEquivalente(entrada.fracaoDeIva),
    taxaDeReembolso: entrada.fracaoDeReembolso,
  };
}

function montarCenarioEquivalente(entrada: EntradaDeReferencia, vendas?: LinhaDeVenda[], cotacoesExtras: Record<string, number> = {}): Cenario {
  const vendaNosEua = entrada.vendaBrutaEmDolar * entrada.fracaoDasVendasNosEua;
  const vendaForaDosEua = entrada.vendaBrutaEmDolar - vendaNosEua;
  return {
    estudio: {
      regime: entrada.regime,
      iss: entrada.iss,
      vendaContaComoExportacao: entrada.vendaContaComoExportacao,
      engine: 'unreal',
      lancadoTambemNaEpic: entrada.royaltyDaUnreal === ROYALTY_NO_LANCAMENTO_NA_EPIC,
      appStorePequenoDesenvolvedor: false,
      aplicarRetencaoDosEua: entrada.aplicarRetencaoDosEua,
      remessa: { irrf: entrada.irrf, iof: entrada.iof, empresaPagaIrrfPorFora: entrada.empresaPagaIrrfPorFora },
    },
    socios: ESTRUTURA_DO_PROTOTIPO.socios.map((socio) => (socio.tipo === 'pessoaFisica' ? { ...socio, proLaboreMensal: entrada.proLaboreMensal } : socio)),
    divisao: ESTRUTURA_DO_PROTOTIPO.divisao,
    vendas: vendas ?? [linhaEmDolar('eua', 'US', vendaNosEua, entrada), linhaEmDolar('resto', 'CA', vendaForaDosEua, entrada)],
    cotacoes: { USD: entrada.cotacaoDoDolar, ...cotacoesExtras },
    custos: { salariosMensais: entrada.salariosMensais, outrosCustosAnuais: entrada.outrosCustos },
  };
}

function conferirEmpresa(entrada: EntradaDeReferencia, cenario: Cenario) {
  const esperado = calcularEmpresaDeReferencia(entrada, entrada.proLaboreMensal);
  const { totais, empresa } = calcularCenario(cenario);
  esperarIgual(totais.impostoConsumoEmDolar, esperado.iva);
  esperarIgual(totais.reembolsosEmDolar, esperado.reembolsos);
  esperarIgual(totais.liquidoEmDolar, esperado.liquido);
  esperarIgual(totais.taxaDasLojasEmDolar, esperado.taxaDaSteam);
  esperarIgual(totais.repasseEmDolar, esperado.repasseEmDolar);
  esperarIgual(empresa.faturamento, esperado.faturamento);
  esperarIgual(empresa.retencaoDosEua, esperado.retencaoDosEua);
  esperarIgual(empresa.royaltyEmDolar, esperado.royaltyEmDolar);
  esperarIgual(empresa.royalty, esperado.royalty);
  esperarIgual(empresa.irrfDaRemessa, esperado.irrf);
  esperarIgual(empresa.iofDaRemessa, esperado.iof);
  esperarIgual(empresa.fatorR, esperado.fatorR);
  expect(empresa.anexo).toBe(esperado.anexo);
  expect(empresa.regime).toBe(esperado.regime);
  esperarIgual(empresa.impostoDaEmpresa, esperado.imposto);
  esperarIgual(empresa.contribuicaoPatronalNoPresumido, esperado.contribuicaoPatronal);
  esperarIgual(empresa.proLaboreAnual, esperado.proLaboreAnual);
  esperarIgual(empresa.custoComSalarios, esperado.custoComSalarios);
  esperarIgual(empresa.lucro, esperado.lucro);
  esperarIgual(empresa.lucroDistribuivel, esperado.lucroDistribuivel);
  return esperado;
}

function conferirSocios(entrada: EntradaDeReferencia, cenario: Cenario, lucroDistribuivel: number) {
  const resultado = calcularCenario(cenario);
  const socioEsperado = calcularSocioDeReferencia(entrada.proLaboreMensal, lucroDistribuivel * FATIA_DE_CADA_SOCIO);
  const comparacaoEsperada = calcularTudoComoProLaboreDeReferencia(entrada);
  for (const idSocio of SOCIOS_PESSOA_FISICA) {
    const socio = resultado.socios.find((candidato) => candidato.idSocio === idSocio)!;
    esperarIgual(socio.fatia, FATIA_DE_CADA_SOCIO);
    esperarIgual(socio.dividendos, socioEsperado.dividendos);
    esperarIgual(socio.renda!.inss, socioEsperado.inss);
    esperarIgual(socio.renda!.irpf, socioEsperado.irpf);
    esperarIgual(socio.renda!.retencaoDeDividendos, socioEsperado.retencao);
    esperarIgual(socio.renda!.aliquotaMinima, socioEsperado.aliquota);
    esperarIgual(socio.renda!.complementoDoImpostoMinimo, socioEsperado.complemento);
    esperarIgual(socio.renda!.creditoNaDeclaracao, socioEsperado.credito);
    esperarIgual(socio.liquidoAnual, socioEsperado.liquido);
    esperarIgual(socio.comparacao!.brutoAnual, comparacaoEsperada.bruto);
    esperarIgual(socio.comparacao!.liquidoAnual, comparacaoEsperada.liquido);
    esperarIgual(socio.comparacao!.inssPatronalNaComparacao, comparacaoEsperada.inssPatronal);
  }
  esperarIgual(resultado.socios.find((socio) => socio.idSocio === 'caixa')!.liquidoAnual, lucroDistribuivel * 0.79 * 0.3);
  esperarIgual(resultado.socios.find((socio) => socio.idSocio === 'freelas')!.liquidoAnual, lucroDistribuivel * 0.79 * 0.7 * 0.1);
  expect(resultado.divisao.gruposComSomaInvalida).toEqual([]);
}

function conferirTudo(entrada: EntradaDeReferencia, cenario = montarCenarioEquivalente(entrada)) {
  const esperado = conferirEmpresa(entrada, cenario);
  conferirSocios(entrada, cenario, esperado.lucroDistribuivel);
}

const CASOS: [descricao: string, ajuste: Partial<EntradaDeReferencia>][] = [
  ['padrão do formulário (cai no Presumido, acima de R$ 5 mi)', {}],
  ['pró-labore na faixa do desconto simplificado do IRPF', { proLaboreMensal: 5_300 }],
  ['venda menor, Simples Anexo V', { vendaBrutaEmDolar: 500_000 }],
  ['venda menor com salários, Simples Anexo III', { vendaBrutaEmDolar: 500_000, salariosMensais: 40_000 }],
  ['exportação de serviço no Simples', { vendaBrutaEmDolar: 500_000, vendaContaComoExportacao: true }],
  ['exportação no Presumido', { vendaContaComoExportacao: true }],
  ['sem gross-up na remessa', { empresaPagaIrrfPorFora: false }],
  ['Unreal 3,5%', { royaltyDaUnreal: ROYALTY_NO_LANCAMENTO_NA_EPIC }],
  ['sem retenção dos EUA', { aplicarRetencaoDosEua: false }],
  ['Simples forçado acima do limite (6ª faixa)', { regime: 'simples' }],
  ['Presumido forçado com faturamento baixo', { vendaBrutaEmDolar: 300_000, regime: 'presumido' }],
  ['abaixo da isenção da Unreal', { vendaBrutaEmDolar: 900_000 }],
  ['prejuízo', { outrosCustos: 50_000_000 }],
  ['pró-labore zero', { proLaboreMensal: 0 }],
  ['pró-labore alto (teto do INSS, IRPF cheio)', { proLaboreMensal: 20_000 }],
  ['pró-labore na faixa de redução do IRPF', { proLaboreMensal: 6_500 }],
  ['venda grande: retenção de dividendos e imposto mínimo', { vendaBrutaEmDolar: 8_000_000 }],
  ['venda média: imposto mínimo parcial', { vendaBrutaEmDolar: 1_200_000, regime: 'presumido' }],
];

describe('conferência com o cálculo de referência (protótipo atualizado para 2026)', () => {
  for (const [descricao, ajuste] of CASOS) {
    it(descricao, () => conferirTudo({ ...ENTRADA_PADRAO_DE_REFERENCIA, ...ajuste }));
  }

  it('vendas por cópias em dólar, real e yuan', () => {
    const cotacoes = { USD: 5.4, CNY: 0.76 };
    const linhas: [id: string, pais: string, moeda: 'USD' | 'BRL' | 'CNY', preco: number, copias: number][] = [
      ['us', 'US', 'USD', 19.99, 60_000],
      ['br', 'BR', 'BRL', 59.99, 25_000],
      ['cn', 'CN', 'CNY', 70, 15_000],
    ];
    const emReais = (moeda: string, valor: number) => valor * (moeda === 'BRL' ? 1 : cotacoes[moeda as 'USD' | 'CNY']);
    const vendaBrutaEmReais = linhas.reduce((soma, [, , moeda, preco, copias]) => soma + emReais(moeda, preco * copias), 0);
    const entrada: EntradaDeReferencia = {
      ...ENTRADA_PADRAO_DE_REFERENCIA,
      vendaBrutaEmDolar: vendaBrutaEmReais / cotacoes.USD,
      fracaoDasVendasNosEua: emReais('USD', 19.99 * 60_000) / vendaBrutaEmReais,
    };
    const vendas: LinhaDeVenda[] = linhas.map(([id, pais, moeda, precoPorCopia, copias]) => ({
      id,
      pais,
      loja: 'steam',
      moeda,
      precoPorCopia,
      copias,
      impostoConsumoNoPreco: aliquotaEmbutidaEquivalente(entrada.fracaoDeIva),
      taxaDeReembolso: entrada.fracaoDeReembolso,
    }));
    const cenario = montarCenarioEquivalente(entrada, vendas, cotacoes);
    conferirTudo(entrada, cenario);
    const { totais } = calcularCenario(cenario);
    esperarIgual(totais.brutoEmReais, vendaBrutaEmReais);
    expect(totais.copias).toBe(100_000);
  });
});
