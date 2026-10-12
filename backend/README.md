# Le serveur du Tracker : collecte des machines

Un serveur Node sans dépendance propre. Il reçoit ce que les postes, un export d'annuaire ou
un fichier de scan envoient, le range sur son disque et, si Firestore est branché, le pousse
vers l'application. Il porte aussi les routes d'administration des comptes (`/api/auth/*`).

```
postes (agent PowerShell)  ─┐
export d'annuaire          ─┼─►  serveur de collecte  ─►  Firestore  ─►  application (Tâches)
fichiers déposés           ─┘     journal + registre      detectedDevices
                                                           meta/collecte
```

L'application est une page statique : elle ne peut pas joindre un serveur du réseau local
depuis son adresse publique. Tout passe donc par Firestore, dans les deux sens.

| Ce que l'application règle (`meta/settings`) | Ce que le serveur en fait |
|---|---|
| « Source active » de l'agent, éteinte | refuse les remontées des agents (`403`, `source_inactive`) |

| Ce que le serveur écrit | Ce que l'application en fait |
|---|---|
| `detectedDevices/<machine>` : les faits d'une machine | la rapproche du parc, puis l'envoie dans Tâches si elle est inconnue |
| `meta/collecte` : sa dernière présence, ses décomptes | l'affiche dans Paramètres, Sources de collecte |

Le serveur n'écrit que **les faits** d'une machine. Le statut (à valider, ignorée, entrée au
parc) et le rapprochement restent à l'application : une machine ignorée le reste, quoi que
son agent renvoie.

## Lancer

```bash
npm run backend:agent
```

Sans clé posée, le serveur tourne avec les clés d'essai du dépôt (`NEEMBA_AGENT_KEY`,
`NEEMBA_ADMIN_KEY`). Elles sont publiques : il n'écoute alors que la machine locale
(`127.0.0.1`) et refuse de démarrer sur une autre adresse.

Pour l'ouvrir au réseau :

```bash
NEEMBA_AGENT_API_KEY="<clé des postes, longue et tirée au hasard>" \
NEEMBA_ADMIN_API_KEY="<clé d'administration, différente>" \
AGENT_SINK=firestore \
FIREBASE_ADMIN_CREDENTIALS=/chemin/compte-de-service.json \
npm run backend:agent
```

Générer une clé : `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.

Les postes parlent au serveur en clair s'il est joint en `http://` : la clé et les relevés
passent alors lisibles sur le réseau. Placez-le derrière un mandataire HTTPS (IIS, nginx,
Caddy) et posez `AGENT_TRUST_PROXY=1` pour qu'il lise l'adresse d'origine.

## Variables

| Variable | Défaut | Rôle |
|---|---|---|
| `NEEMBA_AGENT_API_KEY` | clé d'essai | Clé que les postes présentent. |
| `NEEMBA_AGENT_API_KEYS` | | Plusieurs clés, séparées par des virgules : pour en changer sans coupure. |
| `NEEMBA_ADMIN_API_KEY` | clé d'essai | Clé de lecture et d'administration. Jamais sur un poste. |
| `HOST` | `127.0.0.1` avec les clés d'essai, sinon `0.0.0.0` | Adresse d'écoute. |
| `PORT` | `8787` | Port. |
| `AGENT_DATA_DIR` | `backend/data` | Dossier du journal et du registre. |
| `AGENT_SINK` | (fichier) | `firestore` pour pousser vers l'application. |
| `FIREBASE_ADMIN_CREDENTIALS` | | Compte de service, quand `AGENT_SINK=firestore`. |
| `FIRESTORE_EMULATOR_HOST` | | L'émulateur, à la place du compte de service. |
| `AGENT_PUSH_REFRESH_HOURS` | `24` | Délai avant de redater une machine dont rien n'a changé. |
| `AGENT_MAX_BODY_BYTES` | 1 Mo | Taille d'une remontée. |
| `AGENT_MAX_BATCH_BYTES` | 8 Mo | Taille d'un lot. |
| `AGENT_MAX_BATCH_ITEMS` | `2000` | Remontées par lot. |
| `AGENT_JOURNAL_MAX_BYTES` | 20 Mo | Taille du journal avant qu'il se tourne (cinq anciens gardés). |
| `AGENT_RATE_PER_MINUTE` | `1200` | Remontées acceptées par adresse et par minute. |
| `AGENT_MAX_AUTH_FAILURES` | `20` | Clés fausses tolérées par adresse en cinq minutes. |
| `AGENT_ALLOWED_ORIGINS` | | Origines de navigateur admises, en plus de la machine locale. |
| `AGENT_TRUST_PROXY` | | `1` derrière un mandataire : lit `X-Forwarded-For`. |

