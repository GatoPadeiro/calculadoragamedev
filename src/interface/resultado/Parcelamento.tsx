import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import { formatarReais } from '../formatacao';
import { descreverRecebimento } from './rotulos';

const PARCELAS = [1, 12, 24, 36];

export function Parcelamento({ resultado }: { resultado: ResultadoDoCenario }) {
  return (
    <section className="block" aria-labelledby="parcelamento-titulo">
      <h2 id="parcelamento-titulo" className="block-title">Parcelamento</h2>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Quem</th>
              <th scope="col">No ano</th>
              <th scope="col">÷ 12</th>
              <th scope="col">÷ 24</th>
              <th scope="col">÷ 36</th>
            </tr>
          </thead>
          <tbody>
            {resultado.socios.map((resultadoDoSocio) => (
              <tr key={resultadoDoSocio.idSocio}>
                <th scope="row">
                  {resultadoDoSocio.nome} <small>{descreverRecebimento(resultadoDoSocio.tipo)}</small>
                </th>
                {PARCELAS.map((parcelas) => (
                  <td key={parcelas} className="num">
                    {formatarReais(resultadoDoSocio.liquidoAnual / parcelas)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
