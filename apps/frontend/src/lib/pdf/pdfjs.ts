import type * as PdfjsLib from 'pdfjs-dist';

// ----------------------------------------------------------------------

/**
 * Carrega o pdf.js sob demanda (fica fora do bundle principal) e aponta o worker para o
 * arquivo empacotado pelo Vite. Nada vem de CDN: o front funciona offline e a CSP (REQ-37)
 * pode proibir script externo.
 */
let pdfjsPromise: Promise<typeof PdfjsLib> | null = null;

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });

    // Se o carregamento falhar (rede, chunk ausente), a próxima chamada tenta de novo.
    pdfjsPromise.catch(() => {
      pdfjsPromise = null;
    });
  }

  return pdfjsPromise;
}

// ----------------------------------------------------------------------

export class PdfOpenError extends Error {
  /** `password`: PDF protegido por senha. `invalid`: não é um PDF legível. */
  readonly reason: 'password' | 'invalid';

  constructor(reason: 'password' | 'invalid', cause?: unknown) {
    super(reason === 'password' ? 'PDF protegido por senha' : 'PDF ilegível', { cause });
    this.name = 'PdfOpenError';
    this.reason = reason;
  }
}

/**
 * Abre o PDF no pdf.js, só em memória. Quem chama deve fechar com `doc.loadingTask.destroy()`.
 * O pdf.js passa a ser dono do buffer, então ele é copiado e o original continua usável.
 */
export async function openPdf(bytes: Uint8Array): Promise<PdfjsLib.PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();

  const task = pdfjs.getDocument({
    data: bytes.slice(),
  });

  try {
    return await task.promise;
  } catch (error) {
    await task.destroy();

    if (error instanceof pdfjs.PasswordException) {
      throw new PdfOpenError('password', error);
    }

    throw new PdfOpenError('invalid', error);
  }
}
