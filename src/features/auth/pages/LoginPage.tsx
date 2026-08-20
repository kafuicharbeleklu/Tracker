import React, { useState } from 'react';
import { EnvelopeSimple, LockSimple, ArrowLeft } from '@phosphor-icons/react';
import Icon from '../../../components/ui/Icon';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { mockAllUsersExtended } from '../../../data/mockData';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';
import { useData } from '../../../context/DataContext';
import { getStatusLabel } from '../../../lib/businessRules';
import { APP_CONFIG } from '../../../config';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

type AuthView = 'login' | 'forgot-password';

const DEMO_LOGIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
const LOGIN_FOOTER_YEAR = new Date().getFullYear();

/*
  MÉTRIQUES DU CHAMP ET DU GESTE — planche 02.1.
  Le champ : bord `--line-strong`, rayon 4 (R11, cran de la commande), glyphe de 18 à
  12 px du bord et 10 px d'air, donc un texte qui démarre à 40. Le geste : 48 de haut,
  rayon 4, 15 px / 500 — la valeur des planches à jour (02.1, 02.2, 17.5).
*/
const FIELD_CLASSES = '!rounded-[4px] !pl-10 !text-[15px] !leading-5 !font-normal';
const FIELD_LABEL_CLASSES = '!mb-[5px] uppercase !tracking-[0.06em]';
const SUBMIT_CLASSES = 'h-12 w-full !rounded-[4px] text-[15px] font-medium !shadow-none';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>(undefined);
    const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);

    const [authView, setAuthView] = useState<AuthView>('login');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState<string | undefined>(undefined);
    const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

    const { showToast } = useToast();
    const { login } = useAuth();
    const { logEvent } = useData();
    const isProductionOnlyMode = !DEMO_LOGIN_ENABLED;
    const disabledDemoToastMessage = 'Connexion e-mail indisponible.';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (isProductionOnlyMode) {
            showToast(disabledDemoToastMessage, 'error');
            return;
        }

        const trimmedEmail = email.trim();
        let hasValidationError = false;

        /*
          17.5, deuxième réponse à la question de tri : un champ précis est en cause,
          et il est corrigible sur place. Le message vit donc SOUS ce champ et nulle
          part ailleurs — 40 signes au plus, sans phrase complète, parce que le libellé
          du champ dit déjà de quoi on parle. Pas de résumé en tête de formulaire : il
          obligerait à chercher les champs que chacun d'eux désigne déjà.
        */
        if (!trimmedEmail) {
            setEmailError('Adresse requise.');
            hasValidationError = true;
        } else if (!emailPattern.test(trimmedEmail)) {
            setEmailError('Format d’adresse invalide.');
            hasValidationError = true;
        } else {
            setEmailError(undefined);
        }

        if (!password) {
            setPasswordError('Mot de passe requis.');
            hasValidationError = true;
        } else {
            setPasswordError(undefined);
        }

        if (hasValidationError) {
            return;
        }

        setIsLoading(true);

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
                /*
                  17.5, première réponse : PERSONNE ne doit agir. Aucun des deux champs
                  n'est fautif en propre — c'est le couple que le serveur refuse — et la
                  vue n'a pas changé. Le retour passe donc en snackbar, et le formulaire
                  reste exactement où il était, bouton compris : une erreur ne prend
                  jamais la place du geste qui l'a produite. Sans action : « Réessayer »
                  n'aurait rien à reprendre, le geste est encore là.
                */
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
            setForgotPasswordError('Adresse requise.');
            return;
        }

        if (!emailPattern.test(trimmedEmail)) {
            setForgotPasswordError('Format d’adresse invalide.');
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
            /*
              Hors session, aucun message ne révèle si une adresse a un compte (02.2) :
              un écran qui répond à cette question la répond aussi à un inconnu. La
              tournure conditionnelle est donc portante, pas décorative — et elle tient
              en 41 signes, sous la limite des 60 de 17.5.
            */
            showToast('Si le compte existe, le lien est envoyé.', 'success');
        }, 900);
    };

    const fillDemoCredentials = (userEmail: string) => {
        setEmail(userEmail);
        setPassword('password123');
        setEmailError(undefined);
        setPasswordError(undefined);
        showToast('Identifiants de démo remplis.', 'info');
    };

    return (
        <div className="medium:flex medium:items-center medium:justify-center medium:p-6 min-h-dvh w-full bg-[var(--tk-color-login-desktop-canvas)] text-[var(--tk-color-text-primary)]">
            <div className="medium:min-h-[760px] medium:w-[393px] medium:rounded-[8px] medium:shadow-[0_1px_3px_rgb(0_0_0_/_0.14)] flex min-h-dvh w-full flex-col overflow-hidden bg-[var(--tk-color-app-bg)]">
                {/*
              BANDEAU DE MARQUE — rôle nommé au registre §2.22 :
              Plein cadre, avant authentification. Fond bleu-noir LIVE inverse-surface,
              motif cartouche LIVE en filigrane (20 %), filet jaune 40x3px, titre 28px,
              promesse en blanc cassé 15px.
            */}
                <header className="relative w-full overflow-hidden bg-[var(--tk-color-inverse-surface)] px-5 pt-14 pb-9 text-white">
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 393 220"
                        preserveAspectRatio="xMidYMid slice"
                        className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-20"
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
              PANEL FORMULAIRE — sur le canevas papier chaud, dans la coque 393 px.
              Métriques de la planche : 28 px de haut, 20 px sur les côtés et en pied.
            */}
                <main className="animate-in fade-in flex w-full flex-1 flex-col px-5 pt-7 pb-5 duration-300">
                    <div className="flex w-full flex-1 flex-col">
                        {authView === 'login' ? (
                            <>
                                {/*
                                  Rythme de la planche, et il ne se joue pas au `space-y` :
                                  chaque groupe porte 18 px, le lien en reprend 2 au-dessus
                                  — 20 px sous le champ — et en pose 28 avant le geste.
                                */}
                                <form noValidate onSubmit={handleLogin} className="flex flex-col">
                                    <div className="mb-[18px]">
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
                                            labelClassName={FIELD_LABEL_CLASSES}
                                            leadingElementClassName="!left-3"
                                            className={FIELD_CLASSES}
                                        />
                                    </div>

                                    <div className="mb-[18px]">
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
                                            icon={<Icon glyph={LockSimple} size={18} />}
                                            isPassword
                                            autoComplete="current-password"
                                            error={passwordError}
                                            required
                                            hideRequiredIndicator
                                            showPasswordToggle={false}
                                            containerClassName="!space-y-0"
                                            labelClassName={FIELD_LABEL_CLASSES}
                                            leadingElementClassName="!left-3"
                                            className={FIELD_CLASSES}
                                        />
                                    </div>

                                    {/*
                                      Le lien se lit à sa hauteur de texte, pas à celle d'un
                                      bouton : `min-h-0` défait le gabarit de geste. La cible
                                      tactile reste à 48 px — `touch-target` de la primitive la
                                      porte en couronne transparente, sans grossir la boîte.
                                    */}
                                    <Button
                                        type="button"
                                        variant="text"
                                        onClick={openForgotPassword}
                                        disabled={isLoading}
                                        className="mt-0.5 mb-7 h-auto !min-h-0 self-start p-0 text-[14px] font-medium text-[var(--tk-color-text-primary)] underline underline-offset-[3px] hover:bg-transparent hover:text-[var(--tk-color-text-secondary)]"
                                    >
                                        Mot de passe oublié
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        variant="filled"
                                        loading={isLoading}
                                        loadingLabel="Connexion en cours"
                                        className={SUBMIT_CLASSES}
                                    >
                                        Se connecter
                                    </Button>
                                </form>

                                {/* Section Démo en pied */}
                                {DEMO_LOGIN_ENABLED && (
                                    <div className="mt-auto pt-5">
                                        <div className="border-t border-[var(--tk-color-border-default)] pt-4">
                                            <p className="mb-3 text-[12px] text-[var(--tk-color-text-muted)]">
                                                Comptes de démonstration — développement uniquement
                                            </p>
                                            {/*
                                              LE PORTEUR D'IDENTITÉ N'EST PLUS MUET.
                                              La planche 02.1 nommait ces quatre puces par une
                                              infobulle. Une infobulle est un affordance de
                                              SURVOL : sur un téléphone il n'y a pas de survol,
                                              et la révéler demandait un appui long de 600 ms sur
                                              une cible de 40 px — que personne ne tente. Pire, un
                                              appui un peu lent déclenchait les deux calques à la
                                              fois : la bulle au-dessus de la puce, et le retour
                                              transitoire du remplissage, au même endroit.
                                              Le libellé passe donc EN CLAIR sous la vignette,
                                              comme dans tout sélecteur de profil moderne. Il porte
                                              le RÔLE et non le nom : sur un compte de démonstration
                                              on choisit par ce qu'on veut voir — un admin, un
                                              manager, un utilisateur — jamais par le prénom.
                                            */}
                                            <div className="flex gap-3">
                                                {mockAllUsersExtended.slice(0, 4).map((user) => {
                                                    const initiales = user.name
                                                        .split(' ')
                                                        .filter(Boolean)
                                                        .slice(0, 2)
                                                        .map((mot) => mot[0])
                                                        .join('')
                                                        .toUpperCase();
                                                    const role = getStatusLabel(user.role);
                                                    return (
                                                        <Button
                                                            key={user.id}
                                                            type="button"
                                                            variant="text"
                                                            onClick={() =>
                                                                fillDemoCredentials(user.email)
                                                            }
                                                            aria-label={`Connexion démo : ${user.name}, rôle ${role}`}
                                                            className="group h-auto !min-h-0 min-w-0 flex-1 flex-col items-center gap-1.5 p-0 text-center hover:bg-transparent"
                                                        >
                                                            {/*
                                                              Vignette d'initiales — 40 × 40,
                                                              rayon 6 (§2.2, et le cran « bloc
                                                              groupé en creux » de R11).
                                                            */}
                                                            <span className="font-brand rounded-vignette flex h-10 w-10 items-center justify-center bg-[var(--tk-color-surface-muted)] text-[15px] font-semibold text-[var(--tk-color-text-muted)] transition-colors group-hover:bg-[var(--tk-color-surface-muted-strong)] group-hover:text-[var(--tk-color-text-primary)] group-focus-visible:bg-[var(--tk-color-surface-muted-strong)] group-focus-visible:text-[var(--tk-color-text-primary)]">
                                                                {initiales}
                                                            </span>
                                                            <span className="block w-full truncate text-[11px] leading-[15px] font-normal text-[var(--tk-color-text-muted)] transition-colors group-hover:text-[var(--tk-color-text-primary)]">
                                                                {role}
                                                            </span>
                                                        </Button>
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
                                    labelClassName={FIELD_LABEL_CLASSES}
                                    leadingElementClassName="!left-3"
                                    className={FIELD_CLASSES}
                                />

                                <Button
                                    type="submit"
                                    variant="filled"
                                    loading={isSubmittingForgotPassword}
                                    loadingLabel="Envoi en cours"
                                    className={SUBMIT_CLASSES}
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
                                        icon={<Icon glyph={ArrowLeft} size={18} />}
                                    >
                                        Retour à la connexion
                                    </Button>
                                </div>
                            </form>
                        )}

                        <p className="mt-[18px] text-[12px] text-[var(--tk-color-text-muted)]">
                            © {LOGIN_FOOTER_YEAR} {APP_CONFIG.companyName} · Application interne
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default LoginPage;
