import type { Equipment } from '../../types';

/**
 * **Le motif d'une immobilisation, tel que le produit le porte réellement.**
 *
 * Les deux feuilles de 04.4 lisaient `item.repairReason` — un champ qui **n'existe pas**
 * sur `Equipment`. Le sujet de la feuille annonçait donc le réparateur seul, et le motif
 * qu'elle promettait n'apparaissait jamais.
 *
 * Ce que le modèle porte, c'est un **incident** (04.3) : son issue, ses photos, et un
 * commentaire libre — *« décrire, si la photo ne suffit pas »*. Le motif lisible est donc
 * ce commentaire, celui du dernier incident déclaré. Sans commentaire, il n'y a rien à
 * dire : la feuille se tait plutôt que d'inventer une phrase.
 */
export const motifIncident = (item: Equipment): string | undefined =>
    item.incidents?.[0]?.comment?.trim() || undefined;
