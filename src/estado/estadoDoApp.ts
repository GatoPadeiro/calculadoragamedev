import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { CENARIO_DE_EXEMPLO } from '../calculo/cenarioDeExemplo';
import { SALARIO_MINIMO } from '../dados/tabelasTributarias';
import { lerTexto, validarCenario, validarCotacoes, type CenarioSemCotacoes } from './validarCenario';

export interface CotacoesDoLink {
  emReais: Record<string, number>;
  dataHora: string;
}

export interface EstadoDoApp {
  versao: 2;
  nomeDoEstudio: string;
  nomeDoJogo: string;
  cenario: CenarioSemCotacoes;
  cotacoesTravadas: Record<string, number>;
  cotacoesDoLink?: CotacoesDoLink;
  ehExemploSemEdicao: boolean;
}

export type OrigemDoEstado = 'link' | 'salvo' | 'exemplo' | 'link-invalido';

const CHAVE_NO_NAVEGADOR = 'cgd:cenario:v2';
const PREFIXO_DO_LINK = '#c=';

export function criarEstadoDeExemplo(): EstadoDoApp {
  const { cotacoes: _cotacoes, ...cenario } = structuredClone(CENARIO_DE_EXEMPLO);
  return { versao: 2, nomeDoEstudio: 'Estúdio Exemplo', nomeDoJogo: 'Jogo de Exemplo', cenario, cotacoesTravadas: {}, ehExemploSemEdicao: true };
}

export function criarIdentificador(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function criarEstadoVazio(): EstadoDoApp {
  return {
    versao: 2,
    nomeDoEstudio: '',
    nomeDoJogo: '',
    ehExemploSemEdicao: false,
    cotacoesTravadas: {},
    cenario: {
      estudio: { ...CENARIO_DE_EXEMPLO.estudio },
      socios: [{ id: criarIdentificador(), nome: 'Sócio 1', tipo: 'pessoaFisica', proLaboreMensal: SALARIO_MINIMO.valorMensal }],
      divisao: { tipo: 'grupo', id: 'raiz', nome: 'Lucro distribuível', partes: [] },
      vendas: [{ id: criarIdentificador(), pais: 'US', loja: 'steam', moeda: 'USD', precoPorCopia: 0, copias: 0, impostoConsumoNoPreco: 0, taxaDeReembolso: 0.05 }],
      custos: { salariosMensais: 0, outrosCustosAnuais: 0 },
    },
  };
}

function validarCotacoesDoLink(valor: unknown): CotacoesDoLink | undefined {
  if (typeof valor !== 'object' || valor === null) return undefined;
  const { emReais, dataHora } = valor as Record<string, unknown>;
  const dataHoraValida = lerTexto(dataHora, 40);
  return dataHoraValida ? { emReais: validarCotacoes(emReais), dataHora: dataHoraValida } : undefined;
}

export function validarEstado(valor: unknown): EstadoDoApp | null {
  if (typeof valor !== 'object' || valor === null) return null;
  const estado = valor as Record<string, unknown>;
  if (estado.versao !== 2) return null;
  const cenario = validarCenario(estado.cenario);
  if (!cenario) return null;
  return {
    versao: 2,
    nomeDoEstudio: lerTexto(estado.nomeDoEstudio, 80) ?? '',
    nomeDoJogo: lerTexto(estado.nomeDoJogo, 80) ?? '',
    cenario,
    cotacoesTravadas: validarCotacoes(estado.cotacoesTravadas),
    cotacoesDoLink: validarCotacoesDoLink(estado.cotacoesDoLink),
    ehExemploSemEdicao: false,
  };
}

export function codificarParaLink(estado: EstadoDoApp, cotacoesUsadas: Record<string, number>, dataHoraDasCotacoes: string): string {
  const { ehExemploSemEdicao: _ehExemplo, ...estadoCompartilhado } = estado;
  const cotacoesDoLink: CotacoesDoLink = { emReais: cotacoesUsadas, dataHora: dataHoraDasCotacoes };
  return compressToEncodedURIComponent(JSON.stringify({ ...estadoCompartilhado, cotacoesDoLink }));
}

export function decodificarDoLink(codigo: string): EstadoDoApp | null {
  try {
    const json = decompressFromEncodedURIComponent(codigo);
    return json ? validarEstado(JSON.parse(json)) : null;
  } catch {
    return null;
  }
}

export function montarEnderecoDoLink(estado: EstadoDoApp, cotacoesUsadas: Record<string, number>, dataHoraDasCotacoes: string): string {
  return `${PREFIXO_DO_LINK}${codificarParaLink(estado, cotacoesUsadas, dataHoraDasCotacoes)}`;
}

function lerEstadoDoEndereco(): { estado: EstadoDoApp; origem: OrigemDoEstado } | null {
  if (!location.hash.startsWith(PREFIXO_DO_LINK)) return null;
  const estado = decodificarDoLink(location.hash.slice(PREFIXO_DO_LINK.length));
  return estado ? { estado, origem: 'link' } : { estado: criarEstadoDeExemplo(), origem: 'link-invalido' };
}

function lerEstadoSalvo(): EstadoDoApp | null {
  try {
    const salvo = localStorage.getItem(CHAVE_NO_NAVEGADOR);
    if (!salvo) return null;
    const conteudo = JSON.parse(salvo) as Record<string, unknown>;
    if (conteudo.ehExemploSemEdicao === true) return null;
    const estado = validarEstado(conteudo);
    return estado ? { ...estado, cotacoesDoLink: undefined } : null;
  } catch {
    return null;
  }
}

export function carregarEstadoInicial(): { estado: EstadoDoApp; origem: OrigemDoEstado } {
  const doEndereco = lerEstadoDoEndereco();
  if (doEndereco) return doEndereco;
  const salvo = lerEstadoSalvo();
  if (salvo) return { estado: salvo, origem: 'salvo' };
  return { estado: criarEstadoDeExemplo(), origem: 'exemplo' };
}

export function salvarNoNavegador(estado: EstadoDoApp): boolean {
  try {
    localStorage.setItem(CHAVE_NO_NAVEGADOR, JSON.stringify(estado));
    return true;
  } catch {
    return false;
  }
}
