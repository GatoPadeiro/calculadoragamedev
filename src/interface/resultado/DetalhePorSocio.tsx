import type { ResultadoDoCenario, ResultadoDoSocio } from '../../calculo/calcularCenario';
import type { RendaDoSocio } from '../../calculo/impostosDoBrasil';
import type { Socio } from '../../calculo/tipos';
import { corDoSocio } from '../cores';
import { formatarPercentual, formatarReais } from '../formatacao';

const VALOR_DESPREZIVEL = 0.004;

function LinhaDoExtrato({ descricao, valor, ehDesconto, ehTotal }: { descricao: string; valor: number; ehDesconto?: boolean; ehTotal?: boolean }) {
  const valorExibido = ehDesconto && valor > VALOR_DESPREZIVEL ? -valor : valor;
  return (
    <>
      <dt className={ehTotal ? 'is-sum' : undefined}>{descricao}</dt>
      <dd className={`num${ehTotal ? ' is-sum' : ''}`}>{formatarReais(valorExibido)}</dd>
    </>
  );
}

function ExtratoDePessoaFisica({ renda, fatia }: { renda: RendaDoSocio; fatia: number }) {
  return (
    <>
      <dl>
        <LinhaDoExtrato descricao="Pró-labore bruto" valor={renda.proLaboreBruto} />
        <LinhaDoExtrato descricao="INSS 11%" valor={renda.inss} ehDesconto />
        <LinhaDoExtrato descricao="IRPF do pró-labore" valor={renda.irpf} ehDesconto />
        <LinhaDoExtrato descricao={`Lucro (${formatarPercentual(fatia, 2)})`} valor={renda.dividendos} />
        <LinhaDoExtrato descricao="Retenção de 10% nos dividendos" valor={renda.retencaoDeDividendos} ehDesconto />
        <LinhaDoExtrato descricao={`Imposto mínimo anual (${formatarPercentual(renda.aliquotaMinima, 2)})`} valor={renda.complementoDoImpostoMinimo} ehDesconto />
        <LinhaDoExtrato descricao="Líquido no ano" valor={renda.liquidoAnual} ehTotal />
      </dl>
      {renda.creditoNaDeclaracao > 0 && <p className="field-hint">Até {formatarReais(renda.creditoNaDeclaracao)} retidos a mais podem voltar na declaração de IR.</p>}
    </>
  );
}

function ExtratoDeEmpresa({ resultadoDoSocio }: { resultadoDoSocio: ResultadoDoSocio }) {
  return (
    <>
      <dl>
        <LinhaDoExtrato descricao={`Lucro (${formatarPercentual(resultadoDoSocio.fatia, 2)})`} valor={resultadoDoSocio.dividendos} ehTotal />
      </dl>
      <p className="field-hint">Impostos dependem de quem recebe (empresa, holding ou pessoas do grupo).</p>
    </>
  );
}

export function DetalhePorSocio({ resultado, socios }: { resultado: ResultadoDoCenario; socios: Socio[] }) {
  return (
    <section className="block" aria-labelledby="detalhe-titulo">
      <h2 id="detalhe-titulo" className="block-title">Por sócio, no ano</h2>
      <div className="people">
        {resultado.socios.map((resultadoDoSocio) => {
          const posicao = socios.findIndex((socio) => socio.id === resultadoDoSocio.idSocio);
          const cor = corDoSocio(posicao);
          return (
            <article key={resultadoDoSocio.idSocio} className="person">
              <h3 style={{ background: cor.fundo, color: cor.texto }}>{resultadoDoSocio.nome || `Sócio ${posicao + 1}`}</h3>
              {resultadoDoSocio.renda ? (
                <ExtratoDePessoaFisica renda={resultadoDoSocio.renda} fatia={resultadoDoSocio.fatia} />
              ) : (
                <ExtratoDeEmpresa resultadoDoSocio={resultadoDoSocio} />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
