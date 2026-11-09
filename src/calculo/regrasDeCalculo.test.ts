import { describe, expect, it } from 'vitest';
import { ESTRUTURA_DO_PROTOTIPO } from '../testes/estruturaDoPrototipo';
import { calcularCenario } from './calcularCenario';
import { CENARIO_DE_EXEMPLO } from './cenarioDeExemplo';
import { dividirLucro } from './divisaoDoLucro';
import { calcularAliquotaMinima, calcularInssDoSocio, calcularIrpfMensal, calcularPresumido, calcularRendaDoSocio, calcularSimples } from './impostosDoBrasil';
import { aplicarFaixasMarginais, calcularTaxaDaLoja } from './taxasDasLojas';
import type { Cenario } from './tipos';

const copiaDoExemplo = (): Cenario => structuredClone(CENARIO_DE_EXEMPLO);

describe('taxas das lojas', () => {
  it('Steam abaixo de US$ 10 mi cobra 30%', () => {
    expect(calcularTaxaDaLoja('steam', 1_000_000, false)).toBeCloseTo(300_000, 6);
  });
  it('Steam com US$ 60 mi: 10 mi × 30% + 40 mi × 25% + 10 mi × 20%', () => {
    expect(calcularTaxaDaLoja('steam', 60_000_000, false)).toBeCloseTo(3e6 + 10e6 + 2e6, 6);
  });
  it('Google Play com US$ 1,5 mi: 1 mi × 15% + 0,5 mi × 30%', () => {
    expect(calcularTaxaDaLoja('googleplay', 1_500_000, false)).toBeCloseTo(300_000, 6);
  });
  it('App Store: 15% no programa para pequenos, 30% fora dele', () => {
    expect(calcularTaxaDaLoja('appstore', 100_000, true)).toBeCloseTo(15_000, 6);
    expect(calcularTaxaDaLoja('appstore', 100_000, false)).toBeCloseTo(30_000, 6);
  });
  it('Epic: nada no primeiro US$ 1 mi do ano, 12% acima', () => {
    expect(calcularTaxaDaLoja('epic', 1_000_000, false)).toBe(0);
    expect(calcularTaxaDaLoja('epic', 1_500_000, false)).toBeCloseTo(60_000, 6);
  });
  it('consoles cobram 30%', () => {
    expect(calcularTaxaDaLoja('nintendo', 100_000, false)).toBeCloseTo(30_000, 6);
  });
  it('Google Play nos EUA com US$ 1,5 mi: 1 mi × 15% + 0,5 mi × 25%', () => {
    expect(calcularTaxaDaLoja('googleplay', 1_500_000, false, 'US')).toBeCloseTo(275_000, 6);
    expect(calcularTaxaDaLoja('googleplay', 1_500_000, false, 'DE')).toBeCloseTo(275_000, 6);
  });
  it('Google Play no Brasil continua 15% até US$ 1 mi e 30% acima', () => {
    expect(calcularTaxaDaLoja('googleplay', 1_500_000, false, 'BR')).toBeCloseTo(300_000, 6);
  });
  it('receita zero ou negativa não paga taxa', () => {
    expect(aplicarFaixasMarginais(0, [{ ateEmDolar: Infinity, taxa: 0.3 }])).toBe(0);
    expect(calcularTaxaDaLoja('steam', -10, false)).toBe(0);
  });
});

