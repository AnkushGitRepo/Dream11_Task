import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing'));
const Matches = lazy(() => import('./pages/Matches'));
const MatchRoom = lazy(() => import('./pages/MatchRoom'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/match/:matchId" element={<MatchRoom />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
