import React from 'react';
import { CaretRight, DoorOpen, MapPin, Play } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { JAUGE_RANGEE } from '../../../lib/jauge';
import { cn } from '../../../lib/utils';
import { PlaceAuditRow, STATUS_LABELS } from '../placeAudit';

/** La teinte de l'état d'un lieu — la même dans la vignette et dans la pastille. */
export const TEINTE_STATUT: Record<PlaceAuditRow['status'], string> = {
    'A lancer': 'bg-[var(--tk-color-st-ambre)]',
    'En cours': 'bg-[var(--tk-color-st-bleu)]',
    'A valider': 'bg-[var(--tk-color-st-orange)]',
    Validee: 'bg-[var(--tk-color-st-vert)]',
    Complet: 'bg-[var(--tk-color-st-vert)]',
    'A planifier': '',
};

/**
 * **Une rangée de lieu** — la même au téléphone, dans le panneau du bureau et sur la page
 * qui les porte tous (`AuditLieux`, 09/10) : le panneau *est* la colonne 2 de la planche,
 * mêmes rangées comprises.
 */
const RangeeDeLieu: React.FC<{
    row: PlaceAuditRow;
    index: number;
    niveau: 'site' | 'local';
    /** Ouvrir le niveau suivant, ou le comptage. */
    onOuvrir: (row: PlaceAuditRow) => void;
    /** Lancer le comptage du lieu — le geste `.rbtn`. */
    onLancer: (row: PlaceAuditRow) => void;
}> = ({ row, index, niveau, onOuvrir, onLancer }) => {
    /* Un site qui a des locaux **ouvre** ; un lieu qui se compte
                   directement et n'a jamais été compté porte le verbe. */
    const ouvreUnNiveau = !row.local && !row.horsLocal && (row.localCount ?? 0) > 0;
    const seLance = !ouvreUnNiveau && row.status === 'A lancer';
    const muet = row.expected === 0;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOuvrir(row)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOuvrir(row);
                }
            }}
            /* `.trow` — **56**, gouttière 12, 8 d'intérieur. Elle tenait 64 : le
               plancher de la rangée d'objet (04.1), quand 16.1 range des lieux en
               file et déclare la mesure des files. Le contenu en fait 60 de toute
               façon — vignette 40, deux lignes de 24 et 20 — et le plancher ne
               servait qu'à écarter les rangées d'un lieu sans sous-ligne. */
            className={cn(
                'flex min-h-14 w-full cursor-pointer items-center gap-3 py-2 text-left',
                index > 0 && 'border-outline-variant border-t',
            )}
        >
            {/* `.vig` — la teinte dit l'état du lieu : ambre quand rien
                            n'a été compté, bleu pendant, vert au bout. Un local porte
                            une porte, un site une épingle. */}
            <div
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                    muet
                        ? 'bg-surface-container text-text-tertiary'
                        : row.status === 'Complet'
                          ? 'bg-tint-vert text-on-tint-vert'
                          : row.status === 'En cours'
                            ? 'bg-tint-bleu text-on-tint-bleu'
                            : 'bg-tint-ambre text-on-tint-ambre',
                )}
            >
                <Icon glyph={row.local ? DoorOpen : MapPin} size={20} />
            </div>

            <div className="min-w-0 flex-1">
                <span
                    className={cn(
                        'text-ts-body leading-ts-body block truncate',
                        muet ? 'text-on-surface-variant' : 'text-on-surface',
                    )}
                >
                    {row.local ?? row.site}
                </span>
                {/* **L'état dans la sous-ligne, le compte à droite** (24/09) : « France ·
                    8 attendus » disait le nombre dans la phrase ; il passe en chiffre, et la
                    sous-ligne dit où en est le lieu, par un point de sa teinte. */}
                <span className="text-on-surface-variant text-ts-sub leading-ts-sub flex min-w-0 items-center gap-1.5">
                    {/* Le pays cède la place à l'état : entre le chiffre et le ▶, la sous-ligne
                        n'avait plus que 150 px et coupait « jamais véri… ». */}
                    {niveau === 'local' && row.horsLocal && (
                        <span className="shrink-0">Hors local ·</span>
                    )}
                    {!muet && (
                        <i
                            aria-hidden="true"
                            className={cn(
                                'h-2 w-2 shrink-0 rounded-xs',
                                TEINTE_STATUT[row.status] || 'bg-outline',
                            )}
                        />
                    )}
                    <span className="truncate">
                        {muet
                            ? 'rien à inventorier'
                            : row.status === 'En cours'
                              ? `en cours · ${row.found}/${row.expected}`
                              : row.status === 'Complet'
                                ? 'complet'
                                : row.status === 'A lancer'
                                  ? 'jamais vérifié'
                                  : STATUS_LABELS[row.status].toLowerCase()}
                    </span>
                </span>
                {/* `.mini` — l'avancement du lieu, dans la rangée : il
                                n'existe qu'une fois le comptage commencé. */}
                {row.status === 'En cours' && (
                    <span
                        className={cn(
                            'bg-outline-variant mt-1.5 flex max-w-[200px] overflow-hidden',
                            JAUGE_RANGEE,
                        )}
                    >
                        <i
                            className="mvt-jauge duration-medium2 ease-emphasized block h-full bg-[var(--tk-color-live-vert)] transition-[width]"
                            style={{ width: `${row.progress}%` }}
                        />
                    </span>
                )}
            </div>

            {!muet && (
                <span className="flex shrink-0 flex-col items-end">
                    <span className="font-brand text-on-surface text-ts-head leading-ts-head font-semibold tabular-nums">
                        {row.expected}
                    </span>
                    <span className="text-text-muted text-[0.75rem] leading-4">attendus</span>
                </span>
            )}
            {seLance ? (
                <Button
                    variant="text"
                    iconOnly
                    aria-label={`Lancer le comptage — ${row.local ?? row.site}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        onLancer(row);
                    }}
                    className="bg-tint-ambre text-on-tint-ambre doigt:h-12 doigt:min-h-12 doigt:w-12 doigt:min-w-12 h-10 min-h-10 w-10 min-w-10 shrink-0 rounded-md hover:opacity-90"
                >
                    <Icon glyph={Play} size={20} emphasis="fill" />
                </Button>
            ) : (
                <Icon glyph={CaretRight} size={20} className="text-text-muted shrink-0" />
            )}
        </div>
    );
};

export default RangeeDeLieu;
