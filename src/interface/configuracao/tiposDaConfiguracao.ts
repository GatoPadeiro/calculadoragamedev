import type { CotacoesAoVivo } from '../../cambio/useCotacoesAoVivo';
import type { EstadoDoApp } from '../../estado/estadoDoApp';

export type AlterarEstado = (alteracao: (estado: EstadoDoApp) => void) => void;

export type OrigemDaCotacaoUsada = 'ao vivo' | 'cache' | 'referência' | 'manual' | 'link';

export interface CotacaoUsada {
  emReais: number;
  origem: OrigemDaCotacaoUsada;
  dataHora?: string;
}

export interface SituacaoDoCambio {
  aoVivo: CotacoesAoVivo;
  usadasPorMoeda: Record<string, CotacaoUsada>;
}

export interface PropriedadesDaSecao {
  estado: EstadoDoApp;
  alterarEstado: AlterarEstado;
}
