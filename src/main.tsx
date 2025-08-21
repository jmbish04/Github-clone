import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
const ExplorePage = lazy(() => import('./pages/Explore'));
const RepoPage = lazy(() => import('./pages/RepoPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<Skeleton className="h-96 w-full" />}><ExplorePage /></Suspense>,
      },
      {
        path: "/users/:username",
        element: <Suspense fallback={<Skeleton className="h-96 w-full" />}><ProfilePage /></Suspense>,
      },
      {
        path: "/:owner/:repo/*",
        element: <Suspense fallback={<Skeleton className="h-96 w-full" />}><RepoPage /></Suspense>,
      },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);