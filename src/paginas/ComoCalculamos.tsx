import { ENGINES, type RegraDaEngine } from '../dados/engines';
import type { Fonte } from '../dados/fonte';
import { LOJAS, type FaixaDaLoja, type RegraDaLoja } from '../dados/lojas';
import { DIVIDENDOS, FGTS, INSS_DO_SOCIO, IRPF, PRESUMIDO, REMESSA_AO_EXTERIOR, REMUNERACAO_CLT, RETENCAO_DOS_EUA, SIMPLES } from '../dados/tabelasTributarias';
import { formatarPercentual, formatarReais } from '../interface/formatacao';

interface RegraExplicada {
  nome: string;
  valorUsado: string;
  fonte: Fonte;
}

const percentual = (fracao: number, casas = 0) => formatarPercentual(fracao, casas);
const reais = (valor: number) => formatarReais(valor, Number.isInteger(valor) ? 0 : 2);

function descreverFaixas(faixas: readonly FaixaDaLoja[]): string {
  if (faixas.length === 1) return percentual(faixas[0]!.taxa);
  return faixas
    .map((faixa) => (faixa.ateEmDolar === Infinity ? `${percentual(faixa.taxa)} acima` : `${percentual(faixa.taxa)} até US$ ${(faixa.ateEmDolar / 1e6).toLocaleString('pt-BR')} mi`))
    .join(', ');
}

function descreverFaixasDaLoja(loja: RegraDaLoja): string {
  if (!loja.faixasPorMercado?.length) return descreverFaixas(loja.faixas);
  const porMercado = loja.faixasPorMercado.map((mercado) => `${mercado.nomeDoMercado}: ${descreverFaixas(mercado.faixas)}`);
  return [...porMercado, `Demais países: ${descreverFaixas(loja.faixas)}`].join('. ');
}

function descreverEngine(engine: RegraDaEngine): string {
  if (!engine.royalty) return 'sem royalty';
  const programaDaEpic = engine.royaltyNoLancamentoNaEpic ? `; ${formatarPercentual(engine.royaltyNoLancamentoNaEpic)} no Launch Everywhere` : '';
  return `${formatarPercentual(engine.royalty)} acima de US$ 1 mi${programaDaEpic}`;
}

const REGRAS_DAS_LOJAS: RegraExplicada[] = Object.values(LOJAS).map((loja) => ({ nome: loja.nome, valorUsado: descreverFaixasDaLoja(loja), fonte: loja.fonte }));

const REGRAS_DAS_ENGINES: RegraExplicada[] = Object.values(ENGINES).map((engine) => ({ nome: engine.nome, valorUsado: descreverEngine(engine), fonte: engine.fonte }));

const REGRAS_DO_BRASIL_E_EXTERIOR: RegraExplicada[] = [
  {
    nome: 'Simples Nacional',
    valorUsado: `Anexo III com Fator R de ${percentual(SIMPLES.fatorRMinimoParaAnexoIII)} ou mais; senão Anexo V. Limite de R$ 4,8 mi por ano`,
    fonte: SIMPLES.fonte,
  },
  {
    nome: 'Lucro Presumido',
    valorUsado: `Presunção de ${percentual(PRESUMIDO.percentualDePresuncao)}, ou ${percentual(PRESUMIDO.percentualDePresuncao * PRESUMIDO.fatorDeAcrescimoNaPresuncao, 1)} na receita acima de R$ 5 mi por ano; IRPJ ${percentual(PRESUMIDO.aliquotaIrpj)} + ${percentual(PRESUMIDO.aliquotaAdicionalIrpj)} acima de R$ 240 mil; CSLL ${percentual(PRESUMIDO.aliquotaCsll)}; PIS ${percentual(PRESUMIDO.aliquotaPis, 2)}; COFINS ${percentual(PRESUMIDO.aliquotaCofins)}; ISS do município; INSS patronal de ${percentual(PRESUMIDO.contribuicaoPatronalSobreProLabore)} sobre o pró-labore`,
    fonte: PRESUMIDO.fonte,
  },
  {
    nome: 'Salários CLT',
    valorUsado: `${REMUNERACAO_CLT.remuneracoesPorAno.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} salários por ano: 12 meses, 13º e um terço de férias`,
    fonte: REMUNERACAO_CLT.fonte,
  },
  { nome: 'FGTS', valorUsado: `${percentual(FGTS.aliquota)} sobre salários, 13º e férias`, fonte: FGTS.fonte },
  { nome: 'INSS do sócio', valorUsado: `${percentual(INSS_DO_SOCIO.aliquota)} do pró-labore até o teto de ${reais(INSS_DO_SOCIO.tetoMensal)}`, fonte: INSS_DO_SOCIO.fonte },
  {
    nome: 'IRPF do pró-labore',
    valorUsado: `Isento até ${reais(IRPF.rendaIsentaAte)} por mês; redução até ${reais(IRPF.reducaoAte)}; tabela progressiva até 27,5%, com a maior dedução entre o INSS e o desconto simplificado de ${reais(IRPF.descontoSimplificadoMensal)}`,
    fonte: IRPF.fonte,
  },
  {
    nome: 'Dividendos',
    valorUsado: `Retenção de ${percentual(DIVIDENDOS.aliquotaDeRetencao)} acima de R$ 50 mil por mês; imposto mínimo de 0 a 10% entre R$ 600 mil e R$ 1,2 mi de renda anual`,
    fonte: DIVIDENDOS.fonte,
  },
  {
    nome: 'Remessa de royalties',
    valorUsado: `IRRF de ${percentual(REMESSA_AO_EXTERIOR.irrfPadrao)} e IOF de ${percentual(REMESSA_AO_EXTERIOR.iofPadrao, 2)} (padrões editáveis)`,
    fonte: REMESSA_AO_EXTERIOR.fonte,
  },
  { nome: 'Retenção dos EUA', valorUsado: `${percentual(RETENCAO_DOS_EUA.aliquota)} sobre a receita de vendas nos EUA`, fonte: RETENCAO_DOS_EUA.fonte },
];

