import React, { useMemo, useState } from 'react';
import {
    ArrowUUpLeft,
    Bell,
    CheckCircle,
    ClipboardText,
    ClockCounterClockwise,
    Funnel,
    Handshake,
    PaperPlaneTilt,
    ShieldCheck,
    SignOut,
    UserPlus,
    Wrench,
    XCircle,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import ListTemplate from '../../../components/layout/ListTemplate';
import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FacetChip from '../../../components/ui/FacetChip';
import Icon from '../../../components/ui/Icon';
import ScreenState from '../../../components/ui/ScreenState';
import { useData } from '../../../context/DataContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { cn } from '../../../lib/utils';
import type { EventType, HistoryEvent } from '../../../types';

/**
 * **Historique — le journal des événements** (planche 18.1, dessinée le 05/09).
 *
 * *« Audit » a été scindé le 03/09 : la campagne physique s'appelle Inventaire (16), le
 * journal s'appelle **Historique**, et il n'avait pas de planche.* Il n'avait pas de page
 * non plus : la feuille « Plus » réservait sa place et la laissait vide, parce qu'*« une
 * rangée qui ne mène nulle part est pire qu'une rangée absente »*. La voici.
 *
 * **Un fait par rangée** : l'objet ou la personne en titre, qui l'a fait et par quelle
 * méthode en sous-ligne, l'heure à droite. *« Rien ne se refait ici »* — aucune rangée du
 * journal n'est un acte, et c'est ce qui le rend relisible deux ans après.
 *
 * Les partitions sont **des chips dans la feuille de filtre** (R11, comme 03.3 et 16.1),
 * jamais des onglets ; et le gabarit est celui des huit listes (17.8).
 */

/** Les six natures de la planche, et ce que chacune ramasse dans `EventType`. */
type Nature = 'remises' | 'demandes' | 'incidents' | 'inventaires' | 'comptes' | 'securite';

const NATURES: readonly { id: Nature; label: string; types: readonly EventType[] }[] = [
    {
        id: 'remises',
        label: 'Remises et retours',
        types: ['ASSIGN', 'ASSIGN_PENDING', 'ASSIGN_CONFIRMED', 'ASSIGN_IT_SELECTED', 'RETURN'],
    },
    {
        id: 'demandes',
        label: 'Demandes',
        types: [
            'APPROVAL_CREATE',
            'APPROVAL_MANAGER',
            'APPROVAL_ADMIN',
            'APPROVAL_REJECT',
            'APPROVAL_CANCEL',
            'APPROVAL_DOTATION_REJECT',
            'ASSIGN_MANAGER_WAIT',
            'ASSIGN_MANAGER_OK',
            'ASSIGN_IT_PROCESSING',
            'ASSIGN_DOTATION_WAIT',
            'ASSIGN_DOTATION_OK',
        ],
    },
    {
        id: 'incidents',
        label: 'Incidents et sorties',
        types: ['REPAIR_START', 'REPAIR_END', 'DELETE'],
    },
    { id: 'inventaires', label: 'Inventaires', types: [] },
    { id: 'comptes', label: 'Comptes et rôles', types: ['CREATE', 'UPDATE'] },
    { id: 'securite', label: 'Sécurité et exports', types: ['LOGIN', 'LOGOUT', 'EXPORT'] },
];

/** La marque ronde de 32 : la nature par le pictogramme **et** la teinte (I3). */
const MARQUE: Partial<Record<EventType, { glyph: PhosphorGlyph; teinte: string }>> = {
    ASSIGN: { glyph: Handshake, teinte: 'bg-tint-vert text-on-tint-vert' },
    ASSIGN_PENDING: { glyph: Handshake, teinte: 'bg-tint-ambre text-on-tint-ambre' },
    ASSIGN_CONFIRMED: { glyph: CheckCircle, teinte: 'bg-tint-vert text-on-tint-vert' },
    RETURN: { glyph: ArrowUUpLeft, teinte: 'bg-tint-vert text-on-tint-vert' },
    REPAIR_START: { glyph: Wrench, teinte: 'bg-tint-orange text-on-tint-orange' },
    REPAIR_END: { glyph: Wrench, teinte: 'bg-tint-vert text-on-tint-vert' },
    DELETE: { glyph: SignOut, teinte: 'bg-tint-orange text-on-tint-orange' },
    APPROVAL_CREATE: { glyph: PaperPlaneTilt, teinte: 'bg-tint-bleu text-on-tint-bleu' },
    APPROVAL_MANAGER: { glyph: CheckCircle, teinte: 'bg-tint-bleu text-on-tint-bleu' },
    APPROVAL_ADMIN: { glyph: CheckCircle, teinte: 'bg-tint-bleu text-on-tint-bleu' },
    APPROVAL_REJECT: { glyph: XCircle, teinte: 'bg-tint-danger text-on-tint-danger' },
    APPROVAL_CANCEL: { glyph: XCircle, teinte: 'bg-tint-danger text-on-tint-danger' },
    CREATE: { glyph: UserPlus, teinte: 'bg-tint-bleu text-on-tint-bleu' },
    UPDATE: { glyph: ShieldCheck, teinte: 'bg-tint-bleu text-on-tint-bleu' },
    LOGIN: { glyph: ShieldCheck, teinte: 'bg-tint-bleu text-on-tint-bleu' },
    EXPORT: { glyph: ClipboardText, teinte: 'bg-tint-ambre text-on-tint-ambre' },
};

const PERIODES = [
    { id: '7', label: '7 jours', jours: 7 },
    { id: '30', label: '30 jours', jours: 30 },
    { id: 'tout', label: 'Tout', jours: null },
] as const;

type PeriodeId = (typeof PERIODES)[number]['id'];

const heure = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

/**
 * Le titre d'un jour — « Aujourd'hui », « Hier », puis la date en toutes lettres. Un
 * journal se lit par proximité : la date absolue ne sert qu'au-delà de la veille.
 */
const titreDuJour = (iso: string): string => {
    const jour = new Date(iso);
    const aujourdhui = new Date();
    const veille = new Date();
    veille.setDate(veille.getDate() - 1);
    const memeJour = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (memeJour(jour, aujourdhui)) return "Aujourd'hui";
    if (memeJour(jour, veille)) return 'Hier';
    return jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

/**
 * **La méthode d'attestation, en sous-ligne** — *« c'est ce qui rend le fait relisible
 * deux ans après »*. Elle se lit dans les métadonnées de l'acte quand il en porte.
 */
const sousLigne = (evenement: HistoryEvent): string => {
    const morceaux: string[] = [];
    if (evenement.isSystem) morceaux.push('automatique');
    else if (evenement.actorName) morceaux.push(evenement.actorName);

    /* Le sujet ne se répète pas sous lui-même : une connexion a pour cible la personne
       qui l'a faite, et « Kafui EKLU · Kafui EKLU » ne dit rien deux fois. */
    if (
        evenement.targetName &&
        evenement.targetName !== evenement.actorName &&
        evenement.targetType !== 'USER'
    )
        morceaux.push(evenement.targetName);

    const meta = evenement.metadata ?? {};
    const methode = typeof meta.method === 'string' ? meta.method : undefined;
    if (methode === 'pin') morceaux.push('code PIN');
    else if (methode === 'signature') morceaux.push('signature apposée');

    const raison = typeof meta.reason === 'string' ? meta.reason : undefined;
    if (raison) morceaux.push(raison);

    return morceaux.filter(Boolean).join(' · ');
};

interface HistoryPageProps {
    onBack?: () => void;
    /** Réduit le journal à ce qui concerne une personne — la vue « Mon historique ». */
    scopeUserId?: string;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onBack, scopeUserId }) => {
    const { events } = useData();
    const [recherche, setRecherche] = useState('');
    const [naturesActives, setNaturesActives] = useState<Nature[]>([]);
    const [periode, setPeriode] = useState<PeriodeId>('30');
    const [filtreOuvert, setFiltreOuvert] = useState(false);
    const [ouvert, setOuvert] = useState<HistoryEvent | null>(null);

    const rechercheRetardee = useDebounce(recherche, 250);

    const natureDe = useMemo(() => {
        const table = new Map<EventType, Nature>();
        NATURES.forEach(({ id, types }) => types.forEach((t) => table.set(t, id)));
        return table;
    }, []);

    /** La portée : tout le journal, ou les faits d'une personne. */
    const perimetre = useMemo(
        () =>
            scopeUserId
                ? events.filter((e) => e.actorId === scopeUserId || e.targetId === scopeUserId)
                : events,
        [events, scopeUserId],
    );

    const dansLaPeriode = useMemo(() => {
        const jours = PERIODES.find((p) => p.id === periode)?.jours ?? null;
        if (jours === null) return perimetre;
        const depuis = Date.now() - jours * 86400000;
        return perimetre.filter((e) => new Date(e.timestamp).getTime() >= depuis);
    }, [perimetre, periode]);

    const affiches = useMemo(() => {
        const q = rechercheRetardee.trim().toLowerCase();
        return dansLaPeriode
            .filter((e) => {
                if (naturesActives.length > 0) {
                    const n = natureDe.get(e.type);
                    if (!n || !naturesActives.includes(n)) return false;
                }
                if (!q) return true;
                return [e.targetName, e.actorName, e.description]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));
            })
            .slice()
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [dansLaPeriode, natureDe, naturesActives, rechercheRetardee]);

    /** Le journal se lit **groupé par jour** : c'est la carte `.day` de la planche. */
    const parJour = useMemo(() => {
        const groupes = new Map<string, HistoryEvent[]>();
        affiches.forEach((e) => {
            const cle = new Date(e.timestamp).toDateString();
            groupes.set(cle, [...(groupes.get(cle) ?? []), e]);
        });
        return [...groupes.entries()];
    }, [affiches]);

    const comptesParNature = useMemo(() => {
        const compte = new Map<Nature, number>();
        dansLaPeriode.forEach((e) => {
            const n = natureDe.get(e.type);
            if (n) compte.set(n, (compte.get(n) ?? 0) + 1);
        });
        return compte;
    }, [dansLaPeriode, natureDe]);

    const filtresPoses = naturesActives.length + (periode === 'tout' ? 0 : 1);

    const ordre = [
        naturesActives.length === 0
            ? 'Tout'
            : NATURES.filter((n) => naturesActives.includes(n.id))
                  .map((n) => n.label.toLowerCase())
                  .join(', '),
        PERIODES.find((p) => p.id === periode)?.label.toLowerCase(),
        'les plus récents',
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <>
            <ListTemplate
                /* 18.1 est une file d'événements — squelette de file (17.3, A2). */
                skeleton="file"
                title={scopeUserId ? 'Mon historique' : 'Historique'}
                onBack={onBack}
                search={
                    scopeUserId
                        ? undefined
                        : {
                              value: recherche,
                              onChange: setRecherche,
                              placeholder: 'Identifiant, personne, lieu',
                          }
                }
                filter={
                    <Button
                        variant="text"
                        aria-label="Filtrer le journal"
                        onClick={() => setFiltreOuvert(true)}
                        className="bg-surface-container text-on-surface hover:bg-surface-container-high focus-visible:ring-focus-ring relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md p-0 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                        <Icon glyph={Funnel} size={20} />
                        {filtresPoses > 0 && (
                            <span className="bg-inverse-surface text-inverse-on-surface absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-[2px] px-[5px] text-[11px] leading-[18px] font-medium tabular-nums">
                                {filtresPoses}
                            </span>
                        )}
                    </Button>
                }
                count={{
                    total: affiches.length,
                    noun: `fait${affiches.length > 1 ? 's' : ''} · ${ordre}`,
                }}
                hasRows={parJour.length > 0}
                empty={
                    <ScreenState
                        icon={ClockCounterClockwise}
                        title="Aucun fait ne correspond"
                        description={
                            filtresPoses > 0
                                ? 'Élargissez la période, ou changez de nature.'
                                : 'Le journal se remplit à mesure que des actes sont posés : une remise, un retour, une demande tranchée.'
                        }
                        actions={
                            filtresPoses > 0 ? (
                                <Button
                                    variant="tonal"
                                    onClick={() => {
                                        setNaturesActives([]);
                                        setPeriode('tout');
                                    }}
                                >
                                    Voir tout le journal
                                </Button>
                            ) : undefined
                        }
                    />
                }
            >
                {parJour.map(([cle, faits]) => (
                    <section key={cle} className="border-outline-variant border-t first:border-t-0">
                        {/* `.dh` — le jour et son compte, 17 sur 24 en graisse d'appui. */}
                        <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                            <h3 className="text-on-surface min-w-0 flex-1 truncate text-[17px] leading-6 font-medium first-letter:uppercase">
                                {titreDuJour(faits[0].timestamp)}
                            </h3>
                            <span className="text-on-surface-variant shrink-0 text-[14px] leading-5 tabular-nums">
                                {faits.length}
                            </span>
                        </div>
                        {faits.map((fait, index) => {
                            const marque = MARQUE[fait.type];
                            const detail = sousLigne(fait);
                            return (
                                <div
                                    key={fait.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setOuvert(fait)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setOuvert(fait);
                                        }
                                    }}
                                    className={cn(
                                        'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left',
                                        index > 0 && 'border-outline-variant border-t',
                                    )}
                                >
                                    {/* `.mk` — 32 rond. Un fait **système** est cerclé, sans
                                        fond : il n'a pas d'auteur à teinter. */}
                                    <span
                                        className={cn(
                                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                            fait.isSystem
                                                ? 'border-outline-variant text-text-tertiary border'
                                                : (marque?.teinte ??
                                                      'bg-surface-container text-on-surface-variant'),
                                        )}
                                    >
                                        <Icon glyph={marque?.glyph ?? Bell} size={18} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        {/* `.ev .t` — **le fait**, pas son sujet : la
                                            planche écrit « LFW-PF5XK2M remis », pas
                                            « LFW-PF5XK2M ». La cible et la méthode
                                            descendent en sous-ligne. */}
                                        <span className="text-on-surface block truncate text-[16px] leading-6">
                                            {fait.description || fait.targetName}
                                        </span>
                                        {detail && (
                                            <span className="text-on-surface-variant line-clamp-2 block text-[14px] leading-5">
                                                {detail}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-text-tertiary shrink-0 text-[12px] leading-4 tabular-nums">
                                        {heure(fait.timestamp)}
                                    </span>
                                </div>
                            );
                        })}
                    </section>
                ))}
            </ListTemplate>

            {/* La feuille de filtre — les partitions en chips, jamais en onglets (R11). */}
            <BottomSheet open={filtreOuvert} onClose={() => setFiltreOuvert(false)} title="Filtrer">
                <div className="flex flex-col pb-0">
                    <p className="text-on-surface-variant px-5 pt-3.5 pb-2 text-[12px] leading-4 font-medium">
                        Nature
                    </p>
                    <div className="flex flex-wrap gap-2 px-5">
                        <FacetChip
                            label="Tout"
                            count={dansLaPeriode.length}
                            selected={naturesActives.length === 0}
                            onClick={() => setNaturesActives([])}
                        />
                        {NATURES.map((n) => (
                            <FacetChip
                                key={n.id}
                                label={n.label}
                                count={comptesParNature.get(n.id) ?? 0}
                                selected={naturesActives.includes(n.id)}
                                onClick={() =>
                                    setNaturesActives((prev) =>
                                        prev.includes(n.id)
                                            ? prev.filter((x) => x !== n.id)
                                            : [...prev, n.id],
                                    )
                                }
                            />
                        ))}
                    </div>

                    <p className="text-on-surface-variant px-5 pt-4 pb-2 text-[12px] leading-4 font-medium">
                        Période
                    </p>
                    <div className="flex flex-wrap gap-2 px-5">
                        {PERIODES.map((p) => (
                            <FacetChip
                                key={p.id}
                                label={p.label}
                                selected={periode === p.id}
                                onClick={() => setPeriode(p.id)}
                            />
                        ))}
                    </div>

                    <div className="border-outline-variant mt-4 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button
                            variant="tonal"
                            className="bg-surface-container text-on-surface hover:bg-surface-container-high justify-center"
                            onClick={() => {
                                setNaturesActives([]);
                                setPeriode('tout');
                            }}
                        >
                            Tout effacer
                        </Button>
                        <Button
                            variant="filled"
                            className="justify-center"
                            onClick={() => setFiltreOuvert(false)}
                        >
                            Voir {affiches.length} fait{affiches.length > 1 ? 's' : ''}
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/* Un fait ouvert : ce qui a été attesté, et par qui. **Rien ne s'y modifie.** */}
            <BottomSheet
                open={Boolean(ouvert)}
                onClose={() => setOuvert(null)}
                title={ouvert?.description || ouvert?.targetName || 'Fait'}
            >
                {ouvert && (
                    <div className="flex flex-col gap-4 px-5 pt-3 pb-1">
                        <p className="text-on-surface-variant text-[14px] leading-5">
                            {titreDuJour(ouvert.timestamp)} à {heure(ouvert.timestamp)}
                        </p>
                        <p className="text-on-surface text-[17px] leading-6">
                            {ouvert.description}
                        </p>
                        <div className="bg-surface-container flex flex-col gap-2 rounded-sm px-4 py-3">
                            <span className="text-on-surface-variant text-[12px] leading-4 font-medium">
                                Qui l'a fait
                            </span>
                            <span className="text-on-surface text-[16px] leading-6">
                                {ouvert.isSystem
                                    ? 'Le système, sans intervention'
                                    : `${ouvert.actorName} · ${ouvert.actorRole}`}
                            </span>
                        </div>
                    </div>
                )}
            </BottomSheet>
        </>
    );
};

export default HistoryPage;
