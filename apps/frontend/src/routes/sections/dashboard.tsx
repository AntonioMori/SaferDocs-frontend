import type { RouteObject } from 'react-router';

import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router';

import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { paths } from '../paths';

// ----------------------------------------------------------------------

const AssinarPage = lazy(() => import('src/pages/assinar'));
const SegurancaPage = lazy(() => import('src/pages/conta/seguranca'));
const SessoesPage = lazy(() => import('src/pages/conta/sessoes'));
const PasskeysPage = lazy(() => import('src/pages/conta/passkeys'));

/** Área logada: sem sessão, o AuthGuard manda para o login com `returnTo` (REQ-20). */
const dashboardLayout = () => (
  <AuthGuard>
    <DashboardLayout>
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
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
        ],
      },
    ],
  },
];
