import { useCallback, useEffect, useState } from 'react';
import { criarEstadoDeExemplo, criarEstadoVazio, type OrigemDoEstado } from '../../estado/estadoDoApp';
import { Configuracao } from '../../interface/configuracao/Configuracao';
import { Resultado } from '../../interface/resultado/Resultado';
import { AssinaturaDoEstudio } from '../../interface/Marca';
import { formatarReais, formatarReaisAbreviado } from '../../interface/formatacao';
import { IconeBaixar, IconeImprimir, IconeLink, IconeRecomecar } from '../../interface/icones';
import { copiarParaAreaDeTransferencia, enderecoCompleto } from './copiarLink';
import { baixarPlanilha } from './exportarPlanilha';
import { useCenario, type SituacaoDoSalvamento } from './useCenario';
import { metadadosDaRota } from '../metadadosDasPaginas';

type Aba = 'configurar' | 'resultado';

const TEMPO_DO_AVISO_DE_COPIADO_EM_MS = 2400;
const MESES_NO_ANO = 12;

function useAvisoTemporario(): [boolean, () => void] {
  const [visivel, setVisivel] = useState(false);
  const mostrar = useCallback(() => {
    setVisivel(true);
    window.setTimeout(() => setVisivel(false), TEMPO_DO_AVISO_DE_COPIADO_EM_MS);
  }, []);
  return [visivel, mostrar];
}

function mensagemDoSalvamento(situacao: SituacaoDoSalvamento): string {
  if (situacao === 'salvo') return 'Salvo neste navegador.';
  if (situacao === 'falhou') return 'Este navegador não deixou salvar. Use o link para guardar o cenário.';
  return '';
}

interface PropriedadesDasAcoes {
  aoCopiarLink: () => Promise<boolean>;
  aoBaixarPlanilha: () => void;
  situacaoDoSalvamento: SituacaoDoSalvamento;
}

function AcoesDoCenario({ aoCopiarLink, aoBaixarPlanilha, situacaoDoSalvamento }: PropriedadesDasAcoes) {
  const [linkCopiado, mostrarLinkCopiado] = useAvisoTemporario();
  return (
    <>
      <h2 className="block-title">Levar este cenário</h2>
      <div className="actions">
        <button type="button" className="btn-primary" onClick={() => aoCopiarLink().then(mostrarLinkCopiado)}>
          <IconeLink /> {linkCopiado ? 'Link copiado' : 'Copiar link do cenário'}
        </button>
        <button type="button" className="btn-line" onClick={aoBaixarPlanilha}>
          <IconeBaixar /> Baixar planilha (CSV)
        </button>
        <button type="button" className="btn-line" onClick={() => window.print()}>
          <IconeImprimir /> Imprimir ou salvar em PDF
        </button>
      </div>
      <p className="field-hint" aria-live="polite">
        {mensagemDoSalvamento(situacaoDoSalvamento)}
      </p>
      <AssinaturaDoEstudio />
    </>
  );
}

function textoDoAviso(origem: OrigemDoEstado, ehExemploSemEdicao: boolean): string {
  if (origem === 'link-invalido') return 'O link não abriu um cenário válido. Carregamos o exemplo.';
  if (origem === 'link' && !ehExemploSemEdicao) return 'Cenário aberto de um link compartilhado.';
  return 'Este é um cenário de exemplo, com estúdio, sócios e números fictícios. Edite à vontade.';
}

interface PropriedadesDoAviso {
  origem: OrigemDoEstado;
  ehExemploSemEdicao: boolean;
  aoComecarDoZero: () => void;
  aoVerExemplo: () => void;
}

