import * as identite from '../../backend/collecte/identite.mjs';

/**
 * **Reconnaître une machine d'une remontée à l'autre** : les règles sont celles du serveur
 * de collecte (`backend/collecte/identite.mjs`), lues ici telles quelles. Une machine déposée
 * à la main et la même machine remontée par son agent tombent ainsi sur le même identifiant,
 * donc sur le même document.
 */

export interface IdentifiantsDeMachine {
    uuid: string;
    serie: string;
    mac: string;
    actif: string;
    hote: string;
}

/** Ce qui suffit à désigner une machine : une remontée, une machine détectée ou un actif. */
export interface Designable {
    biosUuid?: string;
    serialNumber?: string;
    macAddress?: string;
    assetId?: string;
    hostname?: string;
    machineName?: string;
}

export const identifiantsDe = (machine: Designable): IdentifiantsDeMachine =>
    identite.identifiantsDe(machine);

/** L'identifiant du document, le même à chaque remontée ; vide si rien ne désigne la machine. */
export const idDeMachine = (machine: Designable): string => identite.idDeMachine(machine);

export const memeMachine = (a: IdentifiantsDeMachine, b: IdentifiantsDeMachine): boolean =>
    identite.memeMachine(a, b);

/** « uuid:… », « serie:… » : l'identifiant le plus sûr, gardé comme empreinte. */
export const empreinteDe = (machine: Designable): string =>
    identite.clesDe(identite.identifiantsDe(machine))[0] ?? '';
