/** Tamanho do selo em pontos PDF (1/72 de polegada), fixo no backend (REQ-47). */
export const SEAL_WIDTH_PT = 240;
export const SEAL_HEIGHT_PT = 80;

/**
 * Posição do selo, no mesmo formato que o backend recebe (REQ-49): `page` começa em 1 e
 * `x`/`y` são o canto inferior esquerdo do selo, em pontos, contados a partir do canto
 * inferior esquerdo da área visível da página (MediaBox ∩ CropBox), sem rotação.
 */
export type SealPosition = {
  page: number;
  x: number;
  y: number;
};

/** Posição inicial: primeira página, canto inferior esquerdo com margem de 0,5 polegada. */
export const DEFAULT_SEAL_POSITION: SealPosition = { page: 1, x: 36, y: 36 };
