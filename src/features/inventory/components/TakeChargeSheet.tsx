import React, { useMemo, useState } from 'react';
import {
    Buildings,
    CalendarBlank,
    Coins,
    ShieldCheck,
    ShieldWarning,
    User,
    Wrench,
} from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import { motifIncident } from '../incidents';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import { Consequences, FieldLabel, FormWarn, SubjectRow } from '../../../components/ui/FormParts';
import RepairFileField from './RepairFileField';
import type { Equipment } from '../../../types';

/**
 * Prendre en charge une réparation — planche **04.4**, premier acte.
 *
 * ## Le geste existait et n'écrivait rien
 *
 * `handleTakeCharge` posait un retour transitoire — *« Prise en charge de
 * l'intervention enregistrée »* — et **n'enregistrait rien**. Le ⋮ de la fiche
 * proposait donc un acte qui ne laissait aucune trace : ni le réparateur, ni la date
 * de retour, ni le coût. C'est le pire des gestes morts, celui qui dit avoir réussi.
 *
 * ## La garantie décide de la route
 *
 * *« Prendre en charge ne demande que ce qui ne se déduit pas, et la garantie décide
 * de la route. »* Sous garantie, on **constate** : le constructeur enlève, le coût est
 * pris en charge, et le verbe du pied est « Prendre en charge ». Hors garantie, un
 * montant part en validation avant la réparation, et le verbe devient **« Demander la
 * validation »** — le pied nomme ce qui va réellement se passer.
 *
 * Le réparateur n'est pas un champ : il se **déduit** de la garantie. Sous garantie
 * c'est la marque, avec enlèvement sur site ; hors garantie, l'atelier du site.
 *
 * ## Une information n'est dite qu'une fois
 *
 * La planche est explicite : *« le bandeau porte la garantie, le bloc de conséquences
 * porte la suite, et rien ne se répète entre les deux »*. Le bandeau ne redit donc pas
 * le montant, et les conséquences ne redisent pas l'état de la garantie.
 */
interface TakeChargeSheetProps {
    open: boolean;
    onClose: () => void;
    item: Equipment;
    /** Le nom du porteur, quand l'objet est attribué — il est prévenu du départ. */
    holderName?: string;
    /** Le site où l'atelier interne travaille, quand la garantie ne couvre plus. */
    siteName?: string;
    /**
     * **La marque du modèle**, résolue au catalogue par la page. Elle n'est pas sur
     * l'objet : `brand` vit sur `Model`, et `item.brand` valait `undefined` depuis que
     * cette feuille existe — le réparateur sous garantie retombait donc toujours sur le
     * nom du modèle, alors que la planche dit « le constructeur ».
     */
    brandName?: string;
    /** Le seuil au-delà duquel le devis part à la Finance, et la devise des réglages. */
    seuil: number;
    devise: string;
    /** Ce qui reste sur la ligne Maintenance de l'exercice — null si la ligne n'existe pas. */
    resteLigne: number | null;
    formatMontant: (valeur: number) => string;
    onConfirm: (valeurs: {
        repairer: string;
        underWarranty: boolean;
        expectedReturn: string;
        ticket?: string;
        quote?: { amount: number; file: File };
        pickupSlip?: File;
    }) => void;
}

/**
 * « 12 août », « 1ᵉʳ janvier » — la date telle que la planche l'écrit. Le premier du
 * mois prend son ordinal : `toLocaleDateString` rend « 1 janvier », qui ne se dit pas.
 */
const enClair = (iso: string): string => {
    const d = new Date(iso);
    const rendu = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    return d.getDate() === 1 ? rendu.replace(/^1\s/, '1ᵉʳ ') : rendu;
};

/** Dans dix jours : la proposition par défaut, corrigeable. */
const dansDixJours = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().slice(0, 10);
};

