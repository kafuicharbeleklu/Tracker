import { AppUser } from '../types';

const MOCK_AUTH_BACKEND_ENABLED =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH_BACKEND === 'true';
const AUTH_API_BASE_URL = (
    import.meta.env.VITE_AUTH_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8787' : '')
)
    .trim()
    .replace(/\/+$/, '');
const AUTH_ADMIN_API_KEY = (import.meta.env.VITE_AUTH_ADMIN_API_KEY || 'NEEMBA_ADMIN_KEY').trim();
const ALLOWED_EMAIL_DOMAINS = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

const isAllowedEmail = (email: string): boolean => {
    if (ALLOWED_EMAIL_DOMAINS.length === 0) return true;
    const domain = email.split('@')[1]?.toLowerCase();
    return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain);
};

const toPublicAppUser = (user: AppUser): AppUser => {
    const { TemporaryPassword: _temporaryPassword, ...safeUser } = user;
    return safeUser;
};

const generateTempPassword = (): string => {
    const fromEnv = import.meta.env.VITE_DEMO_TEMP_PASSWORD?.trim();
    if (fromEnv) return fromEnv;
    if (import.meta.env.DEV) return 'ChangeMe123!';
    return `Tmp#${Math.random().toString(36).slice(2, 10)}!`;
};

/**
 * Code PIN remis à une nouvelle personne — **quatre chiffres** (REGLES-TRANSVERSES.md
 * §2.1). Il en produisait six, alors que tous les pavés du produit en acceptent quatre :
 * un PIN attribué était donc insaisissable là où on le demande.
 */
const generateTempPin = (): string => {
    const fromEnv = import.meta.env.VITE_DEMO_TEMP_PIN?.trim();
    if (fromEnv) return fromEnv;
    if (import.meta.env.DEV) return '1234';
    return String(Math.floor(1000 + Math.random() * 9000));
};

// MOCK DATABASE (Simulating SharePoint List "AppUsers")
let mockAppUsers: AppUser[] = [
    {
        id: '1',
        Title: 'Alice Admin',
        MicrosoftEmail: 'alice.admin@tracker.app', // Must match valid Microsoft accounts for testing
        Role: 'SuperAdmin',
        Status: 'active',
        PinStatus: 'active',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'System',
        LastLoginDate: new Date().toISOString(),
    },
    {
        id: '2',
        Title: 'Bob Manager',
        MicrosoftEmail: 'bob.manager@tracker.app',
        Role: 'Manager',
        Status: 'active',
        PinStatus: 'active',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'System',
    },
    {
        id: '3',
        Title: 'Charlie New',
        MicrosoftEmail: 'charlie.new@tracker.app',
        Role: 'User',
        Status: 'pending',
        PinStatus: 'pending',
        MustChangePassword: true,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'Alice Admin',
    },
    {
        id: '4',
        Title: 'Dave Inactive',
        MicrosoftEmail: 'dave.inactive@tracker.app',
        Role: 'User',
        Status: 'inactive',
        PinStatus: 'not_set',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'Alice Admin',
    },
];

interface AuthResult {
    success: boolean;
    user?: AppUser;
    error?: string;
    needsPasswordChange?: boolean;
}

interface ResetPasswordResult {
    user: AppUser;
    temporaryPassword: string;
}

interface ResetPinResult {
    user: AppUser;
    temporaryPin: string;
}

interface AuthUsersApiResponse {
    ok: boolean;
    users?: AppUser[];
    message?: string;
}

interface ResetPasswordApiResponse {
    ok: boolean;
    user?: AppUser;
    temporaryPassword?: string;
    message?: string;
}

interface ResetPinApiResponse {
    ok: boolean;
    user?: AppUser;
    temporaryPin?: string;
    message?: string;
}

interface SetStatusApiResponse {
    ok: boolean;
    user?: AppUser;
    message?: string;
}

// SIMULATED BACKEND DELAY
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const mockTempPasswords = new Map<string, string>([['3', generateTempPassword()]]);
const mockTempPins = new Map<string, string>([['3', generateTempPin()]]);

const canUseAuthApi = (): boolean => Boolean(AUTH_API_BASE_URL);

const authApiUrl = (path: string): string => `${AUTH_API_BASE_URL}${path}`;

