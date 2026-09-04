import React, { useMemo, useState } from 'react';
import {
    CheckCircle,
    EnvelopeSimple,
    Hourglass,
    Key,
    MapPin,
    ShieldWarning,
    User as UserGlyph,
} from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import { Consequences, FieldLabel, OptionRow, type Tint } from '../../../components/ui/FormParts';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import type { User, UserRole } from '../../../types';

/**
 * **Inviter une personne** — planche 05.3, colonne 2.
 *
 * *« Inviter tient en trois réponses : l'adresse, le rôle, le site. Le reste, la
 * personne le porte. »*
 *
 * Ce que la feuille remplace : un écran plein de huit champs — nom, adresse,
 * téléphone, pays, site, service, rôle, manager — dont **cinq que celui qui invite ne
 * connaît pas**. Un formulaire qui demande ce qu'on ignore produit des fiches à
 * moitié fausses, et personne ne revient les corriger.
 *
 * **Le rôle est nommé par ce qu'il permet**, jamais par son rang : « Manager » ne dit
 * rien, « en plus : valide les demandes de son équipe » le dit. Et chaque cran
 * annonce sa conséquence avant qu'on invite — y compris **combien de personnes ont
 * déjà ce droit**, parce qu'un quatrième super administrateur ne se décide pas comme
 * le premier.
 */

const ROLES: Array<{
    value: UserRole;
    title: string;
    hint: string;
    glyph: typeof UserGlyph;
    tint: Tint;
    consequence: (holders: number) => React.ReactNode;
}> = [
    {
        value: 'User',
        title: 'Utilisateur',
        hint: 'Ses équipements, une demande, un incident',
        glyph: UserGlyph,
        tint: 'vert',
        consequence: () => (
            <>
                Elle ne voit que <b className="font-medium">ses équipements</b>.
            </>
        ),
    },
    {
        value: 'Manager',
        title: 'Manager',
        hint: 'En plus : valide les demandes de son équipe',
        glyph: CheckCircle,
        tint: 'ambre',
        consequence: () => (
            <>
                Les demandes de son équipe <b className="font-medium">lui sont adressées</b>.
            </>
        ),
    },
    {
        value: 'Admin',
        title: 'Administrateur',
        hint: 'En plus : gère le parc, remet, sort du parc',
        glyph: Key,
        tint: 'orange',
        consequence: (holders) => (
            <>
                Elle peut <b className="font-medium">remettre et sortir du parc</b> ·{' '}
                <span className="tabular-nums">{holders}</span> personne
                {holders > 1 ? 's ont' : ' a'} ce droit.
            </>
        ),
    },
    {
        value: 'SuperAdmin',
        title: 'Super administrateur',
        hint: 'En plus : gère les comptes et les droits',
        glyph: ShieldWarning,
        tint: 'rouge',
        consequence: (holders) => (
            <>
                Elle peut <b className="font-medium">suspendre et supprimer des comptes</b> ·{' '}
                <span className="tabular-nums">{holders}</span> personne
                {holders > 1 ? 's ont' : ' a'} ce droit.
            </>
        ),
    },
];

interface InviteSheetProps {
    open: boolean;
    onClose: () => void;
    /** La fiche du compte créé — la planche y conduit aussitôt. */
    onInvited: (user: User) => void;
    /** La fiche d'un compte déjà existant, quand l'adresse est un doublon. */
    onOpenExisting: (user: User) => void;
}

