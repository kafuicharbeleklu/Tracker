import React, { useEffect, useMemo, useState } from 'react';
import { CaretRight, Laptop } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import HandoverTrail from '../../../components/ui/HandoverTrail';
import Icon from '../../../components/ui/Icon';
import { signatureService } from '../../../services/signatureService';
import { cn } from '../../../lib/utils';
import type { Equipment, HistoryEvent, User } from '../../../types';
import {
    autrePartie,
    faitDe,
    filDe,
    lieuDe,
    lire,
    partieDe,
    quandDe,
    type Registres,
} from '../lib/journal';

/** « Vendredi 4 septembre à 19:32 » — le sous-titre commence une ligne. */
const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

const initiales = (nom: string): string =>
    nom
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((mot) => mot[0]?.toUpperCase() ?? '')
        .join('');

/**
 * **La signature apposée, relue** — `.att` de l'état « un événement ouvert » de 18.1 :
 * *« c'est ici que la signature apposée par le code (17.4) se relit »*.
 *
 * L'image n'est pas copiée dans le journal : elle vit, une par personne, dans le magasin
 * de 07.1. Elle ne se montre donc **que si elle était déjà là au moment du fait** —
 * remplacer sa signature purge l'ancienne (D5), et montrer la nouvelle sous un fait plus
 * ancien ferait attester à quelqu'un un trait qu'il n'a pas apposé. Une signature tracée
 * à la main n'est pas gardée : la méthode le dit, l'image ne se montre pas.
 */
const SignatureApposee: React.FC<{ fait: HistoryEvent }> = ({ fait }) => {
    const [image, setImage] = useState<string | null>(null);

    /* L'appelant la remonte d'un fait à l'autre (`key`) : l'image d'un fait ne survit
       pas à l'ouverture du suivant, sans qu'on ait à la vider ici. */
    useEffect(() => {
        let actif = true;
        let url: string | null = null;
        if (fait.isSystem || lire(fait, 'method') !== 'pin+signature') return;

        void Promise.all([
            signatureService.get(fait.actorId),
            signatureService.getSavedAt(fait.actorId),
        ]).then(([blob, posee]) => {
            if (!actif || !blob || !posee) return;
            if (new Date(posee).getTime() > new Date(fait.timestamp).getTime()) return;
            url = URL.createObjectURL(blob);
            setImage(url);
        });

        return () => {
            actif = false;
            if (url) URL.revokeObjectURL(url);
        };
    }, [fait]);

    if (!image) return null;

    return (
        <div className="bg-tint-vert text-on-tint-vert text-ts-sub leading-ts-sub relative flex h-[120px] flex-col items-center justify-center rounded-[4px]">
            <span className="absolute top-3 right-3 text-[0.75rem] leading-4">
                apposée · code PIN
            </span>
            <img
                src={image}
                alt={`Signature de ${fait.actorName}`}
                className="absolute top-[26px] left-1/2 h-14 w-[150px] -translate-x-1/2 object-contain"
            />
            <span className="absolute bottom-2.5">{fait.actorName}</span>
        </div>
    );
};

/** `.arow` — une rangée qui renvoie ailleurs : vignette de 40, deux lignes, chevron. */
const Renvoi: React.FC<{
    vignette: React.ReactNode;
    teinte?: string;
    titre: string;
    sousTitre?: string;
    code?: boolean;
    premier?: boolean;
    onOpen: () => void;
}> = ({ vignette, teinte, titre, sousTitre, code, premier, onOpen }) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen();
            }
        }}
        className={cn(
            'flex min-h-14 cursor-pointer items-center gap-3 py-2',
            !premier && 'border-outline-variant border-t',
        )}
    >
        <span
            className={cn(
                'font-brand text-ts-control flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] font-semibold',
                teinte ?? 'bg-surface-container text-on-surface-variant',
            )}
        >
            {vignette}
        </span>
        <span className="min-w-0 flex-1">
            <span
                className={cn(
                    'text-on-surface text-ts-body leading-ts-body block truncate',
                    code && 'tabular-nums',
                )}
            >
                {titre}
            </span>
            {sousTitre && (
                <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                    {sousTitre}
                </span>
            )}
        </span>
        <Icon glyph={CaretRight} size={20} className="text-text-tertiary shrink-0" />
    </div>
);

interface FactSheetProps {
    fait: HistoryEvent | null;
    /** Tout le journal lisible : la seconde attestation d'un passage de main y est. */
    journal: readonly HistoryEvent[];
    registres: Registres;
    users: readonly User[];
    equipment: readonly Equipment[];
    onClose: () => void;
    /** Ouvre la fiche de l'objet. */
    onOpenEquipment?: (id: string) => void;
    /** Ouvre la fiche d'une personne — absent pour qui ne peut pas la lire. */
    canOpenUser: (id: string) => boolean;
    onOpenUser?: (id: string) => void;
    /**
     * **Le fait ouvert à côté du journal** (P2a, 25/09) — dès 840, en cartes : le même
     * contenu, dans une carte du panneau et non dans une feuille. Rien ne voile le journal.
     */
    enPanneau?: boolean;
}

