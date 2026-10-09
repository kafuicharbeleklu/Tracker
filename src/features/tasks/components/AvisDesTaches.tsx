import React, { useCallback, useEffect, useRef, useState } from 'react';

import BandeauDAvis from '../../../components/ui/BandeauDAvis';
import { useData } from '../../../context/DataContext';
import {
    demanderLesNotifications,
    notifierLeSysteme,
    pastilleDeLApplication,
    permissionDesNotifications,
    sonner,
    vibrer,
} from '../../../lib/avis';
import { useFileDeTaches } from '../hooks/useFileDeTaches';
import { NATURE_MOT, type Task } from '../lib/file';

/**
 * **Le signal d'une tâche qui arrive** (08/10) — comme un message : le bandeau en haut de
 * l'écran, deux notes, une vibration, et la notification du système quand l'application
 * n'est pas sous les yeux.
 *
 * Il ne parle que de ce qu'un **autre appareil** a changé (`dernierChangementDistant`) : la
 * tâche qu'on vient de se créer d'un geste n'est pas une nouvelle. Trois cas :
 * - une tâche entre dans « À faire » — « Nouvelle tâche » ;
 * - une demande suivie avance — elle change de main ;
 * - une demande suivie se clôt — reçue, refusée ou annulée.
 */

interface Avis {
    id: string;
    titre: string;
    corps: string;
    /** L'adresse à ouvrir, sans le `#`. */
    adresse: string;
}

const DUREE_DU_BANDEAU_MS = 7000;
const CLE_INVITATION = 'tracker:avis-invitation';

/**
 * Où mène l'avis : la tâche, ouverte — le panneau au bureau, sa feuille au téléphone (08/10).
 */
const adresseDe = (tache: Task) => `/tasks?ouvert=${encodeURIComponent(tache.id)}`;

const ligneDe = (tache: Task) =>
    [tache.askedBy ?? tache.who, tache.context].filter(Boolean).join(' · ');

const AvisDesTaches: React.FC = () => {
    const taches = useFileDeTaches();
    const { approvals, isHydrating, dernierChangementDistant } = useData();

    const connues = useRef<Map<string, Task> | null>(null);
    const distantVu = useRef<number | null>(null);
    const [avis, setAvis] = useState<Avis | null>(null);
    const [invitation, setInvitation] = useState(false);

    /* La pastille de l'icône installée suit « À faire ». */
    const aFaire = taches.filter((tache) => tache.scope === 'todo').length;
    useEffect(() => {
        if (!isHydrating) pastilleDeLApplication(aFaire);
    }, [aFaire, isHydrating]);

    useEffect(() => {
        if (isHydrating) return;
        const actuelles = new Map(taches.map((tache) => [tache.id, tache]));
        const precedentes = connues.current;
        connues.current = actuelles;
        const distant =
            dernierChangementDistant !== null && dernierChangementDistant !== distantVu.current;
        distantVu.current = dernierChangementDistant;
        /* La première lecture fait l'état connu ; un geste d'ici ne sonne pas. */
        if (!precedentes || !distant) return;

        const avisRecus: Avis[] = [];
        const arrivees = taches.filter(
            (tache) => tache.scope === 'todo' && !precedentes.has(tache.id),
        );
        if (arrivees.length > 0) {
            const premiere = arrivees[0];
            avisRecus.push({
                id: `arrivee-${premiere.id}`,
                titre:
                    arrivees.length > 1
                        ? `${arrivees.length} nouvelles tâches`
                        : `Nouvelle tâche · ${NATURE_MOT[premiere.nature]}`,
                corps: [premiere.title, ligneDe(premiere)].filter(Boolean).join(' — '),
                adresse: adresseDe(premiere),
            });
        }

        for (const tache of taches) {
            const avant = precedentes.get(tache.id);
            if (
                tache.scope !== 'following' ||
                !avant ||
                (avant.nature === tache.nature && avant.context === tache.context)
            ) {
                continue;
            }
            avisRecus.push({
                id: `avance-${tache.id}-${tache.nature}-${tache.context}`,
                titre: `Demande mise à jour · ${NATURE_MOT[tache.nature]}`,
                corps: [tache.title, tache.context].filter(Boolean).join(' — '),
                adresse: adresseDe(tache),
            });
        }

        for (const avant of precedentes.values()) {
            if (avant.scope !== 'following' || actuelles.has(avant.id) || !avant.approvalId) {
                continue;
            }
            /* Passée dans « À faire », elle est déjà annoncée comme nouvelle tâche. */
            if (arrivees.some((tache) => tache.approvalId === avant.approvalId)) continue;
            const statut = approvals.find((demande) => demande.id === avant.approvalId)?.status;
            const issue =
                statut === 'Completed'
                    ? 'Demande aboutie'
                    : statut === 'Rejected'
                      ? 'Demande refusée'
                      : statut === 'Cancelled'
                        ? 'Demande annulée'
                        : null;
            if (!issue) continue;
            avisRecus.push({
                id: `close-${avant.id}-${statut}`,
                titre: issue,
                corps: avant.title,
                /* Close, elle n'a plus de tâche : son parcours se lit dans l'historique. */
                adresse: '/history',
            });
        }

        if (avisRecus.length === 0) return;
        const principal = avisRecus[0];
        setAvis(principal);
        sonner();
        vibrer();
        if (document.visibilityState === 'hidden') {
            avisRecus.forEach(
                (recu) =>
                    void notifierLeSysteme({
                        titre: recu.titre,
                        corps: recu.corps,
                        adresse: recu.adresse,
                        etiquette: recu.id,
                    }),
            );
        }
    }, [taches, approvals, isHydrating, dernierChangementDistant]);

    /* Le bandeau s'efface seul ; le toucher ouvre la tâche. */
    useEffect(() => {
        if (!avis) return;
        const minuteur = window.setTimeout(() => setAvis(null), DUREE_DU_BANDEAU_MS);
        return () => window.clearTimeout(minuteur);
    }, [avis]);

    /*
     * **L'autorisation se demande une fois, par appareil**, et d'un geste — le navigateur
     * ignore une demande qu'aucun toucher n'a provoquée. L'invitation vient après la lecture,
     * pas à l'ouverture : on sait alors de quoi l'on parle.
     */
    useEffect(() => {
        if (isHydrating || permissionDesNotifications() !== 'default') return;
        if (navigator.webdriver) return;
        try {
            if (localStorage.getItem(CLE_INVITATION)) return;
        } catch {
            return;
        }
        const minuteur = window.setTimeout(() => setInvitation(true), 2500);
        return () => window.clearTimeout(minuteur);
    }, [isHydrating]);

    const fermerInvitation = useCallback(() => {
        setInvitation(false);
        try {
            localStorage.setItem(CLE_INVITATION, new Date().toISOString());
        } catch {
            /* Navigation privée : l'invitation reviendra, sans plus. */
        }
    }, []);

    const ouvrir = (adresse: string) => {
        window.location.hash = adresse;
        setAvis(null);
    };

    return (
        <BandeauDAvis
            avis={avis}
            onOuvrir={avis ? () => ouvrir(avis.adresse) : undefined}
            onFermer={() => setAvis(null)}
            invitation={
                invitation
                    ? {
                          texte: 'Être averti quand une tâche arrive, même l’application en arrière-plan ?',
                          onPlusTard: fermerInvitation,
                          onActiver: () => {
                              void demanderLesNotifications().finally(fermerInvitation);
                          },
                      }
                    : null
            }
        />
    );
};

export default AvisDesTaches;
