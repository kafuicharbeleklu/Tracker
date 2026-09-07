import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Camera,
    Check,
    Cpu,
    FileText,
    Info,
    MapPin,
    Package,
    Scan,
    ShieldCheck,
    Tag,
} from '@phosphor-icons/react';

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
import {
    countryCode,
    deducedAssetName,
    nextInternalCode,
    proposeReadableId,
} from '../lib/assetCode';
import { cn } from '../../../lib/utils';
import { AppSettings, EquipmentDocument, Model } from '../../../types';
import {
    FieldLabel,
    FormNote,
    FormSection,
    FormWarn,
    OptionRow,
    ShotBox,
    TINT_CLASS,
} from '../../../components/ui/FormParts';
import FilePicker from '../../../components/ui/FilePicker';
import ListRow from '../../../components/ui/ListRow';

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
const CREATION_STATES: Array<{
    value: string;
    title: string;
    hint: string;
    tint: 'vert' | 'ambre';
}> = [
    {
        value: 'Disponible',
        title: 'Disponible',
        hint: "Entre dans les sélecteurs d'attribution",
        tint: 'vert',
    },
    {
        value: 'En attente',
        title: 'En attente de réception',
        hint: 'Commandé, pas encore là',
        tint: 'ambre',
    },
];

const SOURCE_LABELS: Record<string, string> = {
    equipment: 'réglée sur cette fiche',
    category: 'héritée du type',
    global: 'le défaut de Paramètres',
};

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

    /*
     * **L'identifiant ne se saisit plus : il se déduit** (04.3, passe du 03/09) — code
     * du pays de l'emplacement, puis numéro de série. Le champ de texte a disparu avec
     * la règle : ce qui se calcule ne se tape pas, et un identifiant tapé est un
     * doublon en puissance.
     *
     * `countryPrefix` est vide quand le pays n'a pas de code — ni déclaré par le
     * système, ni relevé sur le parc. La planche ne dessine pas ce cas : elle montre
     * « LFW- » suivi du numéro en attente. On garde alors l'ancienne composition
     * `TYPE-SITE-RANG`, en le disant à l'écran, plutôt que d'inventer trois lettres
     * dans le nom du pays ou d'interdire la création. **À arbitrer** : le référentiel
     * (10.1) annonce « un nom et son code à trois lettres » pour un pays, mais
     * `LocationData.countries` reste un `string[]` qui ne porte pas ce champ.
     */
    const countryPrefix = useMemo(
        () => countryCode(formData.country, equipment),
        [formData.country, equipment],
    );

    const deducedId = useMemo(
        () => deducedAssetName(formData.country, formData.serialNumber, equipment),
        [formData.country, formData.serialNumber, equipment],
    );

    const proposedId = useMemo(
        () => proposeReadableId(type, formData.site, equipment),
        [type, formData.site, equipment],
    );

    /** Ce qui sera écrit dans `name` : le déduit, sinon l'ancienne composition. */
    const resolvedId = deducedId || existing?.name || proposedId;

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

        const readableId = resolvedId || formData.model;

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
                        : "L'identifiant se déduit à l'enregistrement"
                }
                onCancel={onCancel}
                onSave={handleSave}
                saveLabel="Enregistrer"
                submitButtonLocation="header"
                className="bg-background"
            >
                <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
                    {/* ── Référence ───────────────────────────────────────────────── */}
                    <FormSection title="Référence" glyph={Package} tint="bleu">
                        <div>
                            <FieldLabel>Modèle</FieldLabel>
                            {/* `.pick` — 56 de haut, sur le creux, rayon 4 : la même
                                forme que les champs qui l'entourent. */}
                            <div className="bg-surface-container flex min-h-14 items-center gap-3 rounded-md px-3.5 py-2">
                                <span className="bg-surface text-on-surface-variant flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
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
                                            'block truncate text-[16px] leading-6 font-medium',
                                            selectedModel
                                                ? 'text-on-surface'
                                                : 'text-on-surface-variant',
                                        )}
                                    >
                                        {selectedModel?.name || 'Aucun modèle choisi'}
                                    </span>
                                    <span className="text-on-surface-variant block truncate text-[14px] leading-5">
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
                                    className="shrink-0 px-1 text-[15px] font-medium"
                                >
                                    {selectedModel ? 'Changer' : 'Choisir'}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <FieldLabel>Numéro de série</FieldLabel>
                            <div className="flex gap-2">
                                <InputField
                                    name="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={handleChange}
                                    placeholder="tel qu'il figure sur l'étiquette"
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
                                    className="bg-surface-container text-on-surface hover:bg-surface-container-high h-12 shrink-0 rounded-md px-3.5 text-[15px] font-medium"
                                >
                                    Scanner
                                </Button>
                            </div>
                        </div>

                        {/* `.idrow` — l'identifiant **déduit**, montré et jamais tapé.
                            La planche l'écrit en Archivo 600 sur 22, sur la teinte
                            bleue de la section, avec la règle en dessous. */}
                        <div
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3.5 py-3',
                                countryPrefix
                                    ? TINT_CLASS.bleu
                                    : 'bg-surface-container text-on-surface-variant',
                            )}
                        >
                            <Icon glyph={Tag} size={20} className="shrink-0" />
                            <span className="min-w-0 flex-1">
                                <span className="font-brand block truncate text-[22px] leading-7 font-semibold tracking-[-0.01em] tabular-nums">
                                    {countryPrefix ? (
                                        <>
                                            {countryPrefix}-
                                            {formData.serialNumber.trim() ? (
                                                formData.serialNumber.trim().toUpperCase()
                                            ) : (
                                                <span className="opacity-50">n° de série</span>
                                            )}
                                        </>
                                    ) : (
                                        resolvedId || '—'
                                    )}
                                </span>
                                <span className="mt-0.5 block text-[12px] leading-4 opacity-85">
                                    {countryPrefix
                                        ? "Pays de l'emplacement + numéro de série"
                                        : formData.country
                                          ? `${formData.country} n'a pas de code : composition par type, site et rang`
                                          : "Choisissez un pays : son code ouvre l'identifiant"}
                                </span>
                            </span>
                        </div>

                        <FormWarn glyph={Info}>
                            Marque, type et amortissement viennent du <b>catalogue</b> : ils ne sont
                            pas redemandés, et une correction se fait là-bas.
                        </FormWarn>
                    </FormSection>

                    {/* ── Configuration ────────────────────────────────────────────── */}
                    <FormSection
                        title="Configuration"
                        glyph={Cpu}
                        tint="vert"
                        caption="pré-remplie par le modèle"
                    >
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
                    <FormSection title="Où, et dans quel état" glyph={MapPin} tint="ambre">
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
                                    <p className="bg-surface-container text-on-surface flex min-h-12 items-center gap-2.5 rounded-md px-3.5 text-[16px] leading-6">
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
                                            tint={state.tint}
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
                    <FormSection title="Achat et garantie" glyph={ShieldCheck} tint="orange">
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
                    <FormSection title="Documents" glyph={FileText} tint="bleu">
                        {/* `.shots` — les deux pièces de la planche, chacune dans sa
                            case de 56. La case et le champ caché sont des primitives :
                            trois écrans joignent des pièces, et chacun réécrivait sa
                            lecture de `FileList`. */}
                        <div className="flex flex-wrap gap-2">
                            {(['Facture', 'Garantie'] as const).map((kind) => {
                                const attached = documents.find(
                                    (document) => document.type === kind,
                                );
                                const input = kind === 'Facture' ? invoiceInput : warrantyInput;
                                return (
                                    <ShotBox
                                        key={kind}
                                        glyph={
                                            attached
                                                ? Check
                                                : kind === 'Facture'
                                                  ? Camera
                                                  : FileText
                                        }
                                        label={kind.toLowerCase()}
                                        filled={Boolean(attached)}
                                        title={attached?.name}
                                        aria-label={
                                            attached
                                                ? `${kind} jointe : ${attached.name} — remplacer`
                                                : `Joindre la ${kind.toLowerCase()}`
                                        }
                                        onClick={() => input.current?.click()}
                                    />
                                );
                            })}
                            {/* La borne de 17.10 : ce qui dépasse ne s'attache pas, et
                                le dit. Rien n'a changé à l'écran, personne n'attend un
                                geste : c'est un snackbar (17.5, deuxième réponse). */}
                            <FilePicker
                                ref={invoiceInput}
                                onFiles={(_names, files) => attachDocument(files[0], 'Facture')}
                                onReject={(message) => showToast(message, 'error')}
                            />
                            <FilePicker
                                ref={warrantyInput}
                                onFiles={(_names, files) => attachDocument(files[0], 'Garantie')}
                                onReject={(message) => showToast(message, 'error')}
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
                                /* La rangée d'une liste est une primitive : celle-ci
                                   était retapée à la main, avec sa propre hauteur et
                                   sa propre échelle. */
                                <ListRow
                                    key={model.id}
                                    vignette={
                                        model.image ? (
                                            <img
                                                src={model.image}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Icon glyph={Package} size={20} />
                                        )
                                    }
                                    title={model.name}
                                    holder={`${getCategoryLabel(model.type)}${model.brand ? ` · ${model.brand}` : ''}`}
                                    onOpen={() => {
                                        setFormData((prev) => ({ ...prev, model: model.name }));
                                        setIsModelSheetOpen(false);
                                        setModelQuery('');
                                    }}
                                />
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