/**
 * **Un événement ouvert, sa preuve** — 18.1, colonne 3.
 *
 * *« Le fait en titre, puis qui a attesté quoi et comment. Deux rangées renvoient à
 * l'objet et à la personne ; rien ne se modifie. »* C'est la même feuille au téléphone et
 * au bureau, où elle se centre en dialogue (§2.43) : `BottomSheet` le fait déjà dès 600.
 */
const FactSheet: React.FC<FactSheetProps> = ({
    fait,
    journal,
    registres,
    users,
    equipment,
    onClose,
    onOpenEquipment,
    canOpenUser,
    onOpenUser,
    enPanneau = false,
}) => {
    const fil = useMemo(
        () => (fait ? filDe(fait, journal, registres) : []),
        [fait, journal, registres],
    );

    if (!fait)
        return (
            <BottomSheet open={false} onClose={onClose}>
                {null}
            </BottomSheet>
        );

    const partie = partieDe(fait, registres);
    const titre = [faitDe(fait, registres), partie].filter(Boolean).join(' ');
    const lieu = lieuDe(fait);

    /* Le pourquoi se lit sous l'attestation qui l'a donné — un motif de refus, le mot de
       l'incident. */
    const pourquoi = lire(fait, 'reason') ?? lire(fait, 'comment');

    const objet =
        fait.targetType === 'EQUIPMENT'
            ? registres.equipment.get(fait.targetId)
            : fait.targetType === 'APPROVAL'
              ? equipment.find(
                    (e) => e.id === registres.approvals.get(fait.targetId)?.assignedEquipmentId,
                )
              : undefined;

    /* La personne du fait : l'autre partie quand il en a une, son auteur sinon. */
    const autre = autrePartie(fait, registres);
    const personneId =
        autre?.id ?? (fait.isSystem || fait.actorId === 'system' ? undefined : fait.actorId);
    const personne = personneId ? users.find((u) => u.id === personneId) : undefined;
    const detenus = personne ? equipment.filter((e) => e.user?.id === personne.id).length : 0;

    const ouvrir = (geste: () => void) => {
        onClose();
        geste();
    };

    const sousTitre = [capitale(quandDe(fait.timestamp)), lieu].filter(Boolean).join(' · ');

    const corps = (
        <div className="flex flex-col gap-4">
            <HandoverTrail
                steps={fil.map((preuve, index) => ({
                    title: preuve.titre,
                    detail:
                        index === fil.findIndex((p) => p.evenement.id === fait.id) &&
                        !preuve.attente &&
                        pourquoi
                            ? `${preuve.detail} · « ${pourquoi} »`
                            : preuve.detail,
                    state: preuve.attente ? 'wait' : 'done',
                }))}
            />

            <SignatureApposee key={fait.id} fait={fait} />

            {(objet || personne) && (
                <div>
                    {objet && onOpenEquipment && (
                        <Renvoi
                            premier
                            vignette={<Icon glyph={Laptop} size={20} />}
                            titre={objet.assetId || objet.name}
                            code
                            sousTitre={[objet.name, objet.status?.toLowerCase()]
                                .filter(Boolean)
                                .join(' · ')}
                            onOpen={() => ouvrir(() => onOpenEquipment(objet.id))}
                        />
                    )}
                    {personne && onOpenUser && canOpenUser(personne.id) && (
                        <Renvoi
                            premier={!(objet && onOpenEquipment)}
                            vignette={initiales(personne.name)}
                            teinte="bg-tint-bleu text-on-tint-bleu"
                            titre={personne.name}
                            sousTitre={[
                                personne.department,
                                `${detenus} objet${detenus > 1 ? 's' : ''} détenu${detenus > 1 ? 's' : ''}`,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                            onOpen={() => ouvrir(() => onOpenUser(personne.id))}
                        />
                    )}
                </div>
            )}
        </div>
    );

    if (enPanneau)
        return (
            /* La carte du panneau reprend la tête de la feuille — titre de feuille, date et
               lieu dessous — et son corps tel quel. */
            <section className="bg-surface flex flex-col gap-4 rounded-xl px-5 pt-4 pb-5">
                <header>
                    <h2 className="font-brand text-on-surface text-ts-sheet leading-ts-sheet font-semibold tracking-[-0.015em]">
                        {titre}
                    </h2>
                    {sousTitre && (
                        <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-1">
                            {sousTitre}
                        </p>
                    )}
                </header>
                {corps}
            </section>
        );

    return (
        <BottomSheet open onClose={onClose} title={titre} subtitle={sousTitre}>
            {corps}
        </BottomSheet>
    );
};

export default FactSheet;
