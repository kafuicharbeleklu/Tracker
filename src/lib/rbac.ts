import {
    AuthenticationPolicy,
    EffectiveAccessProfile,
    EffectivePermissionDecision,
    PermissionAccessLevel,
    PermissionCandidate,
    PermissionConflict,
    PermissionEffect,
    PermissionKey,
    PermissionRule,
    ResolveEffectiveAccessInput,
    RbacGroup,
    RbacRole,
    ScopeConstraint,
    UserAccessAssignment,
} from '../types/rbac';

const DEFAULT_AUTH_POLICY: AuthenticationPolicy = {
    requiredMethods: ['password'],
    sessionMaxMinutes: 480,
    requireStepUpForSensitiveActions: false,
};

const ACCESS_RANK: Record<PermissionAccessLevel, number> = {
    none: 0,
    read: 1,
    write: 2,
    delete: 3,
};

const SOURCE_PRIORITY = {
    role: 1,
    group: 2,
    user_direct: 3,
} as const;

const uniqueStrings = (values: string[]): string[] => Array.from(new Set(values.filter(Boolean)));

const normalizeRule = (
    rule: PermissionRule,
    sourceKind: PermissionCandidate['sourceKind'],
    sourceId: string,
): PermissionCandidate => ({
    key: rule.key,
    effect: rule.effect,
    access: rule.access || 'read',
    scope: rule.scope,
    sourceKind,
    sourceId,
    priority: SOURCE_PRIORITY[sourceKind],
});

const isNowWithinRange = (now: Date, startsAtISO: string, endsAtISO: string): boolean => {
    const startsAt = new Date(startsAtISO);
    const endsAt = new Date(endsAtISO);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return false;
    return now.getTime() >= startsAt.getTime() && now.getTime() <= endsAt.getTime();
};

const roleClosure = (roleIds: string[], roleIndex: Map<string, RbacRole>): string[] => {
    const visited = new Set<string>();
    const stack = [...roleIds];

    while (stack.length > 0) {
        const roleId = stack.pop();
        if (!roleId || visited.has(roleId)) continue;
        visited.add(roleId);

        const role = roleIndex.get(roleId);
        if (!role) continue;
        if (role.parentRoleId && !visited.has(role.parentRoleId)) stack.push(role.parentRoleId);
        if (role.baseRoleId && !visited.has(role.baseRoleId)) stack.push(role.baseRoleId);
    }

    return Array.from(visited);
};

const mergeAuthPolicy = (
    base: AuthenticationPolicy,
    override?: Partial<AuthenticationPolicy>,
): AuthenticationPolicy => {
    if (!override) return base;

    return {
        requiredMethods: uniqueStrings([
            ...(base.requiredMethods || []),
            ...((override.requiredMethods as string[]) || []),
        ]) as AuthenticationPolicy['requiredMethods'],
        sessionMaxMinutes: Math.min(
            base.sessionMaxMinutes,
            override.sessionMaxMinutes ?? base.sessionMaxMinutes,
        ),
        requireStepUpForSensitiveActions:
            base.requireStepUpForSensitiveActions ||
            Boolean(override.requireStepUpForSensitiveActions),
    };
};

const evaluateCandidates = (
    key: PermissionKey,
    candidates: PermissionCandidate[],
): {
    winner: PermissionCandidate;
    conflicts: PermissionConflict | null;
} => {
    const sorted = [...candidates].sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (a.effect !== b.effect) return a.effect === 'deny' ? -1 : 1;
        return ACCESS_RANK[b.access] - ACCESS_RANK[a.access];
    });

    const winner = sorted[0];
    const losers = sorted.slice(1);
    const hasSemanticConflict = losers.some(
        (candidate) => candidate.effect !== winner.effect || candidate.access !== winner.access,
    );

    return {
        winner,
        conflicts: hasSemanticConflict ? { key, winner, losers } : null,
    };
};

const gatherDataScopes = (
    roleIds: string[],
    groupIds: string[],
    assignment: UserAccessAssignment | undefined,
    roleIndex: Map<string, RbacRole>,
    groupIndex: Map<string, RbacGroup>,
): ScopeConstraint[] => {
    const scopes: ScopeConstraint[] = [];

    roleIds.forEach((roleId) => {
        const role = roleIndex.get(roleId);
        if (role?.dataScopes) scopes.push(...role.dataScopes);
    });

    groupIds.forEach((groupId) => {
        const group = groupIndex.get(groupId);
        if (group?.dataScopes) scopes.push(...group.dataScopes);
    });

    if (assignment?.dataScopeOverrides) scopes.push(...assignment.dataScopeOverrides);
    return scopes;
};

