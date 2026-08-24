import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, FileText, Info, MapPin, Package, Scan } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import BottomSheet from '../../../components/ui/BottomSheet';
import SearchField from '../../../components/ui/SearchField';
import ScanView, { type ScanHit } from '../../../components/ui/ScanView';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { getCategoryLabel } from '../../../constants/glossary';
import { resolveDepreciationConfig } from '../../../lib/financial';
import { nextInternalCode, proposeReadableId } from '../lib/assetCode';
import { cn } from '../../../lib/utils';
import { AppSettings, EquipmentDocument, Model } from '../../../types';

interface AddEquipmentPageProps {
    equipmentId?: string; // Optional for Edit Mode
    onCancel: () => void;
    onSave: () => void;
}

/**
 * **Saisir la fiche d'un équipement — planche 04.3, colonne 1.**
 *
 * *« Créer et modifier ne sont pas deux écrans. »* Mêmes champs, même ordre, même
 * validation ; seuls changent le titre, la ligne sous le titre et le libellé du
 * bouton. En faire deux écrans, c'est se garantir qu'ils divergeront.
 *
 * ## La règle qui gouverne le formulaire
 *
 * **Un écran de saisie ne demande que ce qui ne se déduit pas.** Ce que le catalogue
 * porte déjà est **posé, pas redemandé** — et les quatre sections suivent l'ordre de
 * ce qu'on sait au moment où on le saisit : l'objet en main, sa configuration, où il
 * va, ce qu'il a coûté.
 *
 * ## Ce que le portage retire, et pourquoi
 *
 * - **Le sélecteur de catégorie.** Le modèle vient du catalogue et emporte son type,
 *   sa marque et sa durée d'amortissement. Les redemander ouvre la porte à trois
 *   orthographes du même portable ; une correction se fait **au catalogue**.
 * - **Le bloc « Règle de dépréciation » et son bouton « Personnaliser ».** *« Le
 *   pourcentage amorti et la date de renouvellement se calculent à partir du prix, de
 *   la date et de la catégorie : ils ne se saisissent jamais. »* La cascade
 *   fiche → type → défaut global reste en place ; l'écran **dit** la règle qui
 *   s'appliquera, il ne la fait plus saisir.
 * - **Les deux sélecteurs d'état** — neuf statuts d'inventaire, trois statuts
 *   opérationnels. À l'enregistrement, un objet est **disponible** ou **attendu** :
 *   les sept autres valeurs sont produites par un geste (attribution, réparation,
 *   sortie), pas par une saisie. En correction, un état qui vient d'un geste est
 *   montré et **non modifiable** — *« un objet change de mains par une attribution,
 *   jamais par une correction de fiche, sinon le parc perd la trace du geste »*.
 * - **La carte « Aperçu de la fiche »**, qui portait un titre et **rien** dessous, et
 *   la carte « Aperçu visuel » de 240 px : la vignette du modèle tient dans la rangée
 *   de sélection.
 * - **« Observations »** : la planche ne la porte pas. Les notes déjà écrites sont
 *   conservées — le formulaire ne les efface pas, il ne les édite plus.
 *
 * ## Ce que le portage ajoute
 *
 * - **L'identifiant lisible** (`LPT-HQ-15`), qui **n'était pas saisi du tout** : le
 *   code écrivait `name: formData.model`, si bien qu'une fiche créée ici s'appelait
 *   « Dell Latitude 7420 » quand tout le parc porte `TYPE-SITE-RANG`. Il est proposé,
 *   composé du type, du site et du rang, et modifiable — c'est lui qu'on colle sur
 *   l'objet, et c'est lui que `siteCodeOf` (10.1) relit pour déduire le code d'un site.
 * - **Le scan du numéro de série** — l'emploi « simple / 04.3 » que 17.3 déclare et
 *   que personne n'appelait. Il remplace une **simulation qui inventait un numéro**
 *   (`SN-` + huit caractères au hasard) : un identifiant faux est pire qu'un champ
 *   vide. La vue ne décode rien par contrat ; la lecture réelle passe par « Saisir à
 *   la main », comme dans la campagne d'audit.
 * - **Le code interne**, montré au moment de l'enregistrement et jamais tapé, et les
 *   **documents** (facture, garantie).
 */

