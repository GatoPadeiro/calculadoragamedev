import { ENGINES } from '../dados/engines';
import { LOJAS } from '../dados/lojas';
import type { Cenario, Estudio, LinhaDeVenda, NoDaDivisao, ParteDaDivisao, Socio } from '../calculo/tipos';
import { CENARIO_DE_EXEMPLO } from '../calculo/cenarioDeExemplo';

export type CenarioSemCotacoes = Omit<Cenario, 'cotacoes'>;

type ObjetoDesconhecido = Record<string, unknown>;

const PROFUNDIDADE_MAXIMA_DA_DIVISAO = 8;
const MAXIMO_DE_PARTES_POR_GRUPO = 50;
export const MAXIMO_DE_SOCIOS = 30;
export const MAXIMO_DE_LINHAS_DE_VENDA = 200;

const ehObjeto = (valor: unknown): valor is ObjetoDesconhecido => typeof valor === 'object' && valor !== null;

export function lerNumero(valor: unknown, minimo = -Infinity, maximo = Infinity): number | null {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= minimo && valor <= maximo ? valor : null;
}

export function lerTexto(valor: unknown, tamanhoMaximo = 120): string | null {
  return typeof valor === 'string' && valor.length <= tamanhoMaximo ? valor : null;
}

function lerBooleano(valor: unknown): boolean | null {
  return typeof valor === 'boolean' ? valor : null;
}

function validarSocio(valor: unknown): Socio | null {
  if (!ehObjeto(valor)) return null;
  const id = lerTexto(valor.id, 40);
  const nome = lerTexto(valor.nome, 80);
  const proLaboreMensal = lerNumero(valor.proLaboreMensal, 0, 1e9);
  const tipoValido = valor.tipo === 'pessoaFisica' || valor.tipo === 'empresa';
  if (id === null || nome === null || proLaboreMensal === null || !tipoValido) return null;
  return { id, nome, tipo: valor.tipo as Socio['tipo'], proLaboreMensal };
}

function validarParte(valor: unknown, profundidade: number): ParteDaDivisao | null {
  if (!ehObjeto(valor)) return null;
  const fatia = lerNumero(valor.fatia, 0, 1);
  const no = validarNo(valor.no, profundidade + 1);
  return fatia === null || no === null ? null : { fatia, no };
}

function validarNo(valor: unknown, profundidade: number): NoDaDivisao | null {
  if (!ehObjeto(valor) || profundidade > PROFUNDIDADE_MAXIMA_DA_DIVISAO) return null;
  if (valor.tipo === 'socio') {
    const idSocio = lerTexto(valor.idSocio, 40);
    return idSocio === null ? null : { tipo: 'socio', idSocio };
  }
  if (valor.tipo !== 'grupo') return null;
  const id = lerTexto(valor.id, 40);
  const nome = lerTexto(valor.nome, 80);
  if (id === null || nome === null || !Array.isArray(valor.partes) || valor.partes.length > MAXIMO_DE_PARTES_POR_GRUPO) return null;
  const partes = valor.partes.map((parte) => validarParte(parte, profundidade));
  if (partes.some((parte) => parte === null)) return null;
  return { tipo: 'grupo', id, nome, partes: partes as ParteDaDivisao[] };
}

function validarLinhaDeVenda(valor: unknown): LinhaDeVenda | null {
  if (!ehObjeto(valor)) return null;
  const id = lerTexto(valor.id, 40);
  const pais = lerTexto(valor.pais, 3);
  const moeda = lerTexto(valor.moeda, 3);
  const precoPorCopia = lerNumero(valor.precoPorCopia, 0, 1e12);
  const copias = lerNumero(valor.copias, 0, 1e13);
  const impostoConsumoNoPreco = lerNumero(valor.impostoConsumoNoPreco, 0, 1);
  const taxaDeReembolso = lerNumero(valor.taxaDeReembolso, 0, 1);
  const loja = typeof valor.loja === 'string' && valor.loja in LOJAS ? (valor.loja as LinhaDeVenda['loja']) : null;
  if (id === null || pais === null || moeda === null || precoPorCopia === null || copias === null) return null;
  if (impostoConsumoNoPreco === null || taxaDeReembolso === null || loja === null) return null;
  return { id, pais, loja, moeda: moeda.toUpperCase(), precoPorCopia, copias, impostoConsumoNoPreco, taxaDeReembolso };
}

function validarEstudio(valor: unknown): Estudio {
  const estudio = ehObjeto(valor) ? valor : {};
  const remessa = ehObjeto(estudio.remessa) ? estudio.remessa : {};
  const padrao = CENARIO_DE_EXEMPLO.estudio;
  const regimeValido = estudio.regime === 'simples' || estudio.regime === 'presumido';
  const engineValida = typeof estudio.engine === 'string' && estudio.engine in ENGINES;
  return {
    regime: regimeValido ? (estudio.regime as Estudio['regime']) : 'automatico',
    iss: lerNumero(estudio.iss, 0.02, 0.05) ?? padrao.iss,
    vendaContaComoExportacao: lerBooleano(estudio.vendaContaComoExportacao) ?? false,
    engine: engineValida ? (estudio.engine as Estudio['engine']) : padrao.engine,
    lancadoTambemNaEpic: lerBooleano(estudio.lancadoTambemNaEpic) ?? false,
    appStorePequenoDesenvolvedor: lerBooleano(estudio.appStorePequenoDesenvolvedor) ?? true,
    aplicarRetencaoDosEua: lerBooleano(estudio.aplicarRetencaoDosEua) ?? true,
    remessa: {
      irrf: lerNumero(remessa.irrf, 0, 0.5) ?? padrao.remessa.irrf,
      iof: lerNumero(remessa.iof, 0, 0.1) ?? padrao.remessa.iof,
      empresaPagaIrrfPorFora: lerBooleano(remessa.empresaPagaIrrfPorFora) ?? true,
    },
  };
}

export function validarCenario(valor: unknown): CenarioSemCotacoes | null {
  if (!ehObjeto(valor)) return null;
  if (!Array.isArray(valor.socios) || !Array.isArray(valor.vendas)) return null;
  if (valor.socios.length > MAXIMO_DE_SOCIOS || valor.vendas.length > MAXIMO_DE_LINHAS_DE_VENDA) return null;
  const socios = valor.socios.map(validarSocio);
  const vendas = valor.vendas.map(validarLinhaDeVenda);
  const divisao = validarNo(valor.divisao, 0);
  if (socios.some((socio) => !socio) || vendas.some((linha) => !linha) || !divisao || divisao.tipo !== 'grupo') return null;
  const custos = ehObjeto(valor.custos) ? valor.custos : {};
  return {
    estudio: validarEstudio(valor.estudio),
    socios: socios as Socio[],
    vendas: vendas as LinhaDeVenda[],
    divisao,
    custos: {
      salariosMensais: lerNumero(custos.salariosMensais, 0, 1e10) ?? 0,
      outrosCustosAnuais: lerNumero(custos.outrosCustosAnuais, 0, 1e12) ?? 0,
    },
  };
}

export function validarCotacoes(valor: unknown): Record<string, number> {
  const cotacoes: Record<string, number> = {};
  if (!ehObjeto(valor)) return cotacoes;
  for (const [moeda, cotacao] of Object.entries(valor)) {
    const emReais = lerNumero(cotacao, 0, 1e6);
    if (/^[A-Z]{3}$/.test(moeda) && emReais && emReais > 0) cotacoes[moeda] = emReais;
  }
  return cotacoes;
}
