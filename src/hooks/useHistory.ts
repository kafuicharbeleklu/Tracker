import { useData } from '../context/DataContext';
import { useAccessControl } from './useAccessControl';
import { HistoryEvent, HistoryFilter } from '../types';

export const useHistory = () => {
    const { events, users, equipment, logEvent: contextLogEvent } = useData(); // events: HistoryEvent[]
    const { user: currentUser } = useAccessControl();

    /**
     * Filtrer l'historique selon le rôle
     */
    const filterEvents = (allEvents: HistoryEvent[], filter?: HistoryFilter): HistoryEvent[] => {
        let filtered = [...allEvents];

        // Filtrage RBAC
        const role = currentUser?.role;

        if (role === 'User') {
            // User voit seulement ce qui le concerne
            filtered = filtered.filter((event) => {
                // Événements où il est l'acteur
                if (event.actorId === currentUser.id) return true;

                // Événements où il est la cible
                if (event.targetType === 'USER' && event.targetId === currentUser.id) return true;
                if (event.targetType === 'EQUIPMENT') {
                    // Visible si l'événement le désigne comme bénéficiaire (snapshot historique)
                    // OU si l'équipement lui est actuellement attribué (événements sans metadata).
                    if (event.metadata?.beneficiaryId === currentUser.id) return true;
                    const eq = equipment.find((item) => item.id === event.targetId);
                    return eq?.user?.id === currentUser.id;
                }

                return false;
            });

            // Masquer événements sensibles
            filtered = filtered.filter((e) => !e.isSensitive);

            // Anonymiser les acteurs (sauf si c'est lui)
            filtered = filtered.map((event) => ({
                ...event,
                actorName:
                    event.actorId === currentUser.id
                        ? event.actorName
                        : event.actorRole === 'SuperAdmin' || event.actorRole === 'Admin'
                          ? 'Administrateur'
                          : 'Manager',
            }));
        }

        if (role === 'Manager') {
            // Manager voit son équipe + ses propres actions
            // Calcul des IDs de l'équipe (ceux qui ont ce manager comme managerId)
            const teamUserIds = users
                .filter((u) => u.managerId === currentUser.id)
                .map((u) => u.id);

            filtered = filtered.filter((event) => {
                // Ses propres actions
                if (event.actorId === currentUser.id) return true;

                // Actions de/sur son équipe
                if (event.targetType === 'USER' && teamUserIds.includes(event.targetId))
                    return true;
                if (event.actorId && teamUserIds.includes(event.actorId)) return true;

                // Équipements de son équipe
                if (event.targetType === 'EQUIPMENT') {
                    if (
                        event.metadata?.beneficiaryId &&
                        teamUserIds.includes(event.metadata.beneficiaryId)
                    )
                        return true;
                    const eq = equipment.find((item) => item.id === event.targetId);
                    return Boolean(eq?.user?.id && teamUserIds.includes(eq.user.id));
                }

                return false;
            });

            // Masquer événements Admin sensibles
            filtered = filtered.filter((e) => !e.isSensitive || e.actorId === currentUser.id);
        }

        // Admin : visibilité globale de l'historique à ce stade (pas de cloisonnement géographique).
        // Le géo-scoping par pays gérés (managedCountries) sera implémenté avec le backend,
        // où la localisation des événements sera fiable. Cf. docs/AUDIT_LOGIQUE_METIER.md (D4).

        // SuperAdmin voit tout (pas de filtrage)

        // Filtres additionnels
        if (filter) {
            if (filter.targetType) {
                filtered = filtered.filter((e) => e.targetType === filter.targetType);
            }
            if (filter.targetId) {
                filtered = filtered.filter((e) => e.targetId === filter.targetId);
            }
            if (filter.actorId) {
                filtered = filtered.filter((e) => e.actorId === filter.actorId);
            }
            if (filter.eventTypes) {
                filtered = filtered.filter((e) => filter.eventTypes!.includes(e.type));
            }
            if (filter.startDate) {
                filtered = filtered.filter((e) => e.timestamp >= filter.startDate!);
            }
            if (filter.endDate) {
                filtered = filtered.filter((e) => e.timestamp <= filter.endDate!);
            }
        }

        // Tri par date décroissante
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Limite
        if (filter?.limit) {
            filtered = filtered.slice(0, filter.limit);
        }

        return filtered;
    };

    /**
     * Récupérer l'historique d'un équipement
     */
    const getEquipmentHistory = (equipmentId: string, limit?: number) => {
        return filterEvents(events, {
            targetType: 'EQUIPMENT',
            targetId: equipmentId,
            limit,
        });
    };

    /**
     * Récupérer l'historique d'un utilisateur
     */
    const getUserHistory = (userId: string, limit?: number) => {
        return filterEvents(events, {
            targetType: 'USER',
            targetId: userId,
            limit,
        });
    };

    /**
     * Récupérer l'activité récente globale
     */
    const getRecentActivity = (limit: number = 10) => {
        return filterEvents(events, { limit });
    };

    /**
     * Créer un événement (wrapper autour du DataContext)
     */
    const logEvent = (event: Omit<HistoryEvent, 'id' | 'timestamp'>) => {
        contextLogEvent(event);
    };

    return {
        filterEvents,
        getEquipmentHistory,
        getUserHistory,
        getRecentActivity,
        logEvent,
    };
};
