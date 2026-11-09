import { PAIS_POR_CODIGO } from '../../dados/paises';
import { LOJAS } from '../../dados/lojas';
import type { ResultadoDaLinha, ResultadoDoCenario } from '../../calculo/calcularCenario';
import { formatarPercentual, formatarReais } from '../formatacao';

export function quantoChegaNaEmpresa(linha: ResultadoDaLinha, cotacaoDoDolar: number): number {
  return (linha.repasseEmDolar - linha.retencaoDosEuaEmDolar - linha.royaltyEmDolar) * cotacaoDoDolar;
}

export function VendasPorPaisELoja({ resultado, cotacaoDoDolar }: { resultado: ResultadoDoCenario; cotacaoDoDolar: number }) {
  const vendaBruta = resultado.totais.brutoEmReais;
  if (!resultado.linhas.length) return null;
  return (
    <section className="block" aria-labelledby="vendas-titulo">
      <h2 id="vendas-titulo" className="block-title">Vendas por país e loja</h2>
      <div className="table-wrap">
        <table className="data stack">
          <thead>
            <tr>
              <th scope="col">País e loja</th>
              <th scope="col">Cópias</th>
              <th scope="col">Bruto</th>
              <th scope="col">Das vendas</th>
              <th scope="col">Chega na empresa</th>
              <th scope="col">Por cópia</th>
            </tr>
          </thead>
          <tbody>
            {resultado.linhas.map((linha) => {
              const chegaNaEmpresa = quantoChegaNaEmpresa(linha, cotacaoDoDolar);
              return (
                <tr key={linha.id}>
                  <th scope="row">
                    {PAIS_POR_CODIGO[linha.pais]?.nome ?? linha.pais} <small>{LOJAS[linha.loja].nome}</small>
                  </th>
                  <td className="num" data-label="Cópias">{linha.copias.toLocaleString('pt-BR')}</td>
                  <td className="num" data-label="Bruto">{formatarReais(linha.brutoEmReais, 0)}</td>
                  <td className="num" data-label="Das vendas">{formatarPercentual(vendaBruta ? linha.brutoEmReais / vendaBruta : 0)}</td>
                  <td className="num" data-label="Chega na empresa">{formatarReais(chegaNaEmpresa, 0)}</td>
                  <td className="num" data-label="Por cópia">{linha.copias ? formatarReais(chegaNaEmpresa / linha.copias) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="field-hint">“Chega na empresa” já desconta imposto do país, reembolsos, loja, retenção dos EUA e royalty. Ainda falta o imposto brasileiro.</p>
    </section>
  );
}