export const resolveEffectiveAccess = ({
    userId,
    assignment,
    roles,
    groups,
    now = new Date(),
}: ResolveEffectiveAccessInput): EffectiveAccessProfile => {
    const safeAssignment: UserAccessAssignment = assignment || { userId };
    const roleIndex = new Map(roles.map((role) => [role.id, role]));
    const groupIndex = new Map(groups.map((group) => [group.id, group]));

    const directRoles = safeAssignment.roleIds || [];
    const groupsForUser = (safeAssignment.groupIds || []).filter((groupId) =>
        groupIndex.has(groupId),
    );
    const groupRoles = groupsForUser.flatMap((groupId) => groupIndex.get(groupId)?.roleIds || []);

    const temporaryRoleIds = (safeAssignment.temporaryRoles || [])
        .filter((temporary) => isNowWithinRange(now, temporary.startsAt, temporary.endsAt))
        .map((temporary) => temporary.roleId);

    const expandedRoleIds = roleClosure(
        uniqueStrings([...directRoles, ...groupRoles, ...temporaryRoleIds]),
        roleIndex,
    );

    const candidatesByKey = new Map<PermissionKey, PermissionCandidate[]>();

    expandedRoleIds.forEach((roleId) => {
        const role = roleIndex.get(roleId);
        if (!role) return;
        role.permissions.forEach((rule) => {
            const candidate = normalizeRule(rule, 'role', roleId);
            const list = candidatesByKey.get(candidate.key) || [];
            list.push(candidate);
            candidatesByKey.set(candidate.key, list);
        });
    });

    groupsForUser.forEach((groupId) => {
        const group = groupIndex.get(groupId);
        if (!group?.permissions) return;
        group.permissions.forEach((rule) => {
            const candidate = normalizeRule(rule, 'group', groupId);
            const list = candidatesByKey.get(candidate.key) || [];
            list.push(candidate);
            candidatesByKey.set(candidate.key, list);
        });
    });

    (safeAssignment.directPermissions || []).forEach((rule) => {
        const candidate = normalizeRule(rule, 'user_direct', userId);
        const list = candidatesByKey.get(candidate.key) || [];
        list.push(candidate);
        candidatesByKey.set(candidate.key, list);
    });

    const decisions: Partial<Record<PermissionKey, EffectivePermissionDecision>> = {};
    const conflicts: PermissionConflict[] = [];

    Array.from(candidatesByKey.entries()).forEach(([key, candidates]) => {
        const evaluation = evaluateCandidates(key, candidates);
        decisions[key] = {
            key,
            effect: evaluation.winner.effect,
            access: evaluation.winner.access,
            sourceKind: evaluation.winner.sourceKind,
            sourceId: evaluation.winner.sourceId,
            scope: evaluation.winner.scope,
        };
        if (evaluation.conflicts) conflicts.push(evaluation.conflicts);
    });

    let authPolicy = { ...DEFAULT_AUTH_POLICY };
    expandedRoleIds.forEach((roleId) => {
        const role = roleIndex.get(roleId);
        if (role) authPolicy = mergeAuthPolicy(authPolicy, role.authPolicy);
    });
    groupsForUser.forEach((groupId) => {
        const group = groupIndex.get(groupId);
        if (group?.authPolicy) authPolicy = mergeAuthPolicy(authPolicy, group.authPolicy);
    });
    authPolicy = mergeAuthPolicy(authPolicy, safeAssignment.authPolicyOverride);

    return {
        userId,
        roleIds: expandedRoleIds,
        groupIds: groupsForUser,
        permissions: decisions,
        conflicts,
        authPolicy,
        dataScopes: gatherDataScopes(
            expandedRoleIds,
            groupsForUser,
            safeAssignment,
            roleIndex,
            groupIndex,
        ),
    };
};

export const isPermissionGranted = (
    profile: EffectiveAccessProfile,
    key: PermissionKey,
    access: PermissionAccessLevel = 'read',
): boolean => {
    const decision = profile.permissions[key];
    if (!decision) return false;
    if (decision.effect === 'deny') return false;
    return ACCESS_RANK[decision.access] >= ACCESS_RANK[access];
};

export const hasAnyPermission = (
    profile: EffectiveAccessProfile,
    keys: PermissionKey[],
    access: PermissionAccessLevel = 'read',
): boolean => keys.some((key) => isPermissionGranted(profile, key, access));

export const hasAllPermissions = (
    profile: EffectiveAccessProfile,
    keys: PermissionKey[],
    access: PermissionAccessLevel = 'read',
): boolean => keys.every((key) => isPermissionGranted(profile, key, access));

export const getPermissionConflictSummary = (profile: EffectiveAccessProfile): string[] =>
    profile.conflicts.map((conflict) => {
        const loserSources = conflict.losers
            .map((loser) => `${loser.sourceKind}:${loser.sourceId}`)
            .join(', ');
        return `${conflict.key} -> ${conflict.winner.sourceKind}:${conflict.winner.sourceId} (overrides ${loserSources})`;
    });

export const toBusinessDecision = (
    allowed: boolean,
    reason: string,
): { allowed: boolean; reason?: string } => (allowed ? { allowed } : { allowed, reason });

export const normalizePermissionEffect = (effect?: PermissionEffect): PermissionEffect =>
    effect === 'deny' ? 'deny' : 'allow';
