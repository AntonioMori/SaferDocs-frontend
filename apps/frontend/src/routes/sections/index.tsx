import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { SimpleLayout } from 'src/layouts/simple';
import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { SplashScreen } from 'src/components/loading-screen';

import { paths } from '../paths';
import { dashboardRoutes } from './dashboard';

// ----------------------------------------------------------------------

const LoginPage = lazy(() => import('src/pages/entrar'));
const CadastroPage = lazy(() => import('src/pages/cadastro'));
const DoisFatoresPage = lazy(() => import('src/pages/dois-fatores'));
const VerificarPage = lazy(() => import('src/pages/verificar'));
const Page403 = lazy(() => import('src/pages/error/403'));
const Page404 = lazy(() => import('src/pages/error/404'));
const Page500 = lazy(() => import('src/pages/error/500'));

const authCentered = (page: React.ReactNode): React.ReactNode => (
  <Suspense fallback={<SplashScreen />}>
    <AuthCenteredLayout>{page}</AuthCenteredLayout>
  </Suspense>
);

export const routesSection: RouteObject[] = [
  { path: '/', element: <Navigate to={paths.entrar} replace /> },

  // Autenticação (login, cadastro e 2FA)
  { path: paths.entrar, element: authCentered(<LoginPage />) },
  { path: paths.cadastro, element: authCentered(<CadastroPage />) },
  { path: paths.doisFatores, element: authCentered(<DoisFatoresPage />) },

  // Verificação pública de PDF assinado: sem login
  {
    path: paths.verificar,
    element: (
      <Suspense fallback={<SplashScreen />}>
        <SimpleLayout>
          <VerificarPage />
        </SimpleLayout>
      </Suspense>
    ),
  },

  // Área logada: assinar e conta
  ...dashboardRoutes,

  // Erros
  {
    path: 'error',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: '403', element: <Page403 /> },
      { path: '404', element: <Page404 /> },
      { path: '500', element: <Page500 /> },
    ],
  },

  // No match
  {
    path: '*',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Page404 />
      </Suspense>
    ),
  },
];
