import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { keyframes } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/global-config';

import { LogoMark } from 'src/components/logo';

import { LoginGrafo } from './grafo';

// ----------------------------------------------------------------------

/** Cores do painel, fixas nos dois modos de cor. */
const PAINEL = {
  fundo: '#143D95',
  base: '#254B94',
  descricao: '#DCE6F7',
  /** Rótulo acima do título. */
  rotulo: '#C9D8F2',
  rodape: '#B4C6E6',
  /** Âmbar dos hubs e dos nós acesos pelo cursor no grafo. */
  destaque: '#FFBF31',
  /** Luzes azuis suaves: acendem embaixo, à direita e à esquerda. */
  luz: [
    'radial-gradient(70% 110% at 88% 100%, rgba(0, 110, 199, 0.27) 0%, transparent 62%)',
    'radial-gradient(50% 80% at 8% 100%, rgba(0, 51, 171, 0.32) 0%, transparent 70%)',
  ].join(', '),
};

/** Altura das duas linhas de rodapé (painel e formulário), para ficarem alinhadas na base. */
const RODAPE_ALTURA = 24;

const RECURSOS = [
  { label: 'Assinatura digital de PDF', cor: '#CCF4FE' },
  { label: 'Verificação pública do documento', cor: '#CCF4FE' },
  { label: '2FA e passkeys', cor: '#9FE0FB' },
];

