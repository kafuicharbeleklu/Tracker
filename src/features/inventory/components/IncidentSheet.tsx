import React, { useEffect, useState } from 'react';
import { Package, User, Warning, Wrench, XCircle } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Attestation, { type AttestationMethod } from '../../../components/ui/Attestation';
import { signatureService } from '../../../services/signatureService';
import Button from '../../../components/ui/Button';
import PhotosJointes, { usePhotosJointes } from '../../../components/ui/PhotosJointes';
import Icon from '../../../components/ui/Icon';
import { TextArea } from '../../../components/ui/TextArea';
import { cn } from '../../../lib/utils';
import type { Equipment, IncidentOutcome } from '../../../types';

import {
    Consequences,
    FieldLabel,
    OptionRow,
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
        hint: 'À déposer à l’informatique, qui le fera réparer',
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
    /**
     * Qui déclare, et de quoi il dispose pour l'attester — **le bloc 4 de 17.4** (lot 28,
     * D4). Un incident retire un objet à quelqu'un : c'est un des neuf actes de
     * traçabilité, et il se prouve comme les autres.
     */
    declarer?: { pin?: string; id?: string };
    onClose: () => void;
    onDeclare: (payload: {
        outcome: IncidentOutcome;
        photos: string[];
        comment?: string;
        /** La méthode d'attestation retenue — elle va au journal. */
        method: AttestationMethod;
    }) => void;
}

const IncidentSheet: React.FC<IncidentSheetProps> = ({
    open,
    item,
    declarerName,
    declarer,
    onClose,
    onDeclare,
}) => {
    const [outcome, setOutcome] = useState<IncidentOutcome>('immobilised');
    const {
        photos,
        ajouter: ajouterPhotos,
        retirer: retirerPhoto,
        vider: viderPhotos,
    } = usePhotosJointes();
    /** Ce que la borne de 5 Mo a écarté — lu sous le champ des photos. */
    const [refusPhoto, setRefusPhoto] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    /* Le bloc 4 : tant qu'il n'est pas fait, il n'y a rien à déclarer. */
    const [attestation, setAttestation] = useState<{ method: AttestationMethod; done: boolean }>({
        method: declarer?.pin ? 'pin' : 'signature',
        done: false,
    });
    const [signature, setSignature] = useState<Blob | null>(null);
    /* Le récapitulatif, puis l'attestation seule — l'étape de 17.4 (arbitrage du 22/09). */
    const [etape, setEtape] = useState<'recap' | 'attester'>('recap');

    useEffect(() => {
        let vivant = true;
        setAttestation({ method: declarer?.pin ? 'pin' : 'signature', done: false });
        setEtape('recap');
        if (!open || !declarer?.pin || !declarer?.id) {
            setSignature(null);
            return;
        }
        void signatureService.get(declarer.id).then((image) => {
            if (vivant) setSignature(image);
        });
        return () => {
            vivant = false;
        };
    }, [open, declarer?.pin, declarer?.id]);

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
                              <b className="font-medium">À déposer</b> à l’informatique : elle le
                              prend en charge, avec devis s’il n’est plus garanti.
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
        viderPhotos();
        setComment('');
        setEtape('recap');
        onClose();
    };

    /* Revenir au récapitulatif rend l'attestation : on n'atteste pas ce qu'on a quitté. */
    const retour = () => {
        setAttestation({ method: declarer?.pin ? 'pin' : 'signature', done: false });
        setEtape('recap');
    };

    return (
        <BottomSheet open={open} onClose={close} title="Déclarer un incident">
            {etape === 'recap' ? (
                <div className="flex flex-col gap-4">
                    <p className="text-on-surface-variant text-ts-sub leading-ts-sub">
                        Trace enregistrée au nom de {declarerName}.
                    </p>

                    <SubjectRow
                        glyph={Package}
                        title={item.name}
                        detail={[
                            item.model || item.type,
                            holderName ? `chez ${holderName}` : item.site,
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    />

                    <div>
                        <FieldLabel>Ce qu'on voit</FieldLabel>
                        {/* `.shots` — des carrés de 56 : la miniature de chaque photo, qui
                            s'ouvre en grand ; la croix du coin la retire (25/09). */}
                        <PhotosJointes
                            photos={photos}
                            labelAjout="Ajouter une photo de l'incident"
                            onAjouter={(fichiers) => {
                                setRefusPhoto(null);
                                ajouterPhotos(fichiers);
                            }}
                            onRetirer={retirerPhoto}
                            onRefus={setRefusPhoto}
                        />
                        {/* La borne de 17.10 : le refus se lit **au champ**, là où la photo
                        a été choisie, et nomme le fichier et sa taille (17.5). */}
                        {refusPhoto && (
                            <p
                                className="text-error text-ts-sub leading-ts-sub mt-2 flex items-start gap-1.5"
                                role="alert"
                            >
                                <Icon glyph={XCircle} size={18} className="mt-px" />
                                <span>{refusPhoto}</span>
                            </p>
                        )}
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
                    <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button variant="ghost" onClick={close}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={() => setEtape('attester')}>
                            Continuer
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* 4 · l'attestation, seule dans son étape — le compte décide de la
                        méthode (17.4, arbitrage du 22/09). */}
                    <Attestation
                        signerName={declarerName}
                        signerPin={declarer?.pin}
                        signature={signature}
                        onChange={setAttestation}
                    />

                    <div className="border-outline-variant -mx-5 grid grid-cols-2 gap-3 border-t px-5 pt-4 pb-1">
                        <Button variant="ghost" onClick={retour}>
                            Retour
                        </Button>
                        <Button
                            variant="filled"
                            icon={<Icon glyph={Warning} size={18} />}
                            disabled={!attestation.done}
                            onClick={() => {
                                onDeclare({
                                    outcome,
                                    photos: photos.map((photo) => photo.nom),
                                    comment,
                                    method: attestation.method,
                                });
                                close();
                            }}
                            className={cn(chosen.value === 'serves' && 'bg-primary')}
                        >
                            Déclarer
                        </Button>
                    </div>
                </div>
            )}
        </BottomSheet>
    );
};

export default IncidentSheet;
