import type { Plugin } from 'vite';
import { ENDERECO_DO_SITE, enderecoCanonico, PAGINAS, type MetadadosDaPagina } from './metadadosDasPaginas';

const MARCADOR_DO_CABECALHO = '<!-- cabecalho-da-pagina -->';
const MARCADOR_DO_CONTEUDO = '<!-- conteudo-da-pagina -->';
const IMAGEM_DE_PREVIA = `${ENDERECO_DO_SITE}/og-calculadora-game-dev.png`;
const NOME_DO_SITE = 'Calculadora Game Dev BR';

const escaparAtributo = (texto: string) => texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function montarCabecalho(pagina: MetadadosDaPagina): string {
  const endereco = enderecoCanonico(pagina.caminho);
  const titulo = escaparAtributo(pagina.titulo);
  const descricao = escaparAtributo(pagina.descricao);
  return [
    `<title>${titulo}</title>`,
    `<meta name="description" content="${descricao}" />`,
    `<link rel="canonical" href="${endereco}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${NOME_DO_SITE}" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    `<meta property="og:title" content="${titulo}" />`,
    `<meta property="og:description" content="${descricao}" />`,
    `<meta property="og:url" content="${endereco}" />`,
    `<meta property="og:image" content="${IMAGEM_DE_PREVIA}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${NOME_DO_SITE}, por Gato Padeiro" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${titulo}" />`,
    `<meta name="twitter:description" content="${descricao}" />`,
    `<meta name="twitter:image" content="${IMAGEM_DE_PREVIA}" />`,
  ].join('\n    ');
}

function montarConteudo(pagina: MetadadosDaPagina): string {
  return `<div class="conteudo-para-buscadores"><h1>${pagina.tituloVisivel}</h1><p>${pagina.descricao}</p></div>`;
}

function aplicarPagina(html: string, pagina: MetadadosDaPagina): string {
  return html.replace(MARCADOR_DO_CABECALHO, montarCabecalho(pagina)).replace(MARCADOR_DO_CONTEUDO, montarConteudo(pagina));
}

function nomeDoArquivo(pagina: MetadadosDaPagina): string {
  return pagina.caminho === '/' ? 'index.html' : `${pagina.caminho.slice(1)}.html`;
}

export function paginasParaBuscadores(): Plugin[] {
  const [paginaInicial, ...demaisPaginas] = PAGINAS;
  return [
    {
      name: 'paginas-para-buscadores:desenvolvimento',
      apply: 'serve',
      transformIndexHtml: (html) => aplicarPagina(html, paginaInicial!),
    },
    {
      name: 'paginas-para-buscadores:build',
      apply: 'build',
      enforce: 'post',
      generateBundle(_opcoes, pacote) {
        const indice = pacote['index.html'];
        if (!indice || indice.type !== 'asset') return;
        const modelo = String(indice.source);
        indice.source = aplicarPagina(modelo, paginaInicial!);
        for (const pagina of demaisPaginas) {
          this.emitFile({ type: 'asset', fileName: nomeDoArquivo(pagina), source: aplicarPagina(modelo, pagina) });
        }
      },
    },
  ];
}
