export type OrigemDaCotacao = 'AwesomeAPI' | 'Frankfurter' | 'cache' | 'referência';

export interface ConjuntoDeCotacoes {
  emReais: Record<string, number>;
  dataHora: string;
  origem: OrigemDaCotacao;
}

export const COTACOES_DE_REFERENCIA: ConjuntoDeCotacoes = {
  emReais: {
    USD: 5.4, EUR: 6.25, GBP: 7.2, CNY: 0.76, JPY: 0.036, KRW: 0.0039, CAD: 3.9, AUD: 3.55, MXN: 0.29,
    CLP: 0.0057, COP: 0.0013, PLN: 1.47, RUB: 0.068, INR: 0.063,
  },
  dataHora: '2026-11-01T12:00:00.000Z',
  origem: 'referência',
};

const CHAVE_DO_CACHE = 'cgd:cotacoes:v1';
const FUSO_DE_BRASILIA = '-03:00';

async function buscarJson(endereco: string, sinal?: AbortSignal): Promise<unknown> {
  const resposta = await fetch(endereco, { signal: sinal });
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  return resposta.json();
}

interface CotacaoDaAwesome {
  bid: string;
  create_date: string;
}

async function buscarNaAwesome(moedas: string[], sinal?: AbortSignal): Promise<ConjuntoDeCotacoes> {
  const pares = moedas.map((moeda) => `${moeda}-BRL`).join(',');
  const resposta = (await buscarJson(`https://economia.awesomeapi.com.br/json/last/${pares}`, sinal)) as Record<string, CotacaoDaAwesome>;
  const emReais: Record<string, number> = {};
  let dataMaisRecente = '';
  for (const moeda of moedas) {
    const cotacao = resposta[`${moeda}BRL`];
    const valor = cotacao ? Number(cotacao.bid) : NaN;
    if (!Number.isFinite(valor) || valor <= 0) continue;
    emReais[moeda] = valor;
    const dataHora = cotacao!.create_date.replace(' ', 'T') + FUSO_DE_BRASILIA;
    if (dataHora > dataMaisRecente) dataMaisRecente = dataHora;
  }
  return { emReais, dataHora: dataMaisRecente ? new Date(dataMaisRecente).toISOString() : new Date().toISOString(), origem: 'AwesomeAPI' };
}

async function buscarNaFrankfurter(moedas: string[], sinal?: AbortSignal): Promise<ConjuntoDeCotacoes> {
  const resposta = (await buscarJson(`https://api.frankfurter.dev/v1/latest?base=BRL&symbols=${moedas.join(',')}`, sinal)) as {
    date: string;
    rates: Record<string, number>;
  };
  const emReais: Record<string, number> = {};
  for (const [moeda, unidadesPorReal] of Object.entries(resposta.rates)) {
    if (unidadesPorReal > 0) emReais[moeda] = 1 / unidadesPorReal;
  }
  return { emReais, dataHora: new Date(`${resposta.date}T16:00:00Z`).toISOString(), origem: 'Frankfurter' };
}

export function lerCotacoesSalvas(): ConjuntoDeCotacoes | null {
  try {
    const salvo = localStorage.getItem(CHAVE_DO_CACHE);
    return salvo ? (JSON.parse(salvo) as ConjuntoDeCotacoes) : null;
  } catch {
    return null;
  }
}

function salvarCotacoes(cotacoes: ConjuntoDeCotacoes) {
  try {
    const anteriores = lerCotacoesSalvas();
    localStorage.setItem(CHAVE_DO_CACHE, JSON.stringify({ ...cotacoes, emReais: { ...anteriores?.emReais, ...cotacoes.emReais } }));
  } catch {
    return;
  }
}

async function buscarUmaAUmaNaAwesome(moedas: string[], sinal?: AbortSignal): Promise<ConjuntoDeCotacoes> {
  const resultado: ConjuntoDeCotacoes = { emReais: {}, dataHora: '', origem: 'AwesomeAPI' };
  const tentativas = await Promise.allSettled(moedas.map((moeda) => buscarNaAwesome([moeda], sinal)));
  for (const tentativa of tentativas) {
    if (tentativa.status !== 'fulfilled') continue;
    Object.assign(resultado.emReais, tentativa.value.emReais);
    if (tentativa.value.dataHora > resultado.dataHora) resultado.dataHora = tentativa.value.dataHora;
  }
  return resultado;
}

async function completarComFrankfurter(resultado: ConjuntoDeCotacoes, moedas: string[], sinal?: AbortSignal): Promise<ConjuntoDeCotacoes> {
  const faltando = moedas.filter((moeda) => !(moeda in resultado.emReais));
  if (!faltando.length) return resultado;
  try {
    const frankfurter = await buscarNaFrankfurter(faltando, sinal);
    const nenhumaAntes = !Object.keys(resultado.emReais).length || !resultado.dataHora;
    return {
      emReais: { ...resultado.emReais, ...frankfurter.emReais },
      dataHora: nenhumaAntes ? frankfurter.dataHora : resultado.dataHora,
      origem: nenhumaAntes ? 'Frankfurter' : resultado.origem,
    };
  } catch (erro) {
    if (sinal?.aborted) throw erro;
    return resultado;
  }
}

export async function buscarCotacoes(moedasPedidas: string[], sinal?: AbortSignal): Promise<ConjuntoDeCotacoes> {
  const moedas = [...new Set(moedasPedidas.filter((moeda) => moeda !== 'BRL'))];
  if (!moedas.length) return { emReais: {}, dataHora: new Date().toISOString(), origem: 'AwesomeAPI' };

  let resultado: ConjuntoDeCotacoes;
  try {
    resultado = await buscarNaAwesome(moedas, sinal);
  } catch (erro) {
    if (sinal?.aborted) throw erro;
    resultado = await buscarUmaAUmaNaAwesome(moedas, sinal);
  }
  resultado = await completarComFrankfurter(resultado, moedas, sinal);

  if (!Object.keys(resultado.emReais).length) throw new Error('Nenhuma fonte de câmbio respondeu');
  if (!resultado.dataHora) resultado = { ...resultado, dataHora: new Date().toISOString() };
  salvarCotacoes(resultado);
  return resultado;
}
