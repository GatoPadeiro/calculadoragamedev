import { LOJAS, TAXA_APP_STORE_PEQUENO_DESENVOLVEDOR, type FaixaDaLoja, type IdLoja } from '../dados/lojas';

export function aplicarFaixasMarginais(valor: number, faixas: readonly FaixaDaLoja[]): number {
  let taxaTotal = 0;
  let inicioDaFaixa = 0;
  for (const faixa of faixas) {
    if (valor <= inicioDaFaixa) break;
    const parteNaFaixa = Math.min(valor, faixa.ateEmDolar) - inicioDaFaixa;
    taxaTotal += parteNaFaixa * faixa.taxa;
    inicioDaFaixa = faixa.ateEmDolar;
  }
  return taxaTotal;
}

export function faixasDaLoja(loja: IdLoja, appStorePequenoDesenvolvedor: boolean, paisDoComprador?: string): readonly FaixaDaLoja[] {
  if (loja === 'appstore' && appStorePequenoDesenvolvedor) {
    return [{ ateEmDolar: Infinity, taxa: TAXA_APP_STORE_PEQUENO_DESENVOLVEDOR }];
  }
  const regra = LOJAS[loja];
  const mercadoDoComprador = paisDoComprador ? regra.faixasPorMercado?.find((mercado) => mercado.paises.includes(paisDoComprador)) : undefined;
  return mercadoDoComprador?.faixas ?? regra.faixas;
}

export function calcularTaxaDaLoja(loja: IdLoja, receitaEmDolar: number, appStorePequenoDesenvolvedor: boolean, paisDoComprador?: string): number {
  return aplicarFaixasMarginais(Math.max(0, receitaEmDolar), faixasDaLoja(loja, appStorePequenoDesenvolvedor, paisDoComprador));
}
