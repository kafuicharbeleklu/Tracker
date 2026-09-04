import React, { useState } from 'react';
import { ClockCounterClockwise, Coins, Info, Package, SignOut } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import type { Equipment, RetirementReason } from '../../../types';

import {
    Consequences,
    FieldLabel,
    FormWarn,
    OptionRow,
    SubjectRow,
    type Tint,
} from '../../../components/ui/FormParts';

/**
 * **Sortir du parc** — planche 04.3, colonne 4.
 *
 * *« Ce qui disparaît, ce qui reste, ce que ça coûte : trois lignes, trois couleurs.
 * Le motif est le seul champ obligatoire. »*
 *
 * Ce que la feuille remplace : une confirmation destructive qui demandait de taper
 * **SUPPRIMER** sans jamais demander *pourquoi*. Le mot-clé protégeait le geste ; il
 * ne renseignait rien. Le motif, lui, part avec l'événement du journal — c'est là que
 * l'historique promis reste consultable.
 *
 * **Un objet attribué n'a pas cette entrée** : la planche le dit en pied de feuille,
 * et l'entrée devient « Organiser la restitution ». C'est l'appelant qui garde cette
 * porte fermée ; la feuille se contente de rappeler pourquoi.
 */

const REASONS: Array<{
    value: RetirementReason;
    title: string;
    hint: string;
    tint: Tint;
}> = [
    {
        value: 'end_of_life',
        title: 'Fin de vie',
        hint: 'Amorti, remplacé, mis au rebut',
        tint: 'rouge',
    },
    {
        value: 'sold',
        title: 'Vendu ou cédé',
        hint: 'Une contrepartie est attendue',
        tint: 'rouge',
    },
    {
        value: 'lost',
        title: 'Volé ou perdu',
        hint: 'Déclaration, perte immédiate',
        tint: 'rouge',
    },
];

interface RetireSheetProps {
    open: boolean;
    item: Equipment;
    /** Le nombre d'événements que le journal garde sur cet objet. */
    historyCount: number;
    /** La valeur résiduelle, déjà formatée dans la devise du produit. */
    residualValue?: string;
    onClose: () => void;
    onRetire: (reason: RetirementReason) => void;
}

const RetireSheet: React.FC<RetireSheetProps> = ({
    open,
    item,
    historyCount,
    residualValue,
    onClose,
    onRetire,
}) => {
    /** Aucun cran pris au départ : le motif est **obligatoire**, il se choisit. */
    const [reason, setReason] = useState<RetirementReason | null>(null);

    const close = () => {
        setReason(null);
        onClose();
    };

    const lines = [
        {
            glyph: SignOut,
            tint: 'rouge' as Tint,
            content: <>Quitte la liste et les sélecteurs.</>,
        },
        {
            glyph: ClockCounterClockwise,
            tint: 'bleu' as Tint,
            content: (
                <>
                    <b className="font-medium tabular-nums">
                        {historyCount} événement{historyCount > 1 ? 's' : ''}
                    </b>{' '}
                    rest{historyCount > 1 ? 'ent' : 'e'} dans l'Historique.
                </>
            ),
        },
        ...(residualValue
            ? [
                  {
                      glyph: Coins,
                      tint: 'ambre' as Tint,
                      content: (
                          <>
                              <b className="font-medium tabular-nums">{residualValue}</b> de valeur
                              résiduelle passent en perte.
                          </>
                      ),
                  },
              ]
            : []),
    ];

    return (
        <BottomSheet open={open} onClose={close} title="Sortir du parc">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant -mt-2 text-[14px] leading-5">
                    Irréversible. L'historique, lui, est conservé.
                </p>

                <SubjectRow
                    glyph={Package}
                    title={item.name}
                    detail={[item.model || item.type, item.status.toLowerCase(), item.site]
                        .filter(Boolean)
                        .join(' · ')}
                />

                <div>
                    <FieldLabel note="obligatoire">Motif</FieldLabel>
                    <div className="flex flex-col gap-2">
                        {REASONS.map((entry) => (
                            <OptionRow
                                key={entry.value}
                                title={entry.title}
                                hint={entry.hint}
                                tint={entry.tint}
                                selected={reason === entry.value}
                                onSelect={() => setReason(entry.value)}
                            />
                        ))}
                    </div>
                </div>

                <Consequences label="Ce que cela change" lines={lines} />

                <FormWarn glyph={Info}>
                    Un objet <b className="font-medium">attribué</b> ne sort pas d'ici : l'entrée
                    devient <b className="font-medium">« Organiser la restitution »</b>.
                </FormWarn>

                <div className="border-outline-variant mt-2 grid grid-cols-2 gap-3 border-t pt-4">
                    <Button variant="ghost" onClick={close}>
                        Annuler
                    </Button>
                    {/* `.btn-x` — le seul rouge plein du produit, et il ne s'allume
                        qu'une fois le motif pris. */}
                    <Button
                        variant="danger"
                        disabled={!reason}
                        onClick={() => {
                            if (!reason) return;
                            onRetire(reason);
                            close();
                        }}
                    >
                        Sortir du parc
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default RetireSheet;