const TakeChargeSheet: React.FC<TakeChargeSheetProps> = ({
    open,
    onClose,
    item,
    holderName,
    siteName,
    brandName,
    seuil,
    devise,
    resteLigne,
    formatMontant,
    onConfirm,
}) => {
    const [retour, setRetour] = useState(dansDixJours);
    const [montant, setMontant] = useState('');
    const [dossier, setDossier] = useState('');
    /* Hors garantie, **le prestataire se nomme** (24/09) : l'atelier du site était déduit,
       alors que la réparation part le plus souvent chez un tiers, et c'est son devis. */
    const [prestataire, setPrestataire] = useState('');
    const [devis, setDevis] = useState<File | null>(null);
    const [bon, setBon] = useState<File | null>(null);

    /* Le seul fait qui décide de tout le reste. Sans date de fin déclarée, on ne peut
       pas affirmer que l'objet est couvert : l'écran suppose alors qu'il ne l'est pas,
       parce que se tromper dans ce sens fait passer un montant en validation, tandis
       que l'inverse ferait réparer aux frais de personne. */
    const sousGarantie = useMemo(() => {
        if (!item.warrantyEnd) return false;
        const fin = new Date(item.warrantyEnd);
        return !Number.isNaN(fin.getTime()) && fin.getTime() > Date.now();
    }, [item.warrantyEnd]);

    /* Sous garantie, le réparateur se déduit (04.4) ; hors garantie, il se nomme. */
    const reparateur = sousGarantie
        ? brandName || item.model || 'Le constructeur'
        : prestataire.trim();

    const cout = Number(montant.replace(/[\s\u202f\u00a0]/g, '').replace(',', '.'));
    const coutValide = Number.isFinite(cout) && cout > 0;
    const aLaFinance = !sousGarantie && coutValide && cout > seuil;
    const pret =
        Boolean(retour) && (sousGarantie || (Boolean(reparateur) && coutValide && Boolean(devis)));

    const reste = resteLigne !== null && coutValide ? resteLigne - cout : null;
    const consequences = [
        holderName
            ? {
                  tint: 'bleu' as const,
                  glyph: User,
                  content: `Il reviendra à ${holderName} après réparation.`,
              }
            : { tint: 'bleu' as const, glyph: User, content: 'Il reviendra au stock.' },
        ...(sousGarantie
            ? [
                  {
                      tint: 'vert' as const,
                      glyph: Wrench,
                      content: 'Il part chez le constructeur, sans frais.',
                  },
              ]
            : [
                  {
                      tint: aLaFinance ? ('ambre' as const) : ('vert' as const),
                      glyph: Coins,
                      content: !coutValide
                          ? `Au-delà de ${formatMontant(seuil)} ${devise}, le devis part à la Finance.`
                          : aLaFinance
                            ? `Au-delà de ${formatMontant(seuil)} ${devise} : la Finance valide avant l'envoi.`
                            : `Sous ${formatMontant(seuil)} ${devise} : vous validez, il part chez ${reparateur || 'le prestataire'}.`,
                  },
                  ...(reste !== null
                      ? [
                            {
                                tint: reste < 0 ? ('orange' as const) : ('bleu' as const),
                                glyph: Coins,
                                content:
                                    reste < 0
                                        ? `La ligne Maintenance dépassera de ${formatMontant(-reste)} ${devise}.`
                                        : `Il restera ${formatMontant(reste)} ${devise} sur la ligne Maintenance.`,
                            },
                        ]
                      : []),
              ]),
    ];

    const fermer = () => {
        setRetour(dansDixJours());
        setMontant('');
        setDossier('');
        setPrestataire('');
        setDevis(null);
        setBon(null);
        onClose();
    };

    return (
        <BottomSheet open={open} onClose={fermer} title="Prendre en charge">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant text-ts-sub leading-ts-sub">
                    {item.repairStartDate
                        ? `Déclaré le ${enClair(item.repairStartDate)}.`
                        : 'Déclaré récemment.'}
                </p>

                <SubjectRow
                    glyph={Wrench}
                    title={item.name}
                    detail={[item.type, motifIncident(item), holderName && `chez ${holderName}`]
                        .filter(Boolean)
                        .join(' · ')}
                />

                {/* Le bandeau porte la garantie, et rien d'autre. */}
                {sousGarantie ? (
                    <FormWarn glyph={ShieldCheck} tint="vert">
                        <span>
                            <strong className="font-medium">Sous garantie</strong>
                            {item.warrantyEnd ? ` jusqu'au ${enClair(item.warrantyEnd)}.` : '.'}
                        </span>
                    </FormWarn>
                ) : (
                    <FormWarn glyph={ShieldWarning} tint="ambre">
                        <span>
                            <strong className="font-medium">Garantie expirée</strong>
                            {item.warrantyEnd ? ` le ${enClair(item.warrantyEnd)}.` : '.'}
                        </span>
                    </FormWarn>
                )}

                {sousGarantie ? (
                    <div>
                        <FieldLabel>Qui répare</FieldLabel>
                        {/* Déduit de la garantie : la planche ne le fait pas choisir. */}
                        <div className="bg-surface-container flex min-h-14 items-center gap-3 rounded-[4px] px-3.5 py-2">
                            <span className="bg-surface text-text-tertiary flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={Buildings} size={20} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="text-ts-body leading-ts-body block truncate font-medium">
                                    {reparateur}
                                </span>
                                <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                                    enlèvement sur site
                                </span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <InputField
                        label="Prestataire"
                        name="prestataire"
                        value={prestataire}
                        onChange={(event) => setPrestataire(event.target.value)}
                        placeholder={`Atelier informatique${siteName ? ` · ${siteName}` : ''}, ou un tiers`}
                        required
                    />
                )}

                <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                        <FieldLabel>Retour attendu</FieldLabel>
                        <InputField
                            type="date"
                            value={retour}
                            onChange={(event) => setRetour(event.target.value)}
                            icon={<Icon glyph={CalendarBlank} size={18} />}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <FieldLabel>{sousGarantie ? 'Coût' : 'Montant du devis'}</FieldLabel>
                        {sousGarantie ? (
                            <p className="bg-surface-container text-text-tertiary text-ts-body leading-ts-body flex min-h-12 items-center rounded-[4px] px-3.5">
                                pris en charge
                            </p>
                        ) : (
                            <InputField
                                inputMode="numeric"
                                value={montant}
                                onChange={(event) => setMontant(event.target.value)}
                                placeholder="0"
                                suffix={devise}
                                className="tabular-nums"
                            />
                        )}
                    </div>
                </div>

                {!sousGarantie && (
                    <RepairFileField
                        label="Le devis"
                        appel="Joindre le devis"
                        file={devis}
                        onChange={setDevis}
                        manquant={coutValide && !devis}
                    />
                )}
                <RepairFileField
                    label="Bon d'enlèvement"
                    note="facultatif"
                    appel="Joindre le bon du prestataire"
                    file={bon}
                    onChange={setBon}
                />

                <div>
                    <FieldLabel note="facultatif">Dossier du réparateur</FieldLabel>
                    <InputField
                        value={dossier}
                        onChange={(event) => setDossier(event.target.value)}
                        placeholder="numéro de dossier"
                    />
                </div>

                <Consequences label="Ce que cela déclenche" lines={consequences} />

                <div className="border-outline-variant -mx-5 duo-de-pied gap-3 border-t px-5 pt-4 pb-1">
                    <Button variant="ghost" onClick={fermer}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        disabled={!pret}
                        onClick={() => {
                            onConfirm({
                                repairer: reparateur,
                                underWarranty: sousGarantie,
                                expectedReturn: new Date(retour).toISOString(),
                                ticket: dossier.trim() || undefined,
                                quote:
                                    !sousGarantie && devis
                                        ? { amount: cout, file: devis }
                                        : undefined,
                                pickupSlip: bon ?? undefined,
                            });
                            fermer();
                        }}
                    >
                        {/* Le pied nomme ce qui va réellement se passer. */}
                        {aLaFinance ? 'Envoyer à la Finance' : 'Envoyer en réparation'}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default TakeChargeSheet;
