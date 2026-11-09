export interface PecaParaRotular {
  inicio: number;
  fim: number;
}

export interface RotuloPosicionado {
  centroDaHaste: number;
  esquerda: number;
  linha: number;
  alinhadoADireita: boolean;
}

interface RotuloColocado {
  esquerda: number;
  direita: number;
  haste: number;
  linha: number;
}

const FOLGA = 6;
const RECUO_DA_HASTE = 6;

function limitarAoPalco(esquerda: number, larguraDoPalco: number, larguraDoRotulo: number): number {
  return Math.min(Math.max(0, esquerda), Math.max(0, larguraDoPalco - larguraDoRotulo));
}

function cabeNaLinha(linha: number, esquerda: number, haste: number, larguraDoRotulo: number, colocados: RotuloColocado[]): boolean {
  const direita = esquerda + larguraDoRotulo;
  return colocados.every((outro) => {
    if (outro.linha === linha) return direita + FOLGA <= outro.esquerda || esquerda >= outro.direita + FOLGA;
    if (outro.linha < linha) return haste < outro.esquerda - FOLGA || haste > outro.direita + FOLGA;
    return outro.haste < esquerda - FOLGA || outro.haste > direita + FOLGA;
  });
}

export function posicionarRotulos(pecas: PecaParaRotular[], larguraDoPalco: number, larguraDoRotulo: number): RotuloPosicionado[] {
  const colocados: RotuloColocado[] = [];
  const posicionados: RotuloPosicionado[] = new Array(pecas.length);

  for (let indice = pecas.length - 1; indice >= 0; indice--) {
    const peca = pecas[indice]!;
    const haste = ((peca.inicio + peca.fim) / 2) * larguraDoPalco;
    const aDireitaDaHaste = limitarAoPalco(haste - RECUO_DA_HASTE, larguraDoPalco, larguraDoRotulo);
    const aEsquerdaDaHaste = limitarAoPalco(haste - larguraDoRotulo + RECUO_DA_HASTE, larguraDoPalco, larguraDoRotulo);
    const proximaLinhaLivre = colocados.reduce((maior, rotulo) => Math.max(maior, rotulo.linha), -1) + 1;

    let escolha = { linha: proximaLinhaLivre, esquerda: aDireitaDaHaste };
    procurar: for (let linha = 0; linha <= proximaLinhaLivre; linha++) {
      for (const esquerda of [aDireitaDaHaste, aEsquerdaDaHaste]) {
        if (cabeNaLinha(linha, esquerda, haste, larguraDoRotulo, colocados)) {
          escolha = { linha, esquerda };
          break procurar;
        }
      }
    }

    colocados.push({ esquerda: escolha.esquerda, direita: escolha.esquerda + larguraDoRotulo, haste, linha: escolha.linha });
    posicionados[indice] = {
      centroDaHaste: haste,
      esquerda: escolha.esquerda,
      linha: escolha.linha,
      alinhadoADireita: haste - escolha.esquerda > larguraDoRotulo / 2,
    };
  }
  return posicionados;
}
