/**
 * **La démonstration du site public porte la simulation** (13/10).
 *
 * Le site public est une démonstration isolée : la base est coupée, chaque visiteur travaille
 * dans son navigateur. Elle montrait le petit jeu intégré au code (14 actifs, 11 personnes),
 * qui sert aux essais. Avec `VITE_DEMO_SIMULATION=true`, elle porte la simulation complète
 * (`scripts/simulation/jeu.ts` : 279 actifs, 66 personnes, toutes les situations du produit),
 * versée une fois dans le navigateur du visiteur par `lib/semerLaDemonstration`.
 *
 * Les essais de bout en bout et la régression visuelle coupent la base sans ce réglage : ils
 * gardent le petit jeu, sur lequel ils sont écrits.
 */
export const DEMONSTRATION_SIMULEE =
    import.meta.env.VITE_FIREBASE_DISABLED === 'true' &&
    import.meta.env.VITE_DEMO_SIMULATION === 'true';

/**
 * Le code personnel des comptes de la simulation (`PIN_DE_SIMULATION`). Un visiteur ne peut
 * pas le deviner : l'attestation le lui dit, dans la démonstration seulement.
 */
export const CODE_DE_DEMONSTRATION = '123456';
