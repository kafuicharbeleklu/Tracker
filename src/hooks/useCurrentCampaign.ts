import { useMemo } from 'react';

import { useData } from '../context/DataContext';

/**
 * **L'inventaire physique qui tourne en ce moment** — la carte « Inventaire en cours »
 * que la passe du 05/09 ajoute à l'accueil (03.1), entre « Le parc » et « Types en
 * tension ».
 *
 * L'accueil ne redessine pas 16.1 : il en montre **le lieu ouvert, sa progression et
 * ses écarts**, puis rend la main à la campagne. C'est la seule carte de l'écran qui
 * mène à un travail commencé plutôt qu'à une liste.
 *
 * ## Ce qu'« en cours » veut dire, et pourquoi le calcul est ici
 *
 * Un lieu est en cours quand **on l'a scanné sans en avoir fait le tour** : au moins un
 * objet retrouvé, pas tous. Avant le premier scan il n'y a rien à reprendre ; après le
 * dernier, il n'y a plus rien à faire — dans les deux cas la carte n'existe pas, parce
 * qu'une carte « Inventaire en cours » qui annonce 0 % ou 100 % ne demande aucun geste.
 *
 * Le périmètre est le **site**, le premier niveau de 16.1 — c'est ce que la planche
 * nomme (« Lomé Siège »). Les locaux sont le second niveau, et ils appartiennent à la
 * campagne, pas à son résumé.
 *
 * Un **écart** se compte comme en 16.1 : les alignements de scan, ceux qu'il faudra
 * trancher. Pas les manquants — tant que le tour du lieu n'est pas fini, ce qui n'a pas
 * encore été vu n'est pas perdu (règle V2).
 */

export interface CurrentCampaign {
    country: string;
    /** Le lieu compté, tel que la carte le nomme. */
    site: string;
    expected: number;
    found: number;
    /** La part du parc du lieu retrouvée, en pourcentage entier. */
    progress: number;
    /** Les écarts relevés, à trancher dans la campagne. */
    ecarts: number;
    /** Le premier scan de ce lieu — « commencée hier ». */
    startedAt: string;
}

const normalize = (value?: string): string => (value || '').trim().toLowerCase();
const readString = (value: unknown): string => (typeof value === 'string' ? value : '');

export const useCurrentCampaign = (): CurrentCampaign | null => {
    const { equipment, events } = useData();

    return useMemo(() => {
        /* `audit_scan_alignment` commence lui aussi par `audit_scan` : les deux sources
           se lisent à l'égalité, jamais au préfixe. */
        const comptages = events.filter(
            (event) =>
                event.targetType === 'EQUIPMENT' &&
                readString(event.metadata?.source) === 'audit_scan',
        );
        if (comptages.length === 0) return null;

        /* Le lieu du scan le plus récent : c'est là que quelqu'un compte. */
        const dernier = comptages.reduce((recent, event) =>
            new Date(event.timestamp).getTime() > new Date(recent.timestamp).getTime()
                ? event
                : recent,
        );
        const country = readString(dernier.metadata?.scopeCountry);
        const site = readString(dernier.metadata?.scopeSite);
        if (!site) return null;

        const memeLieu = (paysLu: string, siteLu: string) =>
            normalize(paysLu) === normalize(country) && normalize(siteLu) === normalize(site);

        const duLieu = equipment.filter((item) =>
            memeLieu(item.country || 'Togo', item.site || ''),
        );
        const expected = duLieu.length;
        if (expected === 0) return null;

        const identifiants = new Set(duLieu.map((item) => item.id));
        const vus = new Set<string>();
        comptages.forEach((event) => {
            if (
                !memeLieu(
                    readString(event.metadata?.scopeCountry),
                    readString(event.metadata?.scopeSite),
                )
            )
                return;
            if (event.targetId && identifiants.has(event.targetId)) vus.add(event.targetId);
        });

        const found = vus.size;
        if (found === 0 || found >= expected) return null;

        const ecarts = events.filter(
            (event) =>
                event.targetType === 'EQUIPMENT' &&
                readString(event.metadata?.source) === 'audit_scan_alignment' &&
                memeLieu(
                    readString(event.metadata?.scopeCountry),
                    readString(event.metadata?.scopeSite),
                ),
        ).length;

        const startedAt = comptages
            .filter((event) =>
                memeLieu(
                    readString(event.metadata?.scopeCountry),
                    readString(event.metadata?.scopeSite),
                ),
            )
            .reduce(
                (premier, event) =>
                    new Date(event.timestamp).getTime() < new Date(premier).getTime()
                        ? event.timestamp
                        : premier,
                dernier.timestamp,
            );

        return {
            country,
            site,
            expected,
            found,
            progress: Math.round((found / expected) * 100),
            ecarts,
            startedAt,
        };
    }, [equipment, events]);
};
