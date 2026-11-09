export async function copiarParaAreaDeTransferencia(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    window.prompt('Copie o link do cenário:', texto);
    return false;
  }
}

export function enderecoCompleto(caminhoComHash: string): string {
  return `${location.origin}${location.pathname}${caminhoComHash}`;
}
