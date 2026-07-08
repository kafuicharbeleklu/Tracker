# Import Check-in Agent (Test)

## Fichiers fournis

- `docs/audit/agent-checkin-schema-v1.example.json`
- `docs/audit/agent-checkin-batch.sample.json`
- `docs/audit/agent-checkin-batch.sample.ndjson`
- `deployment/gpo/Neemba-Agent-Checkin.ps1`
- `deployment/gpo/Install-NeembaAgentTask.ps1`
- `deployment/gpo/Uninstall-NeembaAgentTask.ps1`
- `deployment/host/Invoke-NeembaBatchImport.ps1`

## Où importer

1. Ouvrir `Paramètres`
2. Aller dans l'onglet `Collecte automatique`
3. Dans `Import batch check-in`, glisser-déposer un ou plusieurs fichiers

## Mode API direct (recommandé pour GPO/Intune)

Vous pouvez envoyer les check-ins directement vers l'API backend:

- Endpoint: `POST /api/agent/checkin`
- Exemple local: `http://localhost:8787/api/agent/checkin`
- Clé API: `auth.apiKey` (ou `apiKey` legacy)

Lancer le backend:

```bash
npm run backend:agent
```

## Comportement attendu

- Si `Validation manuelle obligatoire` est activée:
  - les machines remontées vont dans `Machines détectées` avec statut `À valider`
- Si désactivée:
  - le système fait un upsert direct dans l'inventaire
  - le statut dans la file devient `Importé`
- En cas de correspondance ambiguë:
  - statut `Ambigu`
  - revue IT obligatoire

## Schema versionné supporté

- `schema: "neemba.agent.checkin.v1"`
- clé agent attendue: `auth.apiKey` (ou `apiKey` en legacy)

Les formats legacy restent acceptés pour faciliter les tests.

## Script agent (référence)

Le script `deployment/gpo/Neemba-Agent-Checkin.ps1` inclut:

- collecte hardware / OS / user / apps
- envoi HTTPS check-in
- file locale offline JSONL
- retry automatique des check-ins en attente
