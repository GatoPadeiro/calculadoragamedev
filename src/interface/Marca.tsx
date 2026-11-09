const SITE_DO_ESTUDIO = 'https://www.gatopadeiro.com.br';

export type LugarDoLink = 'topo' | 'rodape' | 'resultado' | 'sobre';

export function linkDoEstudio(lugar: LugarDoLink): string {
  return `${SITE_DO_ESTUDIO}/?utm_source=calculadora&utm_medium=referral&utm_campaign=calculadora-gamedev&utm_content=${lugar}`;
}

export function LogoDoEstudio({ tamanho = 40 }: { tamanho?: number }) {
  return <img src="/brand/logo-gato-padeiro.svg" width={tamanho} height={tamanho} alt="" className="logo-img" />;
}

export function AssinaturaDoEstudio() {
  return (
    <aside className="signature" aria-label="Quem fez">
      <span className="logo-disc is-small">
        <LogoDoEstudio tamanho={44} />
      </span>
      <p>
        <b>Feito por quem também faz jogos.</b> A Gato Padeiro é um estúdio indie brasileiro e fez esta calculadora para organizar as próprias contas.{' '}
        <a href={linkDoEstudio('resultado')} target="_blank" rel="noopener">
          Conheça a Gato Padeiro
        </a>
      </p>
    </aside>
  );
}
