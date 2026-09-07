import React, { useMemo, useState } from 'react';
import { ArrowLeft, EnvelopeSimple, LockSimple, PaperPlaneTilt } from '@phosphor-icons/react';
import Icon from '../../../components/ui/Icon';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { mockAllUsersExtended } from '../../../data/mockData';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';
import { useData } from '../../../context/DataContext';
import { cn } from '../../../lib/utils';
import type { UserRole } from '../../../types';
import AuthShell, { AUTH_MEASURE } from '../components/AuthShell';
import BrandBanner from '../components/BrandBanner';
import OutcomePanel from '../components/OutcomePanel';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

/**
 * Les trois panneaux de la planche 02.1 (polie sous R15 le 04/09) : **une seule
 * page** — au repos, mot de passe oublié et lien envoyé remplacent le panneau sous le
 * même bandeau, sans écran séparé. Le bandeau ne bouge jamais.
 */
type AuthView = 'login' | 'forgot' | 'sent';

const DEMO_LOGIN_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

/**
 * Les comptes de démonstration sont nommés **par le rôle**, pas par le prénom : on
 * choisit par ce qu'on veut voir. Les quatre mots sont ceux de la planche.
 */
const DEMO_ROLE_LABEL: Partial<Record<UserRole, string>> = {
    SuperAdmin: 'Super admin',
    Admin: 'Admin',
    Manager: 'Manager',
    User: 'Utilisateur',
};

/**
 * **Le mot de passe de démonstration, nommé une fois.** Trois valeurs différentes en
 * circulaient — celle que le remplissage posait, celle du service d'authentification,
 * celle des scripts de recette — pour un mot de passe que la connexion de
 * démonstration **ne vérifie pas** : elle cherche l'adresse dans le store et ouvre la
 * session. Une valeur unique vaut mieux que trois qui se contredisent.
 */
const DEMO_PASSWORD = 'demo-password';

/*
  **Le navigateur ne remplit pas ces champs.** Le formulaire monte avec deux champs
  vides — l'état part de la chaîne vide, rien ne le pré-remplit — mais Chrome réinjecte
  l'identifiant qu'il a retenu d'une session précédente, avec son propre rendu, et c'est
  ce qui se lisait comme un contenu prérempli au mauvais corps. Les attributs de
  remplissage lui disent que ce formulaire ne se remplit pas tout seul : `off` sur les
  formulaires et sur les adresses, `new-password` sur le mot de passe, la seule valeur
  que Chrome respecte pour ne pas y verser un mot de passe enregistré.

  Les comptes de démonstration en pied restent le chemin prévu pour remplir d'un tap.

  **Les champs du login n'annoncent pas d'exemple.** Un texte gris posé dans un champ
  vide se lit comme une valeur déjà là, et il se compare fatalement à celle qu'on tape :
  même corps, mais une encre plus claire, donc l'œil rapporte une différence de taille
  qui n'existe pas. Les deux libellés disent ce qu'on attend, et un champ vide est vide.
  Retiré à la demande du commanditaire le 06/09.
*/

/*
  MÉTRIQUES DU CHAMP ET DU GESTE — planche 02.1.
  Le champ sur le canevas est **blanc et cerné** d'un filet de 1 px (le creux ne se
  verrait pas sur le canevas) : rayon 4, 48 de haut, glyphe de 18 à 12 px du bord et
  10 px d'air, donc un texte qui démarre à 40 ; 16 sur 24, la troisième marche de R15.
  Le geste : 48 de haut, rayon 4, 16 en 500 — c'est le `md` de la primitive, sans
  surcharge.
*/
const FIELD_CLASSES = '!rounded-[4px] !pl-10 !shadow-none';
const SUBMIT_CLASSES = 'w-full !rounded-[4px] !shadow-none';
/* `.lnk` — 14 sur 20 en 500, souligné à 3 px, encre pleine ; il se lit à sa hauteur
   de texte, pas à celle d'un bouton : `min-h-0` défait le gabarit de geste, la cible
   tactile reste à 48 par la couronne `touch-target` de la primitive. */
