
import { AppUser } from '../types';

const MOCK_AUTH_BACKEND_ENABLED =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_AUTH_BACKEND === 'true';
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

// MOCK DATABASE (Simulating SharePoint List "AppUsers")
let mockAppUsers: AppUser[] = [
    {
        id: '1',
        Title: 'Alice Admin',
        MicrosoftEmail: 'alice.admin@tracker.app', // Must match valid Microsoft accounts for testing
        Role: 'SuperAdmin',
        Status: 'active',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'System',
        LastLoginDate: new Date().toISOString()
    },
    {
        id: '2',
        Title: 'Bob Manager',
        MicrosoftEmail: 'bob.manager@tracker.app',
        Role: 'Manager',
        Status: 'active',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'System'
    },
    {
        id: '3',
        Title: 'Charlie New',
        MicrosoftEmail: 'charlie.new@tracker.app',
        Role: 'User',
        Status: 'pending',
        MustChangePassword: true,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'Alice Admin'
    },
    {
        id: '4',
        Title: 'Dave Inactive',
        MicrosoftEmail: 'dave.inactive@tracker.app',
        Role: 'User',
        Status: 'inactive',
        MustChangePassword: false,
        CreatedDate: new Date().toISOString(),
        CreatedBy: 'Alice Admin'
    }
];

interface AuthResult {
    success: boolean;
    user?: AppUser;
    error?: string;
    needsPasswordChange?: boolean;
}

// SIMULATED BACKEND DELAY
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const mockTempPasswords = new Map<string, string>([
    ['3', generateTempPassword()],
]);

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

        const user = mockAppUsers.find(u => u.MicrosoftEmail.toLowerCase() === email.toLowerCase());

        if (!user) {
            return { success: false, error: 'User not found in authorized list.' };
        }

        if (user.Status === 'inactive') {
            return { success: false, error: 'Account is inactive. Contact administrator.' };
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

        const user = mockAppUsers.find(u => u.id === userId);

        if (!user) throw new Error("User not found");
        if (newPass.length < 8) throw new Error("New password too short");

        const expectedTempPassword = mockTempPasswords.get(userId);
        if (user.MustChangePassword) {
            if (!expectedTempPassword) throw new Error("Temporary password unavailable for this account");
            if (expectedTempPassword !== tempPass) {
                throw new Error("Invalid temporary password");
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
        await delay(600);
        if (!MOCK_AUTH_BACKEND_ENABLED) return [];
        return mockAppUsers.map(toPublicAppUser);
    },

    createUser: async (newUser: Partial<AppUser>): Promise<AppUser> => {
        await delay(1000);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        const existing = mockAppUsers.find(u => u.MicrosoftEmail === newUser.MicrosoftEmail);
        if (existing) throw new Error("User with this email already exists.");

        const generatedId = Math.random().toString(36).substr(2, 9);
        const tempPass = Math.random().toString(36).slice(-8) + "!";
        mockTempPasswords.set(generatedId, tempPass);

        const user: AppUser = {
            id: generatedId,
            Title: newUser.Title || '',
            MicrosoftEmail: newUser.MicrosoftEmail || '',
            FirstName: newUser.FirstName,
            LastName: newUser.LastName,
            Role: newUser.Role || 'User',
            Status: 'pending',
            MustChangePassword: true,
            CreatedDate: new Date().toISOString(),
            CreatedBy: newUser.CreatedBy || 'Admin',
            InvitationSentDate: new Date().toISOString(), // Simulating Email Sent
            Notes: newUser.Notes
        };

        mockAppUsers = [user, ...mockAppUsers];

        return toPublicAppUser(user);
    },

    updateUser: async (id: string, updates: Partial<AppUser>): Promise<AppUser> => {
        await delay(500);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        const index = mockAppUsers.findIndex(u => u.id === id);
        if (index === -1) throw new Error("User not found");

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

    deleteUser: async (id: string): Promise<void> => {
        await delay(500);

        if (!MOCK_AUTH_BACKEND_ENABLED) {
            throw new Error('Mode mock auth désactivé.');
        }

        mockTempPasswords.delete(id);
        mockAppUsers = mockAppUsers.filter(u => u.id !== id);
    }
};


