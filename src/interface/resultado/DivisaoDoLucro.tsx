import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { ValorDoNo } from '../../calculo/divisaoDoLucro';
import type { Socio } from '../../calculo/tipos';
import { corDoSocio } from '../cores';
import { formatarPercentual, formatarReais } from '../formatacao';

function NoDaArvore({ no, socios, posicaoPorSocio }: { no: ValorDoNo; socios: Socio[]; posicaoPorSocio: Map<string, number> }) {
  const posicao = no.tipo === 'socio' ? posicaoPorSocio.get(no.id) : undefined;
  const cor = posicao !== undefined ? corDoSocio(posicao) : null;
  const nome = no.tipo === 'grupo' ? no.nome : posicao !== undefined ? socios[posicao]!.nome : 'sócio removido';
  return (
    <li className={`tree-node is-${no.tipo === 'socio' ? 'partner' : 'group'}`}>
      <div className="tree-line">
        {cor ? <span className="tree-chip" style={{ background: cor.fundo }} aria-hidden="true" /> : <span className="tree-chip is-group" aria-hidden="true" />}
        <span className="tree-name">{nome}</span>
        <span className="tree-share num">{formatarPercentual(no.fatiaNoPai, 2)}</span>
        <span className="tree-val num">{formatarReais(no.valor, 0)}</span>
      </div>
      {no.filhos.length > 0 && (
        <ul>
          {no.filhos.map((filho, indice) => (
            <NoDaArvore key={indice} no={filho} socios={socios} posicaoPorSocio={posicaoPorSocio} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DivisaoDoLucro({ resultado, socios }: { resultado: ResultadoDoCenario; socios: Socio[] }) {
  const posicaoPorSocio = new Map(socios.map((socio, posicao) => [socio.id, posicao]));
  return (
    <section className="block" aria-labelledby="divisao-titulo">
      <h2 id="divisao-titulo" className="block-title">Divisão do lucro</h2>
      <ul className="tree">
        <NoDaArvore no={resultado.divisao.arvore} socios={socios} posicaoPorSocio={posicaoPorSocio} />
      </ul>
    </section>
  );
}
