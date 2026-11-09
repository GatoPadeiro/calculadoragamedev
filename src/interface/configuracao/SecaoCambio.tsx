import { formatarDataHora, simboloDaMoeda } from '../formatacao';
import { IconeAtualizar, IconeCadeado } from '../icones';
import { CampoNumerico } from '../CampoNumerico';
import { SecaoNumerada } from './Controles';
import type { CotacaoUsada, PropriedadesDaSecao, SituacaoDoCambio } from './tiposDaConfiguracao';

const COTACAO_MAXIMA = 1e5;

function formatarCotacao(emReais: number): string {
  const casas = emReais < 0.1 ? 6 : 4;
  return `R$ ${emReais.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: casas })}`;
}

function descreverSituacao(estado: PropriedadesDaSecao['estado'], cambio: SituacaoDoCambio): string {
  if (estado.cotacoesDoLink) return `Cotação do link, de ${formatarDataHora(estado.cotacoesDoLink.dataHora)}`;
  if (cambio.aoVivo.situacao === 'carregando') return 'Buscando cotação…';
  if (cambio.aoVivo.situacao === 'falhou') return 'Sem conexão com a cotação';
  return 'Cotação ao vivo';
}

interface PropriedadesDaLinhaDeCotacao extends Pick<PropriedadesDaSecao, 'alterarEstado'> {
  moeda: string;
  cotacaoUsada?: CotacaoUsada;
  valorTravado?: number;
}

function LinhaDeCotacao({ moeda, cotacaoUsada, valorTravado, alterarEstado }: PropriedadesDaLinhaDeCotacao) {
  const estaTravada = valorTravado !== undefined;
  const alternarTrava = (travar: boolean) =>
    alterarEstado((rascunho) => {
      if (travar) rascunho.cotacoesTravadas[moeda] = cotacaoUsada?.emReais ?? 1;
      else delete rascunho.cotacoesTravadas[moeda];
    });

  return (
    <li className="fx-row">
      <span className="fx-code">
        <b>{moeda}</b>
        <small>1 {simboloDaMoeda(moeda)} =</small>
      </span>
      {estaTravada ? (
        <CampoNumerico
          rotulo={`Cotação manual do ${moeda} em reais`}
          esconderRotulo
          prefixo="R$"
          casasDecimais={4}
          valor={valorTravado}
          maximo={COTACAO_MAXIMA}
          mostrarAbreviacao={false}
          aoMudar={(emReais) => alterarEstado((rascunho) => void (rascunho.cotacoesTravadas[moeda] = emReais))}
        />
      ) : (
        <output className="computed fx-value">
          {cotacaoUsada ? formatarCotacao(cotacaoUsada.emReais) : 'sem cotação'}
          {cotacaoUsada && (
            <small>
              {cotacaoUsada.origem}
              {cotacaoUsada.dataHora ? ` · ${formatarDataHora(cotacaoUsada.dataHora)}` : ''}
            </small>
          )}
        </output>
      )}
      <label className="fx-lock" title={estaTravada ? 'Destravar e voltar à cotação automática' : 'Travar um valor manual'}>
        <input type="checkbox" checked={estaTravada} onChange={(evento) => alternarTrava(evento.target.checked)} />
        <IconeCadeado tamanho={16} />
        <span className="sr-only">Travar valor manual para {moeda}</span>
      </label>
    </li>
  );
}

export function SecaoCambio({ estado, alterarEstado, cambio }: PropriedadesDaSecao & { cambio: SituacaoDoCambio }) {
  const moedas = [...new Set(['USD', ...estado.cenario.vendas.map((linha) => linha.moeda)])].filter((moeda) => moeda !== 'BRL');
  const { aoVivo } = cambio;
  const usandoCotacoesDoLink = Boolean(estado.cotacoesDoLink);

  return (
    <SecaoNumerada numero="04" titulo="Câmbio" resumo={descreverSituacao(estado, cambio)}>
      {usandoCotacoesDoLink && (
        <div className="notice">
          <p>Este cenário veio de um link e usa as cotações de quando foi criado, para mostrar os mesmos números.</p>
          <button type="button" className="btn-line" onClick={() => alterarEstado((rascunho) => void (rascunho.cotacoesDoLink = undefined))}>
            Usar a cotação de hoje
          </button>
        </div>
      )}
      {aoVivo.situacao === 'falhou' && !usandoCotacoesDoLink && (
        <p className="notice is-warn" role="status">
          Não foi possível buscar a cotação agora. Usando a última cotação salva neste navegador ou um valor de referência. Você pode travar um valor à mão.
        </p>
      )}
      <ul className="fx-list">
        {moedas.map((moeda) => (
          <LinhaDeCotacao key={moeda} moeda={moeda} cotacaoUsada={cambio.usadasPorMoeda[moeda]} valorTravado={estado.cotacoesTravadas[moeda]} alterarEstado={alterarEstado} />
        ))}
      </ul>
      <button type="button" className="btn-line" onClick={aoVivo.atualizar} disabled={aoVivo.situacao === 'carregando' || usandoCotacoesDoLink}>
        <IconeAtualizar className={aoVivo.situacao === 'carregando' ? 'spin' : undefined} /> Atualizar cotação
      </button>
      <p className="field-hint">Fonte: AwesomeAPI, com o Banco Central Europeu (Frankfurter) de reserva. Atualiza a cada 5 minutos com a aba aberta.</p>
    </SecaoNumerada>
  );
}
