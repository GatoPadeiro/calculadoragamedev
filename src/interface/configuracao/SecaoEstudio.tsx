import { ENGINES, type IdEngine } from '../../dados/engines';
import type { EscolhaDeRegime } from '../../calculo/tipos';
import { formatarPercentual } from '../formatacao';
import { CampoPercentual } from '../CampoNumerico';
import { CaixaDeMarcar, CampoDeTexto, SecaoNumerada, Selecao } from './Controles';
import type { PropriedadesDaSecao } from './tiposDaConfiguracao';

const OPCOES_DE_REGIME: { valor: EscolhaDeRegime; rotulo: string }[] = [
  { valor: 'automatico', rotulo: 'Automático' },
  { valor: 'simples', rotulo: 'Simples Nacional' },
  { valor: 'presumido', rotulo: 'Lucro Presumido' },
];

const OPCOES_DE_ISS = ['2', '3', '4', '5'].map((percentual) => ({ valor: percentual, rotulo: `${percentual}%` }));

const OPCOES_DE_ENGINE = Object.values(ENGINES).map((engine) => ({
  valor: engine.id,
  rotulo: engine.royalty ? `${engine.nome} (${formatarPercentual(engine.royalty)} acima de US$ 1 mi)` : `${engine.nome} (sem royalty)`,
}));

function RemessaDoRoyalty({ estado, alterarEstado }: PropriedadesDaSecao) {
  const remessa = estado.cenario.estudio.remessa;
  return (
    <fieldset className="subgroup">
      <legend>Remessa do royalty para o exterior</legend>
      <div className="grid-2">
        <CampoPercentual rotulo="IRRF" valor={remessa.irrf} maximo={50} aoMudar={(irrf) => alterarEstado((rascunho) => void (rascunho.cenario.estudio.remessa.irrf = irrf))} />
        <CampoPercentual rotulo="IOF" valor={remessa.iof} maximo={10} aoMudar={(iof) => alterarEstado((rascunho) => void (rascunho.cenario.estudio.remessa.iof = iof))} />
      </div>
      <CaixaDeMarcar
        rotulo="A empresa paga o IRRF por fora (gross-up)"
        dica="Desligado: o imposto sai do valor que a Epic recebe"
        marcada={remessa.empresaPagaIrrfPorFora}
        aoMudar={(marcada) => alterarEstado((rascunho) => void (rascunho.cenario.estudio.remessa.empresaPagaIrrfPorFora = marcada))}
      />
    </fieldset>
  );
}

export function SecaoEstudio({ estado, alterarEstado }: PropriedadesDaSecao) {
  const estudio = estado.cenario.estudio;
  const alterarEstudio = (alteracao: (estudioEmEdicao: typeof estudio) => void) => alterarEstado((rascunho) => alteracao(rascunho.cenario.estudio));
  return (
    <SecaoNumerada numero="01" titulo="Estúdio">
      <div className="grid-2">
        <CampoDeTexto rotulo="Estúdio" valor={estado.nomeDoEstudio} placeholder="Nome do estúdio" aoMudar={(nome) => alterarEstado((rascunho) => void (rascunho.nomeDoEstudio = nome))} />
        <CampoDeTexto rotulo="Jogo" valor={estado.nomeDoJogo} placeholder="Nome do jogo" aoMudar={(nome) => alterarEstado((rascunho) => void (rascunho.nomeDoJogo = nome))} />
      </div>
      <div className="grid-2">
        <Selecao rotulo="Regime tributário" valor={estudio.regime} opcoes={OPCOES_DE_REGIME} aoMudar={(regime) => alterarEstudio((edicao) => void (edicao.regime = regime))} />
        <Selecao
          rotulo="ISS do município"
          valor={String(Math.round(estudio.iss * 100))}
          opcoes={OPCOES_DE_ISS}
          aoMudar={(percentual) => alterarEstudio((edicao) => void (edicao.iss = Number(percentual) / 100))}
        />
      </div>
      <Selecao rotulo="Engine" valor={estudio.engine} opcoes={OPCOES_DE_ENGINE} aoMudar={(engine: IdEngine) => alterarEstudio((edicao) => void (edicao.engine = engine))} />
      <div className="toggles">
        {estudio.engine === 'unreal' && (
          <CaixaDeMarcar
            rotulo="Lançado na Epic Games Store junto com as outras lojas"
            dica="Launch Everywhere: lançar na Epic no mesmo dia ou antes baixa o royalty para 3,5%"
            marcada={estudio.lancadoTambemNaEpic}
            aoMudar={(marcada) => alterarEstudio((edicao) => void (edicao.lancadoTambemNaEpic = marcada))}
          />
        )}
        <CaixaDeMarcar
          rotulo="Venda conta como exportação de serviço"
          dica="Tira PIS, COFINS e ISS. Confirme com seu contador"
          marcada={estudio.vendaContaComoExportacao}
          aoMudar={(marcada) => alterarEstudio((edicao) => void (edicao.vendaContaComoExportacao = marcada))}
        />
        <CaixaDeMarcar
          rotulo="Retenção de 30% nas vendas dos EUA"
          dica="Brasil e EUA não têm acordo de bitributação"
          marcada={estudio.aplicarRetencaoDosEua}
          aoMudar={(marcada) => alterarEstudio((edicao) => void (edicao.aplicarRetencaoDosEua = marcada))}
        />
        <CaixaDeMarcar
          rotulo="App Store: programa para pequenos desenvolvedores"
          dica="Taxa de 15% para quem fatura até US$ 1 mi"
          marcada={estudio.appStorePequenoDesenvolvedor}
          aoMudar={(marcada) => alterarEstudio((edicao) => void (edicao.appStorePequenoDesenvolvedor = marcada))}
        />
      </div>
      {ENGINES[estudio.engine].royalty > 0 && <RemessaDoRoyalty estado={estado} alterarEstado={alterarEstado} />}
    </SecaoNumerada>
  );
}
