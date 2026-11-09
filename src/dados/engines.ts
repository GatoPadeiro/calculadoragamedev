import type { Fonte } from './fonte';

export type IdEngine = 'unreal' | 'unity' | 'godot' | 'propria';

export interface RegraDaEngine {
  id: IdEngine;
  nome: string;
  royalty: number;
  royaltyNoLancamentoNaEpic?: number;
  isencaoEmDolar: number;
  fonte: Fonte;
}

export const ENGINES: Record<IdEngine, RegraDaEngine> = {
  unreal: {
    id: 'unreal',
    nome: 'Unreal Engine',
    royalty: 0.05,
    royaltyNoLancamentoNaEpic: 0.035,
    isencaoEmDolar: 1_000_000,
    fonte: {
      referencia: 'Unreal Engine EULA (5% acima de US$ 1 mi por jogo); programa Launch Everywhere with Epic (3,5%)',
      vigencia: '3,5% para jogos lançados a partir de 01/01/2025',
      conferido: false,
      nota: 'A isenção de US$ 1 mi vale por jogo, na vida toda do jogo, e aqui é aplicada ao período simulado. Os 3,5% exigem lançar na Epic Games Store no mesmo dia ou antes das outras lojas da mesma plataforma.',
    },
  },
  unity: {
    id: 'unity',
    nome: 'Unity',
    royalty: 0,
    isencaoEmDolar: 0,
    fonte: { referencia: 'Unity, cancelamento da Runtime Fee (setembro de 2024); licença entra como custo', vigencia: '2025', conferido: false },
  },
  godot: { id: 'godot', nome: 'Godot', royalty: 0, isencaoEmDolar: 0, fonte: { referencia: 'Licença MIT', vigencia: 'vigente', conferido: true } },
  propria: { id: 'propria', nome: 'Engine própria', royalty: 0, isencaoEmDolar: 0, fonte: { referencia: 'Sem royalty', vigencia: 'vigente', conferido: true } },
};
