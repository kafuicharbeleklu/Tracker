import type { Approval, Equipment } from '../../../types';

/** L'âge d'un objet, en années — « neuve » sous trois mois, « 1,1 an », « 3,4 ans ». */
export const ageDeLObjet = (item: Equipment): { mot: string; ans: number } | null => {
    const achat = item.financial?.purchaseDate;
    if (!achat) return null;
    const ans = (Date.now() - new Date(achat).getTime()) / (365.25 * 86_400_000);
    if (Number.isNaN(ans)) return null;
    if (ans < 0.25) return { mot: 'neuve', ans };
    const arrondi = Math.round(ans * 10) / 10;
    return {
        mot: `${arrondi.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} an${arrondi >= 2 ? 's' : ''}`,
        ans,
    };
};

/**
 * **Ce qui peut être remis pour une demande** (26/09) — les unités disponibles de la
 * catégorie demandée : celles du site du bénéficiaire d'abord, puis celles du modèle
 * demandé, puis les plus jeunes. La première est celle que le panneau propose ; la touche
 * A la remet sans qu'on ait à la désigner.
 */
export const unitesARemettre = (
    equipment: readonly Equipment[],
    demande: Pick<Approval, 'equipmentCategory' | 'equipmentModel'>,
    site?: string,
): Equipment[] =>
    equipment
        .filter((item) => item.status === 'Disponible' && item.type === demande.equipmentCategory)
        .sort((a, b) => {
            const memeSite = Number(b.site === site) - Number(a.site === site);
            if (memeSite !== 0) return memeSite;
            const modele =
                Number(b.model === demande.equipmentModel) -
                Number(a.model === demande.equipmentModel);
            if (modele !== 0) return modele;
            return (ageDeLObjet(a)?.ans ?? 99) - (ageDeLObjet(b)?.ans ?? 99);
        });
