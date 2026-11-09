import { abreviarNumero, formatarNumeroBR } from '../utilitarios/numeroBR';

export const SIMBOLO_DA_MOEDA: Record<string, string> = {
  BRL: 'R$', USD: 'US$', EUR: '€', GBP: '£', CNY: '¥', JPY: '¥', KRW: '₩', CAD: 'C$', AUD: 'A$', MXN: 'MX$',
  CLP: 'CLP$', COP: 'COL$', PLN: 'zł', RUB: '₽', INR: '₹',
};

export const MOEDAS_DISPONIVEIS = Object.keys(SIMBOLO_DA_MOEDA);

export const simboloDaMoeda = (moeda: string) => SIMBOLO_DA_MOEDA[moeda] ?? moeda;

const SINAL_DE_MENOS = '−';

export function formatarReais(valor: number, casasDecimais = 2): string {
  const numero = formatarNumeroBR(Math.abs(valor), { minimoDeCasas: casasDecimais, maximoDeCasas: casasDecimais });
  return `${valor < 0 ? SINAL_DE_MENOS : ''}R$ ${numero}`;
}

const ABREVIACOES_CURTAS: [extenso: string, curto: string][] = [
  [' trilhões', ' tri'],
  [' trilhão', ' tri'],
  [' bilhões', ' bi'],
  [' bilhão', ' bi'],
  [' milhões', ' mi'],
  [' milhão', ' mi'],
];

export function formatarReaisAbreviado(valor: number): string {
  const abreviado = abreviarNumero(valor);
  if (!abreviado) return formatarReais(valor, Math.abs(valor) < 100 ? 2 : 0);
  const curto = ABREVIACOES_CURTAS.reduce((texto, [extenso, sigla]) => texto.replace(extenso, sigla), abreviado);
  return `R$ ${curto}`;
}

export function formatarNaMoeda(valor: number, moeda: string, casasDecimais = 2): string {
  const numero = formatarNumeroBR(Math.abs(valor), { minimoDeCasas: casasDecimais, maximoDeCasas: casasDecimais });
  return `${valor < 0 ? SINAL_DE_MENOS : ''}${simboloDaMoeda(moeda)} ${numero}`;
}

export function formatarPercentual(fracao: number, casasDecimais = 1): string {
  return `${formatarNumeroBR(fracao * 100, { maximoDeCasas: casasDecimais })}%`;
}

export function formatarDataHora(dataIso: string): string {
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