Firestore ne se branche **que** sur `AGENT_SINK=firestore` : un essai local n'écrit jamais dans
la base publiée parce qu'un fichier d'identifiants traînait là.

## Routes

La clé des postes se présente dans l'en-tête `x-api-key` (ou `Authorization: Bearer`). Les
anciens agents qui la mettent dans le corps (`auth.apiKey`) restent acceptés ; elle n'est
jamais écrite sur le disque.

| Route | Clé | |
|---|---|---|
| `POST /api/agent/checkin` | postes | Une remontée. `201` enregistrée, `200` déjà traitée, `403` source éteinte. |
| `POST /api/agent/checkin/batch` | postes | Un lot : tableau JSON, `{ "checkins": [...] }`, ou une remontée par ligne. Chaque remontée a sa réponse. |
| `GET /api/agent/checkin/health` | aucune | Le service répond. Avec la clé d'administration : ses décomptes. |
| `GET /api/agent/checkin?limit=25&since=<date>` | administration | Les dernières remontées du journal. |
| `GET /api/agent/machines?source=agent&since=<date>` | administration | Une ligne par machine. |
| `GET /api/auth/users`, `POST /api/auth/users/:id/…` | administration | Les comptes (inchangé). |

La clé des postes n'ouvre aucune lecture : chaque poste la détient.

Une remontée suit le schéma `neemba.agent.checkin.v1` (`docs/audit/agent-checkin-schema-v1.example.json`) ;
l'ancienne écriture à plat reste lue. Sources admises : `agent`, `active_directory`, `network_scan`.

## Reconnaître une machine

Une machine se reconnaît à son UUID de BIOS, à défaut à son numéro de série, à défaut à son
adresse MAC, son étiquette d'actif ou son nom (`collecte/identite.mjs`, que l'application lit
aussi). Conséquences :

- un portable qui change de carte réseau (Wi-Fi, câble, station d'accueil) reste une machine ;
- deux UUID différents sont deux machines, même sous le même nom ;
- les valeurs d'usine (« To be filled by O.E.M. », des zéros) ne désignent rien ;
- un poste connu de l'annuaire par son seul nom est retrouvé le jour où son agent remonte.

## Sur le disque

- `agent-checkins.jsonl` : le journal, une remontée par ligne, écrit avant de répondre.
- `agent-checkins-<date>.jsonl` : les journaux tournés.
- `agent-machines.json` : le registre, réécrit en différé. S'il manque ou s'il est en retard
  après un arrêt brutal, il se reconstruit en relisant le journal.
- `auth-*.json` : les comptes.

## Ce que Firestore coûte

Une machine ne s'écrit que si elle est nouvelle, si ses faits ont changé (l'adresse IP ne
compte pas), ou une fois par jour pour dater sa dernière remontée. Cinq cents postes qui
remontent six fois par jour coûtent environ cinq cents écritures, pas trois mille. Si
Firestore refuse (quota, coupure), les machines attendent dans le registre et repartent
seules, de trente secondes à une heure plus tard.

## Essais

```bash
npm run backend:test
FIRESTORE_EMULATOR_HOST=127.0.0.1:8086 npm run backend:test   # avec la poussée vers Firestore
```

Les essais montent un vrai serveur sur un port libre. Ceux de PowerShell lancent les scripts
de `deployment/` contre lui et sont passés si `pwsh` est absent ; hors de Windows, le relevé
du poste (WMI) y est remplacé par un relevé d'essai.
