import React, { useRef, useState } from 'react';
import { Camera, Package, User, Warning, Wrench, XCircle } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import FilePicker from '../../../components/ui/FilePicker';
import Icon from '../../../components/ui/Icon';
import { TextArea } from '../../../components/ui/TextArea';
import { cn } from '../../../lib/utils';
import type { Equipment, IncidentOutcome } from '../../../types';

import {
    Consequences,
    FieldLabel,
    OptionRow,
    ShotBox,
    SubjectRow,
    type Tint,
} from '../../../components/ui/FormParts';

/**
 * **Déclarer un incident** — planche 04.3, colonne 3.
 *
 * *« La photo d'abord, le commentaire second. Trois crans nommés par leur
 * conséquence, et teintés par elle. »*
 *
 * Ce que la feuille remplace : une confirmation de deux phrases qui passait l'objet
 * en réparation sans rien demander — ni ce qu'on voit, ni ce que ça change, ni ce
 * qu'on en dit —, et qui laissait le porteur attaché à un objet parti à l'atelier.
 *
 * **L'ordre n'est pas un goût.** On photographie ce qu'on a sous les yeux, puis on
 * décide de ce que ça change : décider d'abord, c'est décider sans la pièce. Et le
 * commentaire vient en dernier, parce qu'il ne sert que si la photo ne suffit pas.
 */

const OUTCOMES: Array<{
    value: IncidentOutcome;
    title: string;
    hint: string;
    tint: Tint;
}> = [
    {
        value: 'serves',
        title: 'Continue de servir',
        hint: 'Reste chez son porteur',
        tint: 'vert',
    },
    {
        value: 'immobilised',
        title: 'Immobilisé, à réviser',
        hint: 'Quitte le poste, passe en réparation',
        tint: 'orange',
    },
    {
        value: 'out_of_service',
        title: 'Hors service',
        hint: 'Cesse de servir, la sortie du parc se décide ensuite',
        tint: 'rouge',
    },
];

interface IncidentSheetProps {
    open: boolean;
    item: Equipment;
    /** Le nom au bas de la trace — la déclaration n'est jamais anonyme. */
    declarerName: string;
    onClose: () => void;
    onDeclare: (payload: { outcome: IncidentOutcome; photos: string[]; comment?: string }) => void;
}

const IncidentSheet: React.FC<IncidentSheetProps> = ({
    open,
    item,
    declarerName,
    onClose,
    onDeclare,
}) => {
    const [outcome, setOutcome] = useState<IncidentOutcome>('immobilised');
    const [photos, setPhotos] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const photoInput = useRef<HTMLInputElement>(null);

    const chosen = OUTCOMES.find((entry) => entry.value === outcome)!;
    const holderName = item.user?.name;

    /* `.conseq` — ce que le cran choisi déclenche, dit avant de le poser. */
    const consequences = (() => {
        if (outcome === 'serves') {
            return [
                {
                    glyph: Package,
                    tint: 'vert' as Tint,
                    content: (
                        <>
                            L'objet <b className="font-medium">ne bouge pas</b> ; la déclaration
                            reste sur sa fiche.
                        </>
                    ),
                },
            ];
        }
        const lines = [
            outcome === 'immobilised'
                ? {
                      glyph: Wrench,
                      tint: 'orange' as Tint,
                      content: (
                          <>
                              Passe <b className="font-medium">en réparation</b>, et quitte le
                              poste.
                          </>
                      ),
                  }
                : {
                      glyph: XCircle,
                      tint: 'rouge' as Tint,
                      content: (
                          <>
                              Passe <b className="font-medium">hors service</b> et sort des
                              sélecteurs.
                          </>
                      ),
                  },
        ];
        if (holderName) {
            lines.push({
                glyph: User,
                tint: 'ambre' as Tint,
                content: (
                    <>
                        <b className="font-medium">{holderName} sans poste</b> : proposer un
                        remplacement.
                    </>
                ),
            });
        }
        return lines;
    })();

    const close = () => {
        setOutcome('immobilised');
        setPhotos([]);
        setComment('');
        onClose();
    };

    return (
        <BottomSheet open={open} onClose={close} title="Déclarer un incident">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant -mt-2 text-[14px] leading-5">
                    Trace enregistrée au nom de {declarerName}.
                </p>

                <SubjectRow
                    glyph={Package}
                    title={item.name}
                    detail={[item.model || item.type, holderName ? `chez ${holderName}` : item.site]
                        .filter(Boolean)
                        .join(' · ')}
                />

                <div>
                    <FieldLabel>Ce qu'on voit</FieldLabel>
                    {/* `.shots` — des carrés de 56, la case d'une photo. */}
                    <div className="flex flex-wrap gap-2">
                        {photos.map((name, index) => (
                            <ShotBox
                                key={`${name}-${index}`}
                                glyph={Camera}
                                filled
                                title={name}
                                aria-label={`Photo jointe : ${name} — retirer`}
                                onClick={() =>
                                    setPhotos((prev) =>
                                        prev.filter((_, position) => position !== index),
                                    )
                                }
                            />
                        ))}
                        <ShotBox
                            glyph={Camera}
                            label="ajouter"
                            aria-label="Ajouter une photo de l'incident"
                            onClick={() => photoInput.current?.click()}
                        />
                        <FilePicker
                            ref={photoInput}
                            accept="image/*"
                            multiple
                            onFiles={(names) =>
                                setPhotos((prev) => (names.length > 0 ? [...prev, ...names] : prev))
                            }
                        />
                    </div>
                </div>

                <div>
                    <FieldLabel>Ce que ça change pour l'objet</FieldLabel>
                    <div className="flex flex-col gap-2">
                        {OUTCOMES.map((entry) => (
                            <OptionRow
                                key={entry.value}
                                title={entry.title}
                                hint={entry.hint}
                                tint={entry.tint}
                                selected={outcome === entry.value}
                                onSelect={() => setOutcome(entry.value)}
                            />
                        ))}
                    </div>
                </div>

                {/* `.free` — 96 de haut sur le creux, l'invite en encre tertiaire. */}
                <TextArea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                    aria-label="Décrire l'incident"
                    placeholder="Décrire, si la photo ne suffit pas."
                />

                <Consequences label="Ce que cela déclenche" lines={consequences} />

                {/* `.sfoot` — deux colonnes égales, filet au-dessus. */}
                <div className="border-outline-variant mt-2 grid grid-cols-2 gap-3 border-t pt-4">
                    <Button variant="ghost" onClick={close}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        icon={<Icon glyph={Warning} size={18} />}
                        onClick={() => {
                            onDeclare({ outcome, photos, comment });
                            close();
                        }}
                        className={cn(chosen.value === 'serves' && 'bg-primary')}
                    >
                        Déclarer
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default IncidentSheet;
