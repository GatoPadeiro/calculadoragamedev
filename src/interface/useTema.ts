import { useCallback, useEffect, useState } from 'react';

export type Tema = 'claro' | 'escuro';

const CHAVE_DO_TEMA = 'cgd:tema';
const CONSULTA_DO_TEMA_ESCURO = '(prefers-color-scheme: dark)';
const COR_DA_BARRA_DO_NAVEGADOR: Record<Tema, string> = { claro: '#111114', escuro: '#0a0a0c' };

function ehTema(valor: unknown): valor is Tema {
  return valor === 'claro' || valor === 'escuro';
}

function temaEscolhido(): Tema | null {
  try {
    const salvo = localStorage.getItem(CHAVE_DO_TEMA);
    return ehTema(salvo) ? salvo : null;
  } catch {
    return null;
  }
}

function guardarTema(tema: Tema) {
  try {
    localStorage.setItem(CHAVE_DO_TEMA, tema);
  } catch {
    return;
  }
}

function temaDoSistema(): Tema {
  return window.matchMedia(CONSULTA_DO_TEMA_ESCURO).matches ? 'escuro' : 'claro';
}

function temaInicial(): Tema {
  const aplicado = document.documentElement.dataset.tema;
  return ehTema(aplicado) ? aplicado : temaEscolhido() ?? temaDoSistema();
}

function aplicarTema(tema: Tema) {
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COR_DA_BARRA_DO_NAVEGADOR[tema]);
}

export function useTema(): [Tema, () => void] {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => aplicarTema(tema), [tema]);

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_DO_TEMA_ESCURO);
    const aoMudarNoSistema = () => {
      if (!temaEscolhido()) setTema(temaDoSistema());
    };
    consulta.addEventListener('change', aoMudarNoSistema);
    return () => consulta.removeEventListener('change', aoMudarNoSistema);
  }, []);

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const proximo = atual === 'escuro' ? 'claro' : 'escuro';
      guardarTema(proximo);
      return proximo;
    });
  }, []);

  return [tema, alternarTema];
}
