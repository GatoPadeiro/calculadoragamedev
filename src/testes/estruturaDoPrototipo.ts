import type { Cenario } from '../calculo/tipos';

export const ESTRUTURA_DO_PROTOTIPO: Pick<Cenario, 'socios' | 'divisao'> = {
  socios: [
    { id: 'socio-a', nome: 'Sócio A', tipo: 'pessoaFisica', proLaboreMensal: 5_000 },
    { id: 'socio-b', nome: 'Sócio B', tipo: 'pessoaFisica', proLaboreMensal: 5_000 },
    { id: 'socio-c', nome: 'Sócio C', tipo: 'pessoaFisica', proLaboreMensal: 5_000 },
    { id: 'freelas', nome: 'Freelas', tipo: 'empresa', proLaboreMensal: 0 },
    { id: 'caixa', nome: 'Caixa', tipo: 'empresa', proLaboreMensal: 0 },
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
          id: 'grupo',
          nome: 'Grupo',
          partes: [
            { fatia: 0.3, no: { tipo: 'socio', idSocio: 'caixa' } },
            {
              fatia: 0.7,
              no: {
                tipo: 'grupo',
                id: 'subgrupo',
                nome: 'Subgrupo',
                partes: [
                  { fatia: 0.3, no: { tipo: 'socio', idSocio: 'socio-a' } },
                  { fatia: 0.3, no: { tipo: 'socio', idSocio: 'socio-b' } },
                  { fatia: 0.3, no: { tipo: 'socio', idSocio: 'socio-c' } },
                  { fatia: 0.1, no: { tipo: 'socio', idSocio: 'freelas' } },
                ],
              },
            },
          ],
        },
      },
      { fatia: 0.07, no: { tipo: 'socio', idSocio: 'socio-a' } },
      { fatia: 0.07, no: { tipo: 'socio', idSocio: 'socio-b' } },
      { fatia: 0.07, no: { tipo: 'socio', idSocio: 'socio-c' } },
    ],
  },
};

