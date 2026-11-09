import type { GrupoDaDivisao, Socio } from '../../calculo/tipos';
import { SALARIO_MINIMO } from '../../dados/tabelasTributarias';
import { criarIdentificador } from '../../estado/estadoDoApp';
import { MAXIMO_DE_SOCIOS } from '../../estado/validarCenario';
import { corDoSocio } from '../cores';
import { IconeAdicionar, IconeRemover } from '../icones';
import { CampoNumerico } from '../CampoNumerico';
import { CampoDeTexto, SecaoNumerada, Selecao } from './Controles';
import { EditorDaDivisao } from './EditorDaDivisao';
import type { PropriedadesDaSecao } from './tiposDaConfiguracao';

const OPCOES_DE_TIPO: { valor: Socio['tipo']; rotulo: string }[] = [
  { valor: 'pessoaFisica', rotulo: 'Pessoa física' },
  { valor: 'empresa', rotulo: 'Empresa / grupo' },
];

function removerSocioDaDivisao(grupo: GrupoDaDivisao, idSocio: string) {
  grupo.partes = grupo.partes.filter((parte) => !(parte.no.tipo === 'socio' && parte.no.idSocio === idSocio));
  for (const parte of grupo.partes) {
    if (parte.no.tipo === 'grupo') removerSocioDaDivisao(parte.no, idSocio);
  }
}

const nomeParaLeitor = (socio: Socio, posicao: number) => socio.nome || `sócio ${posicao + 1}`;

function LinhaDoSocio({ socio, posicao, totalDeSocios, alterarEstado }: { socio: Socio; posicao: number; totalDeSocios: number } & Pick<PropriedadesDaSecao, 'alterarEstado'>) {
  const cor = corDoSocio(posicao);
  const nome = nomeParaLeitor(socio, posicao);
  const alterarSocio = (alteracao: (socioEmEdicao: Socio) => void) => alterarEstado((rascunho) => alteracao(rascunho.cenario.socios[posicao]!));
  const removerSocio = () =>
    alterarEstado((rascunho) => {
      rascunho.cenario.socios.splice(posicao, 1);
      removerSocioDaDivisao(rascunho.cenario.divisao, socio.id);
    });

  return (
    <li className="partner-row">
      <CampoDeTexto
        rotulo={`Nome do sócio ${posicao + 1}`}
        esconderRotulo
        valor={socio.nome}
        aoMudar={(novoNome) => alterarSocio((edicao) => void (edicao.nome = novoNome))}
        classe="partner-name"
        estilo={{ background: cor.fundo, color: cor.texto, borderColor: cor.fundo }}
      />
      <Selecao rotulo={`Tipo de ${nome}`} esconderRotulo valor={socio.tipo} opcoes={OPCOES_DE_TIPO} aoMudar={(tipo) => alterarSocio((edicao) => void (edicao.tipo = tipo))} />
      {socio.tipo === 'pessoaFisica' ? (
        <CampoNumerico
          rotulo={`Pró-labore mensal de ${nome}`}
          esconderRotulo
          prefixo="R$"
          sufixo="/mês"
          valor={socio.proLaboreMensal}
          aoMudar={(proLabore) => alterarSocio((edicao) => void (edicao.proLaboreMensal = proLabore))}
          mostrarAbreviacao={false}
        />
      ) : (
        <span className="partner-note">recebe bruto</span>
      )}
      <button type="button" className="icon-btn" aria-label={`Remover ${nome}`} disabled={totalDeSocios <= 1} onClick={removerSocio}>
        <IconeRemover />
      </button>
    </li>
  );
}

export function SecaoSocios({ estado, alterarEstado }: PropriedadesDaSecao) {
  const { socios, divisao } = estado.cenario;
  const adicionarSocio = () =>
    alterarEstado((rascunho) => {
      const id = criarIdentificador();
      rascunho.cenario.socios.push({ id, nome: `Sócio ${rascunho.cenario.socios.length + 1}`, tipo: 'pessoaFisica', proLaboreMensal: SALARIO_MINIMO.valorMensal });
      rascunho.cenario.divisao.partes.push({ fatia: 0, no: { tipo: 'socio', idSocio: id } });
    });

  return (
    <SecaoNumerada numero="02" titulo="Sócios e divisão" resumo={`${socios.length} ${socios.length === 1 ? 'sócio' : 'sócios'}`}>
      <ul className="partner-list">
        {socios.map((socio, posicao) => (
          <LinhaDoSocio key={socio.id} socio={socio} posicao={posicao} totalDeSocios={socios.length} alterarEstado={alterarEstado} />
        ))}
      </ul>
      <p className="field-hint">Pró-labore é por mês, para cada sócio pessoa física. Empresa ou grupo recebe o lucro bruto.</p>
      <button type="button" className="btn-line" disabled={socios.length >= MAXIMO_DE_SOCIOS} onClick={adicionarSocio}>
        <IconeAdicionar /> Adicionar sócio
      </button>

      <h3 className="sub-title">Divisão do lucro</h3>
      <p className="field-hint">Cada nível soma 100%. Use “Dividir” para transformar uma parte num grupo que se divide de novo.</p>
      <EditorDaDivisao grupo={divisao} caminho={[]} estado={estado} alterarEstado={alterarEstado} />
    </SecaoNumerada>
  );
}
