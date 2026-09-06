import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    ClockCountdown,
    Key,
    LockSimple,
    Package,
    PaperPlaneTilt,
    UserCircleMinus,
} from '@phosphor-icons/react';

import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import PinField, { type PinFieldState } from '../../../components/ui/PinField';
import BottomSheet from '../../../components/ui/BottomSheet';
import { useAuth } from '../../../context/AuthContext';
import { useData, INVITATION_VALIDITY_DAYS } from '../../../context/DataContext';
import { useRouter } from '../../../hooks/useRouter';
import { APP_CONFIG } from '../../../config';
import { measurePasswordStrength, PASSWORD_MIN_LENGTH } from '../../../lib/passwordStrength';
import { isValidPinFormat, PIN_LENGTH } from '../../../lib/security';
import { getStatusLabel } from '../../../lib/businessRules';
import { cn } from '../../../lib/utils';
import type { User } from '../../../types';
import AuthShell, { AUTH_MEASURE } from '../components/AuthShell';
import BrandBanner from '../components/BrandBanner';
import OutcomePanel from '../components/OutcomePanel';

/**
 * **La première connexion** — planche 02.2, lot 15.
 *
 * *« Une arrivée demande deux secrets, et l'écran dit lequel sert à quoi avant de les
 * demander. »* Le mot de passe ouvre l'application ; le code PIN vaut signature. Ils se
 * demandent l'un après l'autre, sur deux écrans, chacun avec sa phrase — jamais dans un
 * même formulaire d'inscription.
 *
 * Trois écrans (l'invitation, le mot de passe, le code) et les quatre cas qui cassent
 * une arrivée. Aucun message ne révèle si une adresse existe : c'est ce qui distingue
 * un écran hors session d'un écran d'application.
 *
 * Sans jeton (`token` absent), c'est le compte hérité qui doit définir son mot de passe
 * sans lien : il arrive à l'écran 2 directement.
 */

type Screen = 'invitation' | 'password' | 'pin';
type Issue = 'expired' | 'used' | 'unavailable' | 'unknown';

const FIELD_CLASSES = '!rounded-[4px] !pl-10 !shadow-none';
const ACTION_CLASSES = 'w-full !rounded-[4px] !shadow-none';
const TITLE_CLASSES = 'font-brand mb-2 text-[22px] leading-7 font-semibold tracking-[-0.01em]';

/** `.tbar` de 02.2 : 56 tout compris, retour de 48, « Étape n sur 2 » en 17 sur 24. */
const StepBar: React.FC<{ title: string; onBack?: () => void }> = ({ title, onBack }) => (
    <div className="border-outline-variant bg-surface flex min-h-14 items-center gap-1 border-b px-2 py-1">
        {onBack ? (
            <Button variant="text" iconOnly aria-label="Retour" onClick={onBack} className="shrink-0">
                <Icon glyph={ArrowLeft} />
            </Button>
        ) : (
            <span className="h-12 w-12 shrink-0" aria-hidden="true" />
        )}
        <p className="font-brand min-w-0 flex-1 truncate px-1 text-[17px] leading-6 font-semibold tracking-[-0.01em]">
            {title}
        </p>
    </div>
);

/** `.fact` — une étiquette de 64, la valeur, et sa précision en 12 sur 16. */
const FactRow: React.FC<{ label: string; value: string; detail?: string }> = ({
    label,
    value,
    detail,
}) => (
    <div className="border-outline-variant flex gap-4 border-b py-3 text-[14px] leading-5">
        <span className="text-text-tertiary w-16 shrink-0">{label}</span>
        <span className="min-w-0 flex-1">
            {value}
            {detail && (
                <span className="text-text-tertiary block text-[12px] leading-4">{detail}</span>
            )}
        </span>
    </div>
);

/** `.meter` — quatre segments de 4, rayon 2, 6 d'air ; le vert de statut quand il se remplit. */
const Meter: React.FC<{ filled: number }> = ({ filled }) => (
    <div className="mt-3 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
            <span
                key={i}
                className={cn(
                    'h-1 flex-1 rounded-[2px]',
                    i < filled ? 'bg-[var(--tk-color-st-vert)]' : 'bg-outline-variant',
                )}
            />
        ))}
    </div>
);

const initialsOf = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

