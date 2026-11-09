import type { ReactNode, SVGProps } from 'react';

type PropriedadesDoIcone = SVGProps<SVGSVGElement> & { tamanho?: number };

function IconeBase({ tamanho = 18, children, ...demais }: PropriedadesDoIcone & { children: ReactNode }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...demais}>
      {children}
    </svg>
  );
}

export const IconeAdicionar = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M12 5v14M5 12h14" /></IconeBase>;
export const IconeRemover = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></IconeBase>;
export const IconeDuplicar = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></IconeBase>;
export const IconeDividir = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M12 3v6M12 9l-6 6v6M12 9l6 6v6" /></IconeBase>;
export const IconeAtualizar = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4" /></IconeBase>;
export const IconeCadeado = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><rect x="5" y="11" width="14" height="10" rx="1.5" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></IconeBase>;
export const IconeLink = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></IconeBase>;
export const IconeBaixar = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></IconeBase>;
export const IconeImprimir = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M7 9V3h10v6M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z" /></IconeBase>;
export const IconeAlerta = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M12 3 2 20h20L12 3zM12 10v4M12 17v.01" /></IconeBase>;
export const IconeRecomecar = (propriedades: PropriedadesDoIcone) => <IconeBase {...propriedades}><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6M4 4v4.6h4.6" /></IconeBase>;
