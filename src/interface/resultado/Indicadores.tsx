import type { Alerta, ResultadoDoCenario } from '../../calculo/calcularCenario';
import { formatarPercentual, formatarReaisAbreviado } from '../formatacao';
import { descreverRegime } from './rotulos';

const ALERTAS_DE_REGIME: Alerta['codigo'][] = ['acima-do-limite-do-simples', 'anexo-v', 'iss-fora-da-guia', 'saiu-do-simples'];

function somarImpostos(resultado: ResultadoDoCenario, cotacaoDoDolar: number): number {
  const { empresa, totais } = resultado;
  return (
    totais.impostoConsumoEmDolar * cotacaoDoDolar +
    empresa.retencaoDosEua +
    empresa.irrfDaRemessa +
    empresa.iofDaRemessa +
    empresa.impostoDaEmpresa +
    empresa.contribuicaoPatronalNoPresumido
  );
}

interface PropriedadesDoIndicador {
  rotulo: string;
  valor: string;
  detalhe: string;
  destaque?: boolean;
  valorEmTexto?: boolean;
}

function Indicador({ rotulo, valor, detalhe, destaque, valorEmTexto }: PropriedadesDoIndicador) {
  return (
    <div className={`kpi${destaque ? ' is-warn' : ''}`}>
      <span className="kpi-label">{rotulo}</span>
      <b className={`kpi-val ${valorEmTexto ? 'kpi-text' : 'num'}`}>{valor}</b>
      <span className="kpi-sub">{detalhe}</span>
    </div>
  );
}

export function Indicadores({ resultado, cotacaoDoDolar }: { resultado: ResultadoDoCenario; cotacaoDoDolar: number }) {
  const { empresa } = resultado;
  const vendaBruta = resultado.totais.brutoEmReais;
  const fracaoDaVenda = (valor: number) => formatarPercentual(vendaBruta ? valor / vendaBruta : 0);
  const regime = descreverRegime(resultado);
  const temAlertaDeRegime = resultado.alertas.some((alerta) => ALERTAS_DE_REGIME.includes(alerta.codigo));
  return (
    <section className="kpis" aria-label="Indicadores do ano">
      <Indicador
        rotulo="Faturamento da empresa"
        valor={formatarReaisAbreviado(empresa.faturamento)}
        detalhe={`${fracaoDaVenda(empresa.faturamento)} da venda bruta de ${formatarReaisAbreviado(vendaBruta)}`}
      />
      <Indicador rotulo="Lucro distribuível" valor={formatarReaisAbreviado(empresa.lucro)} detalhe={`${fracaoDaVenda(empresa.lucro)} da venda bruta, no ano`} />
      <Indicador rotulo="Impostos sobre a venda" valor={fracaoDaVenda(somarImpostos(resultado, cotacaoDoDolar))} detalhe="do país, dos EUA, da remessa e da empresa" />
      <Indicador rotulo="Regime" valor={regime.titulo} detalhe={regime.detalhe} destaque={temAlertaDeRegime} valorEmTexto />
    </section>
  );
}