const FirstLoginPage: React.FC<{ token?: string }> = ({ token }) => {
    const {
        users,
        equipment,
        resolveInvitation,
        acceptInvitation,
        requestNewInvitation,
        setUserPin,
    } = useData();
    const { currentUser, loginAs, completeFirstLogin } = useAuth();
    const { navigate } = useRouter();

    const inheritedMode = token === undefined;
    const resolution = useMemo(
        () => (token !== undefined ? resolveInvitation(token) : null),
        [token, resolveInvitation],
    );

    const [accepted, setAccepted] = useState<User | null>(null);
    const [screen, setScreen] = useState<Screen>(inheritedMode ? 'password' : 'invitation');
    const [forcedIssue, setForcedIssue] = useState<Issue | null>(null);
    const [requested, setRequested] = useState(false);
    const [notMeOpen, setNotMeOpen] = useState(false);

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [passwordError, setPasswordError] = useState<string | undefined>();
    const [confirmError, setConfirmError] = useState<string | undefined>();

    const [pinStep, setPinStep] = useState<'entry' | 'confirm'>('entry');
    const [pin, setPin] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [pinIssue, setPinIssue] = useState<string | null>(null);
    const [pinSaving, setPinSaving] = useState(false);

    /* La personne : le compte invité tant qu'il n'est pas ouvert, puis le compte ouvert,
       ou la session courante pour le compte hérité. */
    const person: User | null =
        accepted ??
        (resolution?.state === 'valid' ? resolution.user : null) ??
        (inheritedMode ? currentUser : null);

    const issue: Issue | null =
        forcedIssue ??
        (!accepted && resolution && resolution.state !== 'valid' ? resolution.state : null);

    /* Lien déjà employé : « arriver sur un formulaire de connexion est la réponse ». */
    useEffect(() => {
        if (issue === 'used') navigate('/');
    }, [issue, navigate]);

    const inviter = useMemo(
        () => (person?.invitedBy ? users.find((u) => u.name === person.invitedBy) : undefined),
        [users, person?.invitedBy],
    );
    const inviterName = person?.invitedBy ?? inviter?.name ?? "l'informatique";

    /* Ce qui attend la personne : les objets qu'on lui a remis et qu'elle confirmera à
       la réception — pas avant. */
    const pending = useMemo(
        () =>
            person
                ? equipment.filter(
                      (e) =>
                          e.assignmentStatus === 'PENDING_DELIVERY' &&
                          (e.user?.id === person.id ||
                              (!!e.user?.email &&
                                  e.user.email.toLowerCase() === person.email.toLowerCase())),
                  )
                : [],
        [equipment, person],
    );
    const strength = measurePasswordStrength(password, person ? [person.email, person.name] : []);
    const confirmMatches = confirm.length > 0 && confirm === password;

    const continueFromPassword = (e: React.FormEvent) => {
        e.preventDefault();
        let blocked = false;
        if (password.length < PASSWORD_MIN_LENGTH) {
            setPasswordError(`${PASSWORD_MIN_LENGTH} caractères minimum.`);
            blocked = true;
        }
        if (!blocked && confirm !== password) {
            setConfirmError('Les deux saisies diffèrent.');
            blocked = true;
        }
        if (blocked) return;

        if (inheritedMode) {
            completeFirstLogin();
            setScreen('pin');
            return;
        }
        if (!accepted && token !== undefined) {
            const result = acceptInvitation(token);
            if (!result.decision.allowed || !result.user) {
                setForcedIssue('expired');
                return;
            }
            setAccepted(result.user);
            loginAs(result.user);
        }
        setScreen('pin');
    };

    const pinState: PinFieldState = pinIssue
        ? 'error'
        : pinStep === 'confirm' && pinConfirm.length === PIN_LENGTH && pinConfirm === pin
          ? 'ok'
          : 'idle';
    const pinMatched = pinStep === 'confirm' && pinConfirm === pin && pin.length === PIN_LENGTH;

    const handlePinComplete = (value: string) => {
        if (pinStep === 'entry') {
            if (!isValidPinFormat(value)) {
                setPinIssue('Ni une suite, ni un chiffre répété.');
                return;
            }
            setPinStep('confirm');
            setPinIssue(null);
            return;
        }
        if (value !== pin) setPinIssue('Les deux codes diffèrent. Recommencez.');
    };

    const restartPin = () => {
        setPin('');
        setPinConfirm('');
        setPinStep('entry');
        setPinIssue(null);
    };

    const savePin = () => {
        if (!person || !pinMatched) return;
        setPinSaving(true);
        const decision = setUserPin(person.id, pin);
        setPinSaving(false);
        if (!decision.allowed) {
            setPinIssue(decision.reason ?? 'Le code n’a pas été enregistré.');
            return;
        }
        navigate('/dashboard');
    };

    /* ---------- les quatre cas ---------- */

    if (issue === 'used') return null;

    if (issue === 'unavailable') {
        return (
            <AuthShell>
                <BrandBanner short />
                <main className={cn(AUTH_MEASURE, 'flex flex-1 flex-col px-5 pt-7 pb-5')}>
                    <OutcomePanel
                        icon={UserCircleMinus}
                        tone="ambre"
                        title="Ce compte n'est pas disponible"
                        message="Contactez votre informatique."
                        actions={
                            <Button
                                variant="outlined"
                                className={ACTION_CLASSES}
                                onClick={() => navigate('/')}
                            >
                                Retour à la connexion
                            </Button>
                        }
                    />
                </main>
            </AuthShell>
        );
    }

    if (issue === 'expired' || issue === 'unknown') {
        return (
            <AuthShell>
                <BrandBanner short />
                <main className={cn(AUTH_MEASURE, 'flex flex-1 flex-col px-5 pt-7 pb-5')}>
                    {requested ? (
                        <OutcomePanel
                            icon={PaperPlaneTilt}
                            tone="bleu"
                            title="Lien demandé"
                            message="Si cette adresse a un compte, un nouveau lien vient de partir."
                            detail="Votre informatique en sera informée."
                            actions={
                                <Button
                                    variant="outlined"
                                    className={ACTION_CLASSES}
                                    onClick={() => navigate('/')}
                                >
                                    Retour à la connexion
                                </Button>
                            }
                        />
                    ) : (
                        <OutcomePanel
                            icon={ClockCountdown}
                            tone="ambre"
                            title="Ce lien a expiré"
                            message={
                                <>
                                    Les invitations sont valables <b>{INVITATION_VALIDITY_DAYS} jours</b>.
                                    Demandez-en une nouvelle : elle partira à la même adresse.
                                </>
                            }
                            detail="Votre informatique en sera informée."
                            actions={
                                <Button
                                    variant="filled"
                                    className={ACTION_CLASSES}
                                    onClick={() => {
                                        if (token !== undefined) requestNewInvitation(token);
                                        setRequested(true);
                                    }}
                                >
                                    Demander un nouveau lien
                                </Button>
                            }
                        />
                    )}
                </main>
            </AuthShell>
        );
    }

    if (!person) return null;

    /* ---------- écran 1 : l'invitation, hors session ---------- */

    if (screen === 'invitation') {
        const firstName = person.name.split(' ')[0] || person.name;
        return (
            <AuthShell>
                <BrandBanner />
                <main className={cn(AUTH_MEASURE, 'flex flex-1 flex-col px-5 pt-7 pb-5')}>
                    <p className={TITLE_CLASSES}>Bonjour {firstName}</p>
                    <p className="text-on-surface-variant mb-6 text-[14px] leading-5 text-pretty">
                        <b className="text-on-surface font-medium">{inviterName}</b>, de
                        l'informatique de {APP_CONFIG.companyName}, vous a ouvert un compte.
                    </p>

                    {/* `.me` — l'identité à l'arrivée : une carte, deux faits à gauche. */}
                    <section className="mb-7">
                        <div className="bg-surface flex items-center gap-3.5 rounded-[4px] p-4">
                            <span className="font-brand bg-inverse-surface text-inverse-on-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] text-[17px] font-semibold">
                                {initialsOf(person.name)}
                            </span>
                            <span className="min-w-0">
                                <span className="block truncate text-[17px] leading-6 font-medium">
                                    {person.name}
                                </span>
                                <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                    {person.email}
                                </span>
                            </span>
                        </div>
                        <FactRow
                            label="Rôle"
                            value={getStatusLabel(person.role)}
                            detail={[person.department, person.site].filter(Boolean).join(' · ')}
                        />
                        <FactRow
                            label="Adresse"
                            value="Fixée par l'informatique"
                            detail="elle sert d'identifiant"
                        />
                    </section>

                    {pending.length > 0 && (
                        <section className="mb-7">
                            <div className="bg-surface flex items-center gap-3.5 rounded-[4px] px-4 py-3.5">
                                <span className="bg-tint-bleu text-on-tint-bleu flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                    <Icon glyph={Package} size={20} />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[16px] leading-6 font-medium">
                                        {pending.length === 1
                                            ? '1 équipement vous attend'
                                            : `${pending.length} équipements vous attendent`}
                                    </span>
                                    <span className="text-on-surface-variant block text-[14px] leading-5">
                                        à confirmer à la réception, pas avant
                                    </span>
                                </span>
                            </div>
                        </section>
                    )}

                    <div className="mt-auto flex flex-col gap-3 pt-6">
                        <Button
                            variant="filled"
                            className={ACTION_CLASSES}
                            onClick={() => setScreen('password')}
                        >
                            Ouvrir mon compte
                        </Button>
                        <Button
                            variant="outlined"
                            className={ACTION_CLASSES}
                            onClick={() => setNotMeOpen(true)}
                        >
                            Ce n'est pas moi
                        </Button>
                    </div>
                </main>

                {/*
                  Le désistement n'a pas d'écran : « ce n'est pas moi » ne se règle pas dans
                  un écran, il se dit à une personne. Une feuille d'une seule phrase, le nom
                  de l'inviteur, son adresse ; aucun geste, le lien n'est pas consommé.
                */}
                <BottomSheet
                    open={notMeOpen}
                    onClose={() => setNotMeOpen(false)}
                    title={`Prévenez ${inviterName}`}
                    titleClassName="font-brand text-[22px] leading-7 font-semibold tracking-[-0.01em]"
                >
                    <p className="text-on-surface-variant mb-4 text-[14px] leading-5">
                        Ce lien vous a été transmis par erreur. Rien ne s'enregistre ici.
                    </p>
                    <div className="flex items-center gap-3 py-2">
                        <span className="font-brand bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[15px] font-semibold">
                            {initialsOf(inviterName)}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-[16px] leading-6">{inviterName}</span>
                            <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                {[inviter?.department, inviter?.email].filter(Boolean).join(' · ') ||
                                    'Informatique'}
                            </span>
                        </span>
                    </div>
                </BottomSheet>
            </AuthShell>
        );
    }

    /* ---------- écran 2 : le mot de passe qui ouvre l'application ---------- */

    if (screen === 'password') {
        return (
            <AuthShell>
                <StepBar
                    title="Étape 1 sur 2"
                    onBack={inheritedMode ? undefined : () => setScreen('invitation')}
                />
                <form
                    noValidate
                    onSubmit={continueFromPassword}
                    className={cn(AUTH_MEASURE, 'flex flex-1 flex-col px-5 pt-7 pb-5')}
                >
                    <p className={TITLE_CLASSES}>Choisissez un mot de passe</p>
                    <p className="text-on-surface-variant mb-6 text-[14px] leading-5 text-pretty">
                        {inheritedMode && "Votre compte a été créé par l'informatique. "}
                        {PASSWORD_MIN_LENGTH} caractères minimum. Une phrase vaut mieux qu'un mot
                        compliqué.
                    </p>

                    <section className="mb-7">
                        <InputField
                            id="first-login-password"
                            type="password"
                            aria-label="Mot de passe"
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (passwordError) setPasswordError(undefined);
                                if (confirmError) setConfirmError(undefined);
                            }}
                            icon={<Icon glyph={LockSimple} size={18} />}
                            autoComplete="new-password"
                            autoFocus
                            error={passwordError}
                            variant="outlined"
                            containerClassName="!space-y-0"
                            leadingElementClassName="!left-3"
                            className={FIELD_CLASSES}
                        />
                        <Meter filled={strength.score} />
                    </section>

                    <section className="mb-7">
                        <InputField
                            id="first-login-confirm"
                            label="Confirmer le mot de passe"
                            type="password"
                            placeholder="Retapez-le"
                            value={confirm}
                            onChange={(e) => {
                                setConfirm(e.target.value);
                                if (confirmError) setConfirmError(undefined);
                            }}
                            icon={<Icon glyph={LockSimple} size={18} />}
                            autoComplete="new-password"
                            error={confirmError}
                            variant="outlined"
                            containerClassName="!space-y-0"
                            leadingElementClassName="!left-3"
                            className={FIELD_CLASSES}
                        />
                        <Meter filled={confirmMatches ? 4 : 0} />
                    </section>

                    {/* « Deux secrets, deux usages » — la seule confusion qui compte ici. */}
                    <section className="mb-7">
                        <p className="text-on-surface-variant mb-2 text-[12px] leading-4 font-medium">
                            Deux secrets, deux usages
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-surface flex flex-col gap-2.5 rounded-[4px] p-3.5">
                                <Icon glyph={LockSimple} size={20} className="text-on-surface-variant" />
                                <span>
                                    <span className="block text-[14px] leading-5 font-medium">
                                        Mot de passe
                                    </span>
                                    <span className="text-on-surface-variant block text-[12px] leading-4">
                                        ouvre l'application, depuis tout appareil
                                    </span>
                                </span>
                            </div>
                            <div className="bg-surface flex flex-col gap-2.5 rounded-[4px] p-3.5">
                                <Icon glyph={Key} size={20} className="text-on-surface-variant" />
                                <span>
                                    <span className="block text-[14px] leading-5 font-medium">
                                        Code PIN
                                    </span>
                                    <span className="text-on-surface-variant block text-[12px] leading-4">
                                        prouve une remise, sur place ; il vaut signature
                                    </span>
                                </span>
                            </div>
                        </div>
                    </section>

                    <div className="mt-auto flex flex-col gap-3 pt-6">
                        <Button type="submit" variant="filled" className={ACTION_CLASSES}>
                            Continuer
                        </Button>
                    </div>
                </form>
            </AuthShell>
        );
    }

    /* ---------- écran 3 : le code PIN, et ce qu'il emprunte à 06.2 ---------- */

    const pinHint = pinIssue
        ? pinIssue
        : pinStep === 'entry'
          ? 'Vous le retaperez pour le confirmer.'
          : pinMatched
            ? 'Les deux codes concordent.'
            : 'Retapez-le pour le confirmer.';

    return (
        <AuthShell>
            <StepBar title="Étape 2 sur 2" onBack={() => setScreen('password')} />
            <main className={cn(AUTH_MEASURE, 'flex flex-1 flex-col items-center px-5 pt-7 pb-5 text-center')}>
                <div className="flex flex-col items-center pt-2 pb-7">
                    <span className="bg-tint-bleu text-on-tint-bleu mb-5 flex h-14 w-14 items-center justify-center rounded-full">
                        <Icon glyph={Key} size={26} />
                    </span>
                    <p className={TITLE_CLASSES}>Votre code de remise</p>
                    <p className="text-on-surface-variant max-w-[300px] text-[14px] leading-5 text-pretty">
                        {pending.length > 0
                            ? "Six chiffres, tapés devant la personne qui vous tend l'objet. Il vaut signature."
                            : 'Vous en aurez besoin le jour où on vous remettra un équipement. Il vaut signature.'}
                    </p>
                </div>

                <PinField
                    key={pinStep}
                    value={pinStep === 'entry' ? pin : pinConfirm}
                    onChange={(value) => {
                        if (pinIssue) setPinIssue(null);
                        if (pinStep === 'entry') setPin(value);
                        else setPinConfirm(value);
                    }}
                    onComplete={handlePinComplete}
                    state={pinState}
                    autoFocus
                    label={pinStep === 'entry' ? 'Code de remise' : 'Confirmer le code de remise'}
                />

                {/* `.pinsteps` — deux temps, celui qu'on vit en encre pleine. */}
                <div className="mt-4 flex gap-1.5" aria-hidden="true">
                    <span className="bg-on-surface h-1 w-6 rounded-[2px]" />
                    <span
                        className={cn(
                            'h-1 w-6 rounded-[2px]',
                            pinStep === 'confirm' ? 'bg-on-surface' : 'bg-outline-variant',
                        )}
                    />
                </div>
                <p
                    className={cn(
                        'mt-2 text-[14px] leading-5',
                        pinIssue ? 'text-error' : 'text-on-surface-variant',
                    )}
                    role={pinIssue ? 'alert' : undefined}
                >
                    {pinHint}
                    {pinIssue && pinStep === 'confirm' && (
                        <>
                            {' '}
                            <Button
                                variant="text"
                                onClick={restartPin}
                                className="text-on-surface hover:text-on-surface h-auto !min-h-0 min-w-0 p-0 align-baseline text-[14px] leading-5 font-medium underline underline-offset-[3px] hover:bg-transparent"
                            >
                                Recommencer
                            </Button>
                        </>
                    )}
                </p>

                <p className="text-text-tertiary mt-auto max-w-[300px] pt-6 text-[14px] leading-5 text-pretty [&_b]:font-medium [&_b]:text-[var(--tk-color-text-muted)]">
                    Ni <b>123456</b>, ni <b>000000</b>, ni une suite, ni votre année de naissance.{' '}
                    <b>Personne ne peut le lire</b>, pas même l'informatique.
                </p>

                <div className="flex w-full flex-col gap-3 pt-6">
                    <Button
                        variant="filled"
                        className={ACTION_CLASSES}
                        disabled={!pinMatched || pinSaving}
                        loading={pinSaving}
                        onClick={savePin}
                    >
                        Continuer
                    </Button>
                    {/* Le code n'est pas facultatif à l'arrivée, mais il est reportable :
                        une arrivée sans matériel ne se termine pas par une exigence sans objet. */}
                    <Button
                        variant="outlined"
                        className={ACTION_CLASSES}
                        onClick={() => navigate('/dashboard')}
                    >
                        Plus tard
                    </Button>
                </div>
            </main>
        </AuthShell>
    );
};

export default FirstLoginPage;
