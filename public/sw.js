/*
 * **Le service worker du Tracker** (08/10) — il ne fait qu'une chose : porter les notifications
 * système. Sur Android, une page ne peut pas en afficher elle-même (`new Notification` y est
 * refusé) ; elle passe par lui (`registration.showNotification`).
 *
 * Il n'intercepte aucune requête : pas de `fetch`, donc pas de cache hors ligne qui servirait
 * une version périmée de l'application après une publication.
 */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

/* Toucher la notification ramène à l'application, sur la tâche qu'elle annonce. */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const adresse = event.notification.data?.adresse ?? '';
    event.waitUntil(
        (async () => {
            const fenetres = await self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true,
            });
            const fenetre = fenetres[0];
            if (fenetre) {
                await fenetre.focus();
                fenetre.postMessage({ type: 'tracker:ouvrir', adresse });
                return;
            }
            await self.clients.openWindow(`${self.registration.scope}#${adresse}`);
        })(),
    );
});
