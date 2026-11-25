import type { PDFPageProxy, PDFDocumentProxy } from 'pdfjs-dist';
import type { SealPosition } from '../api/seal';
import type { PageGeometry } from '../api/seal-geometry';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { openPdf } from 'src/lib/pdf/pdfjs';

import { Iconify } from 'src/components/iconify';

import { SEAL_WIDTH_PT, SEAL_HEIGHT_PT } from '../api/seal';
import {
  sealFits,
  moveOnScreen,
  clampPosition,
  sealViewportRect,
  positionFromViewportCenter,
} from '../api/seal-geometry';

// ----------------------------------------------------------------------

const MAX_PREVIEW_WIDTH = 640;
const KEY_STEP_PT = 1;
const KEY_STEP_FAST_PT = 10;

const ARROW_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const formatPt = (value: number) => value.toFixed(2).replace('.', ',');

// ----------------------------------------------------------------------

type Props = {
  file: File;
  value: SealPosition;
  onChange: (position: SealPosition) => void;
  /** Avisa se o selo cabe na página aberta (página menor que 240 x 80 pt não cabe). */
  onFitChange?: (fits: boolean) => void;
  /**
   * Avisa se a geometria da página atual já está pronta. Enquanto for `false` (página nova
   * ainda sendo desenhada), a posição do selo não corresponde à página e não deve ser enviada.
   */
  onReadyChange?: (ready: boolean) => void;
  disabled?: boolean;
};

/**
 * Pré-visualização do PDF com o selo posicionável (REQ-49). Clique ou arraste para mover o
 * selo; com o foco nele, as setas movem 1 pt (Shift, 10 pt). A página aparece girada quando
 * tem `/Rotate`, mas a posição sai sempre no espaço sem rotação, como o backend espera.
 */
