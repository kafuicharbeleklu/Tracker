import React, { useEffect, useId, useMemo, useState } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { CaretRight, MagnifyingGlass, QrCode, X } from '@phosphor-icons/react';

import Icon from './Icon';
import Button from './Button';
import InlineError from './InlineError';
import Attestation, { type AttestationMethod } from './Attestation';
import { signatureService } from '../../services/signatureService';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MEDIA } from '../../constants/breakpoints';

/**
 * **La feuille d'acte** — composant partagé **17.4**, neuf actes.
 *
 * *« Valider » désignait deux choses* : la décision — ce qu'on fait à l'objet — et la
 * preuve — que c'est bien moi. La feuille les tient dans un ordre fixe et **s'ouvre sur
 * la page où l'on est**. Elle remplace les assistants plein écran et les pages de
 * validation : *« jamais un wizard à étapes, une page de validation, un PIN saisi sur
 * l'appareil d'un autre. »*
 *
 * ## Six blocs, et cet ordre
 *
 * 1. **L'objet** — fixe, il ne se change pas ici.
 * 2. **L'autre partie**, si l'acte en a une. Connue par l'entrée, ou à choisir.
 * 3. **La question** propre à l'acte — une seule, parfois aucune.
 * 4. **Votre attestation** — et c'est un bloc, jamais un écran.
 * 5. **Ce que cela déclenche** — une ligne, dite avant le geste.
 * 6. **Le verbe** — Annuler à gauche, le verbe de l'acte à droite. Jamais « OK ».
 *
 * ## Le bloc 4 n'a pas de sélecteur de méthode
 *
 * Passe du 06/09 : **le compte décide**, pas un choix au moment du geste. Un code
 * défini donne le pavé ; une signature enregistrée s'appose alors d'elle-même ; sans
 * code, le tracé s'impose et la feuille dit pourquoi. « Signer » reste à un tap. Le
 * segment « Code PIN / Signature » que portait l'anatomie contredisait la planche de
 * l'attestation : il est retiré.
 *
 * ## Ce que le point de départ change : ce qui est déjà connu, jamais la forme
 *
 * *Fiche objet* : le bloc 1 est connu, le 2 l'est aussi si une demande validée existe.
 * *Fiche personne* : le bloc 2 est connu, le 1 se choisit. *Tâche* : les deux sont
 * connus. **Accueil, FAB, scanner : rien ne l'est, et la feuille s'ouvre sur le choix
 * du bloc 1** — recherche et scan sur une ligne, l'objet demandé en tête, en bleu.
 * Tant qu'un bloc se choisit, la feuille n'a **ni attestation ni pied** : il n'y a
 * encore rien à attester.
 */

/** Une partie nommée — l'objet du bloc 1, la personne du bloc 2. */
export interface ActParty {
    /** La vignette de 40 : un glyphe, des initiales. */
    vignette?: React.ReactNode;
    /** La teinte de la vignette. Sans elle, le gris du fond enfoncé. */
    vignetteTone?: ConsequenceTone;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
}

/** Une ligne de choix — l'objet, ou la personne, qu'on n'a pas encore désigné. */
export interface ActChoice {
    id: string;
    vignette?: React.ReactNode;
    /** L'objet demandé passe en tête, sa vignette en bleu. */
    highlighted?: boolean;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Le texte sur lequel la recherche porte. */
    searchText: string;
}

/** Le choix d'un bloc, dans la feuille — jamais un écran, jamais une étape. */
export interface ActPicker {
    /** Le titre de la feuille pendant le choix : « Remettre un équipement ». */
    title: string;
    /** Ce qu'on demande, en sous-titre : « Lequel ? », « À qui ? ». */
    prompt: string;
    searchPlaceholder: string;
    /** Le scan n'existe que là où l'objet porte une étiquette. */
    onScan?: () => void;
    /** Ce que la liste rassemble : « Disponibles à Lomé Siège ». */
    groupLabel: string;
    items: ActChoice[];
    onPick: (id: string) => void;
    /** Ce que la feuille dit quand rien ne correspond. */
    emptyLabel: string;
}

export type ConsequenceTone = 'bleu' | 'vert' | 'ambre' | 'orange' | 'rouge';

