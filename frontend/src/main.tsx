import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.tsx';
import './index.css';

// Obtener configuración de Auth0 desde variables de entorno
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Verificar que las variables de entorno estén definidas
if (!domain || !clientId) {
  console.error('Error: Variables de entorno de Auth0 no definidas');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: 'openid profile email read:current_user update:current_user_metadata'
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);