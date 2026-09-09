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
    onConfirm: (valeurs: {
        repairer: string;
        repairExpectedReturn: string;
        repairCost?: number;
        repairTicket?: string;
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
    onConfirm,
}) => {
    const [retour, setRetour] = useState(dansDixJours);
    const [montant, setMontant] = useState('');
    const [dossier, setDossier] = useState('');

    /* Le seul fait qui décide de tout le reste. Sans date de fin déclarée, on ne peut
       pas affirmer que l'objet est couvert : l'écran suppose alors qu'il ne l'est pas,
       parce que se tromper dans ce sens fait passer un montant en validation, tandis
       que l'inverse ferait réparer aux frais de personne. */
    const sousGarantie = useMemo(() => {
        if (!item.warrantyEnd) return false;
        const fin = new Date(item.warrantyEnd);
        return !Number.isNaN(fin.getTime()) && fin.getTime() > Date.now();
    }, [item.warrantyEnd]);

    /* Le réparateur se déduit, il ne se saisit pas (04.4). */
    const reparateur = sousGarantie
        ? brandName || item.model || 'Le constructeur'
        : `Atelier informatique${siteName ? ` · ${siteName}` : ''}`;

    const cout = Number(montant.replace(/\s/g, '').replace(',', '.'));
    const coutValide = Number.isFinite(cout) && cout > 0;

    const consequences = [
        holderName
            ? {
                  tint: 'bleu' as const,
                  glyph: User,
                  content: `${holderName} est prévenu du départ de son poste.`,
              }
            : { tint: 'bleu' as const, glyph: User, content: "L'objet quitte son emplacement." },
        {
            tint: 'ambre' as const,
            glyph: Wrench,
            content: 'Un remplacement est proposé à l’écran suivant.',
        },
        ...(sousGarantie
            ? []
            : [
                  {
                      tint: 'orange' as const,
                      glyph: Coins,
                      content: coutValide
                          ? `${cout.toLocaleString('fr-FR')} XOF partent en validation avant la réparation.`
                          : 'Le montant part en validation avant la réparation.',
                  },
              ]),
    ];

    const fermer = () => {
        setRetour(dansDixJours());
        setMontant('');
        setDossier('');
        onClose();
    };

    return (
        <BottomSheet open={open} onClose={fermer} title="Prendre en charge">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant -mt-2 text-[14px] leading-5">
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

                <div>
                    <FieldLabel>Qui répare</FieldLabel>
                    {/* Déduit de la garantie : la planche ne le fait pas choisir. */}
                    <div className="bg-surface-container flex min-h-14 items-center gap-3 rounded-[4px] px-3.5 py-2">
                        <span className="bg-surface text-text-tertiary flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                            <Icon glyph={Buildings} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[16px] leading-6 font-medium">
                                {reparateur}
                            </span>
                            <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                {sousGarantie ? 'enlèvement sur site' : 'interne'}
                            </span>
                        </span>
                    </div>
                </div>

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
                        <FieldLabel>{sousGarantie ? 'Coût' : 'Montant estimé'}</FieldLabel>
                        {sousGarantie ? (
                            <p className="bg-surface-container text-text-tertiary flex min-h-12 items-center rounded-[4px] px-3.5 text-[16px] leading-6">
                                pris en charge
                            </p>
                        ) : (
                            <InputField
                                mesure="courte"
                                inputMode="numeric"
                                value={montant}
                                onChange={(event) => setMontant(event.target.value)}
                                placeholder="0"
                                suffix="XOF"
                            />
                        )}
                    </div>
                </div>

                <div>
                    <FieldLabel note="facultatif">Dossier du réparateur</FieldLabel>
                    <InputField
                        value={dossier}
                        onChange={(event) => setDossier(event.target.value)}
                        placeholder="numéro de dossier"
                    />
                </div>

                <Consequences label="Ce que cela déclenche" lines={consequences} />

                <div className="border-outline-variant mt-1 grid grid-cols-2 gap-3 border-t pt-4">
                    <Button variant="ghost" onClick={fermer}>
                        Annuler
                    </Button>
                    <Button
                        variant="filled"
                        disabled={!retour || (!sousGarantie && !coutValide)}
                        onClick={() => {
                            onConfirm({
                                repairer: reparateur,
                                repairExpectedReturn: new Date(retour).toISOString(),
                                repairCost: sousGarantie ? undefined : cout,
                                repairTicket: dossier.trim() || undefined,
                            });
                            fermer();
                        }}
                    >
                        {/* Le pied nomme ce qui va réellement se passer. */}
                        {sousGarantie ? 'Prendre en charge' : 'Demander la validation'}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default TakeChargeSheet;
