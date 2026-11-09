const MULTIPLICADOR_POR_SUFIXO: Record<string, number> = {
  k: 1e3,
  mil: 1e3,
  m: 1e6,
  mi: 1e6,
  milhao: 1e6,
  milhoes: 1e6,
  bi: 1e9,
  bilhao: 1e9,
  bilhoes: 1e9,
};

const PADRAO_DE_SUFIXO = /^(.*?)\s*(k|mil|milhoes|milhao|mi|m|bilhoes|bilhao|bi)\.?$/;
const PADRAO_DE_LETRAS_NO_FIM = /^(.*?\d.*?)(\s*[a-zA-ZÀ-ÿ]+\.?)$/;
const CARACTERE_SIGNIFICATIVO = /[\d,a-zA-ZÀ-ÿ]/;
const CARACTERES_NAO_SIGNIFICATIVOS = /[^\d,a-zA-ZÀ-ÿ]/g;

const removerAcentos = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '');

function separarSufixoDeEscala(texto: string): { numero: string; multiplicador: number } {
  const encontrado = removerAcentos(texto.trim().toLowerCase()).match(PADRAO_DE_SUFIXO);
  if (!encontrado) return { numero: texto, multiplicador: 1 };
  return { numero: encontrado[1]!, multiplicador: MULTIPLICADOR_POR_SUFIXO[encontrado[2]!]! };
}

function ehNegativo(texto: string): boolean {
  const inicioDoNumero = texto.search(/\d|,/);
  const prefixo = inicioDoNumero < 0 ? texto : texto.slice(0, inicioDoNumero);
  return /[-−]/.test(prefixo);
}

export function lerNumeroBR(texto: string): number | null {
  if (texto == null) return null;
  const { numero, multiplicador } = separarSufixoDeEscala(String(texto));
  const digitosEVirgula = numero.replace(/[^\d,]/g, '');
  if (!/\d/.test(digitosEVirgula)) return null;
  const posicaoDaVirgula = digitosEVirgula.indexOf(',');
  const parteInteira = posicaoDaVirgula < 0 ? digitosEVirgula : digitosEVirgula.slice(0, posicaoDaVirgula);
  const parteDecimal = posicaoDaVirgula < 0 ? '' : digitosEVirgula.slice(posicaoDaVirgula + 1).replace(/,/g, '');
  const valor = Number(`${parteInteira || '0'}.${parteDecimal || '0'}`) * multiplicador;
  if (!Number.isFinite(valor)) return null;
  return ehNegativo(numero) ? -valor : valor;
}

const agruparMilhares = (parteInteira: string) => parteInteira.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function formatarEnquantoDigita(texto: string, casasDecimais = 2): string {
  const encontrado = texto.match(PADRAO_DE_LETRAS_NO_FIM);
  const numero = encontrado ? encontrado[1]! : texto;
  const letras = encontrado ? encontrado[2]!.replace(/\s+/g, ' ') : '';
  const digitosEVirgula = numero.replace(/[^\d,]/g, '');
  const posicaoDaVirgula = digitosEVirgula.indexOf(',');
  if (posicaoDaVirgula < 0) return agruparMilhares(digitosEVirgula) + letras;
  const parteInteira = agruparMilhares(digitosEVirgula.slice(0, posicaoDaVirgula)) || '0';
  const parteDecimal = digitosEVirgula.slice(posicaoDaVirgula + 1).replace(/,/g, '').slice(0, casasDecimais);
  return (casasDecimais > 0 ? `${parteInteira},${parteDecimal}` : parteInteira) + letras;
}

export function posicaoDoCursorAposFormatar(textoAntes: string, cursorAntes: number, textoDepois: string): number {
  const significativosAntesDoCursor = textoAntes.slice(0, cursorAntes).replace(CARACTERES_NAO_SIGNIFICATIVOS, '').length;
  let contados = 0;
  let posicao = 0;
  while (posicao < textoDepois.length && contados < significativosAntesDoCursor) {
    if (CARACTERE_SIGNIFICATIVO.test(textoDepois[posicao]!)) contados++;
    posicao++;
  }
  return posicao;
}

export function formatarNumeroBR(valor: number, { minimoDeCasas = 0, maximoDeCasas = 2 }: { minimoDeCasas?: number; maximoDeCasas?: number } = {}): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: minimoDeCasas, maximumFractionDigits: Math.max(minimoDeCasas, maximoDeCasas) });
}

const ESCALAS: [valor: number, singular: string, plural: string][] = [
  [1e12, 'trilhão', 'trilhões'],
  [1e9, 'bilhão', 'bilhões'],
  [1e6, 'milhão', 'milhões'],
  [1e3, 'mil', 'mil'],
];

const MENOR_VALOR_ABREVIADO = 10_000;

export function abreviarNumero(valor: number): string | null {
  const absoluto = Math.abs(valor);
  if (absoluto < MENOR_VALOR_ABREVIADO) return null;
  const sinal = valor < 0 ? '−' : '';
  const [tamanho, singular, plural] = ESCALAS.find(([tamanhoDaEscala]) => absoluto >= tamanhoDaEscala)!;
  const quantidade = Math.round((absoluto / tamanho) * 10) / 10;
  const texto = quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${sinal}${texto} ${quantidade < 2 ? singular : plural}`;
}
