import type { ReactNode } from 'react';
import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { Socio } from '../../calculo/tipos';
import { Alertas } from './Alertas';
import { AnatomiaDeUmaCopia } from './AnatomiaDeUmaCopia';
import { CaminhoDoDinheiro } from './CaminhoDoDinheiro';
import { ComparacaoComProLabore } from './ComparacaoComProLabore';
import { DetalhePorSocio } from './DetalhePorSocio';
import { DivisaoDoLucro } from './DivisaoDoLucro';
import { Indicadores } from './Indicadores';
import { Parcelamento } from './Parcelamento';
import { QuantoCadaUmLeva } from './QuantoCadaUmLeva';
import { VendasPorPaisELoja } from './VendasPorPaisELoja';

interface PropriedadesDoResultado {
  resultado: ResultadoDoCenario;
  socios: Socio[];
  cotacaoDoDolar: number;
  acoes: ReactNode;
}

export function Resultado({ resultado, socios, cotacaoDoDolar, acoes }: PropriedadesDoResultado) {
  return (
    <div className="result">
      <AnatomiaDeUmaCopia resultado={resultado} socios={socios} cotacaoDoDolar={cotacaoDoDolar} />
      <Indicadores resultado={resultado} cotacaoDoDolar={cotacaoDoDolar} />
      <QuantoCadaUmLeva resultado={resultado} socios={socios} />
      <Alertas resultado={resultado} socios={socios} />
      <CaminhoDoDinheiro resultado={resultado} cotacaoDoDolar={cotacaoDoDolar} />
      <VendasPorPaisELoja resultado={resultado} cotacaoDoDolar={cotacaoDoDolar} />
      <DivisaoDoLucro resultado={resultado} socios={socios} />
      <DetalhePorSocio resultado={resultado} socios={socios} />
      <Parcelamento resultado={resultado} />
      <ComparacaoComProLabore resultado={resultado} socios={socios} />
      <div className="block actions-block">{acoes}</div>
    </div>
  );
}
