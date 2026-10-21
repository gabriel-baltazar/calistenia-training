/** Baixa um conteúdo como arquivo (Blob + <a download>). */
export function downloadFile(fileName: string, content: BlobPart, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoga depois do clique ter sido processado.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