const InviteSheet: React.FC<InviteSheetProps> = ({ open, onClose, onInvited, onOpenExisting }) => {
    const { users, locationData, inviteUser } = useData();
    const { role: currentRole } = useAccessControl();

    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('User');
    const [country, setCountry] = useState('');
    const [site, setSite] = useState('');

    /* **Le doublon se dit au champ, pas au clic.** La planche montre l'erreur sous
       l'adresse, avec la fiche à ouvrir : on ne fait pas taper le reste pour
       apprendre à la fin que le compte existe déjà. */
    const duplicate = useMemo(() => {
        const wanted = email.trim().toLowerCase();
        if (!wanted) return undefined;
        return users.find((user) => user.email.toLowerCase() === wanted);
    }, [email, users]);

    const availableRoles = useMemo(
        () => ROLES.filter((entry) => entry.value !== 'SuperAdmin' || currentRole === 'SuperAdmin'),
        [currentRole],
    );

    const availableSites = useMemo(
        () => (country ? locationData.sites[country] || [] : []),
        [country, locationData.sites],
    );

    const holders = useMemo(() => users.filter((user) => user.role === role).length, [users, role]);

    const chosen = ROLES.find((entry) => entry.value === role)!;
    const ready = Boolean(email.trim()) && !duplicate && Boolean(country) && Boolean(site);

    const close = () => {
        setEmail('');
        setRole('User');
        setCountry('');
        setSite('');
        onClose();
    };

    return (
        <BottomSheet open={open} onClose={close} title="Inviter une personne">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant -mt-2 text-[14px] leading-5">
                    Elle complète son profil à sa première connexion.
                </p>

                <div>
                    <FieldLabel>Adresse professionnelle</FieldLabel>
                    <InputField
                        name="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="prenom.nom@neemba.com"
                        icon={<Icon glyph={EnvelopeSimple} size={18} />}
                        error={duplicate ? ' ' : undefined}
                    />
                    {duplicate && (
                        <p className="text-error mt-1.5 text-[14px] leading-5">
                            Cette adresse a déjà un compte.{' '}
                            {/* La sortie est **dans la phrase**, comme sur la planche :
                                on apprend le doublon et on ouvre la fiche du même
                                geste, sans quitter la feuille pour aller chercher. */}
                            <Button
                                variant="text"
                                onClick={() => {
                                    onOpenExisting(duplicate);
                                    close();
                                }}
                                className="!text-error h-auto !min-h-0 !px-0 !py-0 align-baseline text-[14px] font-medium underline underline-offset-2"
                            >
                                Ouvrir
                            </Button>
                        </p>
                    )}
                </div>

                <div>
                    <FieldLabel>Ce que la personne pourra faire</FieldLabel>
                    <div className="flex flex-col gap-2">
                        {availableRoles.map((entry) => (
                            <OptionRow
                                key={entry.value}
                                title={entry.title}
                                hint={entry.hint}
                                tint="bleu"
                                selected={role === entry.value}
                                onSelect={() => setRole(entry.value)}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                        <FieldLabel>Pays</FieldLabel>
                        <SelectField
                            name="country"
                            options={locationData.countries.map((entry) => ({
                                value: entry,
                                label: entry,
                            }))}
                            value={country}
                            onChange={(event) => {
                                setCountry(event.target.value);
                                setSite('');
                            }}
                            placeholder="Choisir"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <FieldLabel>Site de rattachement</FieldLabel>
                        <SelectField
                            name="site"
                            options={availableSites.map((entry) => ({
                                value: entry,
                                label: entry,
                            }))}
                            value={site}
                            onChange={(event) => setSite(event.target.value)}
                            disabled={!country}
                            placeholder={country ? 'Choisir' : "D'abord un pays"}
                        />
                    </div>
                </div>

                <Consequences
                    label="Ce que cela déclenche"
                    lines={[
                        {
                            glyph: Hourglass,
                            tint: 'bleu',
                            content: (
                                <>
                                    Compte <b className="font-medium">en attente</b> jusqu'à sa
                                    première connexion.
                                </>
                            ),
                        },
                        {
                            glyph: chosen.glyph,
                            tint: chosen.tint,
                            content: chosen.consequence(holders),
                        },
                        ...(site
                            ? [
                                  {
                                      glyph: MapPin,
                                      tint: 'vert' as Tint,
                                      content: (
                                          <>
                                              Rattachée à <b className="font-medium">{site}</b>.
                                          </>
                                      ),
                                  },
                              ]
                            : []),
                    ]}
                />

                <div className="border-outline-variant mt-2 grid grid-cols-2 gap-3 border-t pt-4">
                    <Button variant="ghost" onClick={close}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        disabled={!ready}
                        onClick={() => {
                            const { decision, user } = inviteUser({ email, role, country, site });
                            if (!decision.allowed || !user) return;
                            onInvited(user);
                            close();
                        }}
                    >
                        Inviter
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default InviteSheet;
