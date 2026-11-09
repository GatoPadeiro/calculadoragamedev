import type { ResultadoDaLinha } from '../../calculo/calcularCenario';
import { CampoNumerico } from '../CampoNumerico';
import { SecaoNumerada } from './Controles';
import { SecaoCambio } from './SecaoCambio';
import { SecaoEstudio } from './SecaoEstudio';
import { SecaoSocios } from './SecaoSocios';
import { SecaoVendas } from './SecaoVendas';
import type { PropriedadesDaSecao, SituacaoDoCambio } from './tiposDaConfiguracao';

function SecaoCustos({ estado, alterarEstado }: PropriedadesDaSecao) {
  const custos = estado.cenario.custos;
  return (
    <SecaoNumerada numero="05" titulo="Equipe e custos">
      <div className="grid-2">
        <CampoNumerico
          rotulo="Salários CLT por mês"
          prefixo="R$"
          valor={custos.salariosMensais}
          dica="Total da equipe por mês. 13º, férias e FGTS entram sozinhos"
          aoMudar={(salarios) => alterarEstado((rascunho) => void (rascunho.cenario.custos.salariosMensais = salarios))}
        />
        <CampoNumerico
          rotulo="Outros custos no ano"
          prefixo="R$"
          valor={custos.outrosCustosAnuais}
          dica="Freelas, ferramentas, marketing"
          aoMudar={(outros) => alterarEstado((rascunho) => void (rascunho.cenario.custos.outrosCustosAnuais = outros))}
        />
      </div>
    </SecaoNumerada>
  );
}

interface PropriedadesDaConfiguracao extends PropriedadesDaSecao {
  cambio: SituacaoDoCambio;
  resultadosDasLinhas: ResultadoDaLinha[];
}

export function Configuracao({ estado, alterarEstado, cambio, resultadosDasLinhas }: PropriedadesDaConfiguracao) {
  return (
    <div className="config">
      <SecaoEstudio estado={estado} alterarEstado={alterarEstado} />
      <SecaoSocios estado={estado} alterarEstado={alterarEstado} />
      <SecaoVendas estado={estado} alterarEstado={alterarEstado} resultadosDasLinhas={resultadosDasLinhas} />
      <SecaoCambio estado={estado} alterarEstado={alterarEstado} cambio={cambio} />
      <SecaoCustos estado={estado} alterarEstado={alterarEstado} />
    </div>
  );
}