const ORDEM_DAS_CONTAS = [
  'Preço na moeda do país × cópias. Convertido para reais e depois para dólares, que é como as lojas pagam.',
  'Sai o imposto sobre consumo embutido no preço (IVA), recolhido pela loja, e saem os reembolsos.',
  'Sai a taxa da loja, nas faixas de cada uma, sobre a receita do período.',
  'Das vendas nos EUA sai a retenção de 30%. Da receita fora da Epic sai o royalty da engine, com IRRF e IOF da remessa.',
  'O que a loja repassa, em reais, é o faturamento da empresa. Sobre ele vem o Simples ou o Presumido.',
  'Saem pró-labore, salários, encargos e custos. O que sobra é o lucro distribuível, dividido pela árvore de sócios.',
  'Cada sócio pessoa física paga INSS e IRPF sobre o pró-labore e, acima dos limites, a retenção e o imposto mínimo sobre os dividendos.',
];

function TabelaDeRegras({ titulo, regras }: { titulo: string; regras: RegraExplicada[] }) {
  return (
    <section className="block">
      <h2 className="block-title">{titulo}</h2>
      <div className="table-wrap">
        <table className="data rules">
          <thead>
            <tr>
              <th scope="col">Regra</th>
              <th scope="col">Valor usado</th>
              <th scope="col">Fonte e vigência</th>
            </tr>
          </thead>
          <tbody>
            {regras.map((regra) => (
              <tr key={regra.nome}>
                <th scope="row">{regra.nome}</th>
                <td>{regra.valorUsado}</td>
                <td>
                  {regra.fonte.referencia}. <small>Vigência: {regra.fonte.vigencia}.</small>
                  {regra.fonte.nota && <small> {regra.fonte.nota}</small>}
                  {!regra.fonte.conferido && <span className="tag-warn">a conferir</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ComoCalculamos() {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">Como calculamos</h1>
        <p className="lede">
          Cada regra abaixo é a que a calculadora usa agora, com a fonte e a data. Isto é uma simulação, não consultoria: regras marcadas “a conferir” ainda não foram revisadas por um contador. Confirme
          os números do seu estúdio com o seu.
        </p>
      </header>
      <section className="block">
        <h2 className="block-title">A ordem das contas</h2>
        <ol className="steps">
          {ORDEM_DAS_CONTAS.map((passo) => (
            <li key={passo}>{passo}</li>
          ))}
        </ol>
      </section>
      <TabelaDeRegras titulo="Lojas" regras={REGRAS_DAS_LOJAS} />
      <TabelaDeRegras titulo="Engines" regras={REGRAS_DAS_ENGINES} />
      <TabelaDeRegras titulo="Brasil e exterior" regras={REGRAS_DO_BRASIL_E_EXTERIOR} />
      <section className="block">
        <h2 className="block-title">Câmbio</h2>
        <p>
          Cotação da AwesomeAPI, com a Frankfurter (Banco Central Europeu) de reserva. A calculadora atualiza ao abrir e a cada 5 minutos com a aba aberta. Sem conexão, usa a última cotação salva no
          navegador. Um link compartilhado guarda as cotações do momento em que foi criado, para mostrar os mesmos números.
        </p>
      </section>
    </div>
  );
}