/** Le troisième palier de la cascade — fiche → type → **défaut global** (14.1). */
const globalDepreciationConfig = (settings: AppSettings) => ({
    method: settings.defaultDepreciationMethod,
    years: settings.defaultDepreciationYears,
    salvagePercent: settings.salvageValuePercent,
});

/** Les deux états qu'une saisie peut poser. Les sept autres viennent d'un geste. */
const CREATION_STATES: Array<{ value: string; title: string; hint: string }> = [
    {
        value: 'Disponible',
        title: 'Disponible',
        hint: "Entre immédiatement dans les sélecteurs d'attribution",
    },
    {
        value: 'En attente',
        title: 'En attente de réception',
        hint: 'Commandé, pas encore physiquement là',
    },
];

const SOURCE_LABELS: Record<string, string> = {
    equipment: 'réglée sur cette fiche',
    category: 'héritée du type',
    global: 'le défaut de Paramètres',
};

/** La carte d'une section — `.fsec` de la planche. */
const FormSection: React.FC<{
    title: string;
    caption?: string;
    children: React.ReactNode;
}> = ({ title, caption, children }) => (
    <section className="rounded-card bg-surface flex flex-col gap-3 p-4">
        <p className="text-body-medium text-on-surface flex items-baseline gap-2 font-medium">
            {title}
            {caption && <span className="text-on-surface-variant text-[11px]">{caption}</span>}
        </p>
        {children}
    </section>
);

/** `.fnote` — ce que l'écran déduit, dit une fois, jamais redemandé. */
const FormNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-on-surface-variant text-[11px] leading-4">{children}</p>
);

/** `.warn` — le rappel encadré, sur encart. */
const FormWarn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="bg-surface-container text-on-surface-variant flex gap-2.5 rounded-xs px-3 py-2.5 text-[12px] leading-[17px]">
        <Icon glyph={Info} size={18} className="mt-px shrink-0" />
        <span>{children}</span>
    </p>
);

/** `.lab` — l'étiquette d'un champ. */
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-on-surface-variant mb-1.5 text-[11px] font-medium tracking-[0.06em] uppercase">
        {children}
    </p>
);

/** `.opt` — un cran de l'échelle, nommé par ce qu'il déclenche. */
const OptionRow: React.FC<{
    title: string;
    hint: string;
    selected: boolean;
    onSelect?: () => void;
    disabled?: boolean;
}> = ({ title, hint, selected, onSelect, disabled }) => (
    <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        className={cn(
            'flex min-h-14 w-full items-center gap-3 rounded-xs border px-3 py-2 text-left',
            selected ? 'border-on-surface border-[1.5px]' : 'border-outline-variant',
            disabled ? 'cursor-default' : 'hover:bg-surface-container',
        )}
    >
        <span className="min-w-0 flex-1">
            <span className="text-on-surface block text-[15px] font-medium">{title}</span>
            <span className="text-on-surface-variant mt-px block text-[12px]">{hint}</span>
        </span>
        <span
            className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                selected
                    ? 'bg-[var(--tk-color-inverse-surface)] text-white'
                    : 'border-outline border-[1.5px]',
            )}
        >
            {selected && <Icon glyph={Check} size={14} />}
        </span>
    </button>
);

