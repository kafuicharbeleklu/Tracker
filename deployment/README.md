# Deployment Scripts (GPO / Host)

Ce dossier centralise les scripts de déploiement opérationnels Neemba Tracker.

## Structure

- `deployment/gpo/Neemba-Agent-Checkin.ps1`
  Script agent exécuté sur les postes (collecte + envoi + file offline/retry).
- `deployment/gpo/Install-NeembaAgentTask.ps1`
  Installe une tâche planifiée Windows pour exécuter l'agent à intervalle régulier.
- `deployment/gpo/Uninstall-NeembaAgentTask.ps1`
  Supprime la tâche planifiée et le script local de l'agent.
- `deployment/host/Invoke-NeembaBatchImport.ps1`
  Script hôte pour ingérer des fichiers JSON/NDJSON de check-in et les pousser vers l'API.

## Déploiement GPO (postes)

1. Copier `deployment/gpo/Neemba-Agent-Checkin.ps1` sur un partage accessible aux machines.
2. Déployer `deployment/gpo/Install-NeembaAgentTask.ps1` via GPO Startup/Logon script.
3. Paramétrer:
   - `-ApiUrl`
   - `-ApiKey`
   - `-IntervalMinutes`

### API côté Tracker (backend)

Lancer le service check-in:

```bash
npm run backend:agent
```

Par défaut, l'URL API à utiliser est:

`http://<host-tracker>:8787/api/agent/checkin`

Clé API attendue par défaut:

`NEEMBA_AGENT_KEY`

Vous pouvez la surcharger via variable d'environnement:

`NEEMBA_AGENT_API_KEY=<votre-cle>`

Exemple:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "\\srv\neemba\deployment\gpo\Install-NeembaAgentTask.ps1" `
  -ScriptSourcePath "\\srv\neemba\deployment\gpo\Neemba-Agent-Checkin.ps1" `
  -ApiUrl "https://neemba.example.com/api/agent/checkin" `
  -ApiKey "tracker-dev-2026" `
  -IntervalMinutes 240
```

## Déploiement hôte (import batch)

Exemple:

```powershell
powershell.exe -ExecutionPolicy Bypass -File ".\deployment\host\Invoke-NeembaBatchImport.ps1" `
  -InputPath "C:\neemba\incoming" `
  -ApiUrl "https://neemba.example.com/api/agent/checkin" `
  -ApiKey "tracker-dev-2026"
```
