import React, { useState } from 'react';
import {
    ArrowUUpLeft,
    CheckCircle,
    ClockCounterClockwise,
    SignOut,
    User,
    Warning,
    Wrench,
} from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import { motifIncident } from '../incidents';
import Button from '../../../components/ui/Button';
import { Consequences, FieldLabel, OptionRow, SubjectRow } from '../../../components/ui/FormParts';
import type { Equipment } from '../../../types';

/**
 * Réceptionner un retour de réparation — planche **04.4**, troisième acte.
 *
 * ## Ce que l'écran faisait, et pourquoi c'était faux
 *
 * « Clore l'intervention » ouvrait une confirmation qui posait toujours la même chose :
 * l'objet repassait **Disponible**. Deux erreurs dans un seul geste.
 *
 * D'abord, un objet réparé **repart chez son porteur** — la planche l'écrit :
 * *« Réparé · Repart chez Alice »*. Le renvoyer au stock oblige à le réattribuer à la
 * main, et pendant ce temps il apparaît libre alors que quelqu'un l'attend.
 *
 * Ensuite, un retour de réparation n'a pas **une** issue mais trois, et elles ne
 * mènent pas au même endroit : réparé, réparé mais diminué, irréparable. La
 * confirmation n'en offrait aucune : elle affirmait la première.
 *
 * ## Les trois crans, nommés par leur conséquence
 *
 * C'est la grammaire de 04.3 et de 06.1 — un cran dit ce qu'il **fait**, pas ce qu'il
 * est. « Irréparable » n'enregistre donc rien tout seul : il ouvre la sortie du parc
 * avec son motif déjà écrit, parce que sortir un objet du parc est un acte à part,
 * irréversible, et qu'il ne se glisse pas dans la fermeture d'une intervention.
 */
export type RepairOutcome = 'repaired' | 'diminished' | 'irreparable';

interface ReceiveRepairSheetProps {
    open: boolean;
    onClose: () => void;
    item: Equipment;
    onConfirm: (outcome: RepairOutcome) => void;
}

/** « 2 août » — et le premier du mois prend son ordinal. */
const enClair = (iso?: string): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const rendu = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return d.getDate() === 1 ? rendu.replace(/^1\s/, '1ᵉʳ ') : rendu;
};

const ReceiveRepairSheet: React.FC<ReceiveRepairSheetProps> = ({
    open,
    onClose,
    item,
    onConfirm,
}) => {
    const [outcome, setOutcome] = useState<RepairOutcome>('repaired');

    const porteur = item.repairPreviousUser?.name;
    const parti = enClair(item.repairStartDate);

    /* Le pied de la planche : « Ce que cela referme ». Chaque cran a la sienne — une
       information n'est dite qu'une fois, et celle-ci dit la suite, pas l'état. */
    const consequences =
        outcome === 'repaired'
            ? [
                  porteur
                      ? {
                            tint: 'vert' as const,
                            glyph: CheckCircle,
                            content: (
                                <>
                                    {item.name}{' '}
                                    <strong className="font-medium">revient à {porteur}</strong>,
                                    qui le confirme à la réception.
                                </>
                            ),
                        }
                      : {
                            tint: 'vert' as const,
                            glyph: CheckCircle,
                            content: (
                                <>
                                    {item.name}{' '}
                                    <strong className="font-medium">repasse disponible</strong>.
                                </>
                            ),
                        },
                  {
                      tint: 'ambre' as const,
                      glyph: ClockCounterClockwise,
                      content: "L'incident se ferme.",
                  },
              ]
            : outcome === 'diminished'
              ? [
                    {
                        tint: 'ambre' as const,
                        glyph: Warning,
                        content: (
                            <>
                                Une <strong className="font-medium">réserve</strong> est notée à la
                                fiche, et elle suivra l'objet.
                            </>
                        ),
                    },
                    porteur
                        ? {
                              tint: 'vert' as const,
                              glyph: User,
                              content: <>Il revient tout de même à {porteur}.</>,
                          }
                        : {
                              tint: 'vert' as const,
                              glyph: CheckCircle,
                              content: <>Il repasse disponible.</>,
                          },
                ]
              : [
                    {
                        tint: 'rouge' as const,
                        glyph: SignOut,
                        content: (
                            <>
                                <strong className="font-medium">Sortir du parc</strong> s'ouvre, son
                                motif déjà écrit.
                            </>
                        ),
                    },
                    {
                        tint: 'bleu' as const,
                        glyph: ArrowUUpLeft,
                        content: "Rien n'est enregistré tant que la sortie n'est pas confirmée.",
                    },
                ];

    const fermer = () => {
        setOutcome('repaired');
        onClose();
    };

    return (
        <BottomSheet open={open} onClose={fermer} title="Réceptionner">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant -mt-2 text-[14px] leading-5">
                    {item.repairTicket
                        ? `Dossier ${item.repairTicket}.`
                        : parti
                          ? `Parti le ${parti}.`
                          : 'Vous constatez l’état dans lequel l’objet revient.'}
                </p>

                <SubjectRow
                    glyph={Wrench}
                    title={item.name}
                    detail={
                        [item.repairer, motifIncident(item)].filter(Boolean).join(' · ') ||
                        item.type
                    }
                />

                <div>
                    <FieldLabel>Dans quel état il revient</FieldLabel>
                    <div className="flex flex-col gap-2">
                        <OptionRow
                            title="Réparé"
                            hint={porteur ? `Repart chez ${porteur}` : 'Repasse disponible'}
                            selected={outcome === 'repaired'}
                            tint="vert"
                            onSelect={() => setOutcome('repaired')}
                        />
                        <OptionRow
                            title="Réparé, mais diminué"
                            hint="Une réserve est notée à la fiche"
                            selected={outcome === 'diminished'}
                            tint="ambre"
                            onSelect={() => setOutcome('diminished')}
                        />
                        <OptionRow
                            title="Irréparable"
                            hint="Ouvre « Sortir du parc », motif pré-rempli"
                            selected={outcome === 'irreparable'}
                            tint="rouge"
                            onSelect={() => setOutcome('irreparable')}
                        />
                    </div>
                </div>

                <Consequences label="Ce que cela referme" lines={consequences} />

                <div className="border-outline-variant mt-1 grid grid-cols-2 gap-3 border-t pt-4">
                    <Button variant="ghost" onClick={fermer}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        onClick={() => {
                            onConfirm(outcome);
                            fermer();
                        }}
                    >
                        {outcome === 'irreparable' ? 'Sortir du parc' : 'Réceptionner'}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default ReceiveRepairSheet;
