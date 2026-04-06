import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import { WorkflowBuilderPage } from './pages/WorkflowBuilderPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkflowBuilderPage />
    <Toaster richColors position="top-right" />
  </React.StrictMode>
);
