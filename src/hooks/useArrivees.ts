import { useEffect, useRef, useState } from 'react';

const DUREE_DU_SIGNAL_MS = 1600;

/**
 * **Ce qui vient d'arriver dans une liste** (11/10) : les identifiants parus depuis qu'elle
 * est prête. La rangée qui les porte se signale une fois (`mvt-arrivee`), puis redevient une
 * rangée comme les autres.
 *
 * Une machine que le serveur de collecte vient d'écrire, une demande envoyée d'un autre
 * téléphone : elles entraient dans la file sans rien qui les distingue des trente autres.
 * Le premier remplissage ne signale rien (`pret` à faux tant que la page charge), et un
 * filtre qu'on change non plus : on passe ici la liste entière, pas ce qui est affiché.
 */
export const useArrivees = (ids: readonly string[], pret = true): ReadonlySet<string> => {
    const connus = useRef<Set<string> | null>(null);
    const fin = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [arrives, setArrives] = useState<ReadonlySet<string>>(() => new Set());

    useEffect(() => {
        if (!pret) return;
        const avant = connus.current;
        connus.current = new Set(ids);
        if (avant === null) return;
        const nouveaux = ids.filter((id) => !avant.has(id));
        if (nouveaux.length === 0) return;
        setArrives(new Set(nouveaux));
        if (fin.current) clearTimeout(fin.current);
        fin.current = setTimeout(() => setArrives(new Set()), DUREE_DU_SIGNAL_MS);
    }, [ids, pret]);

    useEffect(
        () => () => {
            if (fin.current) clearTimeout(fin.current);
        },
        [],
    );

    return arrives;
};
