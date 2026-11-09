import { useCallback, useEffect, useMemo, useState } from 'react';
import { calcularCenario } from '../../calculo/calcularCenario';
import { useCotacoesAoVivo } from '../../cambio/useCotacoesAoVivo';
import { carregarEstadoInicial, montarEnderecoDoLink, salvarNoNavegador, type EstadoDoApp } from '../../estado/estadoDoApp';
import type { AlterarEstado, CotacaoUsada, SituacaoDoCambio } from '../../interface/configuracao/tiposDaConfiguracao';

const ESPERA_PARA_SALVAR_EM_MS = 400;

export type SituacaoDoSalvamento = 'salvo' | 'falhou' | null;

function origemParaExibir(origem: string): CotacaoUsada['origem'] {
  if (origem === 'cache' || origem === 'referência') return origem;
  return 'ao vivo';
}

function combinarCotacoes(estado: EstadoDoApp, aoVivo: SituacaoDoCambio['aoVivo']): Record<string, CotacaoUsada> {
  const usadas: Record<string, CotacaoUsada> = {};
  for (const [moeda, cotacao] of Object.entries(aoVivo.porMoeda)) {
    usadas[moeda] = { emReais: cotacao.emReais, dataHora: cotacao.dataHora, origem: origemParaExibir(cotacao.origem) };
  }
  if (estado.cotacoesDoLink) {
    for (const [moeda, emReais] of Object.entries(estado.cotacoesDoLink.emReais)) {
      usadas[moeda] = { emReais, dataHora: estado.cotacoesDoLink.dataHora, origem: 'link' };
    }
  }
  for (const [moeda, emReais] of Object.entries(estado.cotacoesTravadas)) usadas[moeda] = { emReais, origem: 'manual' };
  return usadas;
}

export function useCenario() {
  const [inicial] = useState(carregarEstadoInicial);
  const [estado, setEstado] = useState<EstadoDoApp>(inicial.estado);
  const [situacaoDoSalvamento, setSituacaoDoSalvamento] = useState<SituacaoDoSalvamento>(null);

  const alterarEstado: AlterarEstado = useCallback((alteracao) => {
    setEstado((anterior) => {
      const rascunho = structuredClone(anterior);
      alteracao(rascunho);
      rascunho.ehExemploSemEdicao = false;
      return rascunho;
    });
  }, []);

  const moedasUsadas = useMemo(() => ['USD', ...estado.cenario.vendas.map((linha) => linha.moeda)], [estado.cenario.vendas]);
  const aoVivo = useCotacoesAoVivo(moedasUsadas);
  const cambio: SituacaoDoCambio = useMemo(() => ({ aoVivo, usadasPorMoeda: combinarCotacoes(estado, aoVivo) }), [aoVivo, estado]);
  const cotacoesEmReais = useMemo(
    () => Object.fromEntries(Object.entries(cambio.usadasPorMoeda).map(([moeda, cotacao]) => [moeda, cotacao.emReais])),
    [cambio.usadasPorMoeda],
  );
  const resultado = useMemo(() => calcularCenario({ ...estado.cenario, cotacoes: cotacoesEmReais }), [estado.cenario, cotacoesEmReais]);
  const dataHoraDasCotacoes = estado.cotacoesDoLink?.dataHora ?? cambio.usadasPorMoeda.USD?.dataHora ?? new Date().toISOString();

  const enderecoDoLink = useCallback(() => montarEnderecoDoLink(estado, cotacoesEmReais, dataHoraDasCotacoes), [estado, cotacoesEmReais, dataHoraDasCotacoes]);

  useEffect(() => {
    const espera = window.setTimeout(() => {
      setSituacaoDoSalvamento(salvarNoNavegador(estado) ? 'salvo' : 'falhou');
      const novoEndereco = estado.ehExemploSemEdicao ? location.pathname : enderecoDoLink();
      if (estado.ehExemploSemEdicao && !location.hash) return;
      history.replaceState(null, '', novoEndereco);
    }, ESPERA_PARA_SALVAR_EM_MS);
    return () => window.clearTimeout(espera);
  }, [estado, enderecoDoLink]);

  return {
    estado,
    setEstado,
    origem: inicial.origem,
    alterarEstado,
    cambio,
    resultado,
    cotacaoDoDolar: cotacoesEmReais.USD ?? 0,
    enderecoDoLink,
    situacaoDoSalvamento,
  };
}
