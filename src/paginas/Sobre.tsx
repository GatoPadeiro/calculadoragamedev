import { linkDoEstudio, LogoDoEstudio } from '../interface/Marca';
import { metadadosDaRota } from './metadadosDasPaginas';

const PERGUNTAS_FREQUENTES: { pergunta: string; resposta: string }[] = [
  {
    pergunta: 'Quanto a Steam fica de cada venda?',
    resposta: 'A Steam fica com 30% da receita de cada jogo até US$ 10 milhões, 25% entre US$ 10 e 50 milhões e 20% acima disso. A conta é feita depois de tirar impostos do país e reembolsos.',
  },
  {
    pergunta: 'Quando o estúdio paga royalty da Unreal Engine?',
    resposta: 'Só depois que o jogo passa de US$ 1 milhão de receita bruta: são 5% sobre o que passar disso, ou 3,5% para quem lança na Epic Games Store no mesmo dia ou antes das outras lojas. Vendas feitas na própria Epic não pagam royalty.',
  },
  {
    pergunta: 'Estúdio de jogos é Simples Nacional ou Lucro Presumido?',
    resposta: 'Desenvolvimento e licenciamento de jogos ficam no Anexo V do Simples, ou no Anexo III quando a folha de pagamento chega a 28% do faturamento (Fator R). Acima de R$ 4,8 milhões por ano o Simples não é mais permitido. Na calculadora dá para forçar cada regime e comparar.',
  },
  {
    pergunta: 'Venda para fora do Brasil paga imposto aqui?',
    resposta: 'Sim, a empresa paga imposto sobre o que a loja repassa. Se a venda contar como exportação de serviço, saem PIS, COFINS e ISS. As vendas nos EUA ainda têm retenção de 30% na fonte, porque Brasil e EUA não têm acordo de bitributação.',
  },
  {
    pergunta: 'Como ficam os dividendos dos sócios a partir de 2026?',
    resposta: 'Lucro acima de R$ 50 mil por mês pago pela mesma empresa a um sócio tem retenção de 10%, e quem tem renda acima de R$ 600 mil por ano passa a pagar um imposto mínimo de até 10%. A calculadora já aplica as duas regras.',
  },
];

export function Sobre() {
  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">{metadadosDaRota('/sobre').tituloVisivel}</h1>
        <p className="lede">
          A Calculadora Game Dev BR mostra o caminho do dinheiro de uma venda de jogo até o bolso de cada sócio: loja, imposto do país, retenção dos EUA, royalty da engine, impostos da empresa no
          Brasil, pró-labore, dividendos e a divisão entre sócios.
        </p>
      </header>
      <section className="block about-studio">
        <span className="logo-disc">
          <LogoDoEstudio tamanho={88} />
        </span>
        <div>
          <h2 className="block-title">Feita pela Gato Padeiro</h2>
          <p>
            A Gato Padeiro é um estúdio indie brasileiro. Fizemos esta calculadora para entender as nossas próprias contas antes de lançar o primeiro jogo, e abrimos para qualquer estúdio usar, de graça.
          </p>
          <p>
            <a href={linkDoEstudio('sobre')} target="_blank" rel="noopener">
              gatopadeiro.com.br
            </a>
          </p>
        </div>
      </section>
      <section className="block">
        <h2 className="block-title">Simulação, não consultoria</h2>
        <p>
          Os números são estimativas a partir das regras publicadas e de padrões de mercado. Leis, alíquotas e contratos mudam, e cada estúdio tem detalhes que uma calculadora não vê. Antes de decidir
          preço, regime ou divisão, leve o link do cenário para o seu contador.
        </p>
        <p>Nada do que você digita sai do seu navegador. O cenário fica salvo nele e no link que você copia; não há conta nem servidor.</p>
      </section>
      <section className="block faq" aria-labelledby="faq-titulo">
        <h2 id="faq-titulo" className="block-title">Perguntas frequentes</h2>
        <dl>
          {PERGUNTAS_FREQUENTES.map(({ pergunta, resposta }) => (
            <div key={pergunta} className="faq-item">
              <dt>{pergunta}</dt>
              <dd>{resposta}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
