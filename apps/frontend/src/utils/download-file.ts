/**
 * Dispara o download de um Blob no navegador, sem tocar em disco nem em armazenamento local.
 * A URL do objeto é liberada logo depois do clique.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** `contrato.pdf` vira `contrato-assinado.pdf`; o nome do usuário nunca vai direto ao `download`. */
export function signedFilename(originalName: string): string {
  const base = originalName
    .replace(/\.pdf$/i, '')
    .replace(/[^\p{L}\p{N}._ -]/gu, '_')
    .slice(0, 120)
    .trim();

  return `${base || 'documento'}-assinado.pdf`;
}
