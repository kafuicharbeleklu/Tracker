import type { DetectedDevice, Equipment, User } from '../types';

export interface LieuDeMachine {
    country: string;
    site: string;
    /** D'où vient ce lieu : ce que la machine dit, l'actif reconnu, sa session, ou qui valide. */
    origine: 'machine' | 'parc' | 'session' | 'validateur';
}

interface Contexte {
    equipment: readonly Equipment[];
    users: readonly User[];
    validateur?: Pick<User, 'country' | 'site'> | null;
}

const pareil = (a?: string, b?: string) =>
    Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

/**
 * **La personne dont la session est ouverte sur la machine**, si c'est un compte connu.
 *
 * L'agent rapporte un identifiant de session (« k.mensah ») plus souvent qu'un nom entier :
 * on le compare aussi à la partie locale de l'adresse. Un identifiant que personne ne porte
 * (« admin », un compte de service) ne désigne personne.
 */
export const personneEnSession = <P extends Pick<User, 'name' | 'email'>>(
    machine: Pick<DetectedDevice, 'currentUserEmail' | 'currentUserName'>,
    users: readonly P[],
): P | undefined => {
    const session = machine.currentUserName?.trim().toLowerCase();
    if (!machine.currentUserEmail && !session) return undefined;
    return users.find(
        (user) =>
            pareil(user.email, machine.currentUserEmail) ||
            pareil(user.name, session) ||
            pareil(user.email?.split('@')[0], session),
    );
};

/**
 * **Où ranger une machine remontée.**
 *
 * Un agent ne sait pas où il est : le pays et le site ne viennent que si la stratégie de
 * déploiement les lui donne. Sans eux, la machine entrait au parc sous « France, Bureau
 * Paris », un lieu écrit en dur. On cherche donc, dans l'ordre : ce que la machine dit ;
 * l'actif du parc qu'elle a rejoint ; la personne dont la session est ouverte ; enfin la
 * personne qui valide. Rien de tout cela : pas de lieu, et la machine n'entre pas seule.
 */
export const lieuDeLaMachine = (
    machine: Pick<
        DetectedDevice,
        'country' | 'site' | 'currentUserEmail' | 'currentUserName' | 'linkedEquipmentId'
    >,
    { equipment, users, validateur }: Contexte,
): LieuDeMachine | null => {
    if (machine.country && machine.site) {
        return { country: machine.country, site: machine.site, origine: 'machine' };
    }

    const actif = machine.linkedEquipmentId
        ? equipment.find((item) => item.id === machine.linkedEquipmentId)
        : undefined;
    if (actif?.country && actif.site) {
        return { country: actif.country, site: actif.site, origine: 'parc' };
    }

    const personne = personneEnSession(machine, users);
    if (personne?.country && personne.site) {
        return { country: personne.country, site: personne.site, origine: 'session' };
    }

    if (validateur?.country && validateur.site) {
        return { country: validateur.country, site: validateur.site, origine: 'validateur' };
    }
    return null;
};