describe('impostos da empresa', () => {
  it('Simples Anexo III, R$ 500 mil: (500.000 × 13,5% − 17.640) ÷ 500.000 = 9,972%', () => {
    const simples = calcularSimples(500_000, 'III', false, 0.05);
    expect(simples.faixa).toBe(3);
    expect(simples.aliquotaEfetiva).toBeCloseTo(0.09972, 10);
    expect(simples.imposto).toBeCloseTo(49_860, 6);
  });
  it('Simples na exportação tira COFINS, PIS e ISS da faixa (13,64 + 2,96 + 32,5 = 49,1%)', () => {
    expect(calcularSimples(500_000, 'III', true, 0.05).imposto).toBeCloseTo(49_860 * (1 - 0.491), 6);
  });
  it('Simples Anexo V, R$ 100 mil: 15,5%', () => {
    expect(calcularSimples(100_000, 'V', false, 0.05).imposto).toBeCloseTo(15_500, 6);
  });
  it('Simples na 6ª faixa paga ISS por fora', () => {
    const simples = calcularSimples(4_000_000, 'III', false, 0.05);
    expect(simples.faixa).toBe(6);
    expect(simples.imposto).toBeCloseTo(4_000_000 * 0.33 - 648_000 + 200_000, 6);
  });
  it('Presumido acima de R$ 5 mi: presunção de 35,2% sobre o excedente (LC 224/2025)', () => {
    const presumido = calcularPresumido(8_000_000, false, 0.05);
    const basePresumida = 5_000_000 * 0.32 + 3_000_000 * 0.352;
    expect(presumido.irpj).toBeCloseTo(basePresumida * 0.15 + (basePresumida - 240_000) * 0.1, 6);
    expect(presumido.csll).toBeCloseTo(basePresumida * 0.09, 6);
    expect(presumido.imposto).toBeCloseTo(1_571_040, 6);
  });
  it('Presumido, R$ 1 mi: IRPJ 56 mil + CSLL 28,8 mil + PIS/COFINS 36,5 mil + ISS 50 mil', () => {
    const presumido = calcularPresumido(1_000_000, false, 0.05);
    expect(presumido.irpj).toBeCloseTo(56_000, 6);
    expect(presumido.csll).toBeCloseTo(28_800, 6);
    expect(presumido.pisECofins).toBeCloseTo(36_500, 6);
    expect(presumido.imposto).toBeCloseTo(171_300, 6);
  });
});

describe('impostos do sócio', () => {
  it('INSS de 11% até o teto', () => {
    expect(calcularInssDoSocio(5_000)).toBeCloseTo(550, 6);
    expect(calcularInssDoSocio(20_000)).toBeCloseTo(8_475.55 * 0.11, 6);
  });
  it('IRPF zero até R$ 5 mil', () => {
    expect(calcularIrpfMensal(5_000, calcularInssDoSocio(5_000))).toBe(0);
  });
  it('IRPF de R$ 10 mil: (10.000 − INSS) × 27,5% − 908,73', () => {
    const inss = calcularInssDoSocio(10_000);
    expect(calcularIrpfMensal(10_000, inss)).toBeCloseTo((10_000 - inss) * 0.275 - 908.73, 6);
  });
  it('IRPF usa o desconto simplificado de R$ 607,20 quando ele é maior que o INSS', () => {
    const inss = calcularInssDoSocio(5_200);
    const impostoPelaTabela = (5_200 - 607.2) * 0.225 - 675.49;
    const reducao = 978.62 - 0.133145 * 5_200;
    expect(inss).toBeLessThan(607.2);
    expect(calcularIrpfMensal(5_200, inss)).toBeCloseTo(impostoPelaTabela - reducao, 6);
  });
  it('IRPF de R$ 6 mil tem a redução de 2026', () => {
    const inss = 660;
    const impostoPelaTabela = (6_000 - inss) * 0.275 - 908.73;
    expect(calcularIrpfMensal(6_000, inss)).toBeCloseTo(impostoPelaTabela - (978.62 - 0.133145 * 6_000), 6);
  });
  it('imposto mínimo: 0 até R$ 600 mil, 5% em R$ 900 mil, 10% de R$ 1,2 mi para cima', () => {
    expect(calcularAliquotaMinima(600_000)).toBe(0);
    expect(calcularAliquotaMinima(900_000)).toBeCloseTo(0.05, 10);
    expect(calcularAliquotaMinima(2_000_000)).toBe(0.1);
  });
  it('dividendos de R$ 1,2 mi por ano: retém 10% e não deve mais nada', () => {
    const renda = calcularRendaDoSocio(0, 1_200_000);
    expect(renda.retencaoDeDividendos).toBeCloseTo(120_000, 6);
    expect(renda.complementoDoImpostoMinimo).toBe(0);
    expect(renda.liquidoAnual).toBeCloseTo(1_080_000, 6);
  });
  it('dividendos de R$ 540 mil (45 mil por mês): sem retenção nem imposto mínimo', () => {
    const renda = calcularRendaDoSocio(0, 540_000);
    expect(renda.retencaoDeDividendos).toBe(0);
    expect(renda.liquidoAnual).toBe(540_000);
  });
});