const TEINTE: Record<ConsequenceTone, string> = {
    bleu: 'bg-tint-bleu text-on-tint-bleu',
    vert: 'bg-tint-vert text-on-tint-vert',
    ambre: 'bg-tint-ambre text-on-tint-ambre',
    orange: 'bg-tint-orange text-on-tint-orange',
    rouge: 'bg-tint-danger text-on-tint-danger',
};

interface ActSheetProps {
    open: boolean;
    onClose: () => void;
    /** Le verbe de l'acte, en titre : « Remettre l'équipement ». */
    title: string;
    /** Ce que la personne atteste au juste — « Vous attestez votre geste, pas le sien ». */
    subtitle?: string;
    /** 1 · l'objet, fixe. `null` quand il reste à choisir. */
    subject: ActParty | null;
    /** Le choix du bloc 1, quand l'entrée n'a rien désigné. */
    subjectPicker?: ActPicker;
    /** 2 · l'autre partie, quand l'acte en a une. */
    counterparty?: (ActParty & { label: string }) | null;
    /** Le choix du bloc 2, quand aucune demande validée ne l'a désignée. */
    counterpartyPicker?: ActPicker;
    /** 3 · la seule question propre à l'acte. */
    question?: { label: string; children: React.ReactNode };
    /** Qui atteste, et le code de son compte s'il en a défini un. */
    /**
     * Qui atteste. L'`id` sert à relire sa **signature enregistrée** (07.1, lot 28) :
     * quand elle existe et que le code vaut, elle s'appose d'elle-même.
     */
    signer: { name: string; pin?: string; id?: string };
    /** Le libellé du bloc 4 — « Signature de Karim Diallo » quand l'autre partie signe. */
    attestationLabel?: string;
    /** 5 · ce que l'acte déclenche. Une ligne, calculée. */
    consequence?: { tone: ConsequenceTone; glyph: PhosphorGlyph; text: React.ReactNode };
    /** Ce qui se lit avant le bloc 1 — les deux attestations d'un passage de main. */
    preamble?: React.ReactNode;
    confirmLabel: string;
    /**
     * Le ton du verbe. **Le rouge est réservé à l'irréversible** (17.2, C3) et le
     * sombre au reste : refuser une demande ne détruit rien — le demandeur peut
     * redéposer —, donc « Refuser » est sombre, pas rouge (06.5).
     */
    confirmVariant?: 'filled' | 'tonal' | 'danger';
    /** « Plus tard » quand l'acte vient d'une tâche, « Annuler » sinon. */
    cancelLabel?: string;
    onConfirm: (method: AttestationMethod) => void;
    isLoading?: boolean;
    /** L'acte a échoué : la feuille reste ouverte et le dit (17.1, règle 1). */
    error?: string | null;
}

