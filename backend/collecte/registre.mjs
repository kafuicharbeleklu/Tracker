/**
 * **Le registre de la collecte** : ce que le serveur garde sur son disque.
 *
 * - `agent-checkins.jsonl`, le **journal** : chaque remontée reçue, dans l'ordre, sans la clé
 *   d'API. Il s'écrit aussitôt, et se tourne quand il grossit.
 * - `agent-machines.json`, le **registre** : une ligne par machine (première et dernière
 *   remontée, derniers faits connus), plus les identifiants de remontée déjà vus.
 *
 * Le registre se réécrit en différé (il serait réécrit en entier à chaque poste, sinon) et
 * par remplacement atomique. S'il manque ou s'il est en retard sur le journal après un arrêt
 * brutal, il se reconstruit en relisant le journal.
 */
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
    appendFile,
    mkdir,
    readFile,
    readdir,
    rename,
    stat,
    unlink,
    writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { clesDe, identifiantsDe, idDeMachine, memeMachine } from './identite.mjs';

const JOURNAL = 'agent-checkins.jsonl';
const REGISTRE = 'agent-machines.json';
const ANCIEN_INDEX = 'agent-checkin-index.json';

/** Les faits d'une machine : ce qu'une remontée peut en dire. */
const FAITS = [
    'machineName',
    'hostname',
    'assetId',
    'serialNumber',
    'biosUuid',
    'macAddress',
    'ipAddress',
    'domain',
    'os',
    'ram',
    'storage',
    'cpu',
    'type',
    'model',
    'userName',
    'userEmail',
    'country',
    'site',
    'service',
    'agentVersion',
];

/** Une machine vue par son agent le reste : il en sait plus que l'annuaire ou le réseau. */
const RANG = { agent: 3, active_directory: 2, network_scan: 1 };

/**
 * L'empreinte de ce qui vaut une écriture : l'adresse IP en est exclue, un portable en
 * change à chaque réseau.
 */
const empreinteDe = (machine) => {
    const { ipAddress: _ip, agentVersion: _version, ...stables } = machine.faits;
    return createHash('sha1')
        .update(JSON.stringify([machine.source, stables, machine.agents ?? null]))
        .digest('hex')
        .slice(0, 16);
};

const stampDeFichier = (date) => date.toISOString().replace(/[:.]/g, '-');

