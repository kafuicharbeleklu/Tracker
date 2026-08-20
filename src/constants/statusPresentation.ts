import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    ArrowCircleRight,
    CheckCircle,
    CircleDashed,
    Clock,
    Question,
    Wrench,
} from '@phosphor-icons/react';

import { getStatusLabel } from '../lib/businessRules';
import type { ListRowTone } from '../components/ui/ListRow';

/**
 * L'état d'un actif — **son pictogramme, son mot, sa teinte**, fixés une fois.
 *
 * Registre **§0.3 (I3)** : *l'état porte une icône **et** une couleur*, jamais la
 * couleur seule — un état lisible à la teinte disparaît pour qui ne la distingue
 * pas, et à l'impression. Le registre fixe les cinq paires ; ce module est le seul
 * endroit où elles sont écrites, pour qu'un écran ne puisse pas en inventer une
 * sixième.
 *
 * | État | Ton | Glyphe |
 * | --- | --- | --- |
 * | en service, disponible | `positive` | `CheckCircle` |
 * | attribué | `info` | `ArrowCircleRight` |
 * | en attente | `pending` | `Clock` |
 * | hors service, en réparation | `attention` | `Wrench` |
 * | manquant, perdu | `refused` | `Question` |
 * | retiré, réformé | `muted` | `CircleDashed` |
 *
 * **Le mot vient de `getStatusLabel`**, pas d'ici : le vocabulaire des statuts est
 * une affaire de lexique, la teinte une affaire de design system. Les deux ne se
 * décident pas au même endroit, et les mélanger ferait d'un renommage de statut un
 * changement de couleur.
 */

export interface StatusPresentation {
    icon: PhosphorGlyph;
    label: string;
    tone: ListRowTone;
}

const PRESENTATION: Record<string, { icon: PhosphorGlyph; tone: ListRowTone }> = {
    Disponible: { icon: CheckCircle, tone: 'positive' },
    Attribué: { icon: ArrowCircleRight, tone: 'info' },
    'En attente': { icon: Clock, tone: 'pending' },
    'En réparation': { icon: Wrench, tone: 'attention' },
    'En maintenance préventive': { icon: Wrench, tone: 'attention' },
    Manquant: { icon: Question, tone: 'refused' },
    Perdu: { icon: Question, tone: 'refused' },
    Retiré: { icon: CircleDashed, tone: 'muted' },
    Réformé: { icon: CircleDashed, tone: 'muted' },
};

/** Les étapes d'attribution sont toutes des attentes : un seul couple pour toutes. */
const PENDING_FALLBACK = { icon: Clock, tone: 'pending' as const };

export const getStatusPresentation = (status: string): StatusPresentation => {
    const known = PRESENTATION[status];
    return {
        icon: known?.icon ?? PENDING_FALLBACK.icon,
        tone: known?.tone ?? PENDING_FALLBACK.tone,
        // Un statut inconnu garde son libellé brut plutôt que d'être masqué :
        // mieux vaut un mot qu'on n'attendait pas qu'un état sans mot.
        label: getStatusLabel(status, { short: true }),
    };
};

export default getStatusPresentation;