export function SealPositionPicker({
  file,
  value,
  onChange,
  onFitChange,
  onReadyChange,
  disabled,
}: Props) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [rendered, setRendered] = useState<(PageGeometry & { page: number }) | null>(null);
  const [width, setWidth] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<{ x: number; y: number } | null>(null);
  /** Término da renderização anterior: a nova só começa depois que o canvas foi liberado. */
  const previousRender = useRef<Promise<unknown>>(Promise.resolve());
  const lastAnnounced = useRef<string | null>(null);

  // Abre o PDF só em memória; troca de arquivo ou desmontagem fecham o documento.
  useEffect(() => {
    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;

    setDoc(null);
    setRendered(null);
    setLoadError(false);

    file
      .arrayBuffer()
      .then((buffer) => openPdf(new Uint8Array(buffer)))
      .then((pdf) => {
        if (cancelled) {
          pdf.loadingTask.destroy();
          return;
        }
        opened = pdf;
        setDoc(pdf);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      opened?.loadingTask.destroy();
    };
  }, [file]);

  // Largura disponível para a página.
  useEffect(() => {
    const element = frameRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const pageCount = doc?.numPages ?? 0;
  const pageNumber = Math.min(Math.max(value.page, 1), Math.max(pageCount, 1));

  // A geometria só vale para a página em que foi calculada; ao trocar de página ela some.
  const geometry = rendered && rendered.page === pageNumber ? rendered : null;

  // Desenha a página escolhida e guarda a geometria para converter tela <-> pontos PDF.
  useEffect(() => {
    if (!doc || width <= 0) return undefined;

    let cancelled = false;
    let renderTask: ReturnType<PDFPageProxy['render']> | null = null;

    // Página ou tamanho novo: a geometria antiga não vale mais.
    setRendered(null);

    (async () => {
      // O pdf.js não aceita dois render() no mesmo canvas: espera o cancelamento do anterior.
      await previousRender.current;
      if (cancelled) return;

      const page = await doc.getPage(pageNumber);
      if (cancelled) return;

      // Largura inteira: o canvas e o selo (calculado a partir do viewport) usam a mesma medida,
      // sem a diferença de fração de pixel que desalinhava o selo.
      const base = page.getViewport({ scale: 1 });
      const scale = Math.floor(Math.min(width, MAX_PREVIEW_WIDTH)) / base.width;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(viewport.width * ratio);
      canvas.height = Math.round(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      renderTask = page.render({
        canvas,
        viewport,
        transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
      });

      try {
        await renderTask.promise;
      } catch {
        return; // renderização cancelada por uma troca de página ou de tamanho
      }

      if (!cancelled) setRendered({ page: pageNumber, view: page.view, viewport });
    })().catch(() => {
      if (!cancelled) setLoadError(true);
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();

      // O próximo render espera esta tarefa terminar de verdade (cancelar é assíncrono).
      if (renderTask) {
        previousRender.current = renderTask.promise.catch(() => undefined);
      }
    };
  }, [doc, pageNumber, width]);

  const fits = geometry ? sealFits(geometry) : true;

  useEffect(() => {
    onFitChange?.(fits);
  }, [fits, onFitChange]);

  // Sem pré-visualização (erro ao abrir) o envio segue permitido, com o selo no padrão.
  const ready = loadError || !!geometry;

  useEffect(() => {
    onReadyChange?.(ready);
  }, [ready, onReadyChange]);

  // Ao trocar de página (ou de tamanho), garante que o selo continue dentro dela.
  useEffect(() => {
    if (!geometry) return;

    const clamped = clampPosition(geometry, { ...value, page: pageNumber });
    if (clamped.page !== value.page || clamped.x !== value.x || clamped.y !== value.y) {
      onChange(clamped);
    }
    // Só reage à troca de geometria ou de página: reagir a cada mudança de `value` reabriria o ciclo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry, pageNumber]);

  const moveTo = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!geometry || !canvas) return;

      const bounds = canvas.getBoundingClientRect();
      const offset = dragOffset.current ?? { x: 0, y: 0 };

      onChange(
        positionFromViewportCenter(
          geometry,
          pageNumber,
          clientX - bounds.left - offset.x,
          clientY - bounds.top - offset.y
        )
      );
    },
    [geometry, onChange, pageNumber]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !geometry || !fits || event.button !== 0) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const rect = sealViewportRect(geometry, { ...value, page: pageNumber });
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;

    const inside =
      px >= rect.left &&
      px <= rect.left + rect.width &&
      py >= rect.top &&
      py <= rect.top + rect.height;

    // Dentro do selo, ele acompanha o ponto agarrado; fora, o clique põe o centro do selo ali.
    dragOffset.current = inside
      ? { x: px - (rect.left + rect.width / 2), y: py - (rect.top + rect.height / 2) }
      : { x: 0, y: 0 };

    event.currentTarget.setPointerCapture(event.pointerId);
    sealRef.current?.focus({ preventScroll: true });
    moveTo(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragOffset.current) moveTo(event.clientX, event.clientY);
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    dragOffset.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const direction = ARROW_KEYS[event.key];
    if (!direction || !geometry || !fits || disabled) return;

    event.preventDefault();

    const step = event.shiftKey ? KEY_STEP_FAST_PT : KEY_STEP_PT;
    const next = moveOnScreen(
      geometry,
      { ...value, page: pageNumber },
      direction[0] * step,
      direction[1] * step
    );

    onChange(next);
  };

  const goToPage = (page: number) => onChange({ ...value, page });

  const rect = geometry ? sealViewportRect(geometry, { ...value, page: pageNumber }) : null;
  const positionLabel = `x ${formatPt(value.x)} pt, y ${formatPt(value.y)} pt`;

  // Anuncia a posição a cada mudança (setas ou arraste), com pausa para não falar a cada pixel.
  useEffect(() => {
    if (!geometry) return undefined;

    if (lastAnnounced.current === null) {
      lastAnnounced.current = positionLabel;
      return undefined;
    }

    if (lastAnnounced.current === positionLabel) return undefined;

    const timer = setTimeout(() => {
      lastAnnounced.current = positionLabel;
      setAnnouncement(`Posição ${positionLabel}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [geometry, positionLabel]);

  if (loadError) {
    return (
      <Alert severity="warning">
        Não foi possível mostrar a pré-visualização. Você ainda pode assinar, e o selo vai para o
        canto inferior esquerdo da primeira página.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        sx={{ gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        <Stack direction="row" sx={{ gap: 0.5, alignItems: 'center' }}>
          <IconButton
            aria-label="Página anterior"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={disabled || pageNumber <= 1}
          >
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>

          <Typography
            variant="subtitle2"
            aria-live="polite"
            sx={{ minWidth: 112, textAlign: 'center' }}
          >
            Página {pageNumber} de {pageCount || '...'}
          </Typography>

          <IconButton
            aria-label="Próxima página"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={disabled || pageNumber >= pageCount}
          >
            <Iconify icon="eva:arrow-ios-forward-fill" />
          </IconButton>
        </Stack>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Selo: {positionLabel}
        </Typography>
      </Stack>

      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        Clique ou arraste na página para posicionar o selo. Com o selo selecionado, use as setas do
        teclado para mover 1 pt (com Shift, 10 pt). A posição é medida a partir do canto inferior
        esquerdo da página.
      </Typography>

      {!fits && (
        <Alert severity="warning" role="alert">
          Esta página é pequena demais para o selo ({SEAL_WIDTH_PT} x {SEAL_HEIGHT_PT} pt). Escolha
          outra página.
        </Alert>
      )}

      <Box ref={frameRef} sx={{ width: 1, display: 'flex', justifyContent: 'center' }}>
        <Box
          // Sem isso o mousedown devolve o foco ao body e o selo perde o teclado.
          onMouseDown={(event) => event.preventDefault()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          sx={(theme) => ({
            position: 'relative',
            lineHeight: 0,
            minHeight: 160,
            touchAction: 'none',
            userSelect: 'none',
            bgcolor: 'common.white',
            boxShadow: theme.vars.customShadows.z8,
            cursor: disabled || !fits ? 'default' : 'crosshair',
          })}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={`Pré-visualização da página ${pageNumber}`}
            style={{ display: 'block' }}
          />

          {!geometry && (
            <Box
              sx={{
                inset: 0,
                display: 'flex',
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={28} aria-label="Carregando a página" />
            </Box>
          )}

          {rect && fits && (
            <Box
              ref={sealRef}
              tabIndex={disabled ? -1 : 0}
              role="group"
              aria-roledescription="selo posicionável"
              aria-label={`Selo de assinatura na página ${pageNumber}, ${positionLabel}. Use as setas para mover.`}
              onKeyDown={handleKeyDown}
              sx={(theme) => ({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                display: 'flex',
                lineHeight: 1.2,
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
                typography: 'caption',
                fontWeight: 600,
                color: 'primary.dark',
                cursor: disabled ? 'default' : 'grab',
                border: `2px dashed ${theme.vars.palette.primary.main}`,
                bgcolor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.16)`,
                '&:focus-visible': {
                  outline: `3px solid ${theme.vars.palette.primary.dark}`,
                  outlineOffset: 2,
                },
              })}
            >
              Selo
            </Box>
          )}
        </Box>
      </Box>

      <Box
        aria-live="polite"
        sx={{
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: 'hidden',
          position: 'absolute',
          clip: 'rect(0 0 0 0)',
        }}
      >
        {announcement}
      </Box>
    </Stack>
  );
}
