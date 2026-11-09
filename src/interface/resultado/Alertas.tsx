import type { Alerta, ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { Socio } from '../../calculo/tipos';
import { formatarPercentual, formatarReais } from '../formatacao';
import { IconeAlerta } from '../icones';

type NivelDoAlerta = 'erro' | 'aviso' | 'info';

interface AlertaDescrito {
  nivel: NivelDoAlerta;
  texto: string;
}

function nomesDosSocios(ids: string[], socios: Socio[]): string {
  return ids.map((id) => socios.find((socio) => socio.id === id)?.nome ?? id).join(', ');
}

function descreverAlerta(alerta: Alerta, resultado: ResultadoDoCenario, socios: Socio[]): AlertaDescrito {
  switch (alerta.codigo) {
    case 'acima-do-limite-do-simples':
      return { nivel: 'erro', texto: `O faturamento de ${formatarReais(alerta.faturamento, 0)} passa do limite do Simples (R$ 4,8 mi por ano). Use o Lucro Presumido.` };
    case 'saiu-do-simples':
      return { nivel: 'info', texto: 'O faturamento passa de R$ 4,8 mi, então a empresa saiu do Simples e foi calculada no Lucro Presumido.' };
    case 'iss-fora-da-guia':
      return { nivel: 'aviso', texto: 'Entre R$ 3,6 mi e R$ 4,8 mi o ISS sai da guia do Simples e é pago à parte.' };
    case 'anexo-v':
      return {
        nivel: 'aviso',
        texto: `O Fator R de ${formatarPercentual(alerta.fatorR)} está abaixo de 28%, então a empresa caiu no Anexo V, que é mais caro. Para ir ao Anexo III a folha anual teria que ser ${formatarReais(alerta.folhaNecessaria, 0)}.`,
      };
    case 'pro-labore-zero':
      return {
        nivel: 'erro',
        texto: `Pró-labore zero com lucro sendo distribuído (${nomesDosSocios(alerta.idsDosSocios, socios)}): a Receita pode tratar parte do lucro como pró-labore e cobrar INSS com multa.`,
      };
    case 'prejuizo':
      return { nivel: 'erro', texto: `Os custos passam da receita em ${formatarReais(alerta.deficit, 0)}. Não sobra lucro para distribuir.` };
    case 'divisao-invalida': {
      const semDono = resultado.divisao.valorSemDono;
      const complemento = semDono > 0 ? `; ${formatarReais(semDono, 0)} ficam sem dono` : '';
      return { nivel: 'erro', texto: `A divisão de “${alerta.nomeDoGrupo}” soma ${formatarPercentual(alerta.soma, 2)}. Cada nível precisa somar 100%${complemento}.` };
    }
    case 'cotacao-ausente':
      return { nivel: 'erro', texto: `Sem cotação para ${alerta.moeda}. As vendas nessa moeda contam como zero até você travar um valor em 04 Câmbio.` };
  }
}

export function Alertas({ resultado, socios }: { resultado: ResultadoDoCenario; socios: Socio[] }) {
  const alertasVisiveis = resultado.alertas.filter((alerta) => alerta.codigo !== 'saiu-do-simples');
  if (!alertasVisiveis.length) return null;
  return (
    <section className="alerts" aria-label="Avisos">
      {alertasVisiveis.map((alerta, posicao) => {
        const { nivel, texto } = descreverAlerta(alerta, resultado, socios);
        return (
          <p key={posicao} className={`alert is-${nivel}`} role={nivel === 'erro' ? 'alert' : undefined}>
            <IconeAlerta tamanho={18} />
            <span>{texto}</span>
          </p>
        );
      })}
    </section>
  );
}
