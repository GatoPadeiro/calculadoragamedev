import { useLayoutEffect, useRef, useState } from 'react';
import type { ResultadoDoCenario } from '../../calculo/calcularCenario';
import type { Socio } from '../../calculo/tipos';
import { COR_DA_TINTA, COR_DO_PAINEL, COR_DO_PAPEL, COR_DO_TEXTO, CORES_DA_ANATOMIA, corDoSocio } from '../cores';
import { formatarPercentual, formatarReais } from '../formatacao';
import { posicionarRotulos } from './posicionarRotulos';

interface Peca {
  id: string;
  nome: string;
  valor: number;
  fundo: string;
  texto: string;
  numeroDaPeca?: number;
  ehDeSocio?: boolean;
  ehSemDono?: boolean;
}

const LARGURA_DO_ROTULO = 152;
const ALTURA_DA_LINHA_DE_ROTULOS = 46;
const RECUO_DO_PRIMEIRO_ROTULO = 10;
const LARGURA_MINIMA_PARA_NOME_DENTRO = 104;
const VALOR_DESPREZIVEL = 0.005;

function useLarguraDoElemento() {
  const elemento = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  useLayoutEffect(() => {
    const atual = elemento.current;
    if (!atual) return;
    const observador = new ResizeObserver(([medida]) => setLargura(medida!.contentRect.width));
    observador.observe(atual);
    setLargura(atual.getBoundingClientRect().width);
    return () => observador.disconnect();
  }, []);
  return { elemento, largura };
}

function montarPecasDeDesconto(resultado: ResultadoDoCenario, cotacaoDoDolar: number): Peca[] {
  const { totais, empresa } = resultado;
  return [
    { id: 'imposto-do-pais', numeroDaPeca: 1, nome: 'Imposto do país', valor: totais.impostoConsumoEmDolar * cotacaoDoDolar, fundo: CORES_DA_ANATOMIA.impostoDoPais, texto: COR_DA_TINTA },
    { id: 'reembolsos', numeroDaPeca: 2, nome: 'Reembolsos', valor: totais.reembolsosEmDolar * cotacaoDoDolar, fundo: CORES_DA_ANATOMIA.reembolsos, texto: COR_DA_TINTA },
    { id: 'lojas', numeroDaPeca: 3, nome: 'Lojas', valor: totais.taxaDasLojasEmDolar * cotacaoDoDolar, fundo: CORES_DA_ANATOMIA.lojas, texto: COR_DO_PAPEL },
    {
      id: 'eua-e-engine',
      numeroDaPeca: 4,
      nome: 'EUA e engine',
      valor: empresa.retencaoDosEua + empresa.royalty + empresa.irrfDaRemessa + empresa.iofDaRemessa,
      fundo: CORES_DA_ANATOMIA.euaEEngine,
      texto: COR_DO_PAPEL,
    },
    {
      id: 'impostos-no-brasil',
      numeroDaPeca: 5,
      nome: 'Impostos no Brasil',
      valor: empresa.impostoDaEmpresa + empresa.contribuicaoPatronalNoPresumido,
      fundo: CORES_DA_ANATOMIA.impostosNoBrasil,
      texto: COR_DA_TINTA,
    },
    {
      id: 'pro-labore-e-custos',
      numeroDaPeca: 6,
      nome: 'Pró-labore e custos',
      valor: empresa.proLaboreAnual + empresa.custoComSalarios - empresa.contribuicaoPatronalNoPresumido + empresa.outrosCustos,
      fundo: CORES_DA_ANATOMIA.proLaboreECustos,
      texto: COR_DA_TINTA,
    },
  ];
}

function montarPecasDosSocios(resultado: ResultadoDoCenario, socios: Socio[]): Peca[] {
  if (resultado.empresa.lucro <= 0) return [];
  const pecas: Peca[] = socios.flatMap((socio, posicao) => {
    const valor = resultado.divisao.valorPorSocio[socio.id] ?? 0;
    if (valor <= 0) return [];
    const cor = corDoSocio(posicao);
    return [{ id: `socio-${socio.id}`, nome: socio.nome || `Sócio ${posicao + 1}`, valor, fundo: cor.fundo, texto: cor.texto, ehDeSocio: true }];
  });
  if (resultado.divisao.valorSemDono > VALOR_DESPREZIVEL) {
    pecas.push({ id: 'sem-dono', nome: 'Sem dono (divisão < 100%)', valor: resultado.divisao.valorSemDono, fundo: COR_DO_PAINEL, texto: COR_DO_TEXTO, ehSemDono: true });
  }
  return pecas;
}

function AnatomiaVazia() {
  return (
    <section className="anatomia is-empty" aria-labelledby="anatomia-titulo">
      <h2 id="anatomia-titulo" className="block-title">Anatomia de uma cópia</h2>
      <p className="empty">Informe preço e cópias em 03 Lojas e países para ver a venda desmontada.</p>
    </section>
  );
}

interface PropriedadesDaAnatomia {
  resultado: ResultadoDoCenario;
  socios: Socio[];
  cotacaoDoDolar: number;
}

