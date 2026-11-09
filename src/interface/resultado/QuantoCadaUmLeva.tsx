import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { Socio } from '../../calculo/tipos';
import { corDoSocio } from '../cores';
import { formatarPercentual, formatarReais } from '../formatacao';
import { descreverRecebimento, MESES_NO_ANO } from './rotulos';

export function QuantoCadaUmLeva({ resultado, socios }: { resultado: ResultadoDoCenario; socios: Socio[] }) {
  const resultadoPorSocio = new Map(resultado.socios.map((resultadoDoSocio) => [resultadoDoSocio.idSocio, resultadoDoSocio]));
  return (
    <section className="leva" aria-labelledby="leva-titulo">
      <h2 id="leva-titulo" className="block-title">Quanto cada um leva</h2>
      <ul className="leva-grid">
        {socios.map((socio, posicao) => {
          const resultadoDoSocio = resultadoPorSocio.get(socio.id)!;
          const cor = corDoSocio(posicao);
          return (
            <li key={socio.id} className="leva-field" style={{ background: cor.fundo, color: cor.texto }}>
              <span className="leva-name">{socio.nome || `Sócio ${posicao + 1}`}</span>
              <span className="leva-share">{formatarPercentual(resultadoDoSocio.fatia, 2)} do lucro</span>
              <b className="leva-big num">{formatarReais(resultadoDoSocio.liquidoAnual / MESES_NO_ANO, 0)}</b>
              <span className="leva-unit">por mês, {descreverRecebimento(socio.tipo)}</span>
              <span className="leva-year">
                <span className="num">{formatarReais(resultadoDoSocio.liquidoAnual, 0)}</span> no ano
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
