import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './theme-sombre.css';

// MSAL Imports
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./src/lib/authConfig";
import { enregistrerLeServiceWorker } from "./src/lib/avis";
import { suivreLeThemeDeLAppareil } from "./src/lib/theme";
import { suivreLesRangees } from "./src/lib/passageDeFiche";

// Les notifications système passent par un service worker (08/10) — voir src/lib/avis.ts.
void enregistrerLeServiceWorker();

// Le thème choisi sur cet appareil (10/10) — voir src/lib/theme.ts.
suivreLeThemeDeLAppareil();
suivreLesRangees();

const msalInstance = new PublicClientApplication(msalConfig);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Initialize MSAL outside of component lifecycle
msalInstance.initialize().then(() => {
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>
  );
});