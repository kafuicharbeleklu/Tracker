import React, { useEffect, useState } from 'react';
import {
    CheckCircle,
    ClockCounterClockwise,
    SignOut,
    User,
    Coins,
    Receipt,
    Warning,
    Wrench,
} from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import { motifIncident } from '../incidents';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import RepairFileField from './RepairFileField';
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
    devise: string;
    formatMontant: (valeur: number) => string;
    /**
     * À la récupération, **la facture ou le reçu** (24/09) : il devient la dépense de la
     * ligne Maintenance, son fichier en justificatif. Absent sous garantie.
     */
    onConfirm: (
        outcome: RepairOutcome,
        invoice?: { amount: number; supplier: string; file: File },
    ) => void;
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
    devise,
    formatMontant,
    onConfirm,
}) => {
    const [outcome, setOutcome] = useState<RepairOutcome>('repaired');
    const dossier = item.repair;
    /* Sous garantie, rien à payer ; hors garantie, la pièce est demandée. Un objet réparé
       avant le parcours (sans dossier) garde l'ancienne réception, sans facture. */
    const facturable = Boolean(dossier) && !dossier?.takenCharge?.underWarranty;
    const [montant, setMontant] = useState(() =>
        dossier?.quote?.amount ? String(dossier.quote.amount) : '',
    );
    const [fournisseur, setFournisseur] = useState(dossier?.takenCharge?.repairer ?? '');
    const [facture, setFacture] = useState<File | null>(null);
    /* La feuille reste montée : à chaque ouverture, elle reprend le devis du dossier. */
    useEffect(() => {
        if (!open) return;
        setMontant(dossier?.quote?.amount ? String(dossier.quote.amount) : '');
        setFournisseur(dossier?.takenCharge?.repairer ?? '');
        setFacture(null);
    }, [open, dossier?.quote?.amount, dossier?.takenCharge?.repairer]);
    const cout = Number(montant.replace(/[\s\u202f\u00a0]/g, '').replace(',', '.'));
    const coutValide = Number.isFinite(cout) && cout > 0;
    const ecart = dossier?.quote && coutValide ? cout - dossier.quote.amount : 0;
    const pret = !facturable || (coutValide && Boolean(facture) && Boolean(fournisseur.trim()));

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
                                fiche.
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
                                <strong className="font-medium">Sortir du parc</strong> s'ouvre.
                            </>
                        ),
                    },
                ];

    const fermer = () => {
        setOutcome('repaired');
        setFacture(null);
        onClose();
    };

    const lignesFacture =
        facturable && coutValide
            ? [
                  {
                      tint: 'bleu' as const,
                      glyph: Receipt,
                      content: `Une dépense de ${formatMontant(cout)} ${devise} sur Maintenance & Services.`,
                  },
                  ...(ecart !== 0
                      ? [
                            {
                                tint: ecart > 0 ? ('orange' as const) : ('vert' as const),
                                glyph: Coins,
                                content:
                                    ecart > 0
                                        ? `${formatMontant(ecart)} ${devise} de plus que le devis.`
                                        : `${formatMontant(-ecart)} ${devise} de moins que le devis.`,
                            },
                        ]
                      : []),
              ]
            : [];

    return (
        <BottomSheet open={open} onClose={fermer} title="Réceptionner">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub">
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
                            hint="Ouvre « Sortir du parc »"
                            selected={outcome === 'irreparable'}
                            tint="rouge"
                            onSelect={() => setOutcome('irreparable')}
                        />
                    </div>
                </div>

                {facturable && (
                    <>
                        <div className="flex gap-3">
                            <div className="min-w-0 flex-1">
                                <InputField
                                    label="Fournisseur"
                                    name="fournisseur"
                                    value={fournisseur}
                                    onChange={(event) => setFournisseur(event.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-40 shrink-0">
                                <InputField
                                    label="Montant payé"
                                    name="montant-facture"
                                    inputMode="numeric"
                                    value={montant}
                                    onChange={(event) => setMontant(event.target.value)}
                                    suffix={devise}
                                    className="tabular-nums"
                                    required
                                />
                            </div>
                        </div>
                        <RepairFileField
                            label="Facture ou reçu"
                            appel="Joindre la facture"
                            file={facture}
                            onChange={setFacture}
                            manquant={coutValide && !facture}
                        />
                    </>
                )}

                <Consequences
                    label="Ce que cela referme"
                    lines={[...consequences, ...lignesFacture]}
                />

                <div className="border-outline-variant duo-de-pied -mx-5 gap-3 border-t px-5 pt-4 pb-1">
                    <Button variant="ghost" onClick={fermer}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        disabled={!pret}
                        onClick={() => {
                            onConfirm(
                                outcome,
                                facturable && facture
                                    ? { amount: cout, supplier: fournisseur.trim(), file: facture }
                                    : undefined,
                            );
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
