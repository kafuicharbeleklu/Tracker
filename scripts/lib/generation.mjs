/**
 * **Annoncer une nouvelle génération des données** (27/09) — `meta/synchro.generation`.
 *
 * Les navigateurs gardent les collections dans un cache local et, à chaque ouverture, ne
 * relisent que les documents écrits depuis (le champ `_maj`, posé par l'application). Un script
 * écrit sans ce champ : sans annonce, ses documents ne seraient jamais relus. Tout script qui
 * remplace ou corrige des données appelle donc cette fonction **une fois ses écritures
 * faites** ; chaque navigateur relit alors la base en entier à sa prochaine ouverture.
 */
export const annoncerNouvelleGeneration = async (db, motif) => {
    const generation = `${new Date().toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
    await db
        .collection('meta')
        .doc('synchro')
        .set({ generation, motif, le: new Date().toISOString() });
    return generation;
};
