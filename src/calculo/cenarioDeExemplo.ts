import type { Cenario } from './tipos';

export const CENARIO_DE_EXEMPLO: Cenario = {
  estudio: {
    regime: 'automatico',
    iss: 0.05,
    vendaContaComoExportacao: false,
    engine: 'unreal',
    lancadoTambemNaEpic: false,
    appStorePequenoDesenvolvedor: true,
    aplicarRetencaoDosEua: true,
    remessa: { irrf: 0.15, iof: 0.035, empresaPagaIrrfPorFora: true },
  },
  socios: [
    { id: 'socio-1', nome: 'Sócio 1', tipo: 'pessoaFisica', proLaboreMensal: 2_500 },
    { id: 'socio-2', nome: 'Sócio 2', tipo: 'pessoaFisica', proLaboreMensal: 2_500 },
    { id: 'socio-3', nome: 'Sócio 3', tipo: 'pessoaFisica', proLaboreMensal: 2_500 },
    { id: 'freelas', nome: 'Freelas', tipo: 'empresa', proLaboreMensal: 0 },
    { id: 'caixa', nome: 'Caixa do estúdio', tipo: 'empresa', proLaboreMensal: 0 },
  ],
  divisao: {
    tipo: 'grupo',
    id: 'raiz',
    nome: 'Lucro distribuível',
    partes: [
      {
        fatia: 0.79,
        no: {
          tipo: 'grupo',
          id: 'estudio',
          nome: 'Estúdio',
          partes: [
            { fatia: 0.3, no: { tipo: 'socio', idSocio: 'caixa' } },
            {
              fatia: 0.7,
              no: {
                tipo: 'grupo',
                id: 'projeto-do-estudio',
                nome: 'Projeto do Estudio',
                partes: [
                  { fatia: 0.3, no: { tipo: 'socio', idSocio: 'socio-1' } },
                  { fatia: 0.3, no: { tipo: 'socio', idSocio: 'socio-2' } },
                  { fatia: 0.3, no: { tipo: 'socio', idSocio: 'socio-3' } },
                  { fatia: 0.1, no: { tipo: 'socio', idSocio: 'freelas' } },
                ],
              },
            },
          ],
        },
      },
      { fatia: 0.07, no: { tipo: 'socio', idSocio: 'socio-1' } },
      { fatia: 0.07, no: { tipo: 'socio', idSocio: 'socio-2' } },
      { fatia: 0.07, no: { tipo: 'socio', idSocio: 'socio-3' } },
    ],
  },
  vendas: [
    { id: 'us-steam', pais: 'US', loja: 'steam', moeda: 'USD', precoPorCopia: 14.99, copias: 12_000, impostoConsumoNoPreco: 0, taxaDeReembolso: 0.05 },
    { id: 'br-steam', pais: 'BR', loja: 'steam', moeda: 'BRL', precoPorCopia: 37.99, copias: 6_000, impostoConsumoNoPreco: 0, taxaDeReembolso: 0.05 },
    { id: 'de-epic', pais: 'DE', loja: 'epic', moeda: 'EUR', precoPorCopia: 14.99, copias: 3_000, impostoConsumoNoPreco: 0.19, taxaDeReembolso: 0.05 },
    { id: 'jp-steam', pais: 'JP', loja: 'steam', moeda: 'JPY', precoPorCopia: 1_500, copias: 2_000, impostoConsumoNoPreco: 0.1, taxaDeReembolso: 0.05 },
  ],
  cotacoes: { USD: 5.4, EUR: 6.25, JPY: 0.036 },
  custos: { salariosMensais: 0, outrosCustosAnuais: 60_000 },
};
