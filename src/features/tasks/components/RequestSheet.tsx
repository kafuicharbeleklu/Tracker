import React, { useEffect, useMemo, useState } from 'react';
import {
    Armchair,
    Buildings,
    Desktop,
    Hourglass,
    Info,
    Plugs,
    Printer,
    User as UserIcon,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import BottomSheet from '../../../components/ui/BottomSheet';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InlineError from '../../../components/ui/InlineError';
import { ChoiceTile, FieldLabel, PickRow, Segmented } from '../../../components/ui/FormParts';
import SelectField from '../../../components/ui/SelectField';
import { TextArea } from '../../../components/ui/TextArea';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { getCategoryGlyph } from '../../../constants/categoryIcons';
import { getCategoryLabel } from '../../../constants/glossary';
import { ACTIVE_APPROVAL_STATUSES, approvalRequiresManagerGate } from '../../../lib/businessRules';
import { cn } from '../../../lib/utils';
import { CATEGORY_FAMILIES, type CategoryFamily, type User } from '../../../types';

/**
 * **Demander un équipement** — planche **06.4**, passe sobre du 03/09.
 *
 * *« Le premier maillon, et le seul qui n'avait pas d'écran. »* Il en avait un, en fait :
 * une page plein écran à quatre champs, dont un sélecteur de bénéficiaire ouvert à tout
 * l'annuaire et un menu déroulant de types. La planche en fait **une feuille sur la page
 * où l'on est**, avec trois questions dans l'ordre où elles se décident : *quoi*,
 * *pourquoi maintenant*, *à quel point c'est pressé*.
 *
 * ## Ce que la feuille ne demande pas
 *
 * Le site, le service, ce qu'on détient déjà : *« le reste est sur la fiche »*. Et le
 * **modèle** — on demande un type, l'informatique choisit l'objet. Un demandeur qui
 * choisirait son modèle demanderait en réalité un objet précis, ce que le parc ne promet
 * pas.
 *
 * ## Deux crans d'urgence, pas trois
 *
 * *« Le produit n'en distingue pas trois. »* Le formulaire en offrait trois — basse,
 * normale, haute — dont la première ne changeait rien à rien : une demande « basse » suit
 * exactement le même chemin qu'une demande normale.
 *
 * ## La destination se dit avant le geste
 *
 * Elle change selon qui demande pour qui : pour soi, elle part au manager ; quand c'est
 * le manager lui-même qui demande pour son subordonné, elle part directement à
 * l'informatique. C'est la règle §9.9, et elle était écrite sous le formulaire en petit.
 *
 * ## Une demande déjà en cours ne bloque pas
 *
 * *« Demander deux objets est légitime. On rappelle celle qui existe, avec le lien qui
 * l'ouvre. »*
 */

/** Les quatre familles du catalogue, leur glyphe et leur teinte (06.4, `.fh .si`). */
const FAMILLES: Record<CategoryFamily, { glyph: PhosphorGlyph; teinte: string }> = {
    Informatique: { glyph: Desktop, teinte: 'bg-tint-bleu text-on-tint-bleu' },
    Périphériques: { glyph: Plugs, teinte: 'bg-tint-vert text-on-tint-vert' },
    'Impression et réseau': { glyph: Printer, teinte: 'bg-tint-ambre text-on-tint-ambre' },
    'Mobilier et divers': { glyph: Armchair, teinte: 'bg-tint-orange text-on-tint-orange' },
};

/** Le seuil du motif : une phrase, pas un mot. Il vient de la page qu'elle remplace. */
const MOTIF_MINIMUM = 20;

interface RequestSheetProps {
    open: boolean;
    onClose: () => void;
    /** Le bénéficiaire désigné par l'entrée — la fiche d'une personne. */
    beneficiaryId?: string;
    /** Ce que la demande est devenue : la page qui l'ouvre dit « envoyée » à sa façon. */
    onSent?: (envoi: { beneficiaire: User; destination: string; type: string }) => void;
}

const RequestSheet: React.FC<RequestSheetProps> = ({ open, onClose, beneficiaryId, onSent }) => {
    const { users, categories, approvals, addApproval } = useData();
    const { user: currentUser, role } = useAccessControl();
    const { navigate } = useAppNavigation();

    const [vue, setVue] = useState<'demande' | 'type'>('demande');
    const [beneficiaireId, setBeneficiaireId] = useState<string>('');
    const [type, setType] = useState<string>('');
    const [motif, setMotif] = useState('');
    const [urgence, setUrgence] = useState<'normal' | 'high'>('normal');
    const [erreurs, setErreurs] = useState<{ type?: string; motif?: string }>({});

    useEffect(() => {
        if (!open) return;
        setVue('demande');
        setBeneficiaireId(beneficiaryId || currentUser?.id || '');
        setType('');
        setMotif('');
        setUrgence('normal');
        setErreurs({});
    }, [open, beneficiaryId, currentUser?.id]);

    const beneficiaire = useMemo(
        () => users.find((person) => person.id === beneficiaireId) ?? currentUser ?? null,
        [users, beneficiaireId, currentUser],
    );

    /** Pour soi, ou pour quelqu'un dont on répond. Un employé ne demande que pour lui. */
    const peutDemanderPourUnAutre = role !== 'User';

    /** Les types qui se remettent en main propre : un serveur sert un lieu, pas une personne. */
    const typesDemandables = useMemo(
        () => categories.filter((category) => category.assignable),
        [categories],
    );

    /*
     * La note de bas de feuille explique une **absence** : si rien n'est absent, elle
     * affirme le contraire de ce que la liste montre. Le cas se produit pour de vrai —
     * une catégorie enregistrée avant l'ajout du drapeau `assignable` le prend à `true`
     * par défaut, si bien qu'un catalogue importé propose ses serveurs et ses
     * imprimantes. La note se tait alors, au lieu de mentir.
     */
    const desTypesSontExclus = typesDemandables.length < categories.length;

    const typeChoisi = useMemo(
        () => typesDemandables.find((category) => category.name === type) ?? null,
        [typesDemandables, type],
    );

    const parFamille = useMemo(
        () =>
            CATEGORY_FAMILIES.map((famille) => ({
                famille,
                types: typesDemandables
                    .filter((category) => category.family === famille)
                    .sort((a, b) =>
                        getCategoryLabel(a.name).localeCompare(getCategoryLabel(b.name), 'fr'),
                    ),
            })).filter((groupe) => groupe.types.length > 0),
        [typesDemandables],
    );

    /** La demande déjà en cours pour cette personne — rappelée, jamais bloquante. */
    const dejaEnCours = useMemo(
        () =>
            approvals.find(
                (approval) =>
                    approval.beneficiaryId === beneficiaire?.id &&
                    ACTIVE_APPROVAL_STATUSES.includes(approval.status),
            ) ?? null,
        [approvals, beneficiaire?.id],
    );

    /** Qui recevra la demande — la règle §9.9, dite avant le geste. */
    const passeParLeManager = useMemo(() => {
        if (!currentUser || !beneficiaire) return false;
        return approvalRequiresManagerGate(
            {
                requesterId: currentUser.id,
                beneficiaryId: beneficiaire.id,
                beneficiaryName: beneficiaire.name,
            },
            users,
        );
    }, [currentUser, beneficiaire, users]);

    const manager = useMemo(
        () =>
            beneficiaire?.managerId
                ? (users.find((person) => person.id === beneficiaire.managerId) ?? null)
                : null,
        [users, beneficiaire?.managerId],
    );

    const pourUnAutre = Boolean(beneficiaire && currentUser && beneficiaire.id !== currentUser.id);

    /** Pour soi d'abord, puis les comptes en service : on demande le plus souvent pour soi. */
    const beneficiairesPossibles = useMemo(
        () => [
            ...(currentUser ? [{ value: currentUser.id, label: 'Moi-même' }] : []),
            ...users
                .filter((person) => person.id !== currentUser?.id && person.status !== 'inactive')
                .map((person) => ({ value: person.id, label: person.name })),
        ],
        [users, currentUser],
    );

    const envoyer = () => {
        if (!currentUser || !beneficiaire) return;

        const prochainesErreurs: { type?: string; motif?: string } = {};
        if (!type) prochainesErreurs.type = 'Choisissez ce que vous demandez.';
        if (!motif.trim()) prochainesErreurs.motif = 'Dites ce que vous avez et ce qui ne va plus.';
        else if (motif.trim().length < MOTIF_MINIMUM) {
            prochainesErreurs.motif = 'Une phrase suffit : ce que vous avez, et ce qui ne va plus.';
        }

        setErreurs(prochainesErreurs);
        if (Object.keys(prochainesErreurs).length > 0) return;

        const maintenant = new Date().toISOString();
        addApproval({
            requesterId: currentUser.id,
            requesterName: currentUser.name,
            requesterRole: currentUser.role,
            beneficiaryId: beneficiaire.id,
            beneficiaryName: beneficiaire.name,
            isDelegated: pourUnAutre,
            equipmentCategory: type,
            reason: motif.trim(),
            urgency: urgence,
            status: passeParLeManager ? 'WAITING_MANAGER_APPROVAL' : 'WAITING_IT_PROCESSING',
            createdAt: maintenant,
            updatedAt: maintenant,
            requester: currentUser.name,
            equipmentName: `Demande: ${getCategoryLabel(type)}`,
            equipmentType: type,
            requestType: 'Attribution',
            requestDate: "Aujourd'hui",
            image: '',
        });

        const destination = passeParLeManager ? manager?.name || 'votre manager' : "l'informatique";
        /* 06.3, forme 2 — l'accusé est **un bandeau en tête de page**, pas un snackbar :
           rien de visible n'a changé ici, l'effet est chez quelqu'un d'autre, et le
           bandeau dit chez qui. Les deux ensemble disaient la même chose deux fois. */
        onSent?.({ beneficiaire, destination, type: getCategoryLabel(type) });
        onClose();
    };

    if (!open) return null;

    /* La feuille de choix : **des chemins, pas de pied**. On en sort en choisissant. */
    if (vue === 'type') {
        return (
            <BottomSheet open onClose={() => setVue('demande')} title="Ce que je demande">
                <div className="flex flex-col gap-4">
                    <p className="text-on-surface-variant -mt-2 text-[14px] leading-5">
                        Un type ; le modèle, c’est l’informatique qui le choisit.
                    </p>

                    {parFamille.map(({ famille, types }) => (
                        <div key={famille} className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]',
                                        FAMILLES[famille].teinte,
                                    )}
                                >
                                    <Icon glyph={FAMILLES[famille].glyph} size={18} />
                                </span>
                                <span className="text-on-surface flex-1 text-[17px] leading-6 font-medium">
                                    {famille}
                                </span>
                                <span className="text-on-surface-variant text-[14px] leading-5 tabular-nums">
                                    {types.length}
                                </span>
                            </div>

                            {/* `.grid` — deux colonnes, tuiles de 88. */}
                            <div className="grid grid-cols-2 gap-2">
                                {types.map((category) => (
                                    <ChoiceTile
                                        key={category.id}
                                        glyph={getCategoryGlyph(category.name)}
                                        label={getCategoryLabel(category.name)}
                                        selected={category.name === type}
                                        onClick={() => {
                                            setType(category.name);
                                            setErreurs((prev) => ({ ...prev, type: undefined }));
                                            setVue('demande');
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* `.fnote` — pourquoi certains types n'y sont pas. */}
                    {desTypesSontExclus && (
                        <p className="border-outline-variant text-on-surface-variant flex items-start gap-2 border-t pt-3 text-[14px] leading-5">
                            <Icon
                                glyph={Info}
                                size={18}
                                className="text-text-tertiary mt-px shrink-0"
                            />
                            <span>
                                <strong className="text-on-surface font-medium">
                                    Serveurs, imprimantes, mobilier
                                </strong>{' '}
                                appartiennent à un lieu : ils se demandent à l’informatique
                                directement.
                            </span>
                        </p>
                    )}
                </div>
            </BottomSheet>
        );
    }

    return (
        <BottomSheet open onClose={onClose} title="Demander un équipement">
            <div className="flex flex-col gap-4">
                <p className="text-on-surface-variant -mt-2 text-[14px] leading-5">
                    {pourUnAutre
                        ? `Pour ${beneficiaire?.name.split(' ')[0]}, à votre nom.`
                        : 'Votre manager décide, l’informatique remet.'}
                </p>

                {/* On ne bloque pas : on rappelle celle qui existe. */}
                {dejaEnCours && (
                    <div className="bg-tint-ambre text-on-tint-ambre flex min-h-14 items-center gap-3 rounded-[4px] px-3.5 py-2">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-white/55">
                            <Icon glyph={Hourglass} size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[16px] leading-6">
                                {getCategoryLabel(dejaEnCours.equipmentCategory || '')} attend déjà
                            </span>
                            <span className="block truncate text-[14px] leading-5 opacity-80">
                                {dejaEnCours.status === 'WAITING_MANAGER_APPROVAL'
                                    ? `chez ${manager?.name || 'le manager'}`
                                    : 'chez l’informatique'}
                            </span>
                        </span>
                        {/* Le lien qui l'ouvre : on rappelle la demande en cours, on ne
                            se contente pas de la mentionner. */}
                        <Button
                            variant="text"
                            onClick={() => {
                                onClose();
                                navigate('/tasks');
                            }}
                            className="h-auto !min-h-0 shrink-0 !px-0 !py-0 text-[15px] font-medium text-current underline underline-offset-2"
                        >
                            Ouvrir
                        </Button>
                    </div>
                )}

                {/* Pour qui — la rangée n'existe que si on peut demander pour un autre. */}
                {peutDemanderPourUnAutre && (
                    <div>
                        <FieldLabel>Pour qui</FieldLabel>
                        <div className="bg-surface-container flex min-h-14 items-center gap-3 rounded-[4px] px-3.5 py-2">
                            <span className="bg-tint-bleu text-on-tint-bleu font-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] text-[15px] font-semibold">
                                {(beneficiaire?.name || '?')
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((mot) => mot[0])
                                    .join('')
                                    .toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[16px] leading-6 font-medium">
                                    {beneficiaire?.name}
                                </span>
                                <span className="text-on-surface-variant block truncate text-[14px] leading-5">
                                    {[beneficiaire?.department, beneficiaire?.site]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </span>
                            </span>
                        </div>

                        {/* Le bénéficiaire imposé par l'entrée ne se change pas ici :
                            on est venu depuis sa fiche. Sinon, il se choisit. */}
                        {!beneficiaryId && (
                            <SelectField
                                label="Changer de bénéficiaire"
                                name="beneficiaire"
                                value={beneficiaireId}
                                onChange={(event) => setBeneficiaireId(event.target.value)}
                                options={beneficiairesPossibles}
                                className="mt-2"
                            />
                        )}
                    </div>
                )}

                {/* Ce que je demande — la rangée ouvre la feuille de choix. */}
                <div>
                    <FieldLabel>Ce que je demande</FieldLabel>
                    <PickRow
                        vignette={<Icon glyph={getCategoryGlyph(typeChoisi?.name)} size={20} />}
                        tint={typeChoisi ? 'bleu' : undefined}
                        title={typeChoisi ? getCategoryLabel(typeChoisi.name) : 'Choisir un type'}
                        subtitle={typeChoisi?.family}
                        empty={!typeChoisi}
                        actionLabel={typeChoisi ? 'Changer' : 'Choisir'}
                        onClick={() => setVue('type')}
                    />
                    {erreurs.type && <InlineError className="mt-2">{erreurs.type}</InlineError>}
                </div>

                {/* Pourquoi maintenant — `.free`, 96 de haut sur le creux. */}
                <div>
                    <FieldLabel>Pourquoi maintenant</FieldLabel>
                    <TextArea
                        value={motif}
                        onChange={(event) => {
                            setMotif(event.target.value);
                            if (erreurs.motif)
                                setErreurs((prev) => ({ ...prev, motif: undefined }));
                        }}
                        rows={3}
                        aria-label="Pourquoi maintenant"
                        placeholder="Ce que vous avez, et ce qui ne va plus."
                    />
                    {erreurs.motif ? (
                        <InlineError className="mt-2">{erreurs.motif}</InlineError>
                    ) : (
                        <p className="text-on-surface-variant mt-2 text-[14px] leading-5">
                            Une phrase :{' '}
                            <strong className="text-on-surface font-medium">
                                ce que vous avez, et ce qui ne va plus
                            </strong>
                            .
                        </p>
                    )}
                </div>

                {/* Urgence — deux crans, parce que le produit n'en distingue pas trois. */}
                <div>
                    <FieldLabel>Urgence</FieldLabel>
                    <Segmented
                        label="Urgence"
                        value={urgence}
                        onChange={setUrgence}
                        options={[
                            { value: 'normal', label: 'Normale' },
                            { value: 'high', label: 'Urgente' },
                        ]}
                    />
                </div>

                {/* Ce que cela déclenche — la destination, dite avant le geste. */}
                <div className="bg-surface-container flex flex-col gap-2.5 rounded-[4px] px-4 py-3">
                    <p className="text-on-surface-variant text-[12px] leading-4 font-medium">
                        Ce que cela déclenche
                    </p>
                    <p className="text-on-surface flex items-center gap-3 text-[14px] leading-5">
                        <span className="bg-tint-bleu text-on-tint-bleu flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]">
                            <Icon glyph={passeParLeManager ? UserIcon : Buildings} size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                            {passeParLeManager ? (
                                <>
                                    Part à{' '}
                                    <strong className="font-medium">
                                        {manager?.name || 'votre manager'}
                                    </strong>
                                    . Sa réponse vous attendra dans Tâches.
                                </>
                            ) : pourUnAutre ? (
                                <>
                                    <strong className="font-medium">Vous en répondez</strong> : part
                                    directement à l’informatique.
                                </>
                            ) : (
                                <>
                                    Part directement à{' '}
                                    <strong className="font-medium">l’informatique</strong>.
                                </>
                            )}
                        </span>
                    </p>
                </div>

                {/* `.sfoot` — deux verbes de même largeur, filet au-dessus. */}
                <div className="border-outline-variant mt-2 grid grid-cols-2 gap-3 border-t pt-4">
                    <Button variant="ghost" onClick={onClose} className="!rounded-[4px]">
                        Annuler
                    </Button>
                    <Button variant="filled" onClick={envoyer} className="!rounded-[4px]">
                        Envoyer
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default RequestSheet;
