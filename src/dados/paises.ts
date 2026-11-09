export interface Pais {
  codigo: string;
  nome: string;
  moeda: string;
  impostoConsumoNoPreco: number;
  sofreRetencaoDosEua?: boolean;
}

export const PAISES: Pais[] = [
  { codigo: 'BR', nome: 'Brasil', moeda: 'BRL', impostoConsumoNoPreco: 0 },
  { codigo: 'US', nome: 'Estados Unidos', moeda: 'USD', impostoConsumoNoPreco: 0, sofreRetencaoDosEua: true },
  { codigo: 'CA', nome: 'Canadá', moeda: 'CAD', impostoConsumoNoPreco: 0 },
  { codigo: 'MX', nome: 'México', moeda: 'MXN', impostoConsumoNoPreco: 0.16 },
  { codigo: 'AR', nome: 'Argentina', moeda: 'USD', impostoConsumoNoPreco: 0.21 },
  { codigo: 'CL', nome: 'Chile', moeda: 'CLP', impostoConsumoNoPreco: 0.19 },
  { codigo: 'CO', nome: 'Colômbia', moeda: 'COP', impostoConsumoNoPreco: 0.19 },
  { codigo: 'GB', nome: 'Reino Unido', moeda: 'GBP', impostoConsumoNoPreco: 0.2 },
  { codigo: 'DE', nome: 'Alemanha', moeda: 'EUR', impostoConsumoNoPreco: 0.19 },
  { codigo: 'FR', nome: 'França', moeda: 'EUR', impostoConsumoNoPreco: 0.2 },
  { codigo: 'ES', nome: 'Espanha', moeda: 'EUR', impostoConsumoNoPreco: 0.21 },
  { codigo: 'IT', nome: 'Itália', moeda: 'EUR', impostoConsumoNoPreco: 0.22 },
  { codigo: 'PT', nome: 'Portugal', moeda: 'EUR', impostoConsumoNoPreco: 0.23 },
  { codigo: 'PL', nome: 'Polônia', moeda: 'PLN', impostoConsumoNoPreco: 0.23 },
  { codigo: 'TR', nome: 'Turquia', moeda: 'USD', impostoConsumoNoPreco: 0.2 },
  { codigo: 'RU', nome: 'Rússia', moeda: 'RUB', impostoConsumoNoPreco: 0.22 },
  { codigo: 'CN', nome: 'China', moeda: 'CNY', impostoConsumoNoPreco: 0 },
  { codigo: 'JP', nome: 'Japão', moeda: 'JPY', impostoConsumoNoPreco: 0.1 },
  { codigo: 'KR', nome: 'Coreia do Sul', moeda: 'KRW', impostoConsumoNoPreco: 0.1 },
  { codigo: 'IN', nome: 'Índia', moeda: 'INR', impostoConsumoNoPreco: 0.18 },
  { codigo: 'AU', nome: 'Austrália', moeda: 'AUD', impostoConsumoNoPreco: 0.1 },
];

export const PAIS_POR_CODIGO: Record<string, Pais> = Object.fromEntries(PAISES.map((pais) => [pais.codigo, pais]));
