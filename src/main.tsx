import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

import { BrowserRouter } from 'react-router-dom';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';
const hasGoogleClientId =
  Boolean(googleClientId) &&
  googleClientId !== 'REPLACE_WITH_GOOGLE_CLIENT_ID' &&
  googleClientId.endsWith('.apps.googleusercontent.com');

console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log("ENV CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
if (hasGoogleClientId) console.log("Google OAuth loaded");
console.debug('[auth] Google client id loaded:', hasGoogleClientId);

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {hasGoogleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    ) : (
      app
    )}
  </StrictMode>,
);
