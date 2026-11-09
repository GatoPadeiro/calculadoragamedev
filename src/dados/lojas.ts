import type { Fonte } from './fonte';

export type IdLoja = 'steam' | 'epic' | 'playstation' | 'xbox' | 'nintendo' | 'appstore' | 'googleplay';

export interface FaixaDaLoja {
  ateEmDolar: number;
  taxa: number;
}

export interface FaixasDeUmMercado {
  nomeDoMercado: string;
  paises: readonly string[];
  faixas: FaixaDaLoja[];
}

export interface RegraDaLoja {
  id: IdLoja;
  nome: string;
  grupo: 'PC' | 'Console' | 'Mobile';
  faixas: FaixaDaLoja[];
  faixasPorMercado?: FaixasDeUmMercado[];
  isentaDeRoyaltyDaUnreal?: boolean;
  fonte: Fonte;
}

const taxaUnica = (taxa: number): FaixaDaLoja[] => [{ ateEmDolar: Infinity, taxa }];

const FONTE_DE_CONSOLE: Fonte = { referencia: 'Padrão de mercado; contrato com a plataforma não é público', vigencia: '2026', conferido: false };

export const TAXA_APP_STORE_PEQUENO_DESENVOLVEDOR = 0.15;

const PAISES_DO_ESPACO_ECONOMICO_EUROPEU = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
];

const MERCADOS_COM_A_NOVA_TAXA_DO_GOOGLE_PLAY = [...PAISES_DO_ESPACO_ECONOMICO_EUROPEU, 'GB', 'US', 'AU', 'JP'];

export const LOJAS: Record<IdLoja, RegraDaLoja> = {
  steam: {
    id: 'steam',
    nome: 'Steam',
    grupo: 'PC',
    faixas: [
      { ateEmDolar: 10_000_000, taxa: 0.3 },
      { ateEmDolar: 50_000_000, taxa: 0.25 },
      { ateEmDolar: Infinity, taxa: 0.2 },
    ],
    fonte: {
      referencia: 'Valve, atualização do Steam Distribution Agreement (novembro de 2018)',
      vigencia: 'desde 01/10/2018',
      conferido: false,
      nota: 'As faixas valem por jogo, sobre a receita acumulada. Aqui são aplicadas à receita do período simulado.',
    },
  },
  epic: {
    id: 'epic',
    nome: 'Epic Games Store',
    grupo: 'PC',
    faixas: [
      { ateEmDolar: 1_000_000, taxa: 0 },
      { ateEmDolar: Infinity, taxa: 0.12 },
    ],
    isentaDeRoyaltyDaUnreal: true,
    fonte: {
      referencia: 'Epic Games Store: 100% da receita líquida no primeiro US$ 1 mi por jogo por ano e divisão 88/12 acima; isenção de royalty da Unreal para receita na loja',
      vigencia: 'desde 01/06/2025; o limite recomeça todo 1º de janeiro',
      conferido: false,
    },
  },
  playstation: { id: 'playstation', nome: 'PlayStation', grupo: 'Console', faixas: taxaUnica(0.3), fonte: FONTE_DE_CONSOLE },
  xbox: { id: 'xbox', nome: 'Xbox', grupo: 'Console', faixas: taxaUnica(0.3), fonte: FONTE_DE_CONSOLE },
  nintendo: { id: 'nintendo', nome: 'Nintendo', grupo: 'Console', faixas: taxaUnica(0.3), fonte: FONTE_DE_CONSOLE },
  appstore: {
    id: 'appstore',
    nome: 'App Store',
    grupo: 'Mobile',
    faixas: taxaUnica(0.3),
    fonte: {
      referencia: 'Apple, App Store Small Business Program (15% para quem fatura até US$ 1 mi por ano)',
      vigencia: 'desde 01/01/2021',
      conferido: false,
      nota: 'Com o programa ligado no cenário, a taxa vira 15%.',
    },
  },
  googleplay: {
    id: 'googleplay',
    nome: 'Google Play',
    grupo: 'Mobile',
    faixas: [
      { ateEmDolar: 1_000_000, taxa: 0.15 },
      { ateEmDolar: Infinity, taxa: 0.3 },
    ],
    faixasPorMercado: [
      {
        nomeDoMercado: 'EUA, Espaço Econômico Europeu, Reino Unido, Austrália e Japão',
        paises: MERCADOS_COM_A_NOVA_TAXA_DO_GOOGLE_PLAY,
        faixas: [
          { ateEmDolar: 1_000_000, taxa: 0.15 },
          { ateEmDolar: Infinity, taxa: 0.25 },
        ],
      },
    ],
    fonte: {
      referencia:
        'Google Play Console, taxas de serviço: nos mercados com a nova taxa, 10% + 5% de faturamento no primeiro US$ 1 mi do ano e 20% + 5% acima; nos demais, 15% até US$ 1 mi e 30% acima',
      vigencia: 'nova taxa desde 30/06/2026 (EUA, EEE e Reino Unido) e 30/09/2026 (Austrália e Japão); demais países até 30/09/2027',
      conferido: false,
      nota: 'A taxa depende do país de quem compra. Considera jogo instalado depois da mudança, sem os programas Level Up ou Apps Experience (que baixam a taxa acima de US$ 1 mi para 15% + 5%) e usando o faturamento do Google.',
    },
  },
};
