import React, { useState } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { mockAllUsersExtended } from '../../../data/mockData';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';
import Tooltip from '../../../components/ui/Tooltip';
import { useData } from '../../../context/DataContext';
import { APP_CONFIG } from '../../../config';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

type AuthView = 'login' | 'forgot-password';

const DEMO_LOGIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
const LOGIN_FOOTER_YEAR = new Date().getFullYear();

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>(undefined);
    const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<'email' | 'microsoft' | null>(null);

    const [authView, setAuthView] = useState<AuthView>('login');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState<string | undefined>(undefined);
    const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

    const { showToast } = useToast();
    const { login, loginWithMicrosoft } = useAuth();
    const { logEvent } = useData();
    const isProductionOnlyMode = !DEMO_LOGIN_ENABLED;
    const disabledDemoToastMessage =
        'Connexion démo désactivée dans cet environnement. Utilisez le bouton Microsoft SSO.';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (isProductionOnlyMode) {
            showToast(disabledDemoToastMessage, 'error');
            return;
        }

        const trimmedEmail = email.trim();
        let hasValidationError = false;

        if (!trimmedEmail) {
            setEmailError('Veuillez saisir votre adresse e-mail.');
            hasValidationError = true;
        } else if (!emailPattern.test(trimmedEmail)) {
            setEmailError("Le format de l'adresse e-mail est invalide.");
            hasValidationError = true;
        } else {
            setEmailError(undefined);
        }

        if (!password) {
            setPasswordError('Veuillez saisir votre mot de passe.');
            hasValidationError = true;
        } else {
            setPasswordError(undefined);
        }

        if (hasValidationError) {
            showToast('Veuillez corriger les erreurs du formulaire.', 'error');
            return;
        }

        setIsLoading(true);
        setAuthMethod('email');

        setTimeout(() => {
            const user = mockAllUsersExtended.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());

            if (user) {
                login(user.email);
                logEvent({
                    type: 'LOGIN',
                    actorId: user.id,
                    actorName: user.name,
                    actorRole: user.role,
                    targetType: 'USER',
                    targetId: user.id,
                    targetName: user.name,
                    description: 'Connexion réussie (Email)',
                    isSystem: false,
                    isSensitive: false
                });
                setIsLoading(false);
                setEmailError(undefined);
                setPasswordError(undefined);
                onLoginSuccess();
            } else {
                setIsLoading(false);
                setAuthMethod(null);
                setPasswordError('Identifiants incorrects. Vérifiez vos informations.');
                showToast('Identifiants incorrects.', 'error');
            }
        }, 800);
    };

    const handleMicrosoftLogin = async () => {
        setIsLoading(true);
        setAuthMethod('microsoft');

        try {
            await loginWithMicrosoft();
        } finally {
            setIsLoading(false);
            setAuthMethod(null);
        }
    };

    const openForgotPassword = () => {
        setForgotPasswordEmail(email.trim());
        setForgotPasswordError(undefined);
        setAuthView('forgot-password');
    };

    const backToLogin = () => {
        if (isSubmittingForgotPassword) return;
        setForgotPasswordError(undefined);
        setAuthView('login');
    };

    const handleForgotPasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedEmail = forgotPasswordEmail.trim();

        if (!trimmedEmail) {
            setForgotPasswordError('Veuillez saisir votre adresse e-mail.');
            return;
        }

        if (!emailPattern.test(trimmedEmail)) {
            setForgotPasswordError("Le format de l'adresse e-mail est invalide.");
            return;
        }

        setForgotPasswordError(undefined);
        setIsSubmittingForgotPassword(true);

        setTimeout(() => {
            const accountExists = mockAllUsersExtended.some(
                (user) => user.email.toLowerCase() === trimmedEmail.toLowerCase()
            );

            if (accountExists) {
                setEmail(trimmedEmail);
            }

            setIsSubmittingForgotPassword(false);
            setAuthView('login');
            showToast('Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.', 'success');
        }, 900);
    };

    const fillDemoCredentials = (userEmail: string) => {
        if (isProductionOnlyMode) {
            showToast(disabledDemoToastMessage, 'error');
            return;
        }

        setEmail(userEmail);
        setPassword('password123');
        setEmailError(undefined);
        setPasswordError(undefined);
        showToast('Identifiants de démonstration remplis', 'info');
    };

    const featuresTracker = [
        'Inventaire en temps réel',
        'Suivi du cycle de vie',
        'Audits et rapports dédiés'
    ];

    return (
        <div className="flex min-h-dvh w-full font-sans bg-[var(--color-login-page-bg)] text-[var(--color-text-primary)] overflow-x-hidden">

            {/* LEFT PANEL - SMARTPROCURE-ALIGNED BRAND HERO */}
            <section
                className="hidden expanded:flex expanded:w-5/12 large:w-[40%] fixed inset-y-0 left-0 z-10 flex-col bg-[var(--color-login-hero-bg)] text-white overflow-hidden border-r border-white/5"
            >
                <div className="relative z-10 flex h-full w-full flex-col justify-between px-10 py-10 large:px-14 large:py-12">
                    <div className="flex items-center gap-3 mb-14">
                        <div className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center text-body-medium font-black">
                            TR
                        </div>
                        <span className="text-title-large font-extrabold text-white">{APP_CONFIG.appName}</span>
                    </div>

                    <div className="max-w-lg">
                        <h2 className="text-4xl large:text-5xl font-black mb-6 leading-[1.15] text-white">
                            Pilotez vos actifs avec une expérience{' '}
                            <span className="text-primary font-light italic">unifiée</span>.
                        </h2>

                        <p className="text-body-medium large:text-title-medium text-slate-400 max-w-md leading-relaxed mb-10 font-normal">
                            Une plateforme opérationnelle pour suivre les affectations, les retours, les audits et les coûts du parc interne.
                        </p>

                        <div className="space-y-6">
                            {featuresTracker.map((feature) => (
                                <div key={feature} className="group flex items-start gap-3.5">
                                    <div className="h-5 w-[2px] bg-primary/40 mt-1 shrink-0 group-hover:bg-primary transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-label-large large:text-title-medium font-bold text-slate-200 group-hover:text-white transition-colors">
                                            {feature}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-label-small uppercase font-semibold text-slate-400 flex justify-between items-center border-t border-white/[0.05] pt-6">
                        <span>© {LOGIN_FOOTER_YEAR} {APP_CONFIG.companyName}</span>
                        <span>{APP_CONFIG.version}</span>
                    </div>
                </div>
            </section>

            {/* RIGHT PANEL */}
            <main className="w-full expanded:w-7/12 large:w-[60%] expanded:ml-auto min-h-dvh flex flex-col items-center justify-center px-6 py-12 medium:px-8 large:px-16 bg-[var(--color-login-surface)] animate-in fade-in zoom-in-95 duration-500">
                <div className="w-full max-w-[480px] space-y-7 ui-panel p-6 medium:p-8">

                    {/* MEDIUM HERO (600-839) */}
                    <section className="hidden medium:block expanded:hidden rounded-lg border border-[var(--color-border-default)] bg-[var(--color-neutral-50)] p-5">
                        <p className="text-title-large text-[var(--color-text-primary)] mb-1">{APP_CONFIG.appName}</p>
                        <p className="text-body-medium text-[var(--color-text-muted)] mb-4">
                            Gérez vos actifs IT avec une vue unifiée et des workflows simplifiés.
                        </p>
                        <div className="space-y-2">
                            {featuresTracker.map((feature) => (
                                <div key={`medium-${feature}`} className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                    <MaterialIcon name="check_circle" size={18} className="text-primary" />
                                    <span className="text-label-medium font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* MOBILE BRANDING */}
                    <div className="medium:hidden flex items-center justify-center gap-2 text-[var(--color-text-primary)]">
                        <div className="w-8 h-8 rounded-md bg-primary text-on-primary flex items-center justify-center text-body-small font-black">
                            TR
                        </div>
                        <span className="text-title-medium font-bold">{APP_CONFIG.appName}</span>
                    </div>

                    {/* Header */}
                    <div className="space-y-2">
                        {authView === 'login' ? (
                            <>
                                <h1 className="text-headline-medium font-bold text-[var(--color-text-primary)]">Connexion</h1>
                                <p className="text-body-medium text-[var(--color-text-muted)]">Heureux de vous revoir !</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-headline-medium font-bold text-[var(--color-text-primary)]">Réinitialiser le mot de passe</h1>
                                <p className="text-body-medium text-[var(--color-text-muted)]">Saisissez votre e-mail pour recevoir un lien.</p>
                            </>
                        )}
                    </div>

                    {authView === 'login' ? (
                        <>
                            {isProductionOnlyMode && (
                                <section className="rounded-lg border border-primary/40 bg-primary/10 p-4 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-primary">
                                            <MaterialIcon name="info" size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-label-large font-bold text-[var(--color-text-primary)]">
                                                Environnement de production
                                            </p>
                                            <p className="text-body-small text-[var(--color-text-muted)]">
                                                La connexion e-mail/mot de passe de démonstration est désactivée.
                                                Utilisez Microsoft SSO pour ouvrir votre session Azure AD.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleMicrosoftLogin}
                                        loading={isLoading && authMethod === 'microsoft'}
                                        loadingLabel="Ouverture de Microsoft SSO"
                                        variant="filled"
                                        size="lg"
                                        className="w-full h-12"
                                        icon={<MaterialIcon name="login" size={18} />}
                                    >
                                        Se connecter avec Microsoft SSO
                                    </Button>
                                </section>
                            )}

                            <form noValidate onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-5">
                                    <InputField
                                        label="Adresse e-mail"
                                        type="email"
                                        placeholder="Ex: nom@tracker.app"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) {
                                                setEmailError(undefined);
                                            }
                                        }}
                                        icon={<MaterialIcon name="mail" size={20} />}
                                        variant="filled"
                                        className="bg-white"
                                        autoComplete="username"
                                        error={emailError}
                                        disabled={isProductionOnlyMode}
                                        required
                                    />

                                    <div>
                                        <InputField
                                            label="Mot de passe"
                                            type="password"
                                            placeholder="Votre mot de passe"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) {
                                                    setPasswordError(undefined);
                                                }
                                            }}
                                            icon={<MaterialIcon name="lock" size={20} />}
                                            variant="filled"
                                            className="bg-white"
                                            isPassword
                                            autoComplete="current-password"
                                            error={passwordError}
                                            disabled={isProductionOnlyMode}
                                            required
                                        />
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                type="button"
                                                variant="text"
                                                onClick={openForgotPassword}
                                                disabled={isLoading || isProductionOnlyMode}
                                                className="rounded-sm"
                                            >
                                                Mot de passe oublié ?
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || isProductionOnlyMode}
                                    variant="filled"
                                    size="lg"
                                    loading={isLoading && authMethod === 'email'}
                                    loadingLabel="Connexion en cours"
                                    className="w-full h-12"
                                >
                                    Se connecter
                                </Button>
                            </form>

                            {DEMO_LOGIN_ENABLED && (
                                <div className="pt-8">
                                    <p className="text-label-medium text-[var(--color-text-muted)] uppercase font-bold text-center mb-4">
                                        Comptes Démo
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        {mockAllUsersExtended.slice(0, 4).map((user) => (
                                            // Tooltip maison au lieu de `title` natif : au tap l'avatar pré-remplit ;
                                            // l'appui long (600 ms) révèle nom + rôle complets — jusqu'ici hover-only,
                                            // seul le badge-lettre survivait au tactile (AUDIT_MOBILE #6/#9).
                                            <Tooltip key={user.id} content={`${user.name} · ${user.role}`}>
                                            <Button
                                                type="button"
                                                variant="text"
                                                onClick={() => fillDemoCredentials(user.email)}
                                                aria-label={`Connexion démo: ${user.name}, rôle ${user.role}`}
                                                className="group relative w-12 h-12 p-0 rounded-full min-w-12 min-h-12 overflow-visible"
                                            >
                                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-short4 ease-emphasized">
                                                    <img
                                                        src={user.avatar}
                                                        className="w-full h-full object-contain bg-[var(--color-neutral-100)] p-0.5"
                                                        alt={user.name}
                                                    />
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center text-label-small font-medium text-on-primary bg-primary">
                                                    {user.role[0]}
                                                </div>
                                            </Button>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <form noValidate onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                            <InputField
                                label="Adresse e-mail"
                                type="email"
                                placeholder="Ex: nom@tracker.app"
                                value={forgotPasswordEmail}
                                onChange={(e) => {
                                    setForgotPasswordEmail(e.target.value);
                                    if (forgotPasswordError) {
                                        setForgotPasswordError(undefined);
                                    }
                                }}
                                icon={<MaterialIcon name="mail" size={20} />}
                                variant="filled"
                                className="bg-white"
                                autoComplete="email"
                                error={forgotPasswordError}
                                required
                            />

                            <div className="flex items-center justify-between gap-3">
                                <Button
                                    type="button"
                                    variant="text"
                                    onClick={backToLogin}
                                    disabled={isSubmittingForgotPassword}
                                >
                                    Retour à la connexion
                                </Button>
                                <Button
                                    type="submit"
                                    variant="filled"
                                    loading={isSubmittingForgotPassword}
                                    loadingLabel="Envoi en cours"
                                >
                                    Envoyer le lien
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="pt-2 text-center text-body-small text-[var(--color-text-muted)] space-y-1">
                        <p>
                            © {LOGIN_FOOTER_YEAR} {APP_CONFIG.companyName}. Tous droits réservés.
                        </p>
                        <p>
                            Application interne — pour toute assistance, contactez votre support informatique.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;