describe('divisão do lucro', () => {
  it('exemplo: cada sócio leva 7% + 79% × 70% × 30%, freelas 79% × 70% × 10%, caixa 79% × 30%', () => {
    const fatias = dividirLucro(CENARIO_DE_EXEMPLO.divisao, 100).fatiaPorSocio;
    for (const idSocio of ['socio-1', 'socio-2', 'socio-3']) expect(fatias[idSocio]).toBeCloseTo(0.2359, 10);
    expect(fatias.freelas).toBeCloseTo(0.0553, 10);
    expect(fatias.caixa).toBeCloseTo(0.237, 10);
  });
  it('estrutura do protótipo: cada sócio leva 7% + 79% × 70% × 30% = 23,59%', () => {
    const divisao = dividirLucro(ESTRUTURA_DO_PROTOTIPO.divisao, 1_000_000);
    expect(divisao.fatiaPorSocio['socio-a']).toBeCloseTo(0.2359, 10);
    expect(divisao.fatiaPorSocio.caixa).toBeCloseTo(0.237, 10);
    expect(divisao.fatiaPorSocio.freelas).toBeCloseTo(0.0553, 10);
    expect(divisao.gruposComSomaInvalida).toEqual([]);
    expect(divisao.valorSemDono).toBeCloseTo(0, 6);
  });
  it('grupo que não soma 100% gera aviso e mostra o que ficou sem dono', () => {
    const divisao = dividirLucro(
      {
        tipo: 'grupo',
        id: 'raiz',
        nome: 'Raiz',
        partes: [
          { fatia: 0.6, no: { tipo: 'socio', idSocio: 'a' } },
          { fatia: 0.3, no: { tipo: 'socio', idSocio: 'b' } },
        ],
      },
      100,
    );
    expect(divisao.gruposComSomaInvalida).toHaveLength(1);
    expect(divisao.gruposComSomaInvalida[0]!.soma).toBeCloseTo(0.9, 10);
    expect(divisao.valorSemDono).toBeCloseTo(10, 6);
  });
});

