/**
 * **Peut-on écrire dans Firestore, maintenant ?** — avant de vider une base, on s'en assure.
 *
 * Le 26/09, un chargement a vidé la base puis n'a rien pu réécrire : le quota quotidien
 * d'écritures du forfait gratuit était épuisé (429, RESOURCE_EXHAUSTED), et les suppressions,
 * comptées à part, étaient passées. Le SDK d'administration, lui, retente une écriture refusée
 * pendant de longues minutes sans rien dire. Cette sonde passe par l'API REST, qui répond tout
 * de suite : elle écrit puis efface un document témoin (`meta/_sonde_ecriture`).
 *
 * Rend `{ ok: true }` ou `{ ok: false, raison }`.
 */
import { cert } from 'firebase-admin/app';

export const sonderEcriture = async (serviceAccount) => {
    try {
        const { access_token: jeton } = await cert(serviceAccount).getAccessToken();
        const base = `https://firestore.googleapis.com/v1/projects/${serviceAccount.project_id}/databases/(default)/documents`;
        const entetes = { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' };
        const ecriture = await fetch(`${base}/meta/_sonde_ecriture`, {
            method: 'PATCH',
            headers: entetes,
            body: JSON.stringify({ fields: { at: { stringValue: new Date().toISOString() } } }),
            signal: AbortSignal.timeout(30_000),
        });
        if (!ecriture.ok) {
            const corps = await ecriture.text();
            const quota = ecriture.status === 429 || /RESOURCE_EXHAUSTED|Quota/i.test(corps);
            return {
                ok: false,
                raison: quota
                    ? 'quota quotidien d’écritures Firestore épuisé (429). Il se réinitialise à minuit heure du Pacifique (07:00 UTC) ; le forfait Blaze le lève tout de suite.'
                    : `écriture refusée (${ecriture.status}) : ${corps.slice(0, 200)}`,
            };
        }
        await fetch(`${base}/meta/_sonde_ecriture`, {
            method: 'DELETE',
            headers: entetes,
            signal: AbortSignal.timeout(30_000),
        });
        return { ok: true };
    } catch (erreur) {
        return { ok: false, raison: `sonde impossible : ${erreur.message}` };
    }
};

/**
 * Un `BulkWriter` qui s'arrête net sur un quota épuisé au lieu de retenter pendant des minutes,
 * et qui compte ses échecs.
 */
export const ecrivainSurveille = (db) => {
    const ecrivain = db.bulkWriter();
    const bilan = { echecs: 0, quotaEpuise: false, premiereErreur: null };
    ecrivain.onWriteError((erreur) => {
        if (erreur.code === 8) {
            bilan.quotaEpuise = true;
            bilan.echecs += 1;
            bilan.premiereErreur ??= erreur.message;
            return false;
        }
        if (erreur.failedAttempts < 5) return true;
        bilan.echecs += 1;
        bilan.premiereErreur ??= erreur.message;
        return false;
    });
    return { ecrivain, bilan };
};