const rise = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
`;

function CadeadoIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// ----------------------------------------------------------------------

export type AuthPainelLayoutProps = {
  children: React.ReactNode;
};

/**
 * Layout das telas de entrada (login, cadastro e 2FA): à esquerda o painel azul com o grafo
 * animado e o que o SaferDocs oferece; à direita o formulário da tela. Em telas estreitas o
 * painel vai para cima do formulário.
 */
export function AuthPainelLayout({ children }: AuthPainelLayoutProps) {
  const renderPainel = () => (
    <Box
      component="aside"
      sx={{
        position: 'relative',
        flex: { xs: '1 1 100%', md: '1 1 560px' },
        minWidth: 0,
        minHeight: { xs: 'auto', md: 480 },
        overflow: 'hidden',
        color: 'common.white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        px: { xs: 3, sm: 6 },
        pt: 5,
        pb: 4,
        bgcolor: PAINEL.fundo,
        backgroundImage: `linear-gradient(to bottom, ${PAINEL.fundo}, ${PAINEL.base})`,
      }}
    >
      <LoginGrafo />
      {/* Véu: apaga o grafo atrás do texto (embaixo) e leva as luzes por cima dele. */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `${PAINEL.luz}, linear-gradient(to top, ${PAINEL.base} 20%, transparent 60%)`,
        }}
      />

      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Box
          component="svg"
          viewBox="0 0 104 104"
          role="img"
          aria-label={CONFIG.appName}
          sx={{ width: 56, height: 56 }}
        >
          <LogoMark />
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          mt: { xs: 6, md: 20 },
        }}
      >
        <Typography
          component="span"
          sx={{
            m: 0,
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.5,
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: PAINEL.rotulo,
          }}
        >
          Assinatura digital de documentos
        </Typography>

        <Typography
          component="h1"
          sx={(theme) => ({
            m: 0,
            fontFamily: theme.typography.fontSecondaryFamily,
            fontWeight: 800,
            fontSize: { xs: 44, md: 60 },
            lineHeight: 1.04,
          })}
        >
          {CONFIG.appName}
        </Typography>

        <Typography
          sx={{ maxWidth: 520, fontSize: 16, lineHeight: '26px', color: PAINEL.descricao }}
        >
          Assine seus PDFs e deixe que qualquer pessoa confira a autenticidade do documento. A sua
          conta fica protegida por senha forte, verificação em duas etapas e passkeys.
        </Typography>

        <Box
          component="ul"
          sx={{
            listStyle: 'none',
            m: '4px 0 0',
            p: 0,
            display: 'flex',
            flexWrap: 'wrap',
            '@media (min-width: 1440px)': { flexWrap: 'nowrap' },
            gap: 1.25,
          }}
        >
          {RECURSOS.map((recurso) => (
            <Box
              key={recurso.label}
              component="li"
              sx={{
                display: 'inline-flex',
                whiteSpace: 'nowrap',
                alignItems: 'center',
                gap: 1,
                py: 1,
                px: 1.75,
                borderRadius: 999,
                bgcolor: 'rgba(255,255,255,.10)',
                border: '1px solid rgba(255,255,255,.20)',
                fontSize: 13,
                color: '#F2F6FC',
                cursor: 'default',
                transition: 'background-color .2s, border-color .2s, transform .2s',
                // No hover o ponto vira um "hub" âmbar com halo, como os nós que o cursor acende no grafo.
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,.16)',
                  borderColor: 'rgba(255,191,49,.55)',
                  transform: 'translateY(-1px)',
                  '& .recurso-ponto': {
                    bgcolor: PAINEL.destaque,
                    boxShadow: '0 0 0 4px rgba(255,191,49,.22)',
                  },
                },
                '@media (prefers-reduced-motion: reduce)': {
                  transition: 'none',
                  '&:hover': { transform: 'none' },
                },
              }}
            >
              <Box
                component="span"
                className="recurso-ponto"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: recurso.cor,
                  transition: 'background-color .2s, box-shadow .2s',
                }}
              />
              {recurso.label}
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mt: 5,
          height: RODAPE_ALTURA,
          fontSize: 12,
          letterSpacing: '.06em',
          color: PAINEL.rodape,
        }}
      >
        <Box component="span" sx={{ flex: 1, borderTop: '1px dashed rgba(255,255,255,.28)' }} />
        PROTEGIDO POR{' '}
        <Box component="strong" sx={{ color: 'common.white' }}>
          {CONFIG.appName.toUpperCase()}
        </Box>
        <Box component="svg" viewBox="0 0 104 104" aria-hidden sx={{ width: 18, height: 18 }}>
          <LogoMark tile={false} />
        </Box>
      </Box>
    </Box>
  );

  const renderFormulario = () => (
    <Box
      component="main"
      sx={{
        flex: { xs: '1 1 100%', md: '1 1 480px' },
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        px: { xs: 3, sm: 6 },
        py: 4,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        component="section"
        sx={{
          flex: 1,
          width: 1,
          maxWidth: 400,
          mx: 'auto',
          py: 6,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          animation: `${rise} .6s cubic-bezier(.2,0,0,1) both`,
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        {children}

        <Divider sx={{ borderStyle: 'dashed', mt: 3, mb: 3 }} />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
            fontSize: 13,
            lineHeight: '20px',
            color: 'text.secondary',
          }}
        >
          <Typography component="p" sx={{ font: 'inherit' }}>
            Recebeu um PDF assinado?{' '}
            <Link
              component={RouterLink}
              href={paths.verificar}
              underline="none"
              sx={{ fontWeight: 600, color: '#0565C9', '&:hover': { color: '#0351AB' } }}
            >
              Verificar documento
            </Link>
          </Typography>

          <Typography
            component="p"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, font: 'inherit', fontSize: 12 }}
          >
            <CadeadoIcon />
            Nunca pedimos a sua senha por e-mail ou telefone.
          </Typography>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          minHeight: RODAPE_ALTURA,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1.5,
          fontSize: 12,
          color: 'text.secondary',
        }}
      >
        <Box component="span" sx={{ display: 'flex', gap: 2.5 }}>
          {['Privacidade', 'Termos de uso'].map((label) => (
            // Páginas ainda não existem: ficam só como rótulo com o aviso.
            <Tooltip key={label} title="Em construção" arrow>
              <Box component="span" tabIndex={0} sx={{ cursor: 'default' }}>
                {label}
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap' }}>
      {renderPainel()}
      {renderFormulario()}
    </Box>
  );
}
