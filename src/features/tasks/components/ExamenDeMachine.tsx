import React, { useMemo } from 'react';

import Icon from '../../../components/ui/Icon';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { useData } from '../../../context/DataContext';
import type { DetectedDevice } from '../../../types';
import { INTITULE } from '../../history/components/ParcoursDeDemande';
import Renvoi from '../../history/components/Renvoi';
import { ageLabel } from '../lib/file';

/**
 * **L'examen d'une machine remontée par l'agent** (14.1) — ce qu'elle est, si elle ressemble
 * à des actifs du parc, et lesquels.
 *
 * Dessiné une fois (08/10) : au téléphone, il remplit la feuille d'examen ; au bureau, le
 * panneau de décision, comme toute autre tâche. La collecte était la seule tâche du bureau
 * qui ouvrait une surcouche au lieu du panneau.
 */
const ExamenDeMachine: React.FC<{
    machine: DetectedDevice;
    /** Ouvrir la fiche d'un actif candidat — pour comparer son numéro de série. */
    onOuvrirActif: (id: string) => void;
}> = ({ machine, onOuvrirActif }) => {
    const { equipment } = useData();

    const candidats = useMemo(
        () =>
            (machine.candidateEquipmentIds ?? [])
                .map((id) => equipment.find((item) => item.id === id))
                .filter((item): item is NonNullable<typeof item> => Boolean(item)),
        [machine, equipment],
    );

    return (
        <>
            <dl className="flex flex-col">
                {[
                    ['Nom réseau', machine.hostname],
                    ['Identifiant', machine.assetId],
                    ['Numéro de série', machine.serialNumber],
                    ['Système', machine.os],
                    /* Qui s'en sert, et ce qu'elle a dans le ventre (08/10) : on reconnaît
                       une machine à son utilisateur avant son numéro. */
                    ['Session ouverte', machine.currentUserName],
                    [
                        'Matériel',
                        [machine.cpu, machine.ram, machine.storage].filter(Boolean).join(' · '),
                    ],
                    [
                        'Emplacement',
                        [machine.country, machine.site, machine.service]
                            .filter(Boolean)
                            .join(' · '),
                    ],
                    ['Vue pour la première fois', ageLabel(machine.firstSeenAt)],
                    ['Vue pour la dernière fois', ageLabel(machine.lastSeenAt)],
                ]
                    .filter(([, value]) => Boolean(value))
                    .map(([label, value]) => (
                        <div
                            key={String(label)}
                            className="border-outline-variant text-ts-body leading-ts-body flex min-h-12 items-center justify-between gap-4 border-t py-2 first:border-t-0"
                        >
                            <dt className="text-text-secondary shrink-0">{label}</dt>
                            <dd className="text-on-surface min-w-0 text-right font-medium break-words">
                                {value}
                            </dd>
                        </div>
                    ))}
            </dl>

            {/* **Lesquels** (08/10) — chacun ouvre sa fiche, pour comparer le numéro de série
                et le porteur. Le titre suffit à dire l'ambiguïté : la phrase qui la commentait
                est retirée. */}
            {candidats.length > 0 && (
                <section>
                    <h3 className={INTITULE}>
                        {candidats.length > 1
                            ? 'Les actifs qui lui ressemblent'
                            : 'L’actif qui lui ressemble'}
                    </h3>
                    {candidats.map((item, index) => (
                        <Renvoi
                            key={item.id}
                            premier={index === 0}
                            vignette={<Icon glyph={getCategoryGlyph(item.type)} size={20} />}
                            titre={item.name}
                            code
                            sousTitre={[
                                item.serialNumber ? `série ${item.serialNumber}` : null,
                                item.user?.name ?? item.status,
                                item.site,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                            onOpen={() => onOuvrirActif(item.id)}
                        />
                    ))}
                </section>
            )}
        </>
    );
};

export default ExamenDeMachine;
