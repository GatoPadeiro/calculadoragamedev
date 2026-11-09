export const ENDERECO_DO_SITE = 'https://calculadoragamedev.com.br';

export type Rota = '/' | '/metodologia' | '/sobre';

export interface MetadadosDaPagina {
  caminho: Rota;
  nomeNoMenu: string;
  titulo: string;
  descricao: string;
  tituloVisivel: string;
}

export const PAGINAS: MetadadosDaPagina[] = [
  {
    caminho: '/',
    nomeNoMenu: 'Calculadora',
    titulo: 'Calculadora Game Dev BR · Lucro e impostos de estúdio de jogos',
    descricao:
      'Calculadora gratuita para estúdios de jogos no Brasil: veja quanto cada sócio recebe depois da Steam, Epic, consoles e mobile, do royalty da Unreal, do Simples Nacional ou Lucro Presumido e dos dividendos.',
    tituloVisivel: 'Calculadora para estúdios de jogos',
  },
  {
    caminho: '/metodologia',
    nomeNoMenu: 'Como calculamos',
    titulo: 'Como calculamos · Impostos e taxas para estúdios de games',
    descricao:
      'As regras da Calculadora Game Dev BR com fonte e vigência: taxas da Steam, Epic, App Store e Google Play, royalty da Unreal, Simples Nacional, Lucro Presumido, pró-labore e dividendos.',
    tituloVisivel: 'Como calculamos',
  },
  {
    caminho: '/sobre',
    nomeNoMenu: 'Sobre',
    titulo: 'Sobre a Calculadora Game Dev BR · por Gato Padeiro',
    descricao:
      'A Calculadora Game Dev BR é gratuita e foi feita pelo estúdio indie Gato Padeiro para mostrar o caminho do dinheiro de uma venda de jogo até cada sócio. Perguntas frequentes sobre lojas, engine e impostos.',
    tituloVisivel: 'Sobre a Calculadora Game Dev BR',
  },
];

export function metadadosDaRota(caminho: string): MetadadosDaPagina {
  return PAGINAS.find((pagina) => pagina.caminho === caminho) ?? PAGINAS[0]!;
}

export function enderecoCanonico(caminho: Rota): string {
  return caminho === '/' ? `${ENDERECO_DO_SITE}/` : `${ENDERECO_DO_SITE}${caminho}`;
}
