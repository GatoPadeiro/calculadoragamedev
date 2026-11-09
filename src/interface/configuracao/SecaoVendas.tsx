import { PAISES, PAIS_POR_CODIGO } from '../../dados/paises';
import { LOJAS } from '../../dados/lojas';
import type { LinhaDeVenda } from '../../calculo/tipos';
import type { ResultadoDaLinha } from '../../calculo/calcularCenario';
import { criarIdentificador } from '../../estado/estadoDoApp';
import { MAXIMO_DE_LINHAS_DE_VENDA } from '../../estado/validarCenario';
import { formatarNaMoeda, formatarReais, MOEDAS_DISPONIVEIS, simboloDaMoeda } from '../formatacao';
import { IconeAdicionar, IconeDuplicar, IconeRemover } from '../icones';
import { CampoNumerico, CampoPercentual, ValorCalculado } from '../CampoNumerico';
import { SecaoNumerada, Selecao } from './Controles';
import type { PropriedadesDaSecao } from './tiposDaConfiguracao';

const TAXA_DE_REEMBOLSO_INICIAL = 0.05;
const PRECO_MAXIMO = 1e9;

const OPCOES_DE_LOJA = Object.values(LOJAS).map((loja) => ({ valor: loja.id, rotulo: loja.nome, grupo: loja.grupo }));
const OPCOES_DE_PAIS = PAISES.map((pais) => ({ valor: pais.codigo, rotulo: pais.nome }));
const OPCOES_DE_MOEDA = MOEDAS_DISPONIVEIS.map((moeda) => ({ valor: moeda, rotulo: `${moeda} (${simboloDaMoeda(moeda)})` }));

function criarLinhaParaProximoPais(vendasAtuais: LinhaDeVenda[]): LinhaDeVenda {
  const paisesUsados = new Set(vendasAtuais.map((linha) => linha.pais));
  const pais = PAISES.find((candidato) => !paisesUsados.has(candidato.codigo)) ?? PAISES[0]!;
  return {
    id: criarIdentificador(),
    pais: pais.codigo,
    loja: 'steam',
    moeda: pais.moeda,
    precoPorCopia: 0,
    copias: 0,
    impostoConsumoNoPreco: pais.impostoConsumoNoPreco,
    taxaDeReembolso: TAXA_DE_REEMBOLSO_INICIAL,
  };
}

interface PropriedadesDaLinha extends Pick<PropriedadesDaSecao, 'alterarEstado'> {
  linha: LinhaDeVenda;
  posicao: number;
  resultado?: ResultadoDaLinha;
  podeDuplicar: boolean;
}

