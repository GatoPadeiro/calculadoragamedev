import { describe, expect, it } from 'vitest';
import { compressToEncodedURIComponent } from 'lz-string';
import { codificarParaLink, criarEstadoDeExemplo, decodificarDoLink } from './estadoDoApp';

const codificarObjeto = (objeto: unknown) => compressToEncodedURIComponent(JSON.stringify(objeto));

function estadoBaseParaAdulterar() {
  const { ehExemploSemEdicao: _ehExemplo, ...estado } = criarEstadoDeExemplo();
  return JSON.parse(JSON.stringify(estado));
}

describe('link do cenário', () => {
  it('ida e volta preserva o cenário e grava as cotações usadas', () => {
    const estado = { ...criarEstadoDeExemplo(), ehExemploSemEdicao: false };
    estado.cenario.vendas[0]!.copias = 2_500_000;
    const recuperado = decodificarDoLink(codificarParaLink(estado, { USD: 5.5, EUR: 6.1 }, '2026-11-06T22:14:00.000Z'))!;
    expect(recuperado.cenario).toEqual(estado.cenario);
    expect(recuperado.cotacoesDoLink).toEqual({ emReais: { USD: 5.5, EUR: 6.1 }, dataHora: '2026-11-06T22:14:00.000Z' });
  });

  it('link quebrado ou adulterado não abre', () => {
    const base = estadoBaseParaAdulterar();
    const primeiraVenda = base.cenario.vendas[0];
    expect(decodificarDoLink('isso-nao-e-um-cenario')).toBeNull();
    expect(decodificarDoLink(codificarObjeto({ ...base, versao: 1 }))).toBeNull();
    expect(decodificarDoLink(codificarObjeto({ ...base, cenario: { ...base.cenario, vendas: [{ ...primeiraVenda, loja: 'loja-falsa' }] } }))).toBeNull();
    expect(decodificarDoLink(codificarObjeto({ ...base, cenario: { ...base.cenario, vendas: [{ ...primeiraVenda, copias: -5 }] } }))).toBeNull();
    const socioComNomeGigante = { id: 'x', nome: 'a'.repeat(500), tipo: 'pessoaFisica', proLaboreMensal: 0 };
    expect(decodificarDoLink(codificarObjeto({ ...base, cenario: { ...base.cenario, socios: [socioComNomeGigante] } }))).toBeNull();
  });

  it('cotações inválidas no link são descartadas', () => {
    const base = estadoBaseParaAdulterar();
    const estado = decodificarDoLink(codificarObjeto({ ...base, cotacoesTravadas: { USD: -1, eur: 6, BTC: 'x', CNY: 0.8 } }))!;
    expect(estado.cotacoesTravadas).toEqual({ CNY: 0.8 });
  });
});
