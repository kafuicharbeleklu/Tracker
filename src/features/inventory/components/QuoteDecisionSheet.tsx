import React, { useState } from 'react';
import { Buildings, Check, Coins, FileText, Warning, X } from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { TextArea } from '../../../components/ui/TextArea';
import { Consequences, FieldLabel, SubjectRow } from '../../../components/ui/FormParts';
import type { Equipment } from '../../../types';

/**
 * **Valider le devis d'une réparation** — la Finance, au-delà du seuil (24/09).
 *
 * La prise en charge disait « Montant envoyé en validation » et n'envoyait rien : le
 * montant restait sur la fiche, sans personne pour le trancher. La feuille met sous les
 * yeux ce qui décide — le devis et son fichier, le prestataire, ce qu'il restera sur la
 * ligne Maintenance du budget — et deux issues. Un refus demande son motif : c'est la
 * seule chose que l'informatique lira pour reprendre le dossier.
 */
interface QuoteDecisionSheetProps {
    open: boolean;
    onClose: () => void;
    item: Equipment;
    /** « 1 250 000 XOF » — la page met en forme. */
    montant: string;
    /** Ce qu'il restera sur la ligne après ce devis, déjà mis en forme — ou null. */
    resteApres: { texte: string; depasse: boolean } | null;
    onOpenFile?: () => void;
    onDecide: (approve: boolean, reason?: string) => void;
}

const QuoteDecisionSheet: React.FC<QuoteDecisionSheetProps> = ({
    open,
    onClose,
    item,
    montant,
    resteApres,
    onOpenFile,
    onDecide,
}) => {
    const [refus, setRefus] = useState(false);
    const [motif, setMotif] = useState('');
    const r = item.repair;
    const fermer = () => {
        setRefus(false);
        setMotif('');
        onClose();
    };

    return (
        <BottomSheet
            open={open}
            onClose={fermer}
            title={refus ? 'Refuser le devis' : 'Valider le devis'}
            subtitle={r?.takenCharge ? `pris en charge par ${r.takenCharge.byName}` : undefined}
        >
            <div className="flex flex-col gap-4">
                <SubjectRow
                    glyph={Coins}
                    title={montant}
                    detail={[item.name, item.assetId].filter(Boolean).join(' · ')}
                />

                <div className="bg-surface-container flex flex-col rounded-[4px] px-3.5">
                    <div className="border-outline-variant flex min-h-12 items-center gap-3 border-b">
                        <Icon glyph={Buildings} size={18} className="text-on-surface-variant" />
                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub w-24 shrink-0">
                            Prestataire
                        </span>
                        <span className="text-on-surface text-ts-sub leading-ts-sub min-w-0 flex-1 truncate">
                            {r?.takenCharge?.repairer ?? '—'}
                        </span>
                    </div>
                    <div className="flex min-h-12 items-center gap-3">
                        <Icon glyph={FileText} size={18} className="text-on-surface-variant" />
                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub w-24 shrink-0">
                            Devis
                        </span>
                        <span className="text-on-surface text-ts-sub leading-ts-sub min-w-0 flex-1 truncate">
                            {r?.quote?.fileName ?? 'aucun fichier'}
                        </span>
                        {r?.quote?.fileId && onOpenFile && (
                            <Button variant="text" size="sm" onClick={onOpenFile} className="-mr-2">
                                Ouvrir
                            </Button>
                        )}
                    </div>
                </div>

                {refus ? (
                    <div>
                        <FieldLabel>Le motif, que l’informatique lira</FieldLabel>
                        <TextArea
                            aria-label="Motif du refus"
                            value={motif}
                            onChange={(event) => setMotif(event.target.value)}
                            rows={3}
                            placeholder="Trop cher au regard de la valeur restante ; demander un second devis."
                        />
                    </div>
                ) : (
                    resteApres && (
                        <Consequences
                            label="Ce que cela engage"
                            lines={[
                                {
                                    glyph: resteApres.depasse ? Warning : Coins,
                                    tint: resteApres.depasse ? 'orange' : 'bleu',
                                    content: resteApres.texte,
                                },
                                {
                                    glyph: Check,
                                    tint: 'vert',
                                    content: 'L’objet part chez le prestataire.',
                                },
                            ]}
                        />
                    )
                )}

                <div className="border-outline-variant duo-de-pied -mx-5 gap-3 border-t px-5 pt-4 pb-1">
                    {refus ? (
                        <>
                            <Button variant="ghost" onClick={() => setRefus(false)}>
                                Retour
                            </Button>
                            <Button
                                variant="danger"
                                icon={<Icon glyph={X} size={20} />}
                                disabled={!motif.trim()}
                                onClick={() => {
                                    onDecide(false, motif);
                                    fermer();
                                }}
                            >
                                Refuser
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setRefus(true)}>
                                Refuser…
                            </Button>
                            <Button
                                variant="filled"
                                icon={<Icon glyph={Check} size={20} />}
                                onClick={() => {
                                    onDecide(true);
                                    fermer();
                                }}
                            >
                                Valider
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
};

export default QuoteDecisionSheet;
