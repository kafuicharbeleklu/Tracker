import { Configuration, PopupRequest } from '@azure/msal-browser';

export const msalConfig: Configuration = {
    auth: {
        clientId: '4ba52933-88c9-43df-beb3-10d361730df1', // Provided by user
        authority: 'https://login.microsoftonline.com/common', // Defaulting to common (multi-tenant)
        redirectUri: window.location.origin, // Redirects back to the app
    },
    cache: {
        cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    },
};

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest: PopupRequest = {
    scopes: ['User.Read'],
};