function LinhaDeVendaEditavel({ linha, posicao, resultado, podeDuplicar, alterarEstado }: PropriedadesDaLinha) {
  const descricao = `${PAIS_POR_CODIGO[linha.pais]?.nome ?? linha.pais} na ${LOJAS[linha.loja].nome}`;
  const alterarLinha = (alteracao: (linhaEmEdicao: LinhaDeVenda) => void) => alterarEstado((rascunho) => alteracao(rascunho.cenario.vendas[posicao]!));
  const trocarPais = (codigo: string) =>
    alterarLinha((edicao) => {
      const pais = PAIS_POR_CODIGO[codigo]!;
      edicao.pais = codigo;
      edicao.moeda = pais.moeda;
      edicao.impostoConsumoNoPreco = pais.impostoConsumoNoPreco;
    });
  const duplicar = () => alterarEstado((rascunho) => void rascunho.cenario.vendas.splice(posicao + 1, 0, { ...structuredClone(linha), id: criarIdentificador() }));
  const remover = () => alterarEstado((rascunho) => void rascunho.cenario.vendas.splice(posicao, 1));

  return (
    <li className="sale">
      <div className="sale-head">
        <Selecao rotulo="País" valor={linha.pais} opcoes={OPCOES_DE_PAIS} aoMudar={trocarPais} />
        <Selecao rotulo="Loja" valor={linha.loja} opcoes={OPCOES_DE_LOJA} aoMudar={(loja) => alterarLinha((edicao) => void (edicao.loja = loja))} />
        <div className="sale-actions">
          <button type="button" className="icon-btn" aria-label={`Duplicar ${descricao}`} title="Duplicar" disabled={!podeDuplicar} onClick={duplicar}>
            <IconeDuplicar />
          </button>
          <button type="button" className="icon-btn" aria-label={`Remover ${descricao}`} title="Remover" onClick={remover}>
            <IconeRemover />
          </button>
        </div>
      </div>
      <div className="sale-grid">
        <CampoNumerico
          rotulo="Preço por cópia"
          prefixo={simboloDaMoeda(linha.moeda)}
          valor={linha.precoPorCopia}
          maximo={PRECO_MAXIMO}
          aoMudar={(preco) => alterarLinha((edicao) => void (edicao.precoPorCopia = preco))}
        />
        <CampoNumerico rotulo="Cópias" casasDecimais={0} valor={linha.copias} aoMudar={(copias) => alterarLinha((edicao) => void (edicao.copias = copias))} />
        <CampoPercentual
          rotulo="Imposto no preço"
          valor={linha.impostoConsumoNoPreco}
          maximo={60}
          aoMudar={(imposto) => alterarLinha((edicao) => void (edicao.impostoConsumoNoPreco = imposto))}
        />
        <CampoPercentual rotulo="Reembolsos" valor={linha.taxaDeReembolso} aoMudar={(taxa) => alterarLinha((edicao) => void (edicao.taxaDeReembolso = taxa))} />
      </div>
      <div className="sale-grid sale-totals">
        <Selecao rotulo="Moeda" valor={linha.moeda} opcoes={OPCOES_DE_MOEDA} aoMudar={(moeda) => alterarLinha((edicao) => void (edicao.moeda = moeda))} />
        <ValorCalculado rotulo="Total na moeda">{formatarNaMoeda(linha.precoPorCopia * linha.copias, linha.moeda)}</ValorCalculado>
        <ValorCalculado rotulo="Total em reais" classe="span-2">
          {resultado ? formatarReais(resultado.brutoEmReais) : '—'}
          {resultado && resultado.repasseEmReais > 0 && <small> · chega {formatarReais(resultado.repasseEmReais)}</small>}
        </ValorCalculado>
      </div>
    </li>
  );
}

export function SecaoVendas({ estado, alterarEstado, resultadosDasLinhas }: PropriedadesDaSecao & { resultadosDasLinhas: ResultadoDaLinha[] }) {
  const vendas = estado.cenario.vendas;
  const resultadoPorId = new Map(resultadosDasLinhas.map((resultado) => [resultado.id, resultado]));
  const podeAdicionar = vendas.length < MAXIMO_DE_LINHAS_DE_VENDA;
  return (
    <SecaoNumerada numero="03" titulo="Lojas e países" resumo={`${vendas.length} ${vendas.length === 1 ? 'linha' : 'linhas'}`}>
      <ul className="sales-list">
        {vendas.map((linha, posicao) => (
          <LinhaDeVendaEditavel
            key={linha.id}
            linha={linha}
            posicao={posicao}
            resultado={resultadoPorId.get(linha.id)}
            podeDuplicar={podeAdicionar}
            alterarEstado={alterarEstado}
          />
        ))}
      </ul>
      {!vendas.length && <p className="empty">Nenhuma venda ainda. Adicione um país para começar.</p>}
      <button
        type="button"
        className="btn-line"
        disabled={!podeAdicionar}
        onClick={() => alterarEstado((rascunho) => void rascunho.cenario.vendas.push(criarLinhaParaProximoPais(rascunho.cenario.vendas)))}
      >
        <IconeAdicionar /> Adicionar país
      </button>
    </SecaoNumerada>
  );
}
