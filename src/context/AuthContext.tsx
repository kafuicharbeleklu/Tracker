
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../lib/authConfig";
import { User } from '../types';
import { authService } from '../services/authService';
import { mockAllUsersExtended } from '../data/mockData';
import { useToast } from './ToastContext';

const DEMO_LOGIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  needsPasswordChange: boolean;
  accessDenied: boolean;
  isLoading: boolean;

  login: (email: string) => void; // Legacy/Dev login
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { instance, accounts } = useMsal();
  const { showToast } = useToast();

  // State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authSource, setAuthSource] = useState<'msal' | 'demo' | null>(null);

  /**
   * CORE AUTH VERIFICATION LOGIC (Level 2)
   */
  const verifyUserWithBackend = useCallback(async (email: string) => {
    setIsLoading(true);

    try {
      let accessToken = '';
      const primaryAccount = accounts[0];
      if (primaryAccount) {
        try {
          const tokenResponse = await instance.acquireTokenSilent({
            ...loginRequest,
            account: primaryAccount,
          });
          accessToken = tokenResponse.accessToken;
        } catch (tokenError) {
          console.warn('[AuthContext] Silent token acquisition failed', tokenError);
        }
      }

      const result = await authService.verifyUser(accessToken, email);

      if (result.success && result.user) {
        // Map SharePoint User to App User
        const appUser: User = {
          id: result.user.id,
          name: result.user.Title,
          email: result.user.MicrosoftEmail,
          role: result.user.Role,
          department: 'N/A', // Could be fetched from SharePoint extra fields
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(result.user.Title)}&background=random`,
          // Add other mappings
          status: result.user.Status,
          mustChangePassword: result.user.MustChangePassword
        };

        setCurrentUser(appUser);
        setNeedsPasswordChange(!!result.needsPasswordChange);
        setAccessDenied(false);
        setAuthSource('msal');

      } else {
        console.warn(`[AuthContext] Access Denied: ${result.error}`);
        setCurrentUser(null);
        setAccessDenied(true);
        if (result.error) showToast(result.error, 'error');
      }

    } catch (error) {
      console.error("Auth verification failed", error);
      showToast("Erreur lors de la vérification du compte.", "error");
      setAccessDenied(true);
    } finally {
      setIsLoading(false);
    }
  }, [accounts, instance, showToast]);

  // Check auth status (exposed for re-checks after password change)
  const checkAuthStatus = async () => {
    if (accounts.length > 0) {
      await verifyUserWithBackend(accounts[0].username);
    }
  };

  // Watch MSAL Accounts
  useEffect(() => {
    if (accounts.length > 0 && !currentUser && !accessDenied) {
      verifyUserWithBackend(accounts[0].username);
      return;
    }

    // If an MSAL-backed session loses its account, force local logout state.
    if (accounts.length === 0 && authSource === 'msal') {
      setCurrentUser(null);
      setNeedsPasswordChange(false);
      setAccessDenied(false);
      setAuthSource(null);
    }
  }, [accounts, verifyUserWithBackend, currentUser, accessDenied, authSource]);

  const login = (email: string) => {
    // Dev/Mock login
    if (!DEMO_LOGIN_ENABLED) {
      showToast("Connexion démo désactivée dans cet environnement.", "error");
      return;
    }

    const user = mockAllUsersExtended.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setNeedsPasswordChange(false);
      setAccessDenied(false);
      setAuthSource('demo');
    } else {
      console.error("User not found for simulation");
      showToast("Utilisateur de démonstration introuvable.", "error");
    }
  };

  const loginWithGoogle = async () => {
    // Not implemented for this flow
    showToast("Google Login not supported in this strict mode.", "info");
  };

  const loginWithMicrosoft = async () => {
    try {
      setAccessDenied(false); // Reset flags before new attempt
      await instance.loginPopup(loginRequest);
      // useEffect will pick up the new account
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    instance.logoutPopup(); // MSAL Logout
    setCurrentUser(null);
    setNeedsPasswordChange(false);
    setAccessDenied(false);
    setAuthSource(null);
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser && !needsPasswordChange && !accessDenied,
      needsPasswordChange,
      accessDenied,
      isLoading,
      login,
      loginWithGoogle,
      loginWithMicrosoft,
      logout,
      checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
