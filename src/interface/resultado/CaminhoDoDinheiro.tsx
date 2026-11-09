import { LOJAS } from '../../dados/lojas';
import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import { formatarPercentual, formatarReais } from '../formatacao';
import { descreverRegime } from './rotulos';

interface EtapaDoCaminho {
  nome: string;
  detalhe: string;
  valor: number;
  ehTotal?: boolean;
  numeroDaPeca?: number;
}

const LARGURA_MINIMA_DA_BARRA = 0.4;
const VALOR_DESPREZIVEL = 0.005;

function montarEtapas(resultado: ResultadoDoCenario, cotacaoDoDolar: number): EtapaDoCaminho[] {
  const { empresa, totais, lojas } = resultado;
  const vendaBruta = totais.brutoEmReais;
  const taxasPorLoja = lojas.map((total) => `${LOJAS[total.loja].nome} ${formatarPercentual(total.taxaEfetiva, 1)}`).join(' · ');
  return [
    { nome: 'Venda bruta', detalhe: `${totais.copias.toLocaleString('pt-BR')} cópias`, valor: vendaBruta, ehTotal: true },
    { nome: 'Imposto do país de venda', detalhe: 'IVA embutido no preço, recolhido pela loja', valor: -totais.impostoConsumoEmDolar * cotacaoDoDolar, numeroDaPeca: 1 },
    { nome: 'Reembolsos e estornos', detalhe: '', valor: -totais.reembolsosEmDolar * cotacaoDoDolar, numeroDaPeca: 2 },
    { nome: 'Taxa das lojas', detalhe: taxasPorLoja, valor: -totais.taxaDasLojasEmDolar * cotacaoDoDolar, numeroDaPeca: 3 },
    { nome: 'Retenção dos EUA', detalhe: '30% sobre o que vem das vendas americanas', valor: -empresa.retencaoDosEua, numeroDaPeca: 4 },
    { nome: 'Royalty da engine', detalhe: empresa.royalty ? 'sobre o que passa de US$ 1 mi' : 'abaixo da isenção', valor: -empresa.royalty, numeroDaPeca: 4 },
    { nome: 'IRRF e IOF da remessa', detalhe: '', valor: -(empresa.irrfDaRemessa + empresa.iofDaRemessa), numeroDaPeca: 4 },
    { nome: 'Imposto da empresa', detalhe: descreverRegime(resultado).titulo, valor: -empresa.impostoDaEmpresa, numeroDaPeca: 5 },
    { nome: 'Pró-labore dos sócios', detalhe: 'bruto, antes de INSS e IRPF', valor: -empresa.proLaboreAnual, numeroDaPeca: 6 },
    {
      nome: 'Salários e encargos',
      detalhe: empresa.contribuicaoPatronalNoPresumido ? 'com 13º, férias, FGTS e INSS patronal do pró-labore' : 'com 13º, férias e FGTS',
      valor: -empresa.custoComSalarios,
      numeroDaPeca: 6,
    },
    { nome: 'Outros custos', detalhe: '', valor: -empresa.outrosCustos, numeroDaPeca: 6 },
    { nome: 'Lucro distribuível', detalhe: `${formatarPercentual(vendaBruta ? empresa.lucro / vendaBruta : 0)} da venda bruta`, valor: empresa.lucro, ehTotal: true },
  ];
}

function posicionarBarras(etapas: EtapaDoCaminho[], vendaBruta: number) {
  let saldo = vendaBruta;
  return etapas.map((etapa) => {
    let esquerda = 0;
    if (!etapa.ehTotal) {
      esquerda = vendaBruta ? Math.max(0, (saldo + etapa.valor) / vendaBruta) * 100 : 0;
      saldo += etapa.valor;
    }
    const largura = vendaBruta ? Math.min(100, (Math.abs(etapa.valor) / vendaBruta) * 100) : 0;
    return { ...etapa, esquerda, largura: Math.max(largura, LARGURA_MINIMA_DA_BARRA) };
  });
}

export function CaminhoDoDinheiro({ resultado, cotacaoDoDolar }: { resultado: ResultadoDoCenario; cotacaoDoDolar: number }) {
  const etapas = posicionarBarras(montarEtapas(resultado, cotacaoDoDolar), resultado.totais.brutoEmReais).filter(
    (etapa) => etapa.ehTotal || Math.abs(etapa.valor) >= VALOR_DESPREZIVEL,
  );
  return (
    <section className="block" aria-labelledby="caminho-titulo">
      <h2 id="caminho-titulo" className="block-title">Caminho do dinheiro no ano</h2>
      <div className="wf" role="table" aria-label="Caminho do dinheiro">
        {etapas.map((etapa) => (
          <div key={etapa.nome} className={`wf-row${etapa.ehTotal ? ' is-total' : ''}`} role="row">
            <div className="wf-name" role="rowheader">
              {etapa.numeroDaPeca && (
                <span className="part-no" aria-label={`peça ${etapa.numeroDaPeca}`}>
                  {etapa.numeroDaPeca}
                </span>
              )}
              {etapa.nome}
              {etapa.detalhe && <small>{etapa.detalhe}</small>}
            </div>
            <div className="wf-track" aria-hidden="true">
              <div className={`wf-bar${etapa.valor < 0 ? ' is-neg' : ''}`} style={{ left: `${etapa.esquerda}%`, width: `${etapa.largura}%` }} />
            </div>
            <div className="wf-val num" role="cell">
              {formatarReais(etapa.valor, 0)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
