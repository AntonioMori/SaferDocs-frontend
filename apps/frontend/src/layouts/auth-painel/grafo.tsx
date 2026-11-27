import type { BoxProps } from '@mui/material/Box';

import { useRef, useEffect } from 'react';

import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

type No = { x: number; y: number; vx: number; vy: number; r: number; cor: string; hub: boolean };

/** Raio em que o cursor "puxa" linhas até os nós. */
const RAIO_CURSOR = 170;

type LoginGrafoProps = BoxProps & {
  /** Quantidade de nós (40–180). */
  nos?: number;
};

/**
 * Grafo animado do painel da tela de login: nós brancos e alguns "hubs" (azul/amarelo)
 * ligados por linhas que aparecem conforme a distância; o cursor acende os nós próximos.
 * O cursor é lido no elemento pai (o painel), já que o canvas não recebe eventos.
 */
export function LoginGrafo({ nos = 80, sx, ...other }: LoginGrafoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext('2d');
    const painel = c?.parentElement?.parentElement;
    if (!c || !ctx || !painel) return undefined;

    const count = Math.max(40, Math.min(180, Math.round(nos)));
    const hubs = Math.max(4, Math.round(count / 14));
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const dpr = window.devicePixelRatio || 1;

    let W = 0;
    let H = 0;
    let raf = 0;
    let seeded = false;
    const cursor = { x: 0, y: 0, active: false };

    const nodes: No[] = Array.from({ length: count }, (_, i) => {
      const hub = i < hubs;
      return {
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: hub ? 5 : 1.6 + Math.random() * 1.8,
        cor: hub ? (i % 2 ? '#68CDF9' : '#FFBF31') : '#FFFFFF',
        hub,
      };
    });

    const size = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      if (!w || !h) return;
      if (w !== W || h !== H) {
        W = w;
        H = h;
        c.width = w * dpr;
        c.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      if (!seeded) {
        seeded = true;
        nodes.forEach((n) => {
          n.x = Math.random() * W;
          n.y = Math.random() * H;
        });
      }
    };

    const step = () => {
      nodes.forEach((n) => {
        n.vx *= 0.985;
        n.vy *= 0.985;
        const sp = Math.hypot(n.vx, n.vy);
        if (sp < 0.12) {
          n.vx += (Math.random() - 0.5) * 0.05;
          n.vy += (Math.random() - 0.5) * 0.05;
        } else if (sp > 4) {
          n.vx = (n.vx / sp) * 4;
          n.vy = (n.vy / sp) * 4;
        }
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });
    };

    const draw = () => {
      if (!W || !H) return;
      ctx.clearRect(0, 0, W, H);

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const lim = a.hub || b.hub ? 160 : 110;
          if (d < lim) {
            ctx.strokeStyle = `rgba(255,255,255,${(1 - d / lim) * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      const perto = new Set<No>();
      if (cursor.active) {
        ctx.lineWidth = 1.2;
        nodes.forEach((n) => {
          const d = Math.hypot(cursor.x - n.x, cursor.y - n.y);
          if (d < RAIO_CURSOR) {
            perto.add(n);
            ctx.strokeStyle = `rgba(255,191,49,${(1 - d / RAIO_CURSOR) * 0.75})`;
            ctx.beginPath();
            ctx.moveTo(cursor.x, cursor.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        });
      }

      nodes.forEach((n) => {
        if (n.hub) {
          ctx.fillStyle = `${n.cor}22`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        const aceso = !n.hub && perto.has(n);
        ctx.fillStyle = aceso ? '#FFBF31' : n.cor;
        ctx.globalAlpha = n.hub ? 1 : aceso ? 0.95 : 0.7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      if (cursor.active) {
        ctx.fillStyle = 'rgba(255,191,49,.2)';
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Com movimento reduzido o grafo fica parado e só redesenha ao mover o cursor/redimensionar.
    const redraw = () => {
      if (reduce) draw();
    };

    const tick = () => {
      size();
      step();
      draw();
      raf = requestAnimationFrame(tick);
    };

    const handleMove = (e: MouseEvent) => {
      const b = c.getBoundingClientRect();
      const k = b.width ? c.clientWidth / b.width : 1;
      cursor.x = (e.clientX - b.left) * k;
      cursor.y = (e.clientY - b.top) * k;
      cursor.active = true;
      redraw();
    };

    const handleLeave = () => {
      cursor.active = false;
      redraw();
    };

    const ro = new ResizeObserver(() => {
      size();
      redraw();
    });
    ro.observe(c);
    painel.addEventListener('mousemove', handleMove);
    painel.addEventListener('mouseleave', handleLeave);

    size();
    draw();
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      painel.removeEventListener('mousemove', handleMove);
      painel.removeEventListener('mouseleave', handleLeave);
    };
  }, [nos]);

  return (
    <Box
      aria-hidden
      sx={[
        { position: 'absolute', inset: 0, pointerEvents: 'none' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box
        ref={canvasRef}
        component="canvas"
        sx={{ position: 'absolute', inset: 0, width: 1, height: 1, display: 'block' }}
      />
    </Box>
  );
}
