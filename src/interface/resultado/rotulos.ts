import { SIMPLES } from '../../dados/tabelasTributarias';
import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { TipoDeSocio } from '../../calculo/tipos';
import { formatarPercentual } from '../formatacao';

export const MESES_NO_ANO = 12;

export function descreverRegime(resultado: ResultadoDoCenario): { titulo: string; detalhe: string } {
  const { empresa } = resultado;
  if (empresa.regime === 'simples') {
    return { titulo: 'Simples Nacional', detalhe: `Anexo ${empresa.anexo} · faixa ${empresa.faixaDoSimples} · Fator R ${formatarPercentual(empresa.fatorR)}` };
  }
  const passouDoLimite = empresa.faturamento > SIMPLES.limiteAnual;
  return { titulo: 'Lucro Presumido', detalhe: passouDoLimite ? 'Faturamento passa de R$ 4,8 mi: saiu do Simples' : 'escolhido no cenário' };
}

export function descreverRecebimento(tipo: TipoDeSocio): string {
  return tipo === 'pessoaFisica' ? 'líquido' : 'bruto';
}
