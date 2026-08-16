import React, { useState } from 'react';
import { EnvelopeSimple, Lock, ArrowLeft } from '@phosphor-icons/react';
import Icon from '../../../components/ui/Icon';
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
    const [authMethod, setAuthMethod] = useState<'email' | null>(null);

    const [authView, setAuthView] = useState<AuthView>('login');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState<string | undefined>(undefined);
    const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

    const { showToast } = useToast();
    const { login } = useAuth();
    const { logEvent } = useData();
    const isProductionOnlyMode = !DEMO_LOGIN_ENABLED;
    const disabledDemoToastMessage =
        'La connexion e-mail et mot de passe n’est pas encore disponible dans cet environnement.';

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
            setEmailError('Le format de l’adresse e-mail est invalide.');
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
            const user = mockAllUsersExtended.find(
                (u) => u.email.toLowerCase() === trimmedEmail.toLowerCase(),
            );

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
                    isSensitive: false,
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
            setForgotPasswordError('Le format de l’adresse e-mail est invalide.');
            return;
        }

        setForgotPasswordError(undefined);
        setIsSubmittingForgotPassword(true);

        setTimeout(() => {
            const accountExists = mockAllUsersExtended.some(
                (user) => user.email.toLowerCase() === trimmedEmail.toLowerCase(),
            );

            if (accountExists) {
                setEmail(trimmedEmail);
            }

            setIsSubmittingForgotPassword(false);
            setAuthView('login');
            showToast(
                'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.',
                'success',
            );
        }, 900);
    };

    const fillDemoCredentials = (userEmail: string) => {
        setEmail(userEmail);
        setPassword('password123');
        setEmailError(undefined);
        setPasswordError(undefined);
        showToast('Identifiants de démonstration remplis', 'info');
    };

    return (
        <div className="medium:flex medium:items-center medium:justify-center medium:p-6 min-h-dvh w-full bg-[var(--tk-color-login-desktop-canvas)] text-[var(--tk-color-text-primary)]">
            <div className="medium:min-h-[760px] medium:w-[393px] medium:rounded-[8px] medium:shadow-[0_1px_3px_rgb(0_0_0_/_0.14)] flex min-h-dvh w-full flex-col overflow-hidden bg-[var(--tk-color-app-bg)]">
                {/*
              BANDEAU DE MARQUE — rôle nommé au registre §2.22 :
              Plein cadre, avant authentification. Fond bleu-noir LIVE inverse-surface,
              motif cartouche LIVE en filigrane (10%), filet jaune 40x3px, titre 28px,
              promesse en blanc cassé 15px.
            */}
                <header className="relative w-full overflow-hidden bg-[var(--tk-color-inverse-surface)] px-5 pt-14 pb-9 text-white">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 393 220"
                        preserveAspectRatio="xMidYMid slice"
                        className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-10"
                    >
                        <g fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M-70 16H116V212" />
                            <path d="M-70 46H86V212" />
                            <path d="M-70 76H56V212" />
                            <path d="M388-62L458 8L388 78L318 8Z" />
                            <path d="M388-32L428 8L388 48L348 8Z" />
                            <circle cx="22" cy="254" r="58" />
                            <circle cx="22" cy="254" r="88" />
                            <circle cx="22" cy="254" r="118" />
                            <path d="M300 226V118L408 226Z" />
                            <path d="M352 226V174L404 226Z" />
                        </g>
                    </svg>

                    <div className="relative mx-auto w-full max-w-[440px]">
                        <span aria-hidden="true" className="bg-primary mb-6 block h-[3px] w-10" />
                        <h1 className="mb-2.5 font-sans text-[28px] leading-[34px] font-medium">
                            {APP_CONFIG.appName}
                        </h1>
                        <p className="max-w-[290px] text-[15px] leading-[21px] text-[var(--color-login-hero-text-muted)]">
                            Pilotez vos actifs avec une expérience unifiée.
                        </p>
                    </div>
                </header>

                {/*
              PANEL FORMULAIRE — sur le canevas papier chaud, dans la coque 393 px,
              avec labels majuscules sobres (11px),
              champs blancs (48px) et lien sobre souligné.
            */}
                <main className="animate-in fade-in flex w-full flex-1 flex-col px-5 py-7 duration-300">
                    <div className="flex w-full flex-1 flex-col">
                        {authView === 'login' ? (
                            <>
                                <form noValidate onSubmit={handleLogin} className="space-y-[18px]">
                                    <InputField
                                        id="login-email"
                                        label="Adresse e-mail"
                                        type="email"
                                        placeholder="nom@neemba.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) setEmailError(undefined);
                                        }}
                                        icon={<Icon glyph={EnvelopeSimple} size={18} />}
                                        autoComplete="username"
                                        error={emailError}
                                        required
                                        hideRequiredIndicator
                                        containerClassName="!space-y-0"
                                        labelClassName="!mb-[5px] uppercase !tracking-[0.06em]"
                                        leadingElementClassName="!left-3"
                                        className="!rounded-[4px] !pl-[37px] !font-normal"
                                    />

                                    <div>
                                        <InputField
                                            id="login-password"
                                            label="Mot de passe"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (passwordError) setPasswordError(undefined);
                                            }}
                                            icon={<Icon glyph={Lock} size={18} />}
                                            isPassword
                                            autoComplete="current-password"
                                            error={passwordError}
                                            required
                                            hideRequiredIndicator
                                            showPasswordToggle={false}
                                            containerClassName="!space-y-0"
                                            labelClassName="!mb-[5px] uppercase !tracking-[0.06em]"
                                            leadingElementClassName="!left-3"
                                            className="!rounded-[4px] !pl-[37px] !font-normal"
                                        />
                                        <div className="mt-2 mb-7">
                                            <Button
                                                type="button"
                                                variant="text"
                                                onClick={openForgotPassword}
                                                disabled={isLoading}
                                                className="h-auto p-0 text-[14px] font-medium text-[var(--tk-color-text-primary)] underline underline-offset-[3px] hover:bg-transparent hover:text-[var(--tk-color-text-secondary)]"
                                            >
                                                Mot de passe oublié
                                            </Button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        variant="filled"
                                        loading={isLoading && authMethod === 'email'}
                                        loadingLabel="Connexion en cours"
                                        className="h-12 w-full !rounded-[4px] text-[14px] font-medium !shadow-none"
                                    >
                                        Se connecter
                                    </Button>
                                </form>

                                {/* Section Démo en pied */}
                                {DEMO_LOGIN_ENABLED && (
                                    <div className="mt-auto pt-6">
                                        <div className="border-t border-[var(--tk-color-border-default)] pt-4">
                                            <p className="mb-3 text-[12px] text-[var(--tk-color-text-secondary)]">
                                                Comptes de démonstration — développement uniquement
                                            </p>
                                            <div className="flex gap-3">
                                                {mockAllUsersExtended.slice(0, 4).map((user) => {
                                                    const initiales = user.name
                                                        .split(' ')
                                                        .filter(Boolean)
                                                        .slice(0, 2)
                                                        .map((mot) => mot[0])
                                                        .join('')
                                                        .toUpperCase();
                                                    return (
                                                        <Tooltip
                                                            key={user.id}
                                                            content={`${user.name} · ${user.role}`}
                                                        >
                                                            <Button
                                                                type="button"
                                                                variant="text"
                                                                onClick={() =>
                                                                    fillDemoCredentials(user.email)
                                                                }
                                                                aria-label={`Connexion démo : ${user.name}, rôle ${user.role}`}
                                                                className="min-h-10 min-w-10 p-0 hover:bg-transparent"
                                                            >
                                                                <span className="font-brand flex h-10 w-10 items-center justify-center rounded-md bg-[var(--tk-color-surface-muted)] text-[15px] font-semibold text-[var(--tk-color-text-secondary)] transition-colors hover:bg-[var(--tk-color-surface-default)] hover:text-[var(--tk-color-text-primary)]">
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
                            <form
                                noValidate
                                onSubmit={handleForgotPasswordSubmit}
                                className="space-y-[18px]"
                            >
                                <div className="mb-2">
                                    <h2 className="text-title-large font-medium text-[var(--tk-color-text-primary)]">
                                        Réinitialiser le mot de passe
                                    </h2>
                                    <p className="text-body-medium mt-1 text-[var(--tk-color-text-muted)]">
                                        Saisissez votre e-mail pour recevoir un lien de
                                        réinitialisation.
                                    </p>
                                </div>

                                <InputField
                                    id="forgot-email"
                                    label="Adresse e-mail"
                                    type="email"
                                    placeholder="nom@neemba.com"
                                    value={forgotPasswordEmail}
                                    onChange={(e) => {
                                        setForgotPasswordEmail(e.target.value);
                                        if (forgotPasswordError) setForgotPasswordError(undefined);
                                    }}
                                    icon={<Icon glyph={EnvelopeSimple} size={18} />}
                                    autoComplete="email"
                                    error={forgotPasswordError}
                                    required
                                    hideRequiredIndicator
                                    containerClassName="!space-y-0"
                                    labelClassName="!mb-[5px] uppercase !tracking-[0.06em]"
                                    leadingElementClassName="!left-3"
                                    className="!rounded-[4px] !pl-[37px] !font-normal"
                                />

                                <Button
                                    type="submit"
                                    variant="filled"
                                    loading={isSubmittingForgotPassword}
                                    loadingLabel="Envoi en cours"
                                    className="h-12 w-full !rounded-[4px] text-[14px] font-medium !shadow-none"
                                >
                                    Envoyer le lien
                                </Button>

                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="text"
                                        onClick={backToLogin}
                                        disabled={isSubmittingForgotPassword}
                                        className="px-0 text-[14px] font-medium underline underline-offset-[3px]"
                                        icon={<Icon glyph={ArrowLeft} size={16} />}
                                    >
                                        Retour à la connexion
                                    </Button>
                                </div>
                            </form>
                        )}

                        <p className="mt-4 text-[12px] text-[var(--tk-color-text-secondary)]">
                            © {LOGIN_FOOTER_YEAR} {APP_CONFIG.companyName} · Application interne
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LoginPage;