export function AnatomiaDeUmaCopia({ resultado, socios, cotacaoDoDolar }: PropriedadesDaAnatomia) {
  const { elemento: palco, largura } = useLarguraDoElemento();
  const { totais, empresa } = resultado;
  const copias = totais.copias;

  if (!copias || totais.brutoEmReais <= 0) return <AnatomiaVazia />;

  const pecas = [...montarPecasDeDesconto(resultado, cotacaoDoDolar), ...montarPecasDosSocios(resultado, socios)].filter((peca) => peca.valor > VALOR_DESPREZIVEL);
  const total = Math.max(totais.brutoEmReais, pecas.reduce((soma, peca) => soma + peca.valor, 0));
  let acumulado = 0;
  const pecasNaBarra = pecas.map((peca) => {
    const inicio = acumulado / total;
    acumulado += peca.valor;
    return { ...peca, inicio, fim: acumulado / total };
  });
  const pecasComRotulo = pecasNaBarra.filter((peca) => !peca.ehDeSocio && !peca.ehSemDono);
  const rotulos = posicionarRotulos(pecasComRotulo, largura, LARGURA_DO_ROTULO);
  const linhasDeRotulos = Math.max(1, ...rotulos.map((rotulo) => rotulo.linha + 1));
  const pecasDoLucro = pecasNaBarra.filter((peca) => peca.ehDeSocio || peca.ehSemDono);
  const inicioDoLucro = pecasDoLucro[0]?.inicio ?? 1;
  const porCopia = (valor: number) => formatarReais(valor / copias);
  const descricaoDaBarra = pecas.map((peca) => `${peca.nome}: ${porCopia(peca.valor)} por cópia, ${formatarPercentual(peca.valor / totais.brutoEmReais)}`).join('; ');

  return (
    <section className="anatomia" aria-labelledby="anatomia-titulo">
      <div className="anat-head">
        <h2 id="anatomia-titulo" className="block-title">Anatomia de uma cópia</h2>
        <p className="anat-sum">
          <span>
            Venda média <b className="num">{porCopia(totais.brutoEmReais)}</b>
          </span>
        </p>
      </div>
      <div ref={palco} className="anat-stage">
        <div className="anat-bar" role="img" aria-label={descricaoDaBarra}>
          {pecasNaBarra.map((peca) => (
            <div
              key={peca.id}
              className={`anat-seg${peca.ehDeSocio ? ' is-partner' : ''}${peca.ehSemDono ? ' is-orphan' : ''}`}
              style={{ width: `${(peca.fim - peca.inicio) * 100}%`, background: peca.fundo, color: peca.texto }}
            >
              {peca.ehDeSocio && (peca.fim - peca.inicio) * largura > LARGURA_MINIMA_PARA_NOME_DENTRO && (
                <span className="anat-in">
                  <b>{peca.nome}</b>
                  <span className="num">{porCopia(peca.valor)}</span>
                </span>
              )}
            </div>
          ))}
        </div>
        {empresa.lucro > 0 && (
          <div className="anat-bracket" style={{ left: `${inicioDoLucro * 100}%`, right: 0 }} aria-hidden="true">
            <span>
              Lucro distribuível <b className="num">{porCopia(empresa.lucroDistribuivel)}</b>
            </span>
          </div>
        )}
        <div className="anat-callouts" style={{ height: linhasDeRotulos * ALTURA_DA_LINHA_DE_ROTULOS + 8 }} aria-hidden="true">
          {largura > 0 &&
            pecasComRotulo.map((peca, indice) => {
              const rotulo = rotulos[indice]!;
              const topo = rotulo.linha * ALTURA_DA_LINHA_DE_ROTULOS + RECUO_DO_PRIMEIRO_ROTULO;
              return (
                <div
                  key={peca.id}
                  className={`anat-call${rotulo.alinhadoADireita ? ' is-left' : ''}`}
                  style={{ transform: `translateX(${rotulo.esquerda}px)`, top: topo, width: LARGURA_DO_ROTULO }}
                >
                  <span className="anat-stem" style={{ left: rotulo.centroDaHaste - rotulo.esquerda, height: topo, top: -topo }} />
                  <span className="anat-name">
                    <span className="part-no">{peca.numeroDaPeca}</span>
                    <i style={{ background: peca.fundo }} />
                    {peca.nome}
                  </span>
                  <span className="anat-val num">
                    {porCopia(peca.valor)} <small>{formatarPercentual(peca.valor / totais.brutoEmReais, 0)}</small>
                  </span>
                </div>
              );
            })}
        </div>
      </div>
      {empresa.lucro > 0 && (
        <ul className="anat-key" aria-label="Lucro distribuível por sócio, por cópia">
          {pecasDoLucro.map((peca) => (
            <li key={peca.id}>
              <i style={{ background: peca.fundo }} aria-hidden="true" />
              <span>{peca.nome}</span>
              <b className="num">{porCopia(peca.valor)}</b>
            </li>
          ))}
        </ul>
      )}
      {empresa.lucro < 0 && (
        <p className="notice is-error">
          Os descontos e custos passam da venda: faltam <b className="num">{porCopia(-empresa.lucro)}</b> por cópia para empatar.
        </p>
      )}
    </section>
  );
}
