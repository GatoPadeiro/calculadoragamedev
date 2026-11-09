import { PAIS_POR_CODIGO } from '../../dados/paises';
import { LOJAS } from '../../dados/lojas';
import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { EstadoDoApp } from '../../estado/estadoDoApp';
import { quantoChegaNaEmpresa } from '../../interface/resultado/VendasPorPaisELoja';

type Celula = string | number;

const SEPARADOR = ';';
const MARCA_UTF8 = '﻿';
const MESES_NO_ANO = 12;

function escaparCelula(celula: Celula): string {
  const texto = String(celula);
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

const emReais = (valor: number) => valor.toFixed(2);

function montarLinhas(estado: EstadoDoApp, resultado: ResultadoDoCenario, cotacaoDoDolar: number): Celula[][] {
  const { empresa } = resultado;
  return [
    ['Calculadora Game Dev BR', estado.nomeDoEstudio, estado.nomeDoJogo],
    [],
    ['País', 'Loja', 'Moeda', 'Cópias', 'Bruto (R$)', 'Chega na empresa (R$)'],
    ...resultado.linhas.map((linha) => [
      PAIS_POR_CODIGO[linha.pais]?.nome ?? linha.pais,
      LOJAS[linha.loja].nome,
      linha.moeda,
      linha.copias,
      emReais(linha.brutoEmReais),
      emReais(quantoChegaNaEmpresa(linha, cotacaoDoDolar)),
    ]),
    [],
    ['Faturamento da empresa (R$)', emReais(empresa.faturamento)],
    ['Imposto da empresa (R$)', emReais(empresa.impostoDaEmpresa)],
    ['Lucro distribuível (R$)', emReais(empresa.lucro)],
    [],
    ['Sócio', 'Parte do lucro', 'Líquido no ano (R$)', 'Por mês (R$)'],
    ...resultado.socios.map((socio) => [socio.nome, `${(socio.fatia * 100).toFixed(4)}%`, emReais(socio.liquidoAnual), emReais(socio.liquidoAnual / MESES_NO_ANO)]),
    [],
    ['Gerado na Calculadora Game Dev BR, da Gato Padeiro', 'https://www.gatopadeiro.com.br'],
    ['Simulação, não consultoria. Confirme com seu contador.'],
  ];
}

function nomeDoArquivo(nomeDoJogo: string): string {
  const semEspeciais = (nomeDoJogo || 'jogo').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `cenario-${semEspeciais}.csv`;
}

export function baixarPlanilha(estado: EstadoDoApp, resultado: ResultadoDoCenario, cotacaoDoDolar: number) {
  const conteudo = MARCA_UTF8 + montarLinhas(estado, resultado, cotacaoDoDolar).map((linha) => linha.map(escaparCelula).join(SEPARADOR)).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  link.download = nomeDoArquivo(estado.nomeDoJogo);
  link.click();
  URL.revokeObjectURL(link.href);
}