export const ouvrirLeRegistre = async ({
    dossier,
    maxIdentifiantsVus = 10_000,
    journalMaxOctets = 20 * 1024 * 1024,
    journauxGardes = 5,
    delaiDEcritureMs = 1500,
    horloge = () => new Date(),
} = {}) => {
    await mkdir(dossier, { recursive: true });
    const cheminJournal = join(dossier, JOURNAL);
    const cheminRegistre = join(dossier, REGISTRE);

    /** @type {Map<string, any>} */
    const machines = new Map();
    /** « uuid:… », « serie:… » → identifiant de machine. */
    const parCle = new Map();
    const vus = new Set();
    let tailleDuJournal = existsSync(cheminJournal) ? (await stat(cheminJournal)).size : 0;
    let recuesDepuisLeDemarrage = 0;
    let derniereRemontee = '';
    let ecritureEnAttente = null;
    let ecritureEnCours = Promise.resolve();
    let sale = false;

    const retenir = (identifiant) => {
        if (!identifiant) return;
        vus.delete(identifiant);
        vus.add(identifiant);
        while (vus.size > maxIdentifiantsVus) vus.delete(vus.values().next().value);
    };

    const indexer = (machine) => {
        for (const cle of clesDe(machine.identifiants)) {
            if (!parCle.has(cle)) parCle.set(cle, machine.id);
        }
    };

    /** La machine déjà connue que cette remontée désigne, ou rien. */
    const retrouver = (identifiants) => {
        for (const cle of clesDe(identifiants)) {
            const connue = machines.get(parCle.get(cle));
            if (connue && memeMachine(identifiants, connue.identifiants)) return connue;
        }
        return null;
    };

    /**
     * Ranger une remontée dans le registre, sans toucher au journal : sert à la réception
     * comme à la relecture du journal au démarrage.
     */
    const ranger = (remontee, recuLe) => {
        const identifiants = identifiantsDe(remontee);
        const connue = retrouver(identifiants);
        const machine = connue ?? {
            id: idDeMachine(remontee),
            source: remontee.source,
            sources: [],
            identifiants,
            faits: {},
            agents: undefined,
            premiereRemontee: remontee.scannedAt,
            derniereRemontee: remontee.scannedAt,
            recueLe: recuLe,
            remontees: 0,
            empreinte: '',
            pousseeLe: '',
            empreintePoussee: '',
        };
        /* Deux machines sans rien de commun ne peuvent pas tomber sur le même identifiant,
           sauf si une étiquette ou un nom abîmé les y amène : la seconde prend un suffixe. */
        if (!connue && machines.has(machine.id))
            machine.id = `${machine.id}_${randomUUID().slice(0, 6)}`;

        for (const nom of FAITS) {
            if (remontee[nom]) machine.faits[nom] = remontee[nom];
        }
        if (remontee.agents) machine.agents = { ...remontee.agents };
        if ((RANG[remontee.source] ?? 0) >= (RANG[machine.source] ?? 0))
            machine.source = remontee.source;
        if (!machine.sources.includes(remontee.source)) machine.sources.push(remontee.source);

        /* Les identifiants s'enrichissent : une machine connue par son nom reçoit son UUID
           le jour où son agent remonte. */
        const relus = identifiantsDe(machine.faits);
        for (const nom of Object.keys(relus)) {
            if (relus[nom]) machine.identifiants[nom] = relus[nom];
        }

        if (remontee.scannedAt < machine.premiereRemontee)
            machine.premiereRemontee = remontee.scannedAt;
        if (remontee.scannedAt > machine.derniereRemontee)
            machine.derniereRemontee = remontee.scannedAt;
        machine.recueLe = recuLe;
        machine.remontees += 1;
        machine.empreinte = empreinteDe(machine);

        machines.set(machine.id, machine);
        indexer(machine);
        if (recuLe > derniereRemontee) derniereRemontee = recuLe;
        return { machine, nouvelle: !connue };
    };

    const ecrireLeRegistre = async () => {
        sale = false;
        const contenu = JSON.stringify({
            version: 1,
            enregistreLe: horloge().toISOString(),
            machines: [...machines.values()],
            vus: [...vus],
        });
        const provisoire = `${cheminRegistre}.${process.pid}.tmp`;
        await writeFile(provisoire, contenu, 'utf8');
        await rename(provisoire, cheminRegistre);
    };

    const programmerLEcriture = () => {
        sale = true;
        if (ecritureEnAttente) return;
        ecritureEnAttente = setTimeout(() => {
            ecritureEnAttente = null;
            ecritureEnCours = ecritureEnCours.then(ecrireLeRegistre).catch((erreur) => {
                sale = true;
                console.error('[collecte] registre non écrit :', erreur.message);
            });
        }, delaiDEcritureMs);
        ecritureEnAttente.unref?.();
    };

    const lireLesLignes = async (chemin) => {
        if (!existsSync(chemin)) return [];
        const lignes = [];
        for (const ligne of (await readFile(chemin, 'utf8')).split(/\r?\n/)) {
            if (!ligne) continue;
            try {
                lignes.push(JSON.parse(ligne));
            } catch {
                /* Une ligne coupée par un arrêt brutal ne condamne pas les autres. */
            }
        }
        return lignes;
    };

    const journauxTournes = async () =>
        (await readdir(dossier)).filter((nom) => /^agent-checkins-.+\.jsonl$/.test(nom)).sort();

    const tournerLeJournal = async () => {
        await rename(
            cheminJournal,
            join(dossier, `agent-checkins-${stampDeFichier(horloge())}.jsonl`),
        );
        tailleDuJournal = 0;
        const tournes = await journauxTournes();
        for (const ancien of tournes.slice(0, Math.max(0, tournes.length - journauxGardes))) {
            await unlink(join(dossier, ancien)).catch(() => {});
        }
    };

    /* ── Au démarrage : le registre, puis ce que le journal sait de plus ──────────── */
    let enregistreLe = '';
    try {
        const lu = JSON.parse(await readFile(cheminRegistre, 'utf8'));
        for (const machine of Array.isArray(lu.machines) ? lu.machines : []) {
            if (!machine?.id) continue;
            machines.set(machine.id, machine);
            indexer(machine);
            if (machine.recueLe > derniereRemontee) derniereRemontee = machine.recueLe;
        }
        for (const identifiant of Array.isArray(lu.vus) ? lu.vus : []) retenir(identifiant);
        enregistreLe = typeof lu.enregistreLe === 'string' ? lu.enregistreLe : '';
    } catch {
        /* Pas de registre, ou illisible : tout le journal sera relu. L'ancien index des
           remontées vues, s'il existe, évite de reprendre ce qui a déjà été traité. */
        try {
            const ancien = JSON.parse(await readFile(join(dossier, ANCIEN_INDEX), 'utf8'));
            for (const identifiant of ancien?.seenCheckinIds ?? []) retenir(String(identifiant));
        } catch {
            /* Aucun index non plus : première ouverture. */
        }
    }

    const aRelire = enregistreLe
        ? [cheminJournal]
        : [...(await journauxTournes()).map((nom) => join(dossier, nom)), cheminJournal];
    let relues = 0;
    for (const chemin of aRelire) {
        for (const ligne of await lireLesLignes(chemin)) {
            if (!ligne?.payload || !ligne.receivedAt) continue;
            if (enregistreLe && ligne.receivedAt <= enregistreLe) continue;
            const { apiKey: _cle, ...remontee } = ligne.payload;
            if (!remontee.scannedAt || !idDeMachine(remontee)) continue;
            if (remontee.agents && typeof remontee.agents !== 'object') remontee.agents = undefined;
            ranger({ source: 'agent', ...remontee }, ligne.receivedAt);
            retenir(remontee.checkinId);
            relues += 1;
        }
    }
    if (relues > 0) await ecrireLeRegistre();

    return {
        relues,

        /**
         * Recevoir des remontées déjà lues et autorisées. Le journal s'écrit avant de rendre
         * la main : une remontée acquittée est sur le disque.
         */
        async recevoir(remontees, { ipSource = '' } = {}) {
            const recuLe = horloge().toISOString();
            const lignes = [];
            const resultats = remontees.map((remontee) => {
                if (vus.has(remontee.checkinId)) {
                    return { doublon: true, checkinId: remontee.checkinId };
                }
                retenir(remontee.checkinId);
                const enregistrement = {
                    id: randomUUID(),
                    receivedAt: recuLe,
                    sourceIp: ipSource,
                    payload: remontee,
                };
                lignes.push(JSON.stringify(enregistrement));
                const { machine, nouvelle } = ranger(remontee, recuLe);
                recuesDepuisLeDemarrage += 1;
                return {
                    doublon: false,
                    checkinId: remontee.checkinId,
                    idEnregistre: enregistrement.id,
                    machine,
                    nouvelle,
                };
            });

            if (lignes.length > 0) {
                const bloc = `${lignes.join('\n')}\n`;
                const octets = Buffer.byteLength(bloc);
                if (tailleDuJournal > 0 && tailleDuJournal + octets > journalMaxOctets) {
                    await tournerLeJournal();
                }
                await appendFile(cheminJournal, bloc, 'utf8');
                tailleDuJournal += octets;
                programmerLEcriture();
            }
            return resultats;
        },

        /** Les machines connues, la plus récemment vue d'abord. */
        machines({ depuis = '', source = '', limite = 500 } = {}) {
            return [...machines.values()]
                .filter((machine) => !depuis || machine.recueLe > depuis)
                .filter((machine) => !source || machine.sources.includes(source))
                .sort((a, b) => (a.recueLe < b.recueLe ? 1 : -1))
                .slice(0, limite);
        },

        machine: (id) => machines.get(id) ?? null,

        /** Les dernières remontées du journal courant, la plus récente d'abord. */
        async dernieresRemontees({ limite = 25, depuis = '' } = {}) {
            const lignes = await lireLesLignes(cheminJournal);
            return lignes
                .filter((ligne) => !depuis || ligne.receivedAt > depuis)
                .slice(-limite)
                .reverse()
                .map(({ payload, ...reste }) => {
                    const { apiKey: _cle, ...remontee } = payload ?? {};
                    return { ...reste, payload: remontee };
                });
        },

        /**
         * Les machines dont Firestore n'a pas le dernier état : jamais poussées, changées
         * depuis, ou dont la dernière vue date de plus de `rafraichirApresMs`.
         */
        aPousser({ rafraichirApresMs = 24 * 3600 * 1000 } = {}) {
            const maintenant = horloge().getTime();
            return [...machines.values()].filter((machine) => {
                if (!machine.pousseeLe) return true;
                if (machine.empreinte !== machine.empreintePoussee) return true;
                return (
                    machine.derniereRemontee > machine.pousseeLe &&
                    maintenant - Date.parse(machine.pousseeLe) >= rafraichirApresMs
                );
            });
        },

        marquerPoussee(id, empreinte) {
            const machine = machines.get(id);
            if (!machine) return;
            machine.pousseeLe = horloge().toISOString();
            machine.empreintePoussee = empreinte;
            programmerLEcriture();
        },

        etat() {
            return {
                machines: machines.size,
                derniereRemontee: derniereRemontee || null,
                recuesDepuisLeDemarrage,
            };
        },

        /** Écrire ce qui attend : à l'arrêt, et dans les tests. */
        async fermer() {
            if (ecritureEnAttente) {
                clearTimeout(ecritureEnAttente);
                ecritureEnAttente = null;
            }
            await ecritureEnCours;
            if (sale) await ecrireLeRegistre();
        },
    };
};
