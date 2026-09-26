import { useCallback, useEffect, useRef, useState } from 'react';

/** Le temps pendant lequel une décision se défait — puis elle s'écrit. */
export const DELAI_ANNULATION_MS = 5000;

export interface DecisionEnSuspens {
    /** Ce que le bandeau dit — « Demande validée · Dell P2423 ». */
    message: string;
    /** Les tâches que la décision retire de la file, le temps qu'elle s'écrive. */
    tachesIds: string[];
    /** L'écriture elle-même ; renvoie le motif d'un refus de la règle, ou `null`. */
    ecrire: () => string | null;
    /** Ce que l'annulation rend : d'ordinaire, la tâche rouverte. */
    surAnnulation?: () => void;
}

/**
 * **Décider, puis pouvoir se reprendre** (26/09) — le « Annuler » de Gmail et de Linear,
 * plutôt qu'une confirmation avant.
 *
 * La décision n'est **pas écrite** pendant cinq secondes : sa tâche quitte la file, le
 * bandeau propose de l'annuler, et c'est seulement ensuite que la règle l'écrit. Défaire
 * ne demande donc aucun retour arrière dans la machine à états — il n'y a rien à défaire.
 *
 * Une seule décision attend à la fois : la suivante écrit la précédente. Quitter la page,
 * ou la fenêtre, écrit ce qui attendait — une décision prise ne se perd pas.
 */
export const useDecisionDifferee = (surEchec: (motif: string) => void) => {
    const [enSuspens, setEnSuspens] = useState<(DecisionEnSuspens & { cle: number }) | null>(null);
    const courante = useRef<DecisionEnSuspens | null>(null);
    const minuteur = useRef<number | undefined>(undefined);
    const echec = useRef(surEchec);
    echec.current = surEchec;

    const ecrireLaCourante = useCallback(() => {
        window.clearTimeout(minuteur.current);
        const decision = courante.current;
        courante.current = null;
        if (!decision) return;
        const motif = decision.ecrire();
        if (motif) echec.current(motif);
    }, []);

    const decider = useCallback(
        (decision: DecisionEnSuspens) => {
            ecrireLaCourante();
            courante.current = decision;
            setEnSuspens({ ...decision, cle: Date.now() });
            minuteur.current = window.setTimeout(() => {
                ecrireLaCourante();
                setEnSuspens(null);
            }, DELAI_ANNULATION_MS);
        },
        [ecrireLaCourante],
    );

    const annuler = useCallback(() => {
        window.clearTimeout(minuteur.current);
        const decision = courante.current;
        courante.current = null;
        setEnSuspens(null);
        decision?.surAnnulation?.();
    }, []);

    /* Quitter la page ou la fenêtre écrit ce qui attendait. */
    useEffect(() => {
        window.addEventListener('pagehide', ecrireLaCourante);
        return () => {
            window.removeEventListener('pagehide', ecrireLaCourante);
            ecrireLaCourante();
        };
    }, [ecrireLaCourante]);

    return { enSuspens, decider, annuler };
};
