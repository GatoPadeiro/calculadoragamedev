import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { abreviarNumero, formatarEnquantoDigita, formatarNumeroBR, lerNumeroBR, posicaoDoCursorAposFormatar } from '../utilitarios/numeroBR';

interface PropriedadesDoCampoNumerico {
  rotulo: ReactNode;
  valor: number;
  aoMudar: (valor: number) => void;
  casasDecimais?: number;
  prefixo?: string;
  sufixo?: string;
  minimo?: number;
  maximo?: number;
  dica?: ReactNode;
  mostrarAbreviacao?: boolean;
  classe?: string;
  esconderRotulo?: boolean;
}

const CASAS_PERMITIDAS_AO_DIGITAR_EM_CAMPO_INTEIRO = 3;

function textoDoValor(valor: number, casasDecimais: number): string {
  const minimoDeCasas = casasDecimais > 0 && !Number.isInteger(valor) ? casasDecimais : 0;
  return formatarNumeroBR(valor, { minimoDeCasas, maximoDeCasas: casasDecimais });
}

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}

export function CampoNumerico({
  rotulo,
  valor,
  aoMudar,
  casasDecimais = 2,
  prefixo,
  sufixo,
  minimo = 0,
  maximo = 1e13,
  dica,
  mostrarAbreviacao = true,
  classe,
  esconderRotulo,
}: PropriedadesDoCampoNumerico) {
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(() => textoDoValor(valor, casasDecimais));
  const [estaEditando, setEstaEditando] = useState(false);
  const cursorPendente = useRef<number | null>(null);
  const ehCampoInteiro = casasDecimais === 0;

  useEffect(() => {
    if (!estaEditando) setTexto(textoDoValor(valor, casasDecimais));
  }, [valor, casasDecimais, estaEditando]);

  useEffect(() => {
    if (cursorPendente.current === null || !campo.current || document.activeElement !== campo.current) return;
    campo.current.setSelectionRange(cursorPendente.current, cursorPendente.current);
    cursorPendente.current = null;
  });

  const valorLido = lerNumeroBR(texto);
  const estaForaDoLimite = valorLido !== null && (valorLido < minimo || valorLido > maximo);
  const abreviacao = mostrarAbreviacao && valorLido !== null ? abreviarNumero(valorLido) : null;
  const idDaDica = `${id}-dica`;
  const temDica = Boolean(dica || abreviacao || estaForaDoLimite);

  const valorFinal = (lido: number | null) => {
    const limitado = lido === null ? 0 : limitar(lido, minimo, maximo);
    return ehCampoInteiro ? Math.round(limitado) : limitado;
  };

  return (
    <div className={`field${classe ? ` ${classe}` : ''}`}>
      <label htmlFor={id} className={esconderRotulo ? 'sr-only' : 'field-label'}>
        {rotulo}
      </label>
      <div className={`num-input${estaForaDoLimite ? ' is-invalid' : ''}`}>
        {prefixo && <span className="num-affix" aria-hidden="true">{prefixo}</span>}
        <input
          ref={campo}
          id={id}
          type="text"
          inputMode={ehCampoInteiro ? 'numeric' : 'decimal'}
          autoComplete="off"
          spellCheck={false}
          value={texto}
          aria-invalid={estaForaDoLimite || undefined}
          aria-describedby={temDica ? idDaDica : undefined}
          onFocus={() => setEstaEditando(true)}
          onBlur={() => {
            setEstaEditando(false);
            setTexto(textoDoValor(valorFinal(valorLido), casasDecimais));
          }}
          onChange={(evento) => {
            const elemento = evento.target;
            const casasAoDigitar = ehCampoInteiro ? CASAS_PERMITIDAS_AO_DIGITAR_EM_CAMPO_INTEIRO : casasDecimais;
            const formatado = formatarEnquantoDigita(elemento.value, casasAoDigitar);
            cursorPendente.current = posicaoDoCursorAposFormatar(elemento.value, elemento.selectionStart ?? elemento.value.length, formatado);
            setTexto(formatado);
            aoMudar(valorFinal(lerNumeroBR(formatado)));
          }}
        />
        {sufixo && <span className="num-affix" aria-hidden="true">{sufixo}</span>}
      </div>
      {temDica && (
        <div id={idDaDica} className="field-hint">
          {estaForaDoLimite ? (
            <span className="hint-error">
              Use um valor entre {formatarNumeroBR(minimo)} e {formatarNumeroBR(maximo)}.
            </span>
          ) : (
            <>
              {abreviacao && <span className="hint-abbr">{prefixo ? `${prefixo} ` : ''}{abreviacao}</span>}
              {dica && <span>{dica}</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

type PropriedadesDoCampoPercentual = Omit<PropriedadesDoCampoNumerico, 'sufixo' | 'mostrarAbreviacao'>;

const PARA_PERCENTUAL = 100;

export function CampoPercentual({ valor, aoMudar, maximo = 100, ...demais }: PropriedadesDoCampoPercentual) {
  return (
    <CampoNumerico
      {...demais}
      valor={Math.round(valor * 1e6) / 1e4}
      aoMudar={(percentual) => aoMudar(percentual / PARA_PERCENTUAL)}
      sufixo="%"
      mostrarAbreviacao={false}
      maximo={maximo}
    />
  );
}

export function ValorCalculado({ rotulo, children, classe }: { rotulo: ReactNode; children: ReactNode; classe?: string }) {
  return (
    <div className={`field${classe ? ` ${classe}` : ''}`}>
      <span className="field-label">{rotulo}</span>
      <output className="computed">{children}</output>
    </div>
  );
}
