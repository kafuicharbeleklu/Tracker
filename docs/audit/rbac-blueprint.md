# RBAC Blueprint (Current State)

## Core model implemented
- Entities:
  - `RbacRole` (system + custom),
  - `RbacGroup` (multi-role),
  - `UserAccessAssignment` (direct user overrides),
  - `WorkflowDefinition` + step conditions/timeouts (data model ready).
- Resolution rules:
  - priority: `user_direct > group > role inherited`,
  - tie-break: `deny` wins on same priority,
  - each conflict is captured (`winner` + `losers`).
- Auth policy merge:
  - restrictive merge by default (methods union, shortest session max, strongest step-up flag).
- Scopes:
  - global/country/site/service/team/self/custom scope constraints are supported by the model.

## Default roles/groups seeded
- System roles:
  - `SuperAdmin` (immutable),
  - `Admin`,
  - `Manager`,
  - `Employé`.
- Custom roles (seed):
  - `RH`,
  - `Comptable`,
  - `Auditeur externe`,
  - `Responsable sécurité`.
- Groups (seed):
  - `IT France`, `IT Sénégal`,
  - `Validation Finance`,
  - `Opérateurs Audit`,
  - `Auditeurs externes`.

## App integration
- `useAccessControl` now resolves effective permissions from full RBAC assignment
  (role + groups + direct user overrides).
- Navigation guards are aligned with view permissions (`view.*`) and action permissions (`action.*`).
- `DataContext` now persists RBAC states (`roles`, `groups`, `assignments`, `workflows`) in local storage
  and exposes management methods (`upsert/delete` + effective access resolver).
- User type now supports RBAC overrides:
  - `rbacRoleIds`, `rbacGroupIds`,
  - `rbacDirectPermissions`,
  - `rbacTemporaryRoles`,
  - `rbacAuthPolicyOverride`,
  - `rbacDataScopeOverrides`.
- Mock users include representative RBAC assignments for demo/testing.

## Files
- `src/types/rbac.ts`
- `src/lib/rbac.ts`
- `src/config/rbacDefaults.ts`
- `src/hooks/useAccessControl.ts`
- `src/lib/businessRules.ts`
- `src/types/index.ts`

## Next phases
- Phase 2:
  - add admin UI:
    - left panel roles list (system/custom),
    - right panel tabs: Permissions, Workflow, Auth, Members.
- Phase 3:
  - workflow pipeline editor:
    - required/optional steps,
    - timeout + escalation,
    - conditional branches (e.g. amount threshold).
- Phase 4:
  - role simulation UI (`preview as role/group`),
  - explicit conflict resolver for contradictory group permissions.
