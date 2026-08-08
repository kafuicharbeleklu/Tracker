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


    return (
        <div className="min-h-dvh flex flex-col bg-[var(--color-login-page-bg)] text-[var(--tk-color-text-primary)]">

            {/*
              BANDEAU DE MARQUE — planche 02.1 (piste B retenue).
              Le tiers haut porte l'identité : le motif « cartouche » (les quatre marques de
              valeurs, monochromes et rognées par les bords), le filet jaune, le nom, une phrase.
              Le fond est admis ICI et nulle part ailleurs : la connexion est le seul écran
              d'avant-authentification — aucune donnée, aucun état qu'un motif pourrait contredire.
            */}
            <header className="relative overflow-hidden bg-[var(--color-login-hero-bg)] text-white px-5 pt-14 pb-9 medium:px-8 medium:pt-16 medium:pb-10">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 393 220"
                    preserveAspectRatio="xMidYMid slice"
                    className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-10"
                >
                    <g fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M-70 16H116V212" /><path d="M-70 46H86V212" /><path d="M-70 76H56V212" />
                        <path d="M388-62L458 8L388 78L318 8Z" /><path d="M388-32L428 8L388 48L348 8Z" />
                        <circle cx="22" cy="254" r="58" /><circle cx="22" cy="254" r="88" /><circle cx="22" cy="254" r="118" />
                        <path d="M300 226V118L408 226Z" /><path d="M352 226V174L404 226Z" />
                    </g>
                </svg>

                <div className="relative mx-auto w-full max-w-[440px]">
                    <span aria-hidden="true" className="block w-10 h-[3px] bg-primary mb-6" />
                    <h1 className="text-[28px] leading-[34px] font-medium mb-2.5">{APP_CONFIG.appName}</h1>
                    <p className="text-body-large text-[var(--color-login-hero-text-muted)] max-w-[290px]">
                        Pilotez vos actifs avec une expérience unifiée.
                    </p>
                </div>
            </header>

            {/* Le formulaire vit sur le canevas, en une colonne bornée — quelle que soit la
                largeur de l'écran (§2.43 : le contenu ne s'étire pas, il se centre). */}
            <main className="flex-1 flex px-5 py-7 medium:px-8 animate-in fade-in duration-500">
                <div className="mx-auto w-full max-w-[440px] flex flex-1 flex-col">

                    {authView === 'reset' && (
                        <div className="mb-6 space-y-1">
                            <h2 className="text-title-large text-[var(--tk-color-text-primary)]">
                                Réinitialiser le mot de passe
                            </h2>
                            <p className="text-body-medium text-[var(--tk-color-text-muted)]">
                                Saisissez votre e-mail pour recevoir un lien.
                            </p>
                        </div>
                    )}

                    {authView === 'login' ? (
                        <>
                            {isProductionOnlyMode && (
                                <section className="mb-6 rounded-sm bg-surface-container p-4 space-y-4">
                                    <p className="text-body-small text-[var(--tk-color-text-muted)]">
                                        <strong className="font-medium text-[var(--tk-color-text-primary)]">
                                            Environnement de production.
                                        </strong>{' '}
                                        La connexion par mot de passe de démonstration est désactivée : ouvrez votre
                                        session avec votre compte Microsoft.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={handleMicrosoftLogin}
                                        loading={isLoading && authMethod === 'microsoft'}
                                        loadingLabel="Ouverture de Microsoft SSO"
                                        variant="filled"
                                        className="w-full"
                                        icon={<MaterialIcon name="login" size={18} />}
                                    >
                                        Se connecter avec Microsoft
                                    </Button>
                                </section>
                            )}

                            <form noValidate onSubmit={handleLogin} className="space-y-5">
                                <InputField
                                    label="Adresse e-mail"
                                    type="email"
                                    placeholder="nom@neemba.com"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (emailError) {
                                            setEmailError(undefined);
                                        }
                                    }}
                                    icon={<MaterialIcon name="mail" size={20} />}
                                    autoComplete="username"
                                    error={emailError}
                                    disabled={isProductionOnlyMode}
                                    required
                                />

                                <div>
                                    <InputField
                                        label="Mot de passe"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (passwordError) {
                                                setPasswordError(undefined);
                                            }
                                        }}
                                        icon={<MaterialIcon name="lock" size={20} />}
                                        isPassword
                                        autoComplete="current-password"
                                        error={passwordError}
                                        disabled={isProductionOnlyMode}
                                        required
                                    />
                                    {/* Le renvoi est un lien, pas un bouton : il ne fait rien, il mène ailleurs. */}
                                    <Button
                                        type="button"
                                        variant="text"
                                        onClick={openForgotPassword}
                                        disabled={isLoading || isProductionOnlyMode}
                                        className="mt-1 px-0 underline underline-offset-4"
                                    >
                                        Mot de passe oublié
                                    </Button>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || isProductionOnlyMode}
                                    variant="filled"
                                    loading={isLoading && authMethod === 'email'}
                                    loadingLabel="Connexion en cours"
                                    className="w-full"
                                >
                                    Se connecter
                                </Button>
                            </form>

                            {DEMO_LOGIN_ENABLED && (
                                <div className="mt-auto pt-8">
                                    <div className="border-t border-[var(--tk-color-border-subtle)] pt-4">
                                        <p className="text-body-small text-[var(--tk-color-text-muted)] mb-3">
                                            Comptes de démonstration — développement uniquement
                                        </p>
                                        <div className="flex gap-3">
                                            {mockAllUsersExtended.slice(0, 4).map((user) => {
                                                // Initiales, pas une image : une vignette porte ce que la donnée
                                                // dit (§2.21). Les avatars générés ne disaient rien de la personne.
                                                const initiales = user.name
                                                    .split(' ')
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .map((mot) => mot[0])
                                                    .join('')
                                                    .toUpperCase();
                                                return (
                                                    <Tooltip key={user.id} content={`${user.name} · ${user.role}`}>
                                                        <Button
                                                            type="button"
                                                            variant="text"
                                                            onClick={() => fillDemoCredentials(user.email)}
                                                            aria-label={`Connexion démo : ${user.name}, rôle ${user.role}`}
                                                            className="touch-target p-0 min-w-10 min-h-10"
                                                        >
                                                            {/* Le bouton est la cible, la vignette est le dessin : la
                                                                surface du bouton est écrite après la nôtre par twMerge,
                                                                et un `!` pour la reprendre serait un `!` de trop. */}
                                                            <span className="w-10 h-10 rounded-vignette bg-surface-container text-[var(--tk-color-text-muted)] text-label-large font-semibold flex items-center justify-center">
                                                                {initiales}
                                                            </span>
                                                        </Button>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <form noValidate onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                            <InputField
                                label="Adresse e-mail"
                                type="email"
                                placeholder="nom@neemba.com"
                                value={forgotPasswordEmail}
                                onChange={(e) => {
                                    setForgotPasswordEmail(e.target.value);
                                    if (forgotPasswordError) {
                                        setForgotPasswordError(undefined);
                                    }
                                }}
                                icon={<MaterialIcon name="mail" size={20} />}
                                autoComplete="email"
                                error={forgotPasswordError}
                                required
                            />

                            <Button
                                type="submit"
                                variant="filled"
                                loading={isSubmittingForgotPassword}
                                loadingLabel="Envoi en cours"
                                className="w-full"
                            >
                                Envoyer le lien
                            </Button>
                            <Button
                                type="button"
                                variant="text"
                                onClick={backToLogin}
                                disabled={isSubmittingForgotPassword}
                                className="px-0 underline underline-offset-4"
                            >
                                Retour à la connexion
                            </Button>
                        </form>
                    )}

                    <p className="mt-5 text-body-small text-[var(--tk-color-text-muted)]">
                        © {LOGIN_FOOTER_YEAR} {APP_CONFIG.companyName} · Application interne
                    </p>
                </div>
            </main>
        </div>
    );
};

export default LoginPage;