describe('cenário completo', () => {
  it('exemplo fecha sem avisos de divisão nem de cotação', () => {
    const resultado = calcularCenario(copiaDoExemplo());
    expect(resultado.alertas.filter((alerta) => alerta.codigo === 'divisao-invalida' || alerta.codigo === 'cotacao-ausente')).toEqual([]);
    expect(resultado.totais.copias).toBe(23_000);
  });
  it('vendas na Epic não pagam royalty da Unreal', () => {
    const resultado = calcularCenario(copiaDoExemplo());
    expect(resultado.linhas.find((linha) => linha.loja === 'epic')!.royaltyEmDolar).toBe(0);
  });
  it('só a linha dos EUA sofre a retenção de 30%', () => {
    for (const linha of calcularCenario(copiaDoExemplo()).linhas) {
      if (linha.pais === 'US') expect(linha.retencaoDosEuaEmDolar).toBeCloseTo(linha.repasseEmDolar * 0.3, 6);
      else expect(linha.retencaoDosEuaEmDolar).toBe(0);
    }
  });
  it('IVA embutido de 19% sai como 19/119 do bruto', () => {
    const linhaAlema = calcularCenario(copiaDoExemplo()).linhas.find((linha) => linha.pais === 'DE')!;
    expect(linhaAlema.impostoConsumoEmDolar).toBeCloseTo(linhaAlema.brutoEmDolar * (0.19 / 1.19), 6);
  });
  it('a soma das linhas bate com os totais', () => {
    const resultado = calcularCenario(copiaDoExemplo());
    expect(resultado.linhas.reduce((soma, linha) => soma + linha.repasseEmDolar, 0)).toBeCloseTo(resultado.totais.repasseEmDolar, 6);
    expect(resultado.lojas.reduce((soma, loja) => soma + loja.taxaEmDolar, 0)).toBeCloseTo(resultado.totais.taxaDasLojasEmDolar, 6);
  });
  it('moeda sem cotação gera aviso e a linha vale zero', () => {
    const cenario = copiaDoExemplo();
    cenario.vendas.push({ id: 'kr', pais: 'KR', loja: 'steam', moeda: 'KRW', precoPorCopia: 20_000, copias: 1_000, impostoConsumoNoPreco: 0.1, taxaDeReembolso: 0.05 });
    const resultado = calcularCenario(cenario);
    expect(resultado.alertas).toContainEqual({ codigo: 'cotacao-ausente', moeda: 'KRW' });
    expect(resultado.linhas.find((linha) => linha.id === 'kr')!.brutoEmDolar).toBe(0);
  });
  it('quantidade de sócios configurável: dois sócios 50/50', () => {
    const cenario = copiaDoExemplo();
    cenario.socios = [
      { id: 'a', nome: 'Ana', tipo: 'pessoaFisica', proLaboreMensal: 3_000 },
      { id: 'b', nome: 'Bia', tipo: 'pessoaFisica', proLaboreMensal: 3_000 },
    ];
    cenario.divisao = {
      tipo: 'grupo',
      id: 'raiz',
      nome: 'Lucro',
      partes: [
        { fatia: 0.5, no: { tipo: 'socio', idSocio: 'a' } },
        { fatia: 0.5, no: { tipo: 'socio', idSocio: 'b' } },
      ],
    };
    const resultado = calcularCenario(cenario);
    expect(resultado.empresa.proLaboreAnual).toBe(72_000);
    expect(resultado.socios[0]!.dividendos).toBeCloseTo(resultado.empresa.lucroDistribuivel / 2, 6);
  });
  it('Google Play cobra a taxa do país de quem compra', () => {
    const cenario = copiaDoExemplo();
    const vendaDeUmMilhao = { loja: 'googleplay' as const, moeda: 'USD', precoPorCopia: 1_000_000, copias: 1, impostoConsumoNoPreco: 0, taxaDeReembolso: 0 };
    cenario.vendas = [
      { ...vendaDeUmMilhao, id: 'eua', pais: 'US' },
      { ...vendaDeUmMilhao, id: 'brasil', pais: 'BR' },
    ];
    const resultado = calcularCenario(cenario);
    expect(resultado.linhas.find((linha) => linha.id === 'eua')!.taxaDaLojaEmDolar).toBeCloseTo(0.5 * (150_000 + 250_000), 6);
    expect(resultado.linhas.find((linha) => linha.id === 'brasil')!.taxaDaLojaEmDolar).toBeCloseTo(0.5 * (150_000 + 300_000), 6);
    expect(resultado.lojas[0]!.taxaEmDolar).toBeCloseTo(425_000, 6);
  });
  it('salário CLT custa 13,33 salários no ano, com FGTS sobre o total', () => {
    const cenario = copiaDoExemplo();
    cenario.custos.salariosMensais = 10_000;
    const { empresa } = calcularCenario(cenario);
    expect(empresa.salariosAnuais).toBeCloseTo(10_000 * (12 + 1 + 1 / 3), 6);
    expect(empresa.fgts).toBeCloseTo(empresa.salariosAnuais * 0.08, 6);
  });
  it('sem vendas: nada quebra e o resultado vira prejuízo', () => {
    const cenario = copiaDoExemplo();
    cenario.vendas = [];
    const resultado = calcularCenario(cenario);
    expect(resultado.empresa.faturamento).toBe(0);
    expect(resultado.empresa.lucroDistribuivel).toBe(0);
    expect(resultado.alertas.some((alerta) => alerta.codigo === 'prejuizo')).toBe(true);
  });
  it('valores extremos (bilhões de cópias) continuam finitos', () => {
    const cenario = copiaDoExemplo();
    cenario.vendas[0]!.copias = 5_000_000_000;
    const resultado = calcularCenario(cenario);
    expect(Number.isFinite(resultado.empresa.lucro)).toBe(true);
    expect(resultado.empresa.regime).toBe('presumido');
  });
});
