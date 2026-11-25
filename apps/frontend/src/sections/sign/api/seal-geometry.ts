import type { SealPosition } from './seal';

import { SEAL_WIDTH_PT, SEAL_HEIGHT_PT } from './seal';

// ----------------------------------------------------------------------

/**
 * Conversão entre a tela e os pontos PDF do selo (REQ-49).
 *
 * O backend mede `x` e `y` a partir do canto inferior esquerdo da ÁREA VISÍVEL da página
 * (MediaBox ∩ CropBox, que o pdf.js entrega em `page.view`), sem rotação. A tela mostra a
 * página já girada (`/Rotate`). O `PageViewport` do pdf.js faz a ponte: `convertToPdfPoint`
 * leva um pixel da tela para o espaço da página sem rotação, com a origem absoluta do PDF,
 * então aqui só subtraímos o canto da área visível.
 */

/** O pedaço do `PageViewport` do pdf.js que a geometria usa (facilita testar). */
export type ViewportLike = {
  scale: number;
  width: number;
  height: number;
  convertToPdfPoint: (x: number, y: number) => number[];
  convertToViewportPoint: (x: number, y: number) => number[];
};

export type PageGeometry = {
  /** `page.view` do pdf.js: [xMin, yMin, xMax, yMax] da área visível. */
  view: number[];
  viewport: ViewportLike;
};

export type ViewportRect = { left: number; top: number; width: number; height: number };

/** Duas casas bastam (0,01 pt) e evitam notação científica no texto enviado ao backend. */
export const roundPt = (value: number) => Math.round(value * 100) / 100;

const visibleWidth = ({ view }: PageGeometry) => view[2] - view[0];
const visibleHeight = ({ view }: PageGeometry) => view[3] - view[1];

/** O selo inteiro precisa caber na área visível. */
export function sealFits(geometry: PageGeometry): boolean {
  return visibleWidth(geometry) >= SEAL_WIDTH_PT && visibleHeight(geometry) >= SEAL_HEIGHT_PT;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Mantém o selo dentro da página (se a página for menor que o selo, fica em 0). */
export function clampPosition(geometry: PageGeometry, position: SealPosition): SealPosition {
  const maxX = Math.max(0, visibleWidth(geometry) - SEAL_WIDTH_PT);
  const maxY = Math.max(0, visibleHeight(geometry) - SEAL_HEIGHT_PT);

  return {
    page: position.page,
    x: roundPt(clamp(position.x, 0, maxX)),
    y: roundPt(clamp(position.y, 0, maxY)),
  };
}

/** Posição do selo (em pontos PDF) para o centro dele ficar no pixel (vx, vy) da tela. */
export function positionFromViewportCenter(
  geometry: PageGeometry,
  page: number,
  vx: number,
  vy: number
): SealPosition {
  const [px, py] = geometry.viewport.convertToPdfPoint(vx, vy);

  return clampPosition(geometry, {
    page,
    x: px - geometry.view[0] - SEAL_WIDTH_PT / 2,
    y: py - geometry.view[1] - SEAL_HEIGHT_PT / 2,
  });
}

/** Retângulo do selo na tela (já girado, se a página tem `/Rotate`). */
export function sealViewportRect(geometry: PageGeometry, position: SealPosition): ViewportRect {
  const x0 = geometry.view[0] + position.x;
  const y0 = geometry.view[1] + position.y;

  const [ax, ay] = geometry.viewport.convertToViewportPoint(x0, y0);
  const [bx, by] = geometry.viewport.convertToViewportPoint(x0 + SEAL_WIDTH_PT, y0 + SEAL_HEIGHT_PT);

  return {
    left: Math.min(ax, bx),
    top: Math.min(ay, by),
    width: Math.abs(bx - ax),
    height: Math.abs(by - ay),
  };
}

/**
 * Move o selo `dx` e `dy` pontos NA TELA (dx para a direita, dy para baixo), seja qual for a
 * rotação da página. Usado pelas setas do teclado.
 */
export function moveOnScreen(
  geometry: PageGeometry,
  position: SealPosition,
  dx: number,
  dy: number
): SealPosition {
  const { viewport } = geometry;
  const [ox, oy] = viewport.convertToPdfPoint(0, 0);
  const [mx, my] = viewport.convertToPdfPoint(dx * viewport.scale, dy * viewport.scale);

  return clampPosition(geometry, {
    page: position.page,
    x: position.x + (mx - ox),
    y: position.y + (my - oy),
  });
}
