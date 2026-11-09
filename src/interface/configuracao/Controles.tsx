import type { CSSProperties, ReactNode } from 'react';

export function SecaoNumerada({ numero, titulo, children, resumo }: { numero: string; titulo: string; children: ReactNode; resumo?: ReactNode }) {
  return (
    <details className="sec" open>
      <summary>
        <span className="sec-num" aria-hidden="true">{numero}</span>
        <h2 className="sec-title">{titulo}</h2>
        {resumo && <span className="sec-aside">{resumo}</span>}
      </summary>
      <div className="sec-body">{children}</div>
    </details>
  );
}

export function CaixaDeMarcar({ rotulo, marcada, aoMudar, dica }: { rotulo: ReactNode; marcada: boolean; aoMudar: (marcada: boolean) => void; dica?: ReactNode }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={marcada} onChange={(evento) => aoMudar(evento.target.checked)} />
      <span className="toggle-box" aria-hidden="true" />
      <span className="toggle-text">
        {rotulo}
        {dica && <small>{dica}</small>}
      </span>
    </label>
  );
}

export interface OpcaoDeSelecao<Valor extends string> {
  valor: Valor;
  rotulo: string;
  grupo?: string;
}

function Opcoes<Valor extends string>({ opcoes }: { opcoes: OpcaoDeSelecao<Valor>[] }) {
  return (
    <>
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </option>
      ))}
    </>
  );
}

function OpcoesAgrupadas<Valor extends string>({ opcoes }: { opcoes: OpcaoDeSelecao<Valor>[] }) {
  const grupos = [...new Set(opcoes.map((opcao) => opcao.grupo ?? ''))];
  if (grupos.length <= 1) return <Opcoes opcoes={opcoes} />;
  return (
    <>
      {grupos.map((grupo) => (
        <optgroup key={grupo} label={grupo}>
          <Opcoes opcoes={opcoes.filter((opcao) => (opcao.grupo ?? '') === grupo)} />
        </optgroup>
      ))}
    </>
  );
}

interface PropriedadesDaSelecao<Valor extends string> {
  rotulo: ReactNode;
  valor: Valor;
  aoMudar: (valor: Valor) => void;
  opcoes: OpcaoDeSelecao<Valor>[];
  esconderRotulo?: boolean;
  classe?: string;
  estilo?: CSSProperties;
}

export function Selecao<Valor extends string>({ rotulo, valor, aoMudar, opcoes, esconderRotulo, classe, estilo }: PropriedadesDaSelecao<Valor>) {
  return (
    <label className={`field${classe ? ` ${classe}` : ''}`}>
      <span className={esconderRotulo ? 'sr-only' : 'field-label'}>{rotulo}</span>
      <span className="select" style={estilo?.color ? { color: estilo.color } : undefined}>
        <select value={valor} onChange={(evento) => aoMudar(evento.target.value as Valor)} style={estilo}>
          <OpcoesAgrupadas opcoes={opcoes} />
        </select>
      </span>
    </label>
  );
}

interface PropriedadesDoCampoDeTexto {
  rotulo: ReactNode;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  classe?: string;
  estilo?: CSSProperties;
  esconderRotulo?: boolean;
}

const TAMANHO_MAXIMO_DE_NOME = 80;

export function CampoDeTexto({ rotulo, valor, aoMudar, placeholder, classe, estilo, esconderRotulo }: PropriedadesDoCampoDeTexto) {
  return (
    <label className={`field${classe ? ` ${classe}` : ''}`}>
      <span className={esconderRotulo ? 'sr-only' : 'field-label'}>{rotulo}</span>
      <input
        className="text-input"
        type="text"
        value={valor}
        maxLength={TAMANHO_MAXIMO_DE_NOME}
        placeholder={placeholder}
        onChange={(evento) => aoMudar(evento.target.value)}
        style={estilo}
      />
    </label>
  );
}
