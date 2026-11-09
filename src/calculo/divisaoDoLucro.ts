import type { GrupoDaDivisao, NoDaDivisao } from './tipos';

const TOLERANCIA_DA_SOMA = 1e-6;

export interface GrupoComSomaInvalida {
  idGrupo: string;
  nomeDoGrupo: string;
  soma: number;
}

export interface ValorDoNo {
  id: string;
  tipo: 'grupo' | 'socio';
  nome?: string;
  fatiaNoPai: number;
  fatiaNoTotal: number;
  valor: number;
  filhos: ValorDoNo[];
}

export interface ResultadoDaDivisao {
  arvore: ValorDoNo;
  fatiaPorSocio: Record<string, number>;
  valorPorSocio: Record<string, number>;
  gruposComSomaInvalida: GrupoComSomaInvalida[];
  valorSemDono: number;
}

export function somarFatias(grupo: GrupoDaDivisao): number {
  return grupo.partes.reduce((soma, parte) => soma + parte.fatia, 0);
}

export function somaEhValida(soma: number): boolean {
  return Math.abs(soma - 1) <= TOLERANCIA_DA_SOMA;
}

export function dividirLucro(raiz: GrupoDaDivisao, lucro: number): ResultadoDaDivisao {
  const fatiaPorSocio: Record<string, number> = {};
  const gruposComSomaInvalida: GrupoComSomaInvalida[] = [];

  const percorrer = (no: NoDaDivisao, fatiaNoPai: number, fatiaNoTotal: number): ValorDoNo => {
    if (no.tipo === 'socio') {
      fatiaPorSocio[no.idSocio] = (fatiaPorSocio[no.idSocio] ?? 0) + fatiaNoTotal;
      return { id: no.idSocio, tipo: 'socio', fatiaNoPai, fatiaNoTotal, valor: lucro * fatiaNoTotal, filhos: [] };
    }
    const soma = somarFatias(no);
    if (!somaEhValida(soma)) gruposComSomaInvalida.push({ idGrupo: no.id, nomeDoGrupo: no.nome, soma });
    return {
      id: no.id,
      tipo: 'grupo',
      nome: no.nome,
      fatiaNoPai,
      fatiaNoTotal,
      valor: lucro * fatiaNoTotal,
      filhos: no.partes.map((parte) => percorrer(parte.no, parte.fatia, fatiaNoTotal * parte.fatia)),
    };
  };

  const arvore = percorrer(raiz, 1, 1);
  const fatiaDistribuida = Object.values(fatiaPorSocio).reduce((soma, fatia) => soma + fatia, 0);
  const valorPorSocio = Object.fromEntries(Object.entries(fatiaPorSocio).map(([idSocio, fatia]) => [idSocio, fatia * lucro]));
  return { arvore, fatiaPorSocio, valorPorSocio, gruposComSomaInvalida, valorSemDono: Math.max(0, 1 - fatiaDistribuida) * lucro };
}
