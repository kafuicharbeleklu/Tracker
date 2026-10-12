# Remontées de collecte : les trois chemins

Voir `backend/README.md` (le serveur) et `deployment/README.md` (les scripts).

## 1. Les agents, par le serveur de collecte

Les postes envoient leur relevé au serveur (`POST /api/agent/checkin`, clé dans l'en-tête
`x-api-key`). Le serveur l'écrit dans Firestore ; la machine paraît dans l'application sans
autre geste.

## 2. Un lot, par le serveur

Un export d'annuaire, un fichier de scan réseau ou une reprise : `POST /api/agent/checkin/batch`
(tableau JSON, objet `{ "checkins": [...] }`, ou une remontée par ligne), ou les scripts
`deployment/host/`.

## 3. Un fichier, à la main, dans l'application

Paramètres, Règles de l'organisation, Sources de collecte, « Importer des fichiers de
remontée ». Les mêmes formats. Sert sans serveur, pour un essai ou une reprise ponctuelle.

Fichiers d'exemple : `agent-checkin-schema-v1.example.json`, `agent-checkin-batch.sample.json`,
`agent-checkin-batch.sample.ndjson`.

## Ce que devient une machine remontée

| Elle ressemble à… | Statut | Dans Tâches |
|---|---|---|
| un actif du parc, sans doute possible (même UUID ou même numéro de série) | reconnue | non |
| deux actifs à la fois | correspondance à confirmer | oui |
| aucun actif, ou un seul vaguement | à valider | oui |

- **Importer au parc** crée l'actif, au lieu que la machine indique ou laisse déduire.
- **Ignorer** est définitif : les remontées suivantes mettent ses faits à jour sans la
  remettre dans Tâches.
- « Validation manuelle obligatoire », éteinte, ne vaut que pour un fichier déposé à la main :
  une machine venue du serveur attend toujours dans Tâches si le parc ne la connaît pas.

## Le schéma

`schema: "neemba.agent.checkin.v1"`. Sources : `agent`, `active_directory`, `network_scan`.
L'ancienne écriture à plat reste lue, clé dans le corps comprise.