const LINK_CLASSES =
    'h-auto !min-h-0 min-w-0 p-0 text-[14px] leading-5 font-medium text-[var(--tk-color-text-primary)] underline underline-offset-[3px] hover:bg-transparent hover:text-[var(--tk-color-text-muted)]';

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState<string | undefined>(undefined);
    const [passwordError, setPasswordError] = useState<React.ReactNode>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    /* Le nombre d'échecs du couple adresse / mot de passe : au troisième, la sortie
       est nommée dans la même phrase (planche 02.1, colonne 2). */
    const [failedAttempts, setFailedAttempts] = useState(0);

    const [authView, setAuthView] = useState<AuthView>('login');
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [forgotPasswordError, setForgotPasswordError] = useState<string | undefined>(undefined);
    const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

    const { showToast } = useToast();
    const { loginAs } = useAuth();
    const { users, logEvent } = useData();
    const isProductionOnlyMode = !DEMO_LOGIN_ENABLED;

    /**
     * **Les raccourcis nomment des comptes qui existent.** Ils listaient les quatre
     * premiers du jeu local ; depuis que l'application lit Firestore, trois de ces
     * quatre personnes n'y sont plus — l'écran proposait donc d'ouvrir des sessions
     * fantômes, et deux d'entre elles n'auraient rien affiché.
     *
     * La liste se prend donc sur **la base chargée**, un compte par rôle pour couvrir
     * les quatre vues du produit, et retombe sur le jeu local tant que rien n'est
     * hydraté. Vide des deux côtés, le pied ne s'affiche pas : un raccourci sans
     * compte est un geste mort.
     */
    const demoShortcuts = useMemo(() => {
        const source = users.length > 0 ? users : mockAllUsersExtended;
        const ordre: UserRole[] = ['SuperAdmin', 'Admin', 'Manager', 'User'];
        const parRole = ordre
            .map((role) => source.find((u) => u.role === role && u.status !== 'pending'))
            .filter((u): u is (typeof source)[number] => Boolean(u));
        /* Une base qui ne porte qu'un ou deux rôles complète avec ce qu'elle a. */
        const complement = source
            .filter((u) => u.status !== 'pending' && !parRole.includes(u))
            .slice(0, 4 - parRole.length);
        return [...parRole, ...complement].slice(0, 4);
    }, [users]);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const findLoginCandidate = (candidateEmail: string) => {
        const normalizedEmail = candidateEmail.toLowerCase();
        return (
            users.find(
                (u) => u.email.toLowerCase() === normalizedEmail && u.status !== 'pending',
            ) ??
            mockAllUsersExtended.find(
                (u) => u.email.toLowerCase() === normalizedEmail && u.status !== 'pending',
            )
        );
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        if (isProductionOnlyMode) {
            /* 17.5, première réponse : rien n'a changé et personne n'agit — snackbar. */
            showToast('Connexion e-mail indisponible.', 'error');
            return;
        }

        const trimmedEmail = email.trim();
        let hasValidationError = false;

        /*
          17.5, troisième réponse à la question de tri : un champ précis est en cause,
          et il est corrigible sur place. Le message vit donc SOUS ce champ et nulle
          part ailleurs — 40 signes au plus, sans phrase complète, parce que le libellé
          du champ dit déjà de quoi on parle. Pas de résumé en tête de formulaire.
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
            /* Le store fait foi, pas le mock : une personne invitée puis arrivée (02.2)
               existe dans `users` et nulle part ailleurs. Un compte encore en attente
               n'a pas de mot de passe : il se lit comme un couple faux. */
            const user = findLoginCandidate(trimmedEmail);

            if (user) {
                loginAs(user);
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
                setFailedAttempts(0);
                setEmailError(undefined);
                setPasswordError(undefined);
                onLoginSuccess();
            } else {
                setIsLoading(false);
                /*
                  « Adresse ou mot de passe : l'un des deux est faux, l'écran ne dit
                  pas lequel. Le mot de passe se vide, l'adresse reste. » Planche 02.1,
                  colonne 2 — l'erreur au champ, sous le mot de passe, et le champ prend
                  le filet danger. Au troisième échec, la sortie est nommée dans la
                  même phrase : la personne sait quoi faire sans chercher.
                */
                const attempts = failedAttempts + 1;
                setFailedAttempts(attempts);
                setPassword('');
                setPasswordError(
                    attempts >= 3 ? (
                        <>
                            Adresse ou mot de passe incorrect. Troisième essai :{' '}
                            <b className="font-medium">Mot de passe oublié</b> vous renvoie un lien.
                        </>
                    ) : (
                        'Adresse ou mot de passe incorrect.'
                    ),
                );
            }
        }, 800);
    };

    const openForgotPassword = () => {
        setForgotPasswordEmail(email.trim());
        setForgotPasswordError(undefined);
        setAuthView('forgot');
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
            const accountExists =
                users.some((user) => user.email.toLowerCase() === trimmedEmail.toLowerCase()) ||
                mockAllUsersExtended.some(
                    (user) => user.email.toLowerCase() === trimmedEmail.toLowerCase(),
                );

            if (accountExists) {
                setEmail(trimmedEmail);
            }

            setIsSubmittingForgotPassword(false);
            /*
              Hors session, aucun message ne révèle si une adresse a un compte (02.2) :
              « la phrase de retour est la même que l'adresse ait un compte ou non ».
              Le retour n'est pas un snackbar : la vue a changé, c'est l'issue « Lien
              envoyé » qui remplace le panneau (02.1, panneau 4).
            */
            setAuthView('sent');
        }, 900);
    };

    const fillDemoCredentials = (userEmail: string) => {
        setEmail(userEmail);
        setPassword(DEMO_PASSWORD);
        setEmailError(undefined);
        setPasswordError(undefined);
    };

    /* Le pied de démonstration : un filet, « Comptes de démonstration » et l'étiquette
       `dev` — ils ne servent qu'en développement et le disent. Quatre vignettes de 40,
       le rôle en clair dessous (12 sur 16) ; celle dont l'adresse remplit le champ
       passe en sombre. */
    const demoAccounts = DEMO_LOGIN_ENABLED && demoShortcuts.length > 0 && (
        <div className="mt-auto pt-5">
            <div className="text-on-surface-variant mb-3 flex items-center justify-between border-t border-[var(--tk-color-border-default)] pt-4 text-[12px] leading-4">
                <span>Comptes de démonstration</span>
                <span className="bg-surface-container rounded-[2px] px-1.5 py-0.5 text-[10px] font-medium tracking-[0.04em] uppercase">
                    dev
                </span>
            </div>
            <div className="flex gap-2">
                {demoShortcuts.map((user) => {
                    const initiales = user.name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((mot) => mot[0])
                        .join('')
                        .toUpperCase();
                    const role = DEMO_ROLE_LABEL[user.role] ?? user.role;
                    const isOn = email.trim().toLowerCase() === user.email.toLowerCase();
                    return (
                        <Button
                            key={user.id}
                            type="button"
                            variant="text"
                            onClick={() => fillDemoCredentials(user.email)}
                            aria-label={`Connexion démo : ${user.name}, rôle ${role}`}
                            aria-pressed={isOn}
                            className="group text-on-surface-variant h-auto !min-h-16 min-w-0 flex-col items-center gap-1 rounded-[4px] px-2 py-1.5 text-center hover:bg-transparent"
                        >
                            {/* Vignette d'initiales — 40 × 40, rayon 6 (§2.2 ; arbitré le 04/09
                                contre le 4 des pages : le jeton de vignette ne bouge pas). */}
                            <span
                                className={cn(
                                    'font-brand rounded-vignette flex h-10 w-10 items-center justify-center text-[15px] font-semibold transition-colors',
                                    isOn
                                        ? 'bg-inverse-surface text-inverse-on-surface'
                                        : 'bg-surface-container text-on-surface-variant group-hover:bg-surface-container-high',
                                )}
                            >
                                {initiales}
                            </span>
                            <span
                                className={cn(
                                    'block w-full text-[12px] leading-4 transition-colors',
                                    isOn
                                        ? 'text-on-surface font-medium'
                                        : 'text-on-surface-variant group-hover:text-on-surface font-normal',
                                )}
                            >
                                {role}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <AuthShell>
            <BrandBanner />
            {/*
              PANNEAU — la colonne du formulaire, bornée à la mesure. Métriques de la
              planche : 28 px de haut, 20 sur les côtés et en pied, 18 entre les groupes.
            */}
            <main className={cn(AUTH_MEASURE, 'flex flex-1 flex-col px-5 pt-7 pb-5')}>
                {authView === 'login' && (
                    <>
                        {/*
                              Rythme de la planche, et il ne se joue pas au `space-y` :
                              chaque groupe porte 18 px, le lien en reprend 2 au-dessus
                              — 20 px sous le champ — et en pose 28 avant le geste.
                            */}
                        <form
                            noValidate
                            autoComplete="off"
                            onSubmit={handleLogin}
                            className="flex flex-col"
                        >
                            <div className="mb-[18px]">
                                <InputField
                                    id="login-email"
                                    label="Adresse e-mail"
                                    /*
                                          **Un champ à remplir dit ce qu'il attend.**
                                          Les exemples avaient été retirés avec le
                                          préremplissage, en septembre — mais ce sont
                                          deux choses différentes : une **valeur** entre
                                          dans le champ et part au serveur ; un **texte
                                          d'exemple** ne fait que montrer la forme
                                          attendue, et disparaît à la première frappe.
                                          Sans lui, deux cadres vides ne disent plus
                                          rien de ce qu'on doit y écrire.
                                        */
                                    placeholder="prenom.nom@neemba.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (emailError) setEmailError(undefined);
                                    }}
                                    icon={<Icon glyph={EnvelopeSimple} size={18} />}
                                    autoComplete="off"
                                    error={emailError}
                                    required
                                    hideRequiredIndicator
                                    variant="outlined"
                                    containerClassName="!space-y-0"
                                    leadingElementClassName="!left-3"
                                    className={FIELD_CLASSES}
                                />
                            </div>

                            <div className="mb-[18px]">
                                <InputField
                                    id="login-password"
                                    label="Mot de passe"
                                    type="password"
                                    /*
                                          Pas de pastilles en exemple. La planche dessine
                                          un champ **rempli**, et le reproduire en texte
                                          d'exemple pose de vraies puces `•` à 16 px, que
                                          le navigateur remplace au remplissage par sa
                                          propre pastille de masquage, plus grosse : le
                                          texte grandissait au tap d'un compte de
                                          démonstration. Le libellé dit déjà le champ.
                                        */
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) setPasswordError(undefined);
                                    }}
                                    /* En toutes lettres, jamais en pastilles : des
                                           puces d'exemple à 16 px sont remplacées au
                                           remplissage par celles du navigateur, plus
                                           grosses — le texte paraissait grandir au tap. */
                                    placeholder="Votre mot de passe"
                                    icon={<Icon glyph={LockSimple} size={18} />}
                                    isPassword
                                    autoComplete="new-password"
                                    error={passwordError}
                                    required
                                    hideRequiredIndicator
                                    showPasswordToggle={false}
                                    variant="outlined"
                                    containerClassName="!space-y-0"
                                    leadingElementClassName="!left-3"
                                    className={FIELD_CLASSES}
                                />
                            </div>

                            <Button
                                type="button"
                                variant="text"
                                onClick={openForgotPassword}
                                disabled={isLoading}
                                className={cn(LINK_CLASSES, 'mt-0.5 mb-7 self-start')}
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

                        {demoAccounts}
                    </>
                )}

                {authView === 'forgot' && (
                    <form
                        noValidate
                        autoComplete="off"
                        onSubmit={handleForgotPasswordSubmit}
                        className="flex flex-col"
                    >
                        {/* `.back` — le retour en tête, 14 sur 20 en 500, encre secondaire,
                                20 px avant le titre. */}
                        <Button
                            type="button"
                            variant="text"
                            onClick={backToLogin}
                            disabled={isSubmittingForgotPassword}
                            icon={<Icon glyph={ArrowLeft} size={18} />}
                            className="text-on-surface-variant hover:text-on-surface mb-5 h-auto !min-h-0 min-w-0 gap-1.5 self-start p-0 text-[14px] leading-5 font-medium hover:bg-transparent"
                        >
                            Retour à la connexion
                        </Button>
                        {/* `.pt` / `.ps` — titre de carte 17 sur 24 en Archivo 600, puis la
                                phrase de soutien 14 sur 20, 20 px avant le champ. */}
                        <h2 className="font-brand mb-1 text-[17px] leading-6 font-semibold tracking-[-0.01em]">
                            Mot de passe oublié
                        </h2>
                        <p className="text-on-surface-variant mb-5 text-[14px] leading-5">
                            Un lien par courriel, valable 30 minutes. La phrase de retour est la
                            même que l'adresse ait un compte ou non.
                        </p>

                        <div className="mb-[18px]">
                            <InputField
                                id="forgot-email"
                                label="Adresse e-mail"
                                placeholder="prenom.nom@neemba.com"
                                type="email"
                                value={forgotPasswordEmail}
                                onChange={(e) => {
                                    setForgotPasswordEmail(e.target.value);
                                    if (forgotPasswordError) setForgotPasswordError(undefined);
                                }}
                                icon={<Icon glyph={EnvelopeSimple} size={18} />}
                                autoComplete="off"
                                error={forgotPasswordError}
                                required
                                hideRequiredIndicator
                                autoFocus
                                variant="outlined"
                                containerClassName="!space-y-0"
                                leadingElementClassName="!left-3"
                                className={FIELD_CLASSES}
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="filled"
                            loading={isSubmittingForgotPassword}
                            loadingLabel="Envoi en cours"
                            className={SUBMIT_CLASSES}
                        >
                            Envoyer le lien
                        </Button>
                    </form>
                )}

                {authView === 'sent' && (
                    <OutcomePanel
                        icon={PaperPlaneTilt}
                        tone="bleu"
                        title="Lien envoyé"
                        message={
                            <>
                                Si <b>{forgotPasswordEmail.trim()}</b> a un compte, un courriel
                                vient de partir.
                            </>
                        }
                        detail="Le lien vaut 30 minutes. Votre code PIN ne change pas."
                        actions={
                            <>
                                <Button
                                    type="button"
                                    variant="outlined"
                                    onClick={backToLogin}
                                    className="!rounded-[4px] !shadow-none"
                                >
                                    Retour à la connexion
                                </Button>
                                <Button
                                    type="button"
                                    variant="text"
                                    onClick={() => setAuthView('forgot')}
                                    className={cn(LINK_CLASSES, 'self-center')}
                                >
                                    Je n'ai rien reçu
                                </Button>
                            </>
                        }
                    />
                )}
            </main>
        </AuthShell>
    );
};

export default LoginPage;
