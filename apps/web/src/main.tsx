import { initLogger } from '@movable-madness/logging/frontend';
import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/app';

// Initialize frontend logging
initLogger({
  service: 'web',
  maxBreadcrumbs: 50,
  errorReportingEndpoint: '/api/v1/logs/errors',
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