const ActSheet: React.FC<ActSheetProps> = ({
    open,
    onClose,
    title,
    subtitle,
    subject,
    subjectPicker,
    counterparty,
    counterpartyPicker,
    question,
    signer,
    attestationLabel,
    consequence,
    preamble,
    confirmLabel,
    confirmVariant = 'filled',
    cancelLabel = 'Annuler',
    onConfirm,
    isLoading = false,
    error = null,
}) => {
    const titleId = useId();
    /** Au-delà de 600 px il n'y a plus de pouce : la feuille d'acte se centre à la
        mesure de 560, sans poignée, avec l'ombre du dialogue (00.5). Elle s'étirait
        sur les 1 280 px du bureau (13/09). */
    const compact = useMediaQuery(MEDIA.compact);
    const [attestation, setAttestation] = useState<{ method: AttestationMethod; done: boolean }>({
        method: signer.pin ? 'pin' : 'signature',
        done: false,
    });
    const [recherche, setRecherche] = useState('');

    /**
     * **La signature enregistrée du signataire** — lue seulement s'il a un code : elle ne
     * s'appose que pour *« celui qui saisit son propre code sur son propre appareil »*
     * (lot 28, D5). En présence (17.4, colonne 3), le second signataire n'a ni code ni
     * image : il trace, et c'est ce qui fait la valeur de sa preuve.
     */
    const [signature, setSignature] = useState<Blob | null>(null);
    useEffect(() => {
        let vivant = true;
        if (!open || !signer.pin || !signer.id) {
            setSignature(null);
            return;
        }
        void signatureService.get(signer.id).then((image) => {
            if (vivant) setSignature(image);
        });
        return () => {
            vivant = false;
        };
    }, [open, signer.id, signer.pin]);

    /* Le bloc qui reste à désigner tient la feuille : tant qu'il n'est pas rempli, il
       n'y a rien à attester, donc ni bloc 4 ni pied. */
    const picker = !subject ? subjectPicker : !counterparty ? counterpartyPicker : undefined;

    /*
     * Une feuille refermée oublie son attestation : rouverte, elle la redemande. **Et
     * un changement de signataire vaut fermeture** : dans une remise en présence, la
     * feuille reste ouverte pendant que la main passe de celui qui remet à celui qui
     * reçoit. Sans cette remise à zéro, le tracé du premier valait pour le second, et
     * « Il confirme » était actif avant que quiconque ait signé.
     */
    useEffect(() => {
        setAttestation({ method: signer.pin ? 'pin' : 'signature', done: false });
    }, [open, signer.name, signer.pin]);

    /* Un choix fait vide la recherche : le choix suivant repart de la liste entière. */
    useEffect(() => {
        setRecherche('');
    }, [picker?.title, picker?.groupLabel]);

    useEffect(() => {
        if (!open) return;
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onEscape);
        return () => document.removeEventListener('keydown', onEscape);
    }, [open, onClose]);

    const resultats = useMemo(() => {
        if (!picker) return [];
        const terme = recherche.trim().toLowerCase();
        const trouves = terme
            ? picker.items.filter((item) => item.searchText.toLowerCase().includes(terme))
            : picker.items;
        /* L'objet demandé est en tête : c'est celui pour lequel on a ouvert la feuille. */
        return [...trouves].sort(
            (a, b) => Number(Boolean(b.highlighted)) - Number(Boolean(a.highlighted)),
        );
    }, [picker, recherche]);

    if (!open) return null;

    const vignetteBox = (party: { vignette?: React.ReactNode; vignetteTone?: ConsequenceTone }) => (
        <span
            className={cn(
                'font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[15px] font-semibold',
                party.vignetteTone
                    ? TEINTE[party.vignetteTone]
                    : 'bg-surface-container text-on-surface-variant',
            )}
        >
            {party.vignette}
        </span>
    );

    const partyRow = (party: ActParty, filled: boolean) => (
        <div
            className={cn(
                'flex items-center gap-3',
                filled ? 'bg-surface-container min-h-14 rounded-[4px] px-3.5 py-2' : 'py-2',
            )}
        >
            {party.vignette && vignetteBox(party)}
            <span className="min-w-0 flex-1">
                <span
                    className={cn('block truncate text-[16px] leading-6', filled && 'font-medium')}
                >
                    {party.title}
                </span>
                {party.subtitle && (
                    <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                        {party.subtitle}
                    </span>
                )}
            </span>
        </div>
    );

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex justify-center',
                compact ? 'items-end' : 'items-center p-4',
            )}
        >
            <div
                className="bg-scrim/[0.42] absolute inset-0"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                    'bg-surface animate-in relative flex max-h-[97%] w-full flex-col pb-3 duration-300',
                    compact
                        ? 'rounded-t-card shadow-sheet slide-in-from-bottom-4'
                        : 'rounded-card shadow-dialog fade-in max-w-[560px]',
                )}
            >
                {compact && (
                    <span
                        aria-hidden="true"
                        className="bg-outline-variant mx-auto mt-2 mb-0.5 h-1 w-9 rounded-xs"
                    />
                )}

                {/* `.sttl` — le verbe en titre, et ce qu'on atteste en sous-titre. */}
                <div className={cn('flex items-start gap-2 py-1 pr-3 pl-5', !compact && 'pt-4')}>
                    <div className="min-w-0 flex-1">
                        <h2
                            id={titleId}
                            className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em] text-pretty"
                        >
                            {picker ? picker.title : title}
                        </h2>
                        {(picker ? picker.prompt : subtitle) && (
                            <p className="text-on-surface-variant mt-1 text-[14px] leading-5">
                                {picker ? picker.prompt : subtitle}
                            </p>
                        )}
                    </div>
                    <Button variant="text" iconOnly aria-label="Fermer" onClick={onClose}>
                        <Icon glyph={X} size={20} />
                    </Button>
                </div>

                {picker ? (
                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-3">
                        {/* La recherche et le scan tiennent sur une ligne. */}
                        <div className="flex gap-2">
                            <label className="bg-surface-container flex min-h-12 flex-1 items-center gap-2.5 rounded-[4px] px-3.5">
                                <Icon
                                    glyph={MagnifyingGlass}
                                    size={20}
                                    className="text-on-surface-variant shrink-0"
                                />
                                <input
                                    type="search"
                                    value={recherche}
                                    onChange={(event) => setRecherche(event.target.value)}
                                    placeholder={picker.searchPlaceholder}
                                    aria-label={picker.searchPlaceholder}
                                    autoComplete="off"
                                    className="text-on-surface placeholder:text-text-tertiary min-w-0 flex-1 bg-transparent text-[16px] leading-6 outline-none"
                                />
                            </label>
                            {picker.onScan && (
                                <button
                                    type="button"
                                    onClick={picker.onScan}
                                    aria-label="Scanner l'étiquette"
                                    className="bg-inverse-surface text-inverse-on-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px]"
                                >
                                    <Icon glyph={QrCode} size={20} />
                                </button>
                            )}
                        </div>

                        <div>
                            <p className="text-on-surface-variant mb-2 flex items-baseline justify-between gap-3 text-[12px] leading-4 font-medium">
                                <span>{picker.groupLabel}</span>
                                <span className="text-text-tertiary font-normal tabular-nums">
                                    {resultats.length}
                                </span>
                            </p>

                            {resultats.length === 0 ? (
                                <p className="text-on-surface-variant py-2 text-[14px] leading-5">
                                    {picker.emptyLabel}
                                </p>
                            ) : (
                                resultats.map((item, index) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => picker.onPick(item.id)}
                                        className={cn(
                                            'flex min-h-14 w-full items-center gap-3 py-2 text-left',
                                            index > 0 && 'border-outline-variant border-t',
                                        )}
                                    >
                                        {item.vignette &&
                                            vignetteBox({
                                                vignette: item.vignette,
                                                vignetteTone: item.highlighted ? 'bleu' : undefined,
                                            })}
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[16px] leading-6">
                                                {item.title}
                                            </span>
                                            {item.subtitle && (
                                                <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                                    {item.subtitle}
                                                </span>
                                            )}
                                        </span>
                                        <Icon
                                            glyph={CaretRight}
                                            size={20}
                                            className="text-text-tertiary shrink-0"
                                        />
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-3">
                            {preamble}

                            {/* 1 · l'objet */}
                            {subject && partyRow(subject, false)}

                            {/* 2 · l'autre partie */}
                            {counterparty && (
                                <div>
                                    <p className="text-on-surface-variant mb-2 text-[12px] leading-4 font-medium">
                                        {counterparty.label}
                                    </p>
                                    {partyRow(counterparty, true)}
                                </div>
                            )}

                            {/* 3 · la question */}
                            {question && (
                                <div>
                                    <p className="text-on-surface-variant mb-2 text-[12px] leading-4 font-medium">
                                        {question.label}
                                    </p>
                                    {question.children}
                                </div>
                            )}

                            {/* 4 · l'attestation — le compte décide de la méthode */}
                            <Attestation
                                /* Le bloc entier repart : le pavé du précédent
                                   signataire ne doit pas rester à l'écran. */
                                key={signer.name}
                                signerName={signer.name}
                                signerPin={signer.pin}
                                signature={signature}
                                label={attestationLabel}
                                onChange={setAttestation}
                            />

                            {/* 5 · ce que cela déclenche */}
                            {consequence && (
                                <div className="bg-surface-container flex flex-col gap-2.5 rounded-[4px] px-4 py-3">
                                    <p className="text-on-surface-variant text-[12px] leading-4 font-medium">
                                        Ce que cela déclenche
                                    </p>
                                    <p className="text-on-surface flex items-center gap-3 text-[14px] leading-5">
                                        <span
                                            className={cn(
                                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]',
                                                TEINTE[consequence.tone],
                                            )}
                                        >
                                            <Icon glyph={consequence.glyph} size={18} />
                                        </span>
                                        <span className="min-w-0 flex-1">{consequence.text}</span>
                                    </p>
                                </div>
                            )}

                            {error && <InlineError>{error}</InlineError>}
                        </div>

                        {/* 6 · le verbe */}
                        <div className="border-outline-variant mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                disabled={isLoading}
                                className="!rounded-[4px]"
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                variant={confirmVariant}
                                onClick={() => onConfirm(attestation.method)}
                                disabled={!attestation.done || isLoading}
                                loading={isLoading}
                                className="!rounded-[4px]"
                            >
                                {error ? 'Réessayer' : confirmLabel}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ActSheet;
