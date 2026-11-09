import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import { Calculadora } from './paginas/calculadora/Calculadora';
import { ComoCalculamos } from './paginas/ComoCalculamos';
import { Sobre } from './paginas/Sobre';
import { linkDoEstudio, LogoDoEstudio } from './interface/Marca';
import { IconeLink } from './interface/icones';
import { enderecoCanonico, metadadosDaRota, PAGINAS, type Rota } from './paginas/metadadosDasPaginas';

const CHAVE_DO_CENARIO_NA_SESSAO = 'cgd:endereco-do-cenario';
const TEMPO_DO_AVISO_DE_COPIADO_EM_MS = 2400;

function rotaAtual(): Rota {
  return metadadosDaRota(location.pathname.replace(/\/$/, '') || '/').caminho;
}

function abriuEmOutraAba(evento: MouseEvent<HTMLAnchorElement>): boolean {
  return evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0;
}

function atualizarCabecalhoDaPagina(rota: Rota) {
  const pagina = metadadosDaRota(rota);
  document.title = pagina.titulo;
  document.querySelector('meta[name="description"]')?.setAttribute('content', pagina.descricao);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', enderecoCanonico(rota));
}

function useNavegacao() {
  const [rota, setRota] = useState<Rota>(rotaAtual);

  useEffect(() => {
    const aoVoltar = () => setRota(rotaAtual());
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

  useEffect(() => atualizarCabecalhoDaPagina(rota), [rota]);

  const navegar = (evento: MouseEvent<HTMLAnchorElement>, destino: Rota) => {
    if (abriuEmOutraAba(evento)) return;
    evento.preventDefault();
    if (destino !== '/' && rota === '/') sessionStorage.setItem(CHAVE_DO_CENARIO_NA_SESSAO, location.hash);
    const endereco = destino === '/' ? `/${sessionStorage.getItem(CHAVE_DO_CENARIO_NA_SESSAO) ?? ''}` : destino;
    history.pushState(null, '', endereco);
    setRota(destino);
    window.scrollTo(0, 0);
  };

  return { rota, navegar };
}

function BotaoCopiarLink({ copiarLink }: { copiarLink: () => Promise<boolean> }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    await copiarLink();
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), TEMPO_DO_AVISO_DE_COPIADO_EM_MS);
  };
  return (
    <button type="button" className="btn-primary topbar-cta" onClick={copiar}>
      <IconeLink /> <span>{copiado ? 'Link copiado' : 'Copiar link do cenário'}</span>
    </button>
  );
}

export function App() {
  const { rota, navegar } = useNavegacao();
  const copiarLinkDaCalculadora = useRef<() => Promise<boolean>>(async () => false);
  const registrarCopiarLink = useCallback((copiar: () => Promise<boolean>) => void (copiarLinkDaCalculadora.current = copiar), []);

  return (
    <div className="app">
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topbar">
        <div className="topbar-in">
          <div className="brand">
            <a href="/" className="logo-link" onClick={(evento) => navegar(evento, '/')} tabIndex={-1} aria-hidden="true">
              <span className="logo-disc">
                <LogoDoEstudio tamanho={40} />
              </span>
            </a>
            <div className="brand-text">
              <a href="/" className="brand-name" onClick={(evento) => navegar(evento, '/')}>
                Calculadora <span>Game Dev BR</span>
              </a>
              <a className="brand-by" href={linkDoEstudio('topo')} target="_blank" rel="noopener">
                por Gato Padeiro
              </a>
            </div>
          </div>
          <nav className="nav" aria-label="Páginas">
            {PAGINAS.map((item) => (
              <a key={item.caminho} href={item.caminho} aria-current={rota === item.caminho ? 'page' : undefined} onClick={(evento) => navegar(evento, item.caminho)}>
                {item.nomeNoMenu}
              </a>
            ))}
          </nav>
          {rota === '/' && <BotaoCopiarLink copiarLink={() => copiarLinkDaCalculadora.current()} />}
        </div>
      </header>
      <div id="conteudo" tabIndex={-1}>
        {rota === '/' && <Calculadora registrarCopiarLink={registrarCopiarLink} />}
        {rota === '/metodologia' && <ComoCalculamos />}
        {rota === '/sobre' && <Sobre />}
      </div>
      <footer className="footer">
        <a className="footer-brand" href={linkDoEstudio('rodape')} target="_blank" rel="noopener">
          <span className="logo-disc is-small">
            <LogoDoEstudio tamanho={32} />
          </span>
          Feito pela Gato Padeiro
        </a>
        <p>Simulação, não consultoria. Confirme os números com seu contador. Regras e fontes em “Como calculamos”.</p>
      </footer>
    </div>
  );
}
