import type { IdEngine } from '../dados/engines';
import type { IdLoja } from '../dados/lojas';

export type { IdEngine, IdLoja };

export type CodigoDeMoeda = string;

export type EscolhaDeRegime = 'automatico' | 'simples' | 'presumido';
export type Regime = 'simples' | 'presumido';
export type AnexoDoSimples = 'III' | 'V';

export interface LinhaDeVenda {
  id: string;
  pais: string;
  loja: IdLoja;
  moeda: CodigoDeMoeda;
  precoPorCopia: number;
  copias: number;
  impostoConsumoNoPreco: number;
  taxaDeReembolso: number;
}

export interface RemessaAoExterior {
  irrf: number;
  iof: number;
  empresaPagaIrrfPorFora: boolean;
}

export interface Estudio {
  regime: EscolhaDeRegime;
  iss: number;
  vendaContaComoExportacao: boolean;
  engine: IdEngine;
  lancadoTambemNaEpic: boolean;
  appStorePequenoDesenvolvedor: boolean;
  aplicarRetencaoDosEua: boolean;
  remessa: RemessaAoExterior;
}

export type TipoDeSocio = 'pessoaFisica' | 'empresa';

export interface Socio {
  id: string;
  nome: string;
  tipo: TipoDeSocio;
  proLaboreMensal: number;
}

export interface GrupoDaDivisao {
  tipo: 'grupo';
  id: string;
  nome: string;
  partes: ParteDaDivisao[];
}

export interface SocioNaDivisao {
  tipo: 'socio';
  idSocio: string;
}

export type NoDaDivisao = GrupoDaDivisao | SocioNaDivisao;

export interface ParteDaDivisao {
  fatia: number;
  no: NoDaDivisao;
}

export interface Custos {
  salariosMensais: number;
  outrosCustosAnuais: number;
}

export type CotacoesEmReais = Record<CodigoDeMoeda, number>;

export interface Cenario {
  estudio: Estudio;
  socios: Socio[];
  divisao: GrupoDaDivisao;
  vendas: LinhaDeVenda[];
  cotacoes: CotacoesEmReais;
  custos: Custos;
}
