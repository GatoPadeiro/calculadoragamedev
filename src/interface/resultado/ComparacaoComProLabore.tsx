import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { Socio } from '../../calculo/tipos';
import { corDoSocio } from '../cores';
import { formatarReais } from '../formatacao';

export function ComparacaoComProLabore({ resultado, socios }: { resultado: ResultadoDoCenario; socios: Socio[] }) {
  const sociosComparaveis = resultado.socios.filter((resultadoDoSocio) => resultadoDoSocio.comparacao);
  if (!sociosComparaveis.length) return null;
  return (
    <section className="block" aria-labelledby="comparacao-titulo">
      <h2 id="comparacao-titulo" className="block-title">Pró-labore + lucro ou tudo como pró-labore?</h2>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Sócio</th>
              <th scope="col">Como está</th>
              <th scope="col">Tudo como pró-labore</th>
              <th scope="col">Diferença no ano</th>
            </tr>
          </thead>
          <tbody>
            {sociosComparaveis.map((resultadoDoSocio) => {
              const comparacao = resultadoDoSocio.comparacao!;
              const diferenca = resultadoDoSocio.liquidoAnual - comparacao.liquidoAnual;
              const posicao = socios.findIndex((socio) => socio.id === resultadoDoSocio.idSocio);
              return (
                <tr key={resultadoDoSocio.idSocio}>
                  <th scope="row">
                    <span className="tree-chip" style={{ background: corDoSocio(posicao).fundo }} aria-hidden="true" /> {resultadoDoSocio.nome}
                  </th>
                  <td className="num">{formatarReais(resultadoDoSocio.liquidoAnual, 0)}</td>
                  <td className="num">
                    {formatarReais(comparacao.liquidoAnual, 0)}
                    {comparacao.inssPatronalNaComparacao > 0 && <small> + {formatarReais(comparacao.inssPatronalNaComparacao, 0)} de INSS patronal para a empresa</small>}
                  </td>
                  <td>
                    <span className="num">{formatarReais(Math.abs(diferenca), 0)}</span> <small>{diferenca >= 0 ? 'a favor de como está' : 'a favor do tudo como pró-labore'}</small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="field-hint">Líquido para a pessoa. No cenário “tudo como pró-labore” a empresa paga o lucro inteiro como pró-labore, sujeito a INSS e IRPF de até 27,5%.</p>
    </section>
  );
}