const AddEquipmentPage: React.FC<AddEquipmentPageProps> = ({ equipmentId, onCancel, onSave }) => {
    const { showToast } = useToast();
    const { locationData, categories, equipment, models, addEquipment, updateEquipment, settings } =
        useData();

    const isEditMode = !!equipmentId;
    const existing = useMemo(
        () => (equipmentId ? equipment.find((item) => item.id === equipmentId) : undefined),
        [equipmentId, equipment],
    );

    const [formData, setFormData] = useState({
        model: '',
        serialNumber: '',
        readableId: '',
        ram: '',
        storage: '',
        os: '',
        country: '',
        site: '',
        status: 'Disponible',
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: '',
        warrantyEnd: '',
    });
    const [documents, setDocuments] = useState<EquipmentDocument[]>([]);
    /** L'identifiant a-t-il été retouché à la main ? Alors on ne le repropose plus. */
    const [readableIdTouched, setReadableIdTouched] = useState(false);
    const [isModelSheetOpen, setIsModelSheetOpen] = useState(false);
    const [modelQuery, setModelQuery] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanHit, setScanHit] = useState<ScanHit | null>(null);
    const invoiceInput = useRef<HTMLInputElement>(null);
    const warrantyInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!existing) return;
        setFormData({
            model: existing.model || '',
            serialNumber: existing.serialNumber || '',
            readableId: existing.name || '',
            ram: existing.ram || '',
            storage: existing.storage || '',
            os: existing.os || '',
            country: existing.country || '',
            site: existing.site || '',
            status: existing.status,
            supplier: existing.financial?.supplier || '',
            purchaseDate: existing.financial?.purchaseDate
                ? new Date(existing.financial.purchaseDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
            purchasePrice: existing.financial?.purchasePrice?.toString() || '',
            warrantyEnd: existing.warrantyEnd
                ? new Date(existing.warrantyEnd).toISOString().split('T')[0]
                : '',
        });
        setDocuments(existing.documents || []);
        setReadableIdTouched(true);
    }, [existing]);

    const selectedModel = useMemo<Model | undefined>(
        () => models.find((model) => model.name === formData.model),
        [models, formData.model],
    );

    /** Le type ne se saisit pas : il vient du catalogue, avec le modèle. */
    const type = selectedModel?.type || existing?.type || '';

    const selectedCategory = useMemo(
        () => categories.find((category) => category.name === type),
        [categories, type],
    );

    const effectiveConfig = useMemo(
        () =>
            resolveDepreciationConfig(
                isEditMode && existing?.financial?.depreciationYears
                    ? {
                          method: existing.financial.depreciationMethod,
                          years: existing.financial.depreciationYears,
                          salvagePercent: 0,
                      }
                    : null,
                selectedCategory?.defaultDepreciation
                    ? {
                          method: selectedCategory.defaultDepreciation.method,
                          years: selectedCategory.defaultDepreciation.years,
                          salvageValuePercent:
                              selectedCategory.defaultDepreciation.salvageValuePercent,
                      }
                    : null,
                globalDepreciationConfig(settings),
            ),
        [isEditMode, existing, selectedCategory, settings],
    );

    const availableSites = useMemo(
        () => (formData.country ? locationData.sites[formData.country] || [] : []),
        [formData.country, locationData.sites],
    );

    /* L'identifiant lisible se repropose tant que personne ne l'a retouché : il dépend
       du type et du site, et les deux se choisissent après lui dans l'ordre de l'écran. */
    const proposedId = useMemo(
        () => proposeReadableId(type, formData.site, equipment),
        [type, formData.site, equipment],
    );

    useEffect(() => {
        if (readableIdTouched || !proposedId) return;
        setFormData((prev) => ({ ...prev, readableId: proposedId }));
    }, [proposedId, readableIdTouched]);

    /** Le code interne — **généré**, montré, jamais tapé. */
    const internalCode = useMemo(
        () => existing?.assetId || nextInternalCode(equipment),
        [existing, equipment],
    );

    const filteredModels = useMemo(() => {
        const query = modelQuery.trim().toLowerCase();
        if (!query) return models;
        return models.filter((model) =>
            `${model.name} ${model.brand || ''} ${getCategoryLabel(model.type)}`
                .toLowerCase()
                .includes(query),
        );
    }, [models, modelQuery]);

    /**
     * L'état vient-il d'un geste ? Alors il se montre et ne se corrige pas ici — la
     * fiche n'est pas le lieu où un objet change de mains.
     */
    const stateComesFromAGesture =
        isEditMode && !CREATION_STATES.some((state) => state.value === formData.status);

    const handleChange = (event: { target: { name: string; value: string } }): void => {
        const { name, value } = event.target;
        setFormData((prev) => {
            const next = { ...prev, [name]: value };
            if (name === 'country') next.site = '';
            return next;
        });
    };

    const attachDocument = (file: File | undefined, kind: 'Facture' | 'Garantie') => {
        if (!file) return;
        setDocuments((prev) => [
            ...prev.filter((document) => document.type !== kind),
            {
                id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                name: file.name,
                type: kind,
                url: '',
                size: `${Math.max(1, Math.round(file.size / 1024))} Ko`,
                date: new Date().toISOString(),
            },
        ]);
    };

    const handleSave = () => {
        if (!formData.model) {
            showToast(
                'Choisissez un modèle au catalogue : il porte le type et la marque.',
                'error',
            );
            return;
        }
        if (!formData.serialNumber.trim()) {
            showToast(
                "Le numéro de série est le seul champ que rien ne connaît : lisez-le sur l'étiquette.",
                'error',
            );
            return;
        }

        const readableId = formData.readableId.trim() || proposedId || formData.model;

        const payload = {
            name: readableId,
            assetId: internalCode,
            type,
            model: formData.model,
            status: formData.status,
            serialNumber: formData.serialNumber.trim(),
            os: formData.os,
            ram: formData.ram,
            storage: formData.storage,
            country: formData.country,
            site: formData.site,
            warrantyEnd: formData.warrantyEnd,
            documents,
            image: selectedModel?.image || existing?.image || '',
            financial: {
                purchasePrice: parseFloat(formData.purchasePrice) || 0,
                purchaseDate: formData.purchaseDate,
                supplier: formData.supplier,
                invoiceNumber: existing?.financial?.invoiceNumber || '',
                depreciationMethod: effectiveConfig.method,
                depreciationYears: effectiveConfig.years,
                salvageValue: existing?.financial?.salvageValue || 0,
            },
        };

        if (isEditMode && equipmentId) {
            updateEquipment(equipmentId, payload);
            showToast(`${readableId} — fiche mise à jour.`, 'success');
        } else {
            addEquipment({
                ...payload,
                id: Date.now().toString(),
                assignmentStatus: 'NONE',
            });
            showToast(`${readableId} est entré au parc.`, 'success');
        }

        onSave();
    };

    const currencySymbol =
        settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency;

    return (
        <>
            <FullScreenFormLayout
                title={isEditMode ? 'Modifier la fiche' : 'Nouvel équipement'}
                subtitle={
                    isEditMode
                        ? `${existing?.name || internalCode} · fiche existante`
                        : "Aucun identifiant tant que la fiche n'est pas créée"
                }
                onCancel={onCancel}
                onSave={handleSave}
                saveLabel="Enregistrer"
                className="bg-background"
            >
                <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
                    {/* ── Ce que c'est ─────────────────────────────────────────────── */}
                    <FormSection title="Ce que c'est">
                        <div>
                            <FieldLabel>Modèle</FieldLabel>
                            <div className="border-outline-variant flex min-h-12 items-center gap-3 rounded-xs border px-3 py-1.5">
                                <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                                    {selectedModel?.image ? (
                                        <img
                                            src={selectedModel.image}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Icon glyph={Package} size={20} />
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            'block truncate text-[15px] font-medium',
                                            selectedModel
                                                ? 'text-on-surface'
                                                : 'text-on-surface-variant',
                                        )}
                                    >
                                        {selectedModel?.name || 'Aucun modèle choisi'}
                                    </span>
                                    <span className="text-on-surface-variant mt-0.5 block truncate text-[12px]">
                                        {selectedModel
                                            ? `${getCategoryLabel(selectedModel.type)} · catalogue`
                                            : 'le type et la marque en viennent'}
                                    </span>
                                </span>
                                <Button
                                    type="button"
                                    variant="text"
                                    size="sm"
                                    onClick={() => setIsModelSheetOpen(true)}
                                    className="shrink-0 px-1 text-[13px] font-medium"
                                >
                                    {selectedModel ? 'Changer' : 'Choisir'}
                                </Button>
                            </div>
                        </div>

                        <FormWarn>
                            Le catalogue porte la <b>marque</b>, le <b>type</b> et la{' '}
                            <b>durée d'amortissement</b> : ils ne sont pas redemandés, et une
                            correction se fait au catalogue.
                        </FormWarn>

                        <div>
                            <FieldLabel>Numéro de série</FieldLabel>
                            <div className="flex gap-2">
                                <InputField
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    placeholder="à lire sur l'étiquette"
                                    containerClassName="flex-1 min-w-0"
                                />
                                {/* `.act` de la planche : une pastille sur encart, pas un
                                    bouton plein — le seul geste appuyé de l'écran est
                                    « Enregistrer ». */}
                                <Button
                                    type="button"
                                    variant="text"
                                    onClick={() => {
                                        setScanHit(null);
                                        setIsScanning(true);
                                    }}
                                    icon={<Icon glyph={Scan} size={18} />}
                                    className="bg-surface-container text-on-surface hover:bg-surface-container-high h-12 shrink-0 rounded-xs px-3 text-[13px] font-medium"
                                >
                                    Scanner
                                </Button>
                            </div>
                        </div>

                        <div>
                            <FieldLabel>Identifiant lisible</FieldLabel>
                            <InputField
                                name="readableId"
                                value={formData.readableId}
                                onChange={(event) => {
                                    setReadableIdTouched(true);
                                    handleChange(event);
                                }}
                                placeholder={proposedId || 'TYPE-SITE-RANG'}
                            />
                            <FormNote>
                                Composé du type, du site et du rang. Modifiable — c'est lui qui sera
                                collé sur l'objet.
                            </FormNote>
                        </div>

                        <div className="border-outline-variant text-on-surface-variant flex items-baseline justify-between gap-3 border-t pt-3 text-[12px]">
                            <span>
                                {isEditMode
                                    ? 'Code interne'
                                    : "Code interne, attribué à l'enregistrement"}
                            </span>
                            <b className="text-on-surface font-medium tabular-nums">
                                {internalCode}
                            </b>
                        </div>
                    </FormSection>

                    {/* ── Configuration ────────────────────────────────────────────── */}
                    <FormSection title="Configuration" caption="pré-remplie par le modèle">
                        <div className="flex gap-2.5">
                            <div className="min-w-0 flex-1">
                                <FieldLabel>Mémoire</FieldLabel>
                                <InputField
                                    name="ram"
                                    value={formData.ram}
                                    onChange={handleChange}
                                    placeholder="16 Go"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <FieldLabel>Stockage</FieldLabel>
                                <InputField
                                    name="storage"
                                    value={formData.storage}
                                    onChange={handleChange}
                                    placeholder="512 Go SSD"
                                />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Système</FieldLabel>
                            <InputField
                                name="os"
                                value={formData.os}
                                onChange={handleChange}
                                placeholder="Windows 11 Pro"
                            />
                        </div>
                        <FormNote>
                            Trois champs que la fiche affiche et que rien ne déduit : deux unités du
                            même modèle peuvent avoir des configurations différentes.
                        </FormNote>
                    </FormSection>

                    {/* ── Où, et dans quel état ────────────────────────────────────── */}
                    <FormSection title="Où, et dans quel état">
                        <div className="flex gap-2.5">
                            <div className="min-w-0 flex-1">
                                <FieldLabel>Pays</FieldLabel>
                                <SelectField
                                    name="country"
                                    options={locationData.countries.map((country) => ({
                                        value: country,
                                        label: country,
                                    }))}
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="Choisir un pays"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <FieldLabel>Emplacement</FieldLabel>
                                <SelectField
                                    name="site"
                                    options={availableSites.map((site) => ({
                                        value: site,
                                        label: site,
                                    }))}
                                    value={formData.site}
                                    onChange={handleChange}
                                    disabled={!formData.country}
                                    placeholder={
                                        formData.country
                                            ? 'Choisir un site'
                                            : "Choisissez d'abord un pays"
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <FieldLabel>
                                {isEditMode ? 'État' : "État à l'enregistrement"}
                            </FieldLabel>
                            {stateComesFromAGesture ? (
                                <>
                                    <p className="border-outline-variant text-on-surface flex min-h-12 items-center gap-2.5 rounded-xs border px-3 text-[15px]">
                                        <Icon
                                            glyph={MapPin}
                                            size={18}
                                            className="text-on-surface-variant"
                                        />
                                        {formData.status}
                                    </p>
                                    <FormNote>
                                        Cet état vient d'un geste — une attribution, une réparation,
                                        une sortie. Il ne se corrige pas ici, sinon le parc perd la
                                        trace du geste.
                                    </FormNote>
                                </>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {CREATION_STATES.map((state) => (
                                        <OptionRow
                                            key={state.value}
                                            title={state.title}
                                            hint={state.hint}
                                            selected={formData.status === state.value}
                                            onSelect={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: state.value,
                                                }))
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {isEditMode && (
                            <FormNote>
                                <b>Le porteur ne se change pas ici.</b> Un objet change de mains par
                                une attribution ou une restitution, jamais par une correction de
                                fiche.
                            </FormNote>
                        )}
                    </FormSection>

                    {/* ── Achat et garantie ────────────────────────────────────────── */}
                    <FormSection title="Achat et garantie">
                        <div>
                            <FieldLabel>Fournisseur</FieldLabel>
                            <InputField
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                placeholder="Dell Technologies"
                            />
                        </div>
                        <div className="flex gap-2.5">
                            <div className="min-w-0 flex-1">
                                <FieldLabel>Date d'achat</FieldLabel>
                                <InputField
                                    type="date"
                                    name="purchaseDate"
                                    value={formData.purchaseDate}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <FieldLabel>Prix d'achat</FieldLabel>
                                <InputField
                                    type="number"
                                    name="purchasePrice"
                                    value={formData.purchasePrice}
                                    onChange={handleChange}
                                    placeholder="0"
                                    suffix={currencySymbol}
                                />
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Fin de garantie</FieldLabel>
                            <InputField
                                type="date"
                                name="warrantyEnd"
                                value={formData.warrantyEnd}
                                onChange={handleChange}
                            />
                        </div>
                        <FormNote>
                            Le <b>pourcentage amorti</b> et la <b>date de renouvellement</b> de la
                            fiche se calculent à partir de ces trois valeurs et de la catégorie :
                            ils ne se saisissent jamais. Règle appliquée ici —{' '}
                            <b>
                                {effectiveConfig.years} ans,{' '}
                                {effectiveConfig.method === 'linear' ? 'linéaire' : 'dégressif'}
                            </b>{' '}
                            ({SOURCE_LABELS[effectiveConfig.source] || effectiveConfig.source}).
                        </FormNote>
                    </FormSection>

                    {/* ── Documents ────────────────────────────────────────────────── */}
                    <FormSection title="Documents">
                        <div className="flex flex-wrap gap-2">
                            {(['Facture', 'Garantie'] as const).map((kind) => {
                                const attached = documents.find(
                                    (document) => document.type === kind,
                                );
                                const input = kind === 'Facture' ? invoiceInput : warrantyInput;
                                return (
                                    <button
                                        key={kind}
                                        type="button"
                                        onClick={() => input.current?.click()}
                                        className={cn(
                                            'flex h-14 min-w-[104px] items-center gap-2 rounded-xs px-3 text-left text-[11px] leading-[13px]',
                                            attached
                                                ? 'bg-surface-container text-on-surface'
                                                : 'border-outline text-on-surface-variant hover:bg-surface-container border-[1.5px] border-dashed',
                                        )}
                                    >
                                        <Icon
                                            glyph={
                                                attached
                                                    ? Check
                                                    : kind === 'Facture'
                                                      ? Camera
                                                      : FileText
                                            }
                                            size={18}
                                            className="shrink-0"
                                        />
                                        <span className="min-w-0">
                                            <span className="block font-medium">
                                                {kind.toLowerCase()}
                                            </span>
                                            {attached && (
                                                <span className="text-on-surface-variant block truncate">
                                                    {attached.name}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                            <input
                                ref={invoiceInput}
                                type="file"
                                className="hidden"
                                onChange={(event) =>
                                    attachDocument(event.target.files?.[0], 'Facture')
                                }
                            />
                            <input
                                ref={warrantyInput}
                                type="file"
                                className="hidden"
                                onChange={(event) =>
                                    attachDocument(event.target.files?.[0], 'Garantie')
                                }
                            />
                        </div>
                        <FormNote>
                            La pièce est rattachée à la fiche par son nom, sa nature et sa taille —
                            c'est ce que la fiche en affiche.
                        </FormNote>
                    </FormSection>
                </div>
            </FullScreenFormLayout>

            {/* Le catalogue, en feuille : on y cherche, on n'y saisit pas. */}
            <BottomSheet
                open={isModelSheetOpen}
                onClose={() => setIsModelSheetOpen(false)}
                title="Choisir un modèle"
            >
                <div className="flex flex-col gap-3">
                    <SearchField
                        value={modelQuery}
                        onChange={setModelQuery}
                        placeholder="Un modèle, une marque, un type"
                    />
                    <div className="max-h-[50vh] overflow-y-auto">
                        {filteredModels.length === 0 ? (
                            <p className="text-on-surface-variant py-6 text-center text-[13px]">
                                Aucun modèle ne correspond. Le catalogue se complète depuis
                                Référentiel.
                            </p>
                        ) : (
                            filteredModels.map((model) => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => {
                                        setFormData((prev) => ({ ...prev, model: model.name }));
                                        setIsModelSheetOpen(false);
                                        setModelQuery('');
                                    }}
                                    className="border-outline-variant hover:bg-surface-container flex min-h-14 w-full items-center gap-3 border-t px-1 text-left first:border-t-0"
                                >
                                    <span className="bg-surface-container text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                                        {model.image ? (
                                            <img
                                                src={model.image}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Icon glyph={Package} size={20} />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="text-on-surface block truncate text-[15px] font-medium">
                                            {model.name}
                                        </span>
                                        <span className="text-on-surface-variant block truncate text-[12px]">
                                            {getCategoryLabel(model.type)}
                                            {model.brand ? ` · ${model.brand}` : ''}
                                        </span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </BottomSheet>

            {/* 17.3, emploi « simple / 04.3 » : le numéro de série. La vue ne décode rien —
                la lecture réelle du produit passe par la saisie, que le pied porte. */}
            {isScanning && (
                <div className="fixed inset-0 z-50 bg-[var(--tk-color-inverse-surface)]">
                    <ScanView
                        mode="simple"
                        onClose={() => setIsScanning(false)}
                        tip="Cadrez le numéro de série de l'étiquette. Tenez l'appareil à environ 20 cm."
                        hit={scanHit}
                        acceptLabel="Utiliser ce numéro"
                        onAccept={(accepted) => {
                            setFormData((prev) => ({ ...prev, serialNumber: accepted.code }));
                            setIsScanning(false);
                            setScanHit(null);
                        }}
                        onRetry={() => setScanHit(null)}
                        onManualSubmit={(code) =>
                            setScanHit({
                                id: `serial_${Date.now()}`,
                                code,
                                detail: selectedModel
                                    ? `Numéro de série · ${selectedModel.name}`
                                    : 'Numéro de série',
                            })
                        }
                    />
                </div>
            )}
        </>
    );
};

export default AddEquipmentPage;