export const authService = {
    /**
     * Step 2 Verification: Backend simulated logic
     * Checks if Microsoft Email exists in SharePoint and is Active
     */
    verifyUser: async (accessToken: string, email: string): Promise<AuthResult> => {
        await delay(800);
        console.log(`[Backend] Verifying user: ${email}`);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            return {
                success: false,
                error: 'Vérification locale désactivée hors développement.',
            };
        }

        if (!accessToken || accessToken === 'mock_token') {
            return {
                success: false,
                error: 'Jeton Microsoft invalide ou absent.',
            };
        }

        if (!isAllowedEmail(email)) {
            return {
                success: false,
                error: 'Domaine e-mail non autorisé.',
            };
        }

        const user = mockAppUsers.find(
            (u) => u.MicrosoftEmail.toLowerCase() === email.toLowerCase(),
        );

        if (!user) {
            // Le motif est ce que l'écran d'accès refusé affiche (planche 17.1) : il dit
            // la cause de cette personne, au lieu de lui faire trier trois hypothèses.
            return {
                success: false,
                error: "Votre compte n'est pas sur la liste des personnes autorisées.",
            };
        }

        // `pending` n'est pas un refus : c'est le compte invité qui vient définir son
        // mot de passe (planche 02.2). Seul `inactive` ferme la porte.
        if (user.Status === 'inactive') {
            return { success: false, error: 'Votre compte a été suspendu.' };
        }

        if (user.MustChangePassword) {
            return { success: true, user: toPublicAppUser(user), needsPasswordChange: true };
        }

        // Update Last Login (Simulated)
        user.LastLoginDate = new Date().toISOString();

        return { success: true, user: toPublicAppUser(user) };
    },

    /**
     * Change Password Logic
     */
    changePassword: async (userId: string, tempPass: string, newPass: string): Promise<boolean> => {
        await delay(1000);

        if (!MOCK_AUTH_BACKEND_ENABLED) throw new Error('Mode mock auth désactivé.');

        const user = mockAppUsers.find((u) => u.id === userId);

        if (!user) throw new Error('User not found');
        if (newPass.length < 8) throw new Error('New password too short');

        const expectedTempPassword = mockTempPasswords.get(userId);
        if (user.MustChangePassword) {
            if (!expectedTempPassword)
                throw new Error('Temporary password unavailable for this account');
            if (expectedTempPassword !== tempPass) {
                throw new Error('Invalid temporary password');
            }
        }

        // Update user "SharePoint" entry (secret stays out of exposed user object)
        mockTempPasswords.delete(userId);
        user.MustChangePassword = false;
        user.Status = 'active'; // Activate user if they were pending

        return true;
    },

    // --- ADMIN METHODS ---

    getAllUsers: async (): Promise<AppUser[]> => {
        if (canUseAuthApi()) {
            try {
                const response = await fetch(authApiUrl('/api/auth/users'), {
                    method: 'GET',
                    headers: {
                        'x-admin-key': AUTH_ADMIN_API_KEY,
                    },
                });

                const payload = (await response.json()) as AuthUsersApiResponse;
                if (!response.ok || !payload.ok) {
                    throw new Error(
                        payload.message || "Impossible de lire les utilisateurs via l'API.",
                    );
                }

                return Array.isArray(payload.users) ? payload.users : [];
            } catch (error) {
                if (!MOCK_AUTH_BACKEND_ENABLED) {
                    throw error instanceof Error
                        ? error
                        : new Error("API d'authentification indisponible.");
                }
                console.warn('[authService] Fallback local getAllUsers:', error);
            }
        }

        await delay(600);
        if (!MOCK_AUTH_BACKEND_ENABLED) return [];
        return mockAppUsers.map(toPublicAppUser);
    },

    createUser: async (newUser: Partial<AppUser>): Promise<AppUser> => {
        await delay(1000);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        const existing = mockAppUsers.find((u) => u.MicrosoftEmail === newUser.MicrosoftEmail);
        if (existing) throw new Error('User with this email already exists.');

        const generatedId = Math.random().toString(36).substr(2, 9);
        const tempPass = Math.random().toString(36).slice(-8) + '!';
        const tempPin = generateTempPin();
        mockTempPasswords.set(generatedId, tempPass);
        mockTempPins.set(generatedId, tempPin);

        const user: AppUser = {
            id: generatedId,
            Title: newUser.Title || '',
            MicrosoftEmail: newUser.MicrosoftEmail || '',
            FirstName: newUser.FirstName,
            LastName: newUser.LastName,
            Role: newUser.Role || 'User',
            Status: 'pending',
            PinStatus: 'pending',
            MustChangePassword: true,
            CreatedDate: new Date().toISOString(),
            CreatedBy: newUser.CreatedBy || 'Admin',
            InvitationSentDate: new Date().toISOString(), // Simulating Email Sent
            Notes: newUser.Notes,
        };

        mockAppUsers = [user, ...mockAppUsers];

        return toPublicAppUser(user);
    },

    updateUser: async (id: string, updates: Partial<AppUser>): Promise<AppUser> => {
        await delay(500);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        const index = mockAppUsers.findIndex((u) => u.id === id);
        if (index === -1) throw new Error('User not found');

        const safeUpdates = { ...updates };
        delete safeUpdates.TemporaryPassword;

        if (safeUpdates.MustChangePassword === true && !mockTempPasswords.has(id)) {
            mockTempPasswords.set(id, generateTempPassword());
        }
        if (safeUpdates.MustChangePassword === false) {
            mockTempPasswords.delete(id);
        }

        mockAppUsers[index] = { ...mockAppUsers[index], ...safeUpdates };
        return toPublicAppUser(mockAppUsers[index]);
    },

    resetUserPassword: async (id: string): Promise<ResetPasswordResult> => {
        if (canUseAuthApi()) {
            const response = await fetch(
                authApiUrl(`/api/auth/users/${encodeURIComponent(id)}/reset-password`),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': AUTH_ADMIN_API_KEY,
                    },
                    body: JSON.stringify({}),
                },
            );

            const payload = (await response.json()) as ResetPasswordApiResponse;
            if (!response.ok || !payload.ok || !payload.user || !payload.temporaryPassword) {
                throw new Error(
                    payload.message || 'Réinitialisation du mot de passe refusée par le backend.',
                );
            }

            return {
                user: payload.user,
                temporaryPassword: payload.temporaryPassword,
            };
        }

        await delay(700);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        const index = mockAppUsers.findIndex((user) => user.id === id);
        if (index === -1) throw new Error('User not found');

        const tempPassword = generateTempPassword();
        mockTempPasswords.set(id, tempPassword);

        const updatedUser: AppUser = {
            ...mockAppUsers[index],
            MustChangePassword: true,
            Status:
                mockAppUsers[index].Status === 'inactive' ? 'pending' : mockAppUsers[index].Status,
            InvitationSentDate: new Date().toISOString(),
        };

        mockAppUsers[index] = updatedUser;

        return {
            user: toPublicAppUser(updatedUser),
            temporaryPassword: tempPassword,
        };
    },

    resetUserPin: async (id: string): Promise<ResetPinResult> => {
        if (canUseAuthApi()) {
            try {
                const response = await fetch(
                    authApiUrl(`/api/auth/users/${encodeURIComponent(id)}/reset-pin`),
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-key': AUTH_ADMIN_API_KEY,
                        },
                        body: JSON.stringify({}),
                    },
                );

                const payload = (await response.json()) as ResetPinApiResponse;
                if (!response.ok || !payload.ok || !payload.user || !payload.temporaryPin) {
                    throw new Error(
                        payload.message || 'Réinitialisation du PIN refusée par le backend.',
                    );
                }

                return {
                    user: payload.user,
                    temporaryPin: payload.temporaryPin,
                };
            } catch (error) {
                if (!MOCK_AUTH_BACKEND_ENABLED) {
                    throw error instanceof Error ? error : new Error('API PIN indisponible.');
                }
                console.warn('[authService] Fallback local resetUserPin:', error);
            }
        }

        await delay(500);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        const index = mockAppUsers.findIndex((user) => user.id === id);
        if (index === -1) throw new Error('User not found');

        const tempPin = generateTempPin();
        mockTempPins.set(id, tempPin);

        const updatedUser: AppUser = {
            ...mockAppUsers[index],
            PinStatus: 'pending',
            InvitationSentDate: new Date().toISOString(),
        };

        mockAppUsers[index] = updatedUser;

        return {
            user: toPublicAppUser(updatedUser),
            temporaryPin: tempPin,
        };
    },

    setUserStatus: async (id: string, status: AppUser['Status']): Promise<AppUser> => {
        if (canUseAuthApi()) {
            try {
                const response = await fetch(
                    authApiUrl(`/api/auth/users/${encodeURIComponent(id)}/status`),
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-admin-key': AUTH_ADMIN_API_KEY,
                        },
                        body: JSON.stringify({ status }),
                    },
                );
                const payload = (await response.json()) as SetStatusApiResponse;
                if (!response.ok || !payload.ok || !payload.user) {
                    throw new Error(
                        payload.message || 'Mise à jour du statut refusée par le backend.',
                    );
                }
                return payload.user;
            } catch (error) {
                if (!MOCK_AUTH_BACKEND_ENABLED) {
                    throw error instanceof Error ? error : new Error('API statut indisponible.');
                }
                console.warn('[authService] Fallback local setUserStatus:', error);
            }
        }

        await delay(300);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        const index = mockAppUsers.findIndex((user) => user.id === id);
        if (index === -1) throw new Error('User not found');

        const updatedUser: AppUser = {
            ...mockAppUsers[index],
            Status: status,
        };
        mockAppUsers[index] = updatedUser;
        return toPublicAppUser(updatedUser);
    },

    deleteUser: async (id: string): Promise<void> => {
        await delay(500);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        mockTempPasswords.delete(id);
        mockTempPins.delete(id);
        mockAppUsers = mockAppUsers.filter((u) => u.id !== id);
    },
};
