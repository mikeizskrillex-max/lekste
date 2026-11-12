import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './i18n/I18n';
import { StoreProvider } from './lib/store';
import { Landing } from './pages/Landing';
import { Quiz } from './pages/Quiz';
import { Result } from './pages/Result';
import { Welcome } from './pages/Welcome';
import { Legal } from './pages/Legal';
import { AppLayout } from './pages/app/AppLayout';
import { Today } from './pages/app/Today';
import { Menu } from './pages/app/Menu';
import { Basket } from './pages/app/Basket';
import { Week } from './pages/app/Week';
import { Progress } from './pages/app/Progress';
import { Settings } from './pages/app/Settings';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/result" element={<Result />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/privacy" element={<Legal kind="privacy" />} />
            <Route path="/terms" element={<Legal kind="terms" />} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Week />} />
              <Route path="menu" element={<Menu />} />
              <Route path="basket" element={<Basket />} />
              <Route path="diary" element={<Today />} />
              <Route path="progress" element={<Progress />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </I18nProvider>
  </StrictMode>,
);
