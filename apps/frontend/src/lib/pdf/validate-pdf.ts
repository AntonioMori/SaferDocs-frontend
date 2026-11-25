import { openPdf, PdfOpenError } from './pdfjs';

// ----------------------------------------------------------------------

/**
 * Validação prévia do PDF no navegador (REQ-61). É só uma camada de experiência: ela barra
 * o erro óbvio antes de gastar o upload, mas quem decide é o backend (DOC_001 a DOC_005).
 */

/** Mesmo limite do backend (`MAX_UPLOAD_MB`). */
export const MAX_PDF_MB = 20;
export const MAX_PDF_BYTES = MAX_PDF_MB * 1024 * 1024;

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

export type PdfValidationCode =
  | 'EMPTY'
  | 'TOO_LARGE'
  | 'NOT_PDF'
  | 'BAD_MAGIC'
  | 'PASSWORD'
  | 'UNREADABLE';

export type PdfValidationResult =
  | { ok: true; pageCount: number }
  | { ok: false; code: PdfValidationCode; message: string };

export const PDF_VALIDATION_MESSAGES: Record<PdfValidationCode, string> = {
  EMPTY: 'O arquivo está vazio.',
  TOO_LARGE: `O arquivo passa do limite de ${MAX_PDF_MB} MB. Envie um PDF menor.`,
  NOT_PDF: 'Este arquivo não é um PDF. Escolha um arquivo com extensão .pdf.',
  BAD_MAGIC: 'O conteúdo do arquivo não é de um PDF, mesmo que o nome termine em .pdf.',
  PASSWORD: 'O PDF está protegido por senha. Remova a senha e envie de novo.',
  UNREADABLE: 'Não foi possível abrir este PDF. Ele pode estar corrompido.',
};

const fail = (code: PdfValidationCode): PdfValidationResult => ({
  ok: false,
  code,
  message: PDF_VALIDATION_MESSAGES[code],
});

// ----------------------------------------------------------------------

export function hasPdfName(file: File): boolean {
  return file.name.toLowerCase().endsWith('.pdf');
}

/** Lê só os 5 primeiros bytes (não carrega o arquivo inteiro) e compara com `%PDF-`. */
export async function hasPdfMagicBytes(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, PDF_MAGIC.length).arrayBuffer());

  return head.length === PDF_MAGIC.length && PDF_MAGIC.every((byte, index) => head[index] === byte);
}

/**
 * Confere, em ordem e parando no primeiro problema: tamanho, extensão ou tipo, `%PDF-` nos
 * primeiros bytes e se o pdf.js consegue abrir. As checagens baratas vêm antes da que lê tudo.
 */
export async function validatePdfFile(file: File): Promise<PdfValidationResult> {
  if (file.size === 0) return fail('EMPTY');
  if (file.size > MAX_PDF_BYTES) return fail('TOO_LARGE');

  // O nome e o tipo vêm do sistema do usuário e não provam nada: é só para barrar cedo.
  if (!hasPdfName(file) && file.type !== 'application/pdf') return fail('NOT_PDF');

  try {
    if (!(await hasPdfMagicBytes(file))) return fail('BAD_MAGIC');
  } catch {
    return fail('UNREADABLE');
  }

  try {
    const doc = await openPdf(new Uint8Array(await file.arrayBuffer()));
    const { numPages } = doc;
    await doc.loadingTask.destroy();

    return { ok: true, pageCount: numPages };
  } catch (error) {
    return fail(
      error instanceof PdfOpenError && error.reason === 'password' ? 'PASSWORD' : 'UNREADABLE'
    );
  }
}
