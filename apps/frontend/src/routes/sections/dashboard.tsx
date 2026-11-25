import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { SecurityEventsHighlight } from 'src/sections/account/components/security-events-highlight';

import { AuthGuard } from 'src/auth/guard';

import { paths } from '../paths';

// ----------------------------------------------------------------------

const AssinarPage = lazy(() => import('src/pages/assinar'));
const SegurancaPage = lazy(() => import('src/pages/conta/seguranca'));
const SessoesPage = lazy(() => import('src/pages/conta/sessoes'));
const PasskeysPage = lazy(() => import('src/pages/conta/passkeys'));
const AtividadePage = lazy(() => import('src/pages/conta/atividade'));

/** Área logada: sem sessão, o AuthGuard manda para o login com `returnTo` (REQ-20). */
const dashboardLayout = () => (
  <AuthGuard>
    <DashboardLayout>
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>

      {/* Eventos de segurança não vistos, em destaque logo depois do login (REQ-58). */}
      <SecurityEventsHighlight />
    </DashboardLayout>
  </AuthGuard>
);

export const dashboardRoutes: RouteObject[] = [
  {
    element: dashboardLayout(),
    children: [
      { path: paths.assinar, element: <AssinarPage /> },
      {
        path: paths.conta.root,
        children: [
          { index: true, element: <Navigate to={paths.conta.seguranca} replace /> },
          { path: 'seguranca', element: <SegurancaPage /> },
          { path: 'sessoes', element: <SessoesPage /> },
          { path: 'passkeys', element: <PasskeysPage /> },
          { path: 'atividade', element: <AtividadePage /> },
        ],
      },
    ],
  },
];
