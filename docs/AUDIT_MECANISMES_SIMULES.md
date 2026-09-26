# Audit — Mécanismes simulés (Chantier E)

> Pour chaque élément : **état réel**, **risque**, **recommandation**. Décisions à prendre ensemble — **je ne tranche pas seul, surtout la sécurité.**
> Date : 2026-07-01.

---

## 🔴 A. Sécurité (théâtre de sécurité — priorité)

### A1. PIN administrateur codé en dur
- **État** : `validateAdminPIN(pin)` compare à `ADMIN_PIN`, soit `VITE_ADMIN_PIN` si la variable est posée, soit **`1234`** par défaut (`lib/security.ts`). Utilisé par `SecurityGate` pour valider les actions sensibles (attribution, retour, ligne d'approbation).
- **Risque** : **quiconque connaît le code valide n'importe quelle action sensible.** Le PIN est en clair dans le code source livré.
- **Note du 18/08/2026** : la valeur est passée de `123456` à `1234` avec l'alignement du pavé sur `REGLES-TRANSVERSES.md` §2.1 — quatre caractères, sans exception. Le pavé de `SecurityGate` déclarait six cases, seul dans le produit ; un code de six chiffres n'y est plus saisissable. La valeur reste volontairement triviale : c'est un contrôle de démonstration vérifié côté client, et lui donner l'allure d'un secret ferait croire qu'il en est un.
- **Recommandation** : a minima **sortir le PIN du code** (variable d'env / config) ; cible réelle = vérification côté **backend** (hash), avec le Chantier A. Si c'est juste une **démo**, l'assumer explicitement.

### A2. Reconnaissance faciale « toujours OK »
- **État** (`components/security/FacialRecognitionScan.tsx`) : ouvre la vraie caméra, **mais** la barre de progression se remplit **toute seule** (+2 % / 50 ms) et appelle `onSuccess()` à 100 % — **aucune reconnaissance réelle**. Valide **n'importe qui** en ~2,5 s.
- **Risque** : **fausse sécurité** — pire que pas de biométrie (faux sentiment de confiance). Gate des actions sensibles.
- **Recommandation** : **retirer** (ou la reléguer explicitement en « démonstration visuelle »). La vraie biométrie (service tiers de face-match) est hors périmètre raisonnable ici.

### A3. Journal de sécurité = console uniquement
- **État** : `logSecurityAction(...)` (`lib/security.ts:17`) fait un `console.log`/`warn`, rien de persistant. Commentaire : « En production : appel API vers la table d'audit ».
- **Risque** : **aucune piste d'audit** des actions sensibles (non conforme à une exigence d'auditabilité).
- **Recommandation** : brancher sur le **journal `HistoryEvent`** (déjà persisté dans l'app, avec `isSensitive`) dès maintenant ; puis backend avec A.

---

## 🟡 B. « IA » marketing (aucune IA réelle)

### B1. Classification finance « IA »
- **État** : `classifyBudgetLine` (`FinanceManagementPage.tsx:40`) = « simulant une classification IA », **heuristiques** CAPEX/OPEX simples. L'UI affiche « Données pré-remplies par IA », « IA Note », « Type (IA) ».
- **Risque** : **promesse trompeuse** (parle d'IA sans IA) — problème de confiance si un utilisateur s'y fie.
- **Recommandation** : soit **rebrander honnêtement** (« détection automatique » / « règles »), soit **brancher une vraie classification**.

### B2. `GEMINI_API_KEY` morte
- **État** : exposée au build (`vite.config.ts` → `process.env.API_KEY`/`GEMINI_API_KEY`) mais **utilisée nulle part** dans `src/` (0 référence). `.env.local` = `PLACEHOLDER_API_KEY`.
- **Risque** : dette/confusion ; une clé exposée au bundle sans usage.
- **Recommandation** : **retirer** la clé et son injection Vite, **sauf** si on décide d'implémenter une vraie classification IA (B1) — auquel cas ⚠️ **envoi de données de factures à un LLM externe = coût + confidentialité** à valider.

---

## 🟢 C. Comportement / clarifications (non-sécurité)

### C1. Auto-approbation « provisoire »
- **État** (`NewRequestPage.tsx:85-89`) : `setTimeout` factice + commentaire « auto-approve step 1 » **non implémenté** — le code **crée simplement la demande** (calcule `isDelegated`).
- **Recommandation** : clarifier le comportement voulu (une demande déléguée doit-elle auto-valider l'étape 1 ?). Par défaut, cohérent avec le workflow (Chantier D) : **pas d'auto-approbation**, tout passe par les étapes. Retirer le `setTimeout` factice.

### C2. Login démo
- **État** : `DEMO_LOGIN_ENABLED = import.meta.env.DEV || VITE_ENABLE_DEMO_LOGIN === 'true'` (`AuthContext`). Déjà restreint au dev / flag explicite.
- **Recommandation** : **garder tel quel** ; s'assurer que le build prod ne met pas `VITE_ENABLE_DEMO_LOGIN=true`. (Peu risqué.)

### C3. Bloc « SIMULATION » de SettingsPage
- **État** (`SettingsPage.tsx:81`) : **faux positif** — c'est un **aperçu réel** du calcul d'amortissement (mensualité, valeur résiduelle), pas un stub.
- **Recommandation** : **renommer le commentaire** (« Aperçu amortissement ») pour lever l'ambiguïté. Rien à « débrancher ».

### C4. Rapports sur données mock
- **État** (`ReportsPage.tsx:19`) : CSV/PDF générés sur les données mock.
- **Recommandation** : **se résout via le Chantier A** (vraies données). Rien à faire d'ici là.

---

## Décisions requises
- **E-A1** PIN admin : démo assumée / env-config / vrai (backend) ?
- **E-A2** Reco faciale : retirer / garder en démo étiquetée / implémenter vrai ?
- **E-A3** Journal sécurité : brancher sur `HistoryEvent` / laisser console / backend seulement ?
- **E-B** « IA » finance + `GEMINI_API_KEY` : rebrander honnête + retirer la clé / implémenter vrai Gemini / laisser ?
- **E-C1** Auto-approbation : comportement définitif (pas d'auto / auto étape 1 pour délégué) ?

> C2/C3/C4 : je peux les traiter en autonomie (garder login démo gated, renommer le commentaire, rapports via A).
