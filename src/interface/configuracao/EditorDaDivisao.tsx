import { somaEhValida, somarFatias } from '../../calculo/divisaoDoLucro';
import type { GrupoDaDivisao, ParteDaDivisao, Socio } from '../../calculo/tipos';
import { criarIdentificador } from '../../estado/estadoDoApp';
import { corDoSocio } from '../cores';
import { formatarPercentual } from '../formatacao';
import { IconeAdicionar, IconeDividir, IconeRemover } from '../icones';
import { CampoPercentual } from '../CampoNumerico';
import { CampoDeTexto, Selecao } from './Controles';
import type { PropriedadesDaSecao } from './tiposDaConfiguracao';

const PROFUNDIDADE_MAXIMA_PARA_DIVIDIR = 6;
const MAXIMO_DE_PARTES = 50;

type PropriedadesDoEditor = PropriedadesDaSecao & { grupo: GrupoDaDivisao; caminho: number[] };

function encontrarGrupo(raiz: GrupoDaDivisao, caminho: number[]): GrupoDaDivisao {
  return caminho.reduce((grupo, posicao) => grupo.partes[posicao]!.no as GrupoDaDivisao, raiz);
}

function descreverSoma(soma: number): string {
  if (somaEhValida(soma)) return 'Soma 100%';
  const diferenca = soma < 1 ? `faltam ${formatarPercentual(1 - soma, 2)}` : `sobram ${formatarPercentual(soma - 1, 2)}`;
  return `Soma ${formatarPercentual(soma, 2)}: ${diferenca}`;
}

function nomeDaParte(parte: ParteDaDivisao, socios: Socio[]): string {
  if (parte.no.tipo === 'grupo') return parte.no.nome;
  const idSocio = parte.no.idSocio;
  return socios.find((socio) => socio.id === idSocio)?.nome ?? 'sócio removido';
}

interface PropriedadesDaParte {
  parte: ParteDaDivisao;
  posicao: number;
  grupo: GrupoDaDivisao;
  caminho: number[];
  estado: PropriedadesDaSecao['estado'];
  alterarEstado: PropriedadesDaSecao['alterarEstado'];
  alterarGrupo: (alteracao: (grupo: GrupoDaDivisao) => void) => void;
}

function ParteDoGrupo({ parte, posicao, grupo, caminho, estado, alterarEstado, alterarGrupo }: PropriedadesDaParte) {
  const socios = estado.cenario.socios;
  const nome = nomeDaParte(parte, socios);
  const posicaoDoSocio = parte.no.tipo === 'socio' ? socios.findIndex((socio) => socio.id === (parte.no as { idSocio: string }).idSocio) : -1;
  const cor = posicaoDoSocio >= 0 ? corDoSocio(posicaoDoSocio) : null;
  const podeDividir = parte.no.tipo === 'socio' && caminho.length < PROFUNDIDADE_MAXIMA_PARA_DIVIDIR;

  const transformarEmGrupo = () =>
    alterarGrupo((grupoEmEdicao) => {
      const socioAtual = grupoEmEdicao.partes[posicao]!.no as { tipo: 'socio'; idSocio: string };
      grupoEmEdicao.partes[posicao]!.no = {
        tipo: 'grupo',
        id: criarIdentificador(),
        nome: `Grupo de ${nome}`,
        partes: [{ fatia: 1, no: { tipo: 'socio', idSocio: socioAtual.idSocio } }],
      };
    });

  return (
    <li className="split-row">
      <div className="split-line">
        <CampoPercentual
          rotulo={`Parte de ${nome} em ${grupo.nome}`}
          esconderRotulo
          valor={parte.fatia}
          aoMudar={(fatia) => alterarGrupo((grupoEmEdicao) => void (grupoEmEdicao.partes[posicao]!.fatia = fatia))}
          classe="split-share"
        />
        {parte.no.tipo === 'socio' ? (
          <Selecao
            rotulo={`Quem recebe esta parte de ${grupo.nome}`}
            esconderRotulo
            valor={parte.no.idSocio}
            opcoes={socios.map((socio) => ({ valor: socio.id, rotulo: socio.nome || 'Sem nome' }))}
            aoMudar={(idSocio) => alterarGrupo((grupoEmEdicao) => void (grupoEmEdicao.partes[posicao]!.no = { tipo: 'socio', idSocio }))}
            classe="split-who"
            estilo={cor ? { background: cor.fundo, color: cor.texto, borderColor: cor.fundo, fontWeight: 650 } : undefined}
          />
        ) : (
          <CampoDeTexto
            rotulo={`Nome do grupo dentro de ${grupo.nome}`}
            esconderRotulo
            valor={parte.no.nome}
            aoMudar={(novoNome) => alterarGrupo((grupoEmEdicao) => void ((grupoEmEdicao.partes[posicao]!.no as GrupoDaDivisao).nome = novoNome))}
            classe="split-who is-group"
          />
        )}
        {podeDividir && (
          <button type="button" className="icon-btn" aria-label={`Dividir a parte de ${nome} em um grupo`} title="Dividir" onClick={transformarEmGrupo}>
            <IconeDividir />
          </button>
        )}
        <button type="button" className="icon-btn" aria-label={`Remover a parte de ${nome}`} onClick={() => alterarGrupo((grupoEmEdicao) => void grupoEmEdicao.partes.splice(posicao, 1))}>
          <IconeRemover />
        </button>
      </div>
      {parte.no.tipo === 'grupo' && <EditorDaDivisao grupo={parte.no} caminho={[...caminho, posicao]} estado={estado} alterarEstado={alterarEstado} />}
    </li>
  );
}

export function EditorDaDivisao({ grupo, caminho, estado, alterarEstado }: PropriedadesDoEditor) {
  const soma = somarFatias(grupo);
  const socios = estado.cenario.socios;
  const alterarGrupo = (alteracao: (grupoEmEdicao: GrupoDaDivisao) => void) => alterarEstado((rascunho) => alteracao(encontrarGrupo(rascunho.cenario.divisao, caminho)));
  const adicionarParte = () =>
    alterarGrupo((grupoEmEdicao) => void grupoEmEdicao.partes.push({ fatia: Math.max(0, 1 - soma), no: { tipo: 'socio', idSocio: socios[0]!.id } }));

  return (
    <div className={`split-group${caminho.length ? ' is-nested' : ''}`}>
      <ul className="split-children">
        {grupo.partes.map((parte, posicao) => (
          <ParteDoGrupo
            key={`${posicao}-${parte.no.tipo === 'socio' ? parte.no.idSocio : parte.no.id}`}
            parte={parte}
            posicao={posicao}
            grupo={grupo}
            caminho={caminho}
            estado={estado}
            alterarEstado={alterarEstado}
            alterarGrupo={alterarGrupo}
          />
        ))}
      </ul>
      <div className="split-foot">
        <button type="button" className="btn-text" disabled={!socios.length || grupo.partes.length >= MAXIMO_DE_PARTES} onClick={adicionarParte}>
          <IconeAdicionar tamanho={16} /> Parte
        </button>
        <output className={`split-sum${somaEhValida(soma) ? '' : ' is-off'}`} aria-live="polite">
          {descreverSoma(soma)}
        </output>
      </div>
    </div>
  );
}
