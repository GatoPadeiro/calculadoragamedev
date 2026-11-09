import { useCallback, useEffect, useRef, useState } from 'react';
import { buscarCotacoes, COTACOES_DE_REFERENCIA, lerCotacoesSalvas, type OrigemDaCotacao } from './cotacoes';

export type SituacaoDaBusca = 'carregando' | 'ok' | 'falhou';

export interface CotacaoDaMoeda {
  emReais: number;
  dataHora: string;
  origem: OrigemDaCotacao;
}

export interface CotacoesAoVivo {
  situacao: SituacaoDaBusca;
  porMoeda: Record<string, CotacaoDaMoeda>;
  atualizar: () => void;
}

const CINCO_MINUTOS = 5 * 60 * 1000;

function cotacoesIniciais(): Record<string, CotacaoDaMoeda> {
  const porMoeda: Record<string, CotacaoDaMoeda> = {};
  for (const [moeda, emReais] of Object.entries(COTACOES_DE_REFERENCIA.emReais)) {
    porMoeda[moeda] = { emReais, dataHora: COTACOES_DE_REFERENCIA.dataHora, origem: 'referência' };
  }
  const salvas = lerCotacoesSalvas();
  if (salvas) {
    for (const [moeda, emReais] of Object.entries(salvas.emReais)) porMoeda[moeda] = { emReais, dataHora: salvas.dataHora, origem: 'cache' };
  }
  return porMoeda;
}

export function useCotacoesAoVivo(moedas: string[]): CotacoesAoVivo {
  const moedasOrdenadas = [...new Set(moedas)].filter((moeda) => moeda !== 'BRL').sort().join(',');
  const [situacao, setSituacao] = useState<SituacaoDaBusca>('carregando');
  const [porMoeda, setPorMoeda] = useState(cotacoesIniciais);
  const buscaEmAndamento = useRef<AbortController | null>(null);

  const atualizar = useCallback(() => {
    if (!moedasOrdenadas) {
      setSituacao('ok');
      return;
    }
    buscaEmAndamento.current?.abort();
    const controle = new AbortController();
    buscaEmAndamento.current = controle;
    setSituacao('carregando');
    buscarCotacoes(moedasOrdenadas.split(','), controle.signal)
      .then((cotacoes) => {
        setPorMoeda((anteriores) => {
          const atualizadas = { ...anteriores };
          for (const [moeda, emReais] of Object.entries(cotacoes.emReais)) {
            atualizadas[moeda] = { emReais, dataHora: cotacoes.dataHora, origem: cotacoes.origem };
          }
          return atualizadas;
        });
        setSituacao('ok');
      })
      .catch(() => {
        if (!controle.signal.aborted) setSituacao('falhou');
      });
  }, [moedasOrdenadas]);

  useEffect(() => {
    atualizar();
    const intervalo = window.setInterval(() => {
      if (document.visibilityState === 'visible') atualizar();
    }, CINCO_MINUTOS);
    return () => {
      window.clearInterval(intervalo);
      buscaEmAndamento.current?.abort();
    };
  }, [atualizar]);

  return { situacao, porMoeda, atualizar };
}
