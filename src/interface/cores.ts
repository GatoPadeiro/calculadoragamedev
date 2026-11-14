export interface CorDoSocio {
  fundo: string;
  texto: string;
  nome: string;
}

export const CORES_DOS_SOCIOS: CorDoSocio[] = [
  { fundo: '#2b6fd6', texto: '#ffffff', nome: 'azul' },
  { fundo: '#ffd23f', texto: '#111114', nome: 'amarelo' },
  { fundo: '#187a45', texto: '#ffffff', nome: 'verde' },
  { fundo: 'var(--socio-preto)', texto: 'var(--socio-preto-texto)', nome: 'preto' },
  { fundo: '#8a1c2b', texto: '#ffffff', nome: 'vinho' },
  { fundo: '#6a4bb5', texto: '#ffffff', nome: 'roxo' },
  { fundo: '#e8892b', texto: '#111114', nome: 'laranja' },
  { fundo: '#156f77', texto: '#ffffff', nome: 'petróleo' },
];

export function corDoSocio(posicaoNaLista: number): CorDoSocio {
  const total = CORES_DOS_SOCIOS.length;
  return CORES_DOS_SOCIOS[((posicaoNaLista % total) + total) % total]!;
}

export const CORES_DA_ANATOMIA = {
  impostoDoPais: '#9a9a93',
  reembolsos: '#c4c4bd',
  lojas: '#3a3a40',
  euaEEngine: '#6b6b72',
  impostosNoBrasil: '#86867f',
  proLaboreECustos: '#b3b3ab',
} as const;

export const COR_DA_TINTA = '#111114';
export const COR_DO_PAPEL = '#ffffff';
export const COR_DO_PAINEL = 'var(--panel)';
export const COR_DO_TEXTO = 'var(--ink)';
