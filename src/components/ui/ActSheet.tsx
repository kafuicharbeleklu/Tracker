import React, { useEffect, useId, useState } from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import { X } from '@phosphor-icons/react';

import Icon from './Icon';
import Button from './Button';
import InlineError from './InlineError';
import Attestation, { type AttestationMethod } from './Attestation';
import { cn } from '../../lib/utils';

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
 * Ce que le point de départ change, c'est **ce qui est déjà connu** à l'ouverture,
 * jamais la forme : depuis une tâche les blocs 1 et 2 sont remplis, depuis l'accueil
 * rien ne l'est et la feuille s'ouvre sur le choix de l'objet.
 */

/** Une partie nommée — l'objet du bloc 1, la personne du bloc 2. */
export interface ActParty {
    /** La vignette de 40 : un glyphe, des initiales. */
    vignette?: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
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
    /** 1 · l'objet, fixe. */
    subject: ActParty;
    /** 2 · l'autre partie, quand l'acte en a une. */
    counterparty?: ActParty & { label: string };
    /** 3 · la seule question propre à l'acte. */
    question?: { label: string; children: React.ReactNode };
    /** Qui atteste, et le code de son compte s'il en a défini un. */
    signer: { name: string; pin?: string };
    /** 5 · ce que l'acte déclenche. Une ligne, calculée. */
    consequence?: { tone: ConsequenceTone; glyph: PhosphorGlyph; text: React.ReactNode };
    confirmLabel: string;
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
    counterparty,
    question,
    signer,
    consequence,
    confirmLabel,
    cancelLabel = 'Annuler',
    onConfirm,
    isLoading = false,
    error = null,
}) => {
    const titleId = useId();
    const [attestation, setAttestation] = useState<{ method: AttestationMethod; done: boolean }>({
        method: signer.pin ? 'pin' : 'signature',
        done: false,
    });

    /* Une feuille refermée oublie son attestation : rouverte, elle la redemande. */
    useEffect(() => {
        if (!open) setAttestation({ method: signer.pin ? 'pin' : 'signature', done: false });
    }, [open, signer.pin]);

    useEffect(() => {
        if (!open) return;
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onEscape);
        return () => document.removeEventListener('keydown', onEscape);
    }, [open, onClose]);

    if (!open) return null;

    const partyRow = (party: ActParty, filled: boolean) => (
        <div
            className={cn(
                'flex items-center gap-3',
                filled ? 'bg-surface-container min-h-14 rounded-[4px] px-3.5 py-2' : 'py-2',
            )}
        >
            {party.vignette && (
                <span className="bg-surface-container text-on-surface-variant font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[15px] font-semibold">
                    {party.vignette}
                </span>
            )}
            <span className="min-w-0 flex-1">
                <span
                    className={cn(
                        'block truncate text-[16px] leading-6',
                        filled && 'font-medium',
                    )}
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
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <div
                className="bg-scrim/[0.42] absolute inset-0"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="bg-surface rounded-t-card shadow-elevation-3 animate-in slide-in-from-bottom-4 duration-300 relative flex max-h-[97%] w-full flex-col pb-3"
            >
                <span
                    aria-hidden="true"
                    className="bg-outline-variant mx-auto mt-2 mb-0.5 h-1 w-9 rounded-xs"
                />

                {/* `.sttl` — le verbe en titre, et ce qu'on atteste en sous-titre. */}
                <div className="flex items-start gap-2 py-1 pr-3 pl-5">
                    <div className="min-w-0 flex-1">
                        <h2
                            id={titleId}
                            className="font-brand text-on-surface text-[22px] leading-7 font-semibold tracking-[-0.015em] text-pretty"
                        >
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-on-surface-variant mt-1 text-[14px] leading-5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <Button variant="text" iconOnly aria-label="Fermer" onClick={onClose}>
                        <Icon glyph={X} size={20} />
                    </Button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-3">
                    {/* 1 · l'objet */}
                    {partyRow(subject, false)}

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
                        signerName={signer.name}
                        signerPin={signer.pin}
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
                <div className="border-outline-variant mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="!rounded-[4px]"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant="filled"
                        onClick={() => onConfirm(attestation.method)}
                        disabled={!attestation.done || isLoading}
                        loading={isLoading}
                        className="!rounded-[4px]"
                    >
                        {error ? 'Réessayer' : confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ActSheet;
