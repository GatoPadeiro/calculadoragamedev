import { describe, expect, it } from 'vitest';
import { abreviarNumero, formatarEnquantoDigita, formatarNumeroBR, lerNumeroBR, posicaoDoCursorAposFormatar } from './numeroBR';

describe('lerNumeroBR', () => {
  it.each([
    ['1.000', 1_000],
    ['2.500.000', 2_500_000],
    ['1.500.000.000', 1_500_000_000],
    ['19,99', 19.99],
    ['R$ 1.234,56', 1_234.56],
    ['US$ 19,99', 19.99],
    ['1,5mi', 1_500_000],
    ['2bi', 2_000_000_000],
    ['300mil', 300_000],
    ['300 mil', 300_000],
    ['2 milhões', 2_000_000],
    ['1 bilhão', 1_000_000_000],
    ['10k', 10_000],
    ['-1.000', -1_000],
    ['0', 0],
  ])('%s → %d', (texto, esperado) => {
    expect(lerNumeroBR(texto)).toBeCloseTo(esperado, 6);
  });
  it('texto sem número devolve null', () => {
    expect(lerNumeroBR('')).toBeNull();
    expect(lerNumeroBR('abc')).toBeNull();
  });
});

describe('formatarEnquantoDigita', () => {
  it.each([
    ['1000', '1.000'],
    ['10000', '10.000'],
    ['2500000', '2.500.000'],
    ['1500000000', '1.500.000.000'],
    ['1.0000', '10.000'],
    ['1234,5', '1.234,5'],
    ['1234,', '1.234,'],
    [',5', '0,5'],
    ['007', '7'],
    ['19,999', '19,99'],
    ['1,5mi', '1,5mi'],
    ['1500m', '1.500m'],
    ['300 mil', '300 mil'],
  ])('%s → %s', (texto, esperado) => {
    expect(formatarEnquantoDigita(texto)).toBe(esperado);
  });
  it('campo sem casas decimais descarta a parte decimal', () => {
    expect(formatarEnquantoDigita('1234,56', 0)).toBe('1.234');
  });
});

describe('posicaoDoCursorAposFormatar', () => {
  it('letras de escala não trocam de lugar ao digitar', () => {
    expect(posicaoDoCursorAposFormatar('300m', 4, '300m')).toBe(4);
    expect(posicaoDoCursorAposFormatar('3000mi', 6, '3.000mi')).toBe(7);
  });
  it('cursor no fim continua no fim', () => {
    expect(posicaoDoCursorAposFormatar('1000', 4, '1.000')).toBe(5);
  });
  it('cursor no meio fica depois do mesmo dígito', () => {
    expect(posicaoDoCursorAposFormatar('1234', 2, '1.234')).toBe(3);
  });
});

describe('formatarNumeroBR e abreviarNumero', () => {
  it('formata no padrão brasileiro', () => {
    expect(formatarNumeroBR(1234567.891)).toBe('1.234.567,89');
    expect(formatarNumeroBR(19.9, { minimoDeCasas: 2 })).toBe('19,90');
  });
  it.each([
    [9_999, null],
    [300_000, '300 mil'],
    [1_500_000, '1,5 milhão'],
    [2_500_000, '2,5 milhões'],
    [1_000_000_000, '1 bilhão'],
    [3_200_000_000, '3,2 bilhões'],
  ])('%d → %s', (valor, esperado) => {
    expect(abreviarNumero(valor)).toBe(esperado);
  });
});