function AvisoDoCenario({ origem, ehExemploSemEdicao, aoComecarDoZero, aoVerExemplo }: PropriedadesDoAviso) {
  const deveMostrar = ehExemploSemEdicao || origem === 'link' || origem === 'link-invalido';
  if (!deveMostrar) return null;
  return (
    <div className="banner" role="status">
      <span>{textoDoAviso(origem, ehExemploSemEdicao)}</span>
      <span className="banner-actions">
        <button type="button" className="btn-text" onClick={aoComecarDoZero}>
          <IconeRecomecar tamanho={16} /> Começar do zero
        </button>
        {!ehExemploSemEdicao && (
          <button type="button" className="btn-text" onClick={aoVerExemplo}>
            Ver o exemplo
          </button>
        )}
      </span>
    </div>
  );
}

export function Calculadora({ registrarCopiarLink }: { registrarCopiarLink: (copiar: () => Promise<boolean>) => void }) {
  const { estado, setEstado, origem, alterarEstado, cambio, resultado, cotacaoDoDolar, enderecoDoLink, situacaoDoSalvamento } = useCenario();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('resultado');

  const copiarLink = useCallback(() => copiarParaAreaDeTransferencia(enderecoCompleto(enderecoDoLink())), [enderecoDoLink]);
  useEffect(() => registrarCopiarLink(copiarLink), [registrarCopiarLink, copiarLink]);

  const alternarAba = () => {
    setAbaAtiva(abaAtiva === 'configurar' ? 'resultado' : 'configurar');
    document.querySelector('.tabs')?.scrollIntoView({ block: 'start' });
  };
  const primeiroSocio = resultado.socios[0];

  return (
    <div className="calc">
      <header className="calc-head">
        <h1 className="calc-title">{metadadosDaRota('/').tituloVisivel}</h1>
        <p className="calc-lede">Quanto cada sócio recebe depois das lojas, da engine e dos impostos no Brasil. Grátis e sem cadastro.</p>
      </header>
      <AvisoDoCenario
        origem={origem}
        ehExemploSemEdicao={estado.ehExemploSemEdicao}
        aoComecarDoZero={() => setEstado(criarEstadoVazio())}
        aoVerExemplo={() => setEstado(criarEstadoDeExemplo())}
      />

      <div className="tabs" role="tablist" aria-label="Área da calculadora">
        <button type="button" role="tab" id="aba-configurar" aria-controls="painel-configurar" aria-selected={abaAtiva === 'configurar'} onClick={() => setAbaAtiva('configurar')}>
          Configurar
        </button>
        <button type="button" role="tab" id="aba-resultado" aria-controls="painel-resultado" aria-selected={abaAtiva === 'resultado'} onClick={() => setAbaAtiva('resultado')}>
          Resultado
        </button>
      </div>

      <div className="work">
        <aside id="painel-configurar" className={`work-config${abaAtiva === 'configurar' ? ' is-active' : ''}`} aria-label="Configuração">
          <Configuracao estado={estado} alterarEstado={alterarEstado} cambio={cambio} resultadosDasLinhas={resultado.linhas} />
        </aside>
        <main id="painel-resultado" className={`work-result${abaAtiva === 'resultado' ? ' is-active' : ''}`} aria-label="Resultado">
          <Resultado
            resultado={resultado}
            socios={estado.cenario.socios}
            cotacaoDoDolar={cotacaoDoDolar}
            acoes={
              <AcoesDoCenario
                aoCopiarLink={copiarLink}
                aoBaixarPlanilha={() => baixarPlanilha(estado, resultado, cotacaoDoDolar)}
                situacaoDoSalvamento={situacaoDoSalvamento}
              />
            }
          />
        </main>
      </div>

      <div className="dock" aria-label="Resumo">
        <span>
          <small>Lucro distribuível</small>
          <b className="num">{formatarReaisAbreviado(resultado.empresa.lucro)}</b>
        </span>
        {primeiroSocio && (
          <span>
            <small>{primeiroSocio.nome} por mês</small>
            <b className="num">{formatarReais(primeiroSocio.liquidoAnual / MESES_NO_ANO, 0)}</b>
          </span>
        )}
        <button type="button" className="btn-text" onClick={alternarAba}>
          {abaAtiva === 'configurar' ? 'Ver resultado' : 'Configurar'}
        </button>
      </div>
    </div>
  );
}
