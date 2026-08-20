import React, { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    CheckCircle,
    Clock,
    ShieldWarning,
    SignOut,
    Warning,
    type Icon as PhosphorGlyph,
} from '@phosphor-icons/react';

import Icon from '../../../components/ui/Icon';
import Button from '../../../components/ui/Button';
import InputField from '../../../components/ui/InputField';
import Toggle from '../../../components/ui/Toggle';
import BottomSheet from '../../../components/ui/BottomSheet';
import RuleGroup from '../../../components/ui/RuleGroup';
import type { RuleRowTone } from '../../../components/ui/RuleGroup';
import Notice from '../../../components/ui/Notice';
import Reading from '../../../components/layout/Reading';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import { authService } from '../../../services/authService';
import { parseAgentBatchContent } from '../../../lib/agentCheckin';
import { checkAgentApiHealth, postAgentCheckIn } from '../../../services/agentCollectionService';
import { APP_CONFIG } from '../../../config';
import type { AgentCheckInPayload, AppSettings, AutoCollectionSource, ViewType } from '../../../types';

/**
 * Paramètres — **porté sur la planche 14.1**.
 *
 * ## Ce que la planche a tranché
 *
 * L'écran tenait 891 lignes derrière **cinq onglets** — *Affichage · Compte &
 * Sécurité · Finances & Paramètres · Collecte automatique · Aide* — dont deux
 * seulement enregistraient, avec un bouton qui changeait de nom selon l'onglet
 * regardé. Le relevé de la planche dit pourquoi c'était intenable : ces cinq
 * sections **n'appartiennent pas aux mêmes personnes**. Deux sont à la personne,
 * une à l'entreprise, une à l'informatique, et la dernière ne se règle pas.
 *
 * **Paramètres devient une liste de destinations**, rangée par propriétaire :
 * quatre **groupes à filets** (`RuleGroup`, R4 de 00.1) au lieu de onze cartes
 * blanches, et **la valeur passe à droite de la rangée**, où elle se lit sans
 * ouvrir. Une personne qui vient changer la devise ne traverse plus les réglages de
 * l'agent local.
 *
 * ## Les quatre retraits, et ce qui les justifie
 *
 * - **La section « Affichage »** portait un seul réglage — un thème clair qu'on ne
 *   peut pas changer — et une promesse : *« Le mode sombre sera proposé dans une
 *   prochaine version. »* On n'annonce pas ce qui n'existe pas, et le clair est une
 *   **décision d'identité**, pas une attente. Le fait descend en ligne d'« À propos ».
 * - **La file des machines détectées** n'est pas un réglage, c'est **du travail qui
 *   attend quelqu'un** : sa place est *Tâches › À faire*, au même titre qu'une
 *   demande à valider. Paramètres règle les sources ; il ne garde pas leur produit.
 * - **Le bouton « Enregistrer » par section.** Un geste qui apparaît et se renomme
 *   selon l'endroit apprend qu'un réglage posé **ne compte pas tant qu'on n'a pas
 *   trouvé le bouton**. Il ne reste qu'en pied de feuille, là où des champs valent
 *   ensemble ou pas du tout : les identifiants d'une source.
 * - **Le « Centre d'aide » et ses quatre pavés** — *Documentation · Support ·
 *   Tutoriels · FAQ* — étaient des `<Button variant="outlined">` **sans `onClick`** :
 *   ils réagissaient au survol et ne menaient nulle part. Un geste mort est pire
 *   qu'un manque. Il en reste **une ligne**, « Contacter le support », qui ne
 *   s'affiche que si l'organisation a rempli l'adresse.
 *
 * ## Deux écarts relevés au portage, et ce qu'ils changent au texte
 *
 * La planche fait dire à l'amortissement qu'il *« décide de la valeur de 14 actifs »*.
 * Le code disait le contraire : `settings.defaultDepreciationYears` **n'avait aucun
 * consommateur** — `AddEquipmentPage` retombait sur un `GLOBAL_FINANCIAL_SETTINGS`
 * écrit en dur à côté. Le portage **branche le réglage** sur la cascade réelle
 * (fiche → type → défaut global) ; et comme les huit types portent déjà leur durée,
 * l'écran dit la vérité mesurée sur la donnée, pas le chiffre de la planche.
 *
 * `renewalThreshold` et `roundingRule` restent sans consommateur **et sans écran** :
 * un réglage qui ne change rien ne mérite pas une rangée.
 */

interface SettingsPageProps {
    onLogout: () => void;
    /** La file de collecte vit dans Tâches : cette page y renvoie, elle ne la refait pas. */
    onNavigate?: (view: ViewType) => void;
}

/** Les vues de l'écran. Chacune est un état de Paramètres, pas une page du produit. */
type SettingsView = 'index' | 'account' | 'currency' | 'depreciation' | 'sources';

/** Le propriétaire du réglage, écrit sous le titre de la vue — 14.1 `.aid`. */
const VIEW_OWNER: Record<SettingsView, string | null> = {
    index: null,
    account: 'Paramètres · vous',
    currency: "Paramètres · l'entreprise",
    depreciation: "Paramètres · l'entreprise",
    sources: "Paramètres · l'informatique",
};

const VIEW_TITLE: Record<SettingsView, string> = {
    index: 'Paramètres',
    account: 'Compte et sécurité',
    currency: 'Devise et année fiscale',
    depreciation: 'Amortissement',
    sources: 'Sources de collecte',
};

const FISCAL_MONTHS: Array<{ value: string; label: string; short: string }> = [
    { value: '01', label: '1er janvier', short: '1er janv.' },
    { value: '04', label: '1er avril', short: '1er avr.' },
    { value: '09', label: '1er septembre', short: '1er sept.' },
];

const DEPRECIATION_METHODS: Array<{ value: AppSettings['defaultDepreciationMethod']; label: string }> = [
    { value: 'linear', label: 'Linéaire' },
    { value: 'degressive', label: 'Dégressif' },
];

interface SourceDescriptor {
    id: AutoCollectionSource;
    title: string;
    subtitle: string;
    enabledKey: keyof AppSettings;
}

/** Les trois sources relevées dans le code, dans l'ordre où 14.1 les pose. */
const SOURCES: SourceDescriptor[] = [
    {
        id: 'agent',
        title: 'Agent local',
        subtitle: 'GPO / Intune',
        enabledKey: 'autoCollectionAgentEnabled',
    },
    {
        id: 'active_directory',
        title: 'Annuaire',
        subtitle: 'LDAP',
        enabledKey: 'autoCollectionAdEnabled',
    },
    {
        id: 'network_scan',
        title: 'Scan réseau',
        subtitle: 'Passif, sur les plages déclarées',
        enabledKey: 'autoCollectionNetworkEnabled',
    },
];

/** « il y a 6 j » — l'état d'une source, c'est ce qu'elle a renvoyé **et quand**. */
const daysSince = (iso: string): number =>
    Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

/**
 * La barre de la vue — `.tbar` de 14.1. Au téléphone elle porte le titre à 22 px ;
 * au rail la destination est déjà écrite à gauche, la barre ne la redit pas (00.4).
 */
const SettingsBar: React.FC<{
    title: string;
    owner?: string | null;
    onBack?: () => void;
}> = ({ title, owner, onBack }) => {
    const isCompact = useMediaQuery(MEDIA.compact);

    if (isCompact) {
        return (
            <div className="flex min-h-14 items-center gap-1 border-b border-outline-variant bg-surface px-5 py-1">
                {onBack && (
                    <Button variant="text" iconOnly aria-label="Retour" onClick={onBack} className="-ml-2 shrink-0">
                        <Icon glyph={ArrowLeft} size={24} />
                    </Button>
                )}
                <div className="min-w-0 flex-1">
                    <h1 className="truncate font-brand text-[22px] font-semibold leading-7 tracking-tight text-on-surface">
                        {title}
                    </h1>
                    {owner && <p className="truncate text-label-small text-text-secondary">{owner}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 px-page pt-5">
            {onBack && (
                <Button variant="text" iconOnly aria-label="Retour" onClick={onBack} className="-ml-2 shrink-0">
                    <Icon glyph={ArrowLeft} size={24} />
                </Button>
            )}
            <h1 className="shrink-0 font-brand text-[22px] font-semibold leading-7 tracking-tight text-on-surface">
                {title}
            </h1>
            {owner && <span className="text-body-medium text-text-secondary">{owner}</span>}
        </div>
    );
};

const SettingsPage: React.FC<SettingsPageProps> = ({ onLogout, onNavigate }) => {
    const { showToast } = useToast();
    const { currentUser } = useAuth();
    const { settings, updateSettings, equipment, categories, detectedDevices, ingestAgentCheckIn } = useData();

    const [view, setView] = useState<SettingsView>('index');
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);

    /** La feuille d'une source — le seul endroit de l'écran qui garde un pied. */
    const [openSource, setOpenSource] = useState<AutoCollectionSource | null>(null);
    const [sourceDraft, setSourceDraft] = useState<AppSettings>(settings);
    const [sourceError, setSourceError] = useState<string | null>(null);

    const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
    const [feedSheetOpen, setFeedSheetOpen] = useState(false);

    useEffect(() => {
        if (!openSource) setSourceDraft(settings);
    }, [openSource, settings]);

    /** Un réglage s'applique **au geste** : il n'attend pas un bouton (14.1). */
    const apply = (patch: Partial<AppSettings>) => updateSettings({ ...settings, ...patch });

    const fiscalMonth = useMemo(
        () => FISCAL_MONTHS.find((month) => month.value === settings.fiscalYearStart) ?? FISCAL_MONTHS[0],
        [settings.fiscalYearStart]
    );

    /**
     * Ce que le réglage d'amortissement décide **réellement** : les actifs dont ni la
     * fiche ni le type ne portent de plan. Le chiffre est compté sur la donnée — la
     * planche en annonçait 14 sans avoir vu la cascade.
     */
    const governedAssets = useMemo(() => {
        const typedWithoutPlan = new Set(
            categories.filter((category) => !category.defaultDepreciation?.years).map((category) => category.name)
        );
        return equipment.filter(
            (item) => !item.financial?.depreciationYears && typedWithoutPlan.has(item.type)
        ).length;
    }, [categories, equipment]);

    const typesWithOwnPlan = useMemo(
        () => categories.filter((category) => Boolean(category.defaultDepreciation?.years)).length,
        [categories]
    );

    /** L'état d'une source : ce qu'elle a renvoyé, et quand. */
    const sourceState = useMemo(() => {
        const bySource = new Map<AutoCollectionSource, { last: string | null; count: number }>();
        SOURCES.forEach((source) => bySource.set(source.id, { last: null, count: 0 }));

        detectedDevices.forEach((device) => {
            const entry = bySource.get(device.source);
            if (!entry) return;
            entry.count += 1;
            if (!entry.last || new Date(device.lastSeenAt) > new Date(entry.last)) {
                entry.last = device.lastSeenAt;
            }
        });

        return bySource;
    }, [detectedDevices]);

    const enabledSources = useMemo(
        () => SOURCES.filter((source) => Boolean(settings[source.enabledKey])).length,
        [settings]
    );

    /**
     * La source dont l'état mérite d'être remonté au sommaire : celle qui est active
     * et qui **ne dit plus rien**. Une source éteinte n'est pas une anomalie.
     */
    const stalestSource = useMemo(() => {
        let worst: { title: string; days: number } | null = null;
        SOURCES.forEach((source) => {
            if (!settings[source.enabledKey]) return;
            const last = sourceState.get(source.id)?.last;
            const days = last ? daysSince(last) : Infinity;
            if (days < 2) return;
            if (!worst || days > worst.days) worst = { title: source.title, days };
        });
        return worst as { title: string; days: number } | null;
    }, [settings, sourceState]);

    const pendingDevices = useMemo(
        () =>
            detectedDevices.filter((device) =>
                ['pending_review', 'ambiguous_match'].includes(device.status)
            ).length,
        [detectedDevices]
    );

    const twoFactor: { tone: RuleRowTone; icon: PhosphorGlyph; label: string } = isTwoFactorEnabled
        ? { tone: 'positive', icon: CheckCircle, label: '2FA active' }
        : { tone: 'pending', icon: ShieldWarning, label: '2FA inactive' };

    const openSourceSheet = (id: AutoCollectionSource) => {
        setSourceDraft(settings);
        setSourceError(null);
        setOpenSource(id);
    };

    const saveSource = () => {
        updateSettings(sourceDraft);
        setOpenSource(null);
        setSourceError(null);
        showToast('Source enregistrée.', 'success');
    };

    const testApiConnection = async () => {
        if (!sourceDraft.autoCollectionApiBaseUrl.trim()) {
            setSourceError("L'URL de l'API est vide : rien à joindre.");
            return;
        }
        const health = await checkAgentApiHealth(sourceDraft.autoCollectionApiBaseUrl);
        if (!health.ok) {
            setSourceError(
                'L’API n’a pas répondu. Vos deux réglages restent écrits — aucune source n’a été enregistrée.'
            );
            return;
        }
        setSourceError(null);
        showToast(`API joignable (${health.service || 'service check-in'}).`, 'success');
    };

    const ingestWithOptionalApiForwarding = async (rawPayload: AgentCheckInPayload) => {
        const payload: AgentCheckInPayload = {
            ...rawPayload,
            apiKey: rawPayload.apiKey || settings.autoCollectionAgentApiKey,
        };
        const forward =
            settings.autoCollectionForwardToApi && Boolean(settings.autoCollectionApiBaseUrl.trim());

        if (forward) {
            await postAgentCheckIn(
                settings.autoCollectionApiBaseUrl,
                payload,
                settings.autoCollectionAgentApiKey
            );
        }
        return ingestAgentCheckIn(payload);
    };

    const importCheckInFiles = async (files: File[]) => {
        if (!files.length) return;
        let accepted = 0;
        let rejected = 0;

        try {
            for (const file of files) {
                const parsed = parseAgentBatchContent(await file.text());
                for (const payload of parsed.payloads) {
                    const result = await ingestWithOptionalApiForwarding(payload);
                    if (result.ok) accepted += 1;
                    else rejected += 1;
                }
                rejected += parsed.errors.length;
            }
        } catch {
            showToast("Impossible de lire les fichiers de remontée.", 'error');
            return;
        }

        setFeedSheetOpen(false);
        if (accepted && !rejected) {
            showToast(`${accepted} machine(s) remontée(s) — elles attendent dans Tâches.`, 'success');
        } else if (accepted) {
            showToast(`${accepted} remontée(s), ${rejected} rejetée(s).`, 'warning');
        } else {
            showToast('Aucune entrée valide dans les fichiers.', 'error');
        }
    };

    const goBack = () => setView('index');

    return (
        <div className="flex min-h-0 w-full flex-1 flex-col">
            <SettingsBar
                title={VIEW_TITLE[view]}
                owner={VIEW_OWNER[view]}
                onBack={view === 'index' ? undefined : goBack}
            />

            <div className="flex-1 overflow-y-auto px-5 py-4 medium:px-page">
                <Reading className="flex flex-col gap-5 pb-16">
                    {view === 'index' && (
                        <>
                            <RuleGroup
                                header="Ce qui est à vous"
                                note="Une seule vue pour ces réglages, atteinte aussi depuis votre avatar. Cette ligne ne les refait pas, elle y mène."
                            >
                                <RuleGroup.Row
                                    title="Compte et sécurité"
                                    /* Le sous-titre **ne répète pas le contenu** : il dit la
                                       conséquence. « Mot de passe, double authentification,
                                       session » énumérait ce qu'il y a derrière la porte —
                                       ce que le chevron dit déjà. */
                                    subtitle={
                                        isTwoFactorEnabled
                                            ? 'Un second facteur protège chaque connexion'
                                            : 'Le mot de passe seul ouvre votre session'
                                    }
                                    status={{ icon: twoFactor.icon, tone: twoFactor.tone }}
                                    value={twoFactor.label}
                                    valueTone={twoFactor.tone}
                                    onOpen={() => setView('account')}
                                />
                            </RuleGroup>

                            <RuleGroup header="Ce qui est à l'entreprise">
                                <RuleGroup.Row
                                    title="Devise et année fiscale"
                                    subtitle="Tout montant du produit s'écrit avec"
                                    value={`${settings.currency} · ${fiscalMonth.short}`}
                                    onOpen={() => setView('currency')}
                                />
                                <RuleGroup.Row
                                    title="Amortissement par défaut"
                                    subtitle={
                                        governedAssets > 0
                                            ? `Décide de la valeur de ${governedAssets} actif${governedAssets > 1 ? 's' : ''}`
                                            : "Sert quand ni le type ni la fiche ne portent le leur"
                                    }
                                    value={`${settings.defaultDepreciationYears} ans`}
                                    onOpen={() => setView('depreciation')}
                                />
                            </RuleGroup>

                            <RuleGroup
                                header="Ce qui est à l'informatique"
                                note={
                                    <>
                                        Ce que les sources produisent est <strong className="font-medium text-text-secondary">du travail</strong>, pas un réglage :
                                        il attend dans la file, avec le reste. Paramètres règle les sources ; il ne garde pas leur produit.
                                    </>
                                }
                            >
                                <RuleGroup.Row
                                    title="Sources de collecte"
                                    subtitle={
                                        stalestSource
                                            ? `${stalestSource.title} n'a rien renvoyé depuis ${stalestSource.days} jours`
                                            : 'Agent local, annuaire, scan réseau'
                                    }
                                    status={stalestSource ? { icon: Clock, tone: 'pending' } : undefined}
                                    value={
                                        enabledSources === 0
                                            ? 'Aucune active'
                                            : `${enabledSources} active${enabledSources > 1 ? 's' : ''} sur ${SOURCES.length}`
                                    }
                                    valueTone={
                                        enabledSources === 0 ? 'muted' : stalestSource ? 'pending' : undefined
                                    }
                                    onOpen={() => setView('sources')}
                                />
                                {pendingDevices > 0 && (
                                    <RuleGroup.Row
                                        title={`${pendingDevices} machine${pendingDevices > 1 ? 's' : ''} détectée${pendingDevices > 1 ? 's' : ''} à valider`}
                                        subtitle="Ce que les sources produisent attend dans Tâches › À faire"
                                        external
                                        onOpen={() => onNavigate?.('tasks')}
                                    />
                                )}
                            </RuleGroup>

                            <RuleGroup
                                header="À propos"
                                note="Les éléments de démonstration (équipements, utilisateurs) sont restaurés à chaque chargement, y compris après suppression. Vos créations et modifications sont, elles, conservées."
                            >
                                <RuleGroup.Row title="Version" value={APP_CONFIG.version} />
                                <RuleGroup.Row
                                    title="Thème"
                                    subtitle="Clair par décision d'identité — il n'y a pas de mode sombre à attendre"
                                    value="Clair"
                                />
                                {APP_CONFIG.supportEmail && (
                                    <RuleGroup.Row
                                        title="Contacter le support"
                                        value={APP_CONFIG.supportEmail}
                                        onOpen={() => {
                                            window.location.href = `mailto:${APP_CONFIG.supportEmail}`;
                                        }}
                                        external
                                    />
                                )}
                            </RuleGroup>
                        </>
                    )}

                    {view === 'account' && (
                        <>
                            <RuleGroup header="Qui est connecté">
                                <RuleGroup.Row
                                    title={currentUser?.name ?? 'Utilisateur'}
                                    subtitle={currentUser?.email ?? ''}
                                    value={currentUser?.role}
                                />
                            </RuleGroup>

                            <RuleGroup header="Sécurité">
                                <RuleGroup.Row
                                    title="Mot de passe"
                                    subtitle="Il sert à ouvrir la session, pas à signer une réception"
                                    onOpen={() => setPasswordSheetOpen(true)}
                                />
                                <RuleGroup.Row
                                    title="Double authentification"
                                    subtitle="Un second facteur à chaque connexion"
                                    trailing={
                                        <Toggle checked={isTwoFactorEnabled} onChange={setIsTwoFactorEnabled} />
                                    }
                                />
                            </RuleGroup>

                            <RuleGroup header="Session">
                                <RuleGroup.Row
                                    title="Cet appareil"
                                    subtitle="Se déconnecter ferme la session ici, pas ailleurs"
                                    trailing={
                                        <Button variant="outlined" size="sm" onClick={onLogout} icon={<Icon glyph={SignOut} size={18} />}>
                                            Déconnexion
                                        </Button>
                                    }
                                />
                            </RuleGroup>
                        </>
                    )}

                    {view === 'currency' && (
                        <>
                            <RuleGroup
                                header="Lecture des montants"
                                note="Ces réglages ne changent pas un calcul mais une lecture : tous les montants du produit s'écrivent avec."
                            >
                                <RuleGroup.Row
                                    title="Devise"
                                    subtitle="Le franc CFA est la seule devise du parc"
                                    value={settings.currency}
                                />
                                <RuleGroup.Row
                                    title="Notation compacte"
                                    subtitle="1 200 000 s'écrit 1,2 M"
                                    trailing={
                                        <Toggle
                                            checked={settings.compactNotation}
                                            onChange={(value) => apply({ compactNotation: value })}
                                        />
                                    }
                                />
                            </RuleGroup>

                            <RuleGroup header="Début de l'année fiscale">
                                {FISCAL_MONTHS.map((month) => (
                                    <RuleGroup.Row
                                        key={month.value}
                                        title={month.label}
                                        status={
                                            settings.fiscalYearStart === month.value
                                                ? { icon: CheckCircle, tone: 'positive' }
                                                : undefined
                                        }
                                        value={settings.fiscalYearStart === month.value ? 'Retenu' : undefined}
                                        valueTone={settings.fiscalYearStart === month.value ? 'positive' : undefined}
                                        onOpen={() => apply({ fiscalYearStart: month.value })}
                                    />
                                ))}
                            </RuleGroup>

                            <p className="text-[12px] leading-[17px] text-text-muted">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on le pose.
                            </p>
                        </>
                    )}

                    {view === 'depreciation' && (
                        <>
                            <RuleGroup
                                header="Par défaut"
                                note={
                                    <>
                                        Un plan se prend d'abord sur la fiche, puis sur le type, et seulement ensuite ici.
                                        {typesWithOwnPlan === categories.length && categories.length > 0
                                            ? ` Les ${categories.length} types portent déjà le leur : ce plan ne sert donc qu'aux types créés sans lui.`
                                            : ` ${categories.length - typesWithOwnPlan} type(s) n'en portent pas : ce plan est le leur.`}
                                        {' '}Les changer{' '}
                                        <strong className="font-medium text-text-secondary">ne touche pas au passé</strong> : les
                                        objets déjà amortis gardent leur plan, les prochains prennent le nouveau.
                                    </>
                                }
                            >
                                {DEPRECIATION_METHODS.map((method) => (
                                    <RuleGroup.Row
                                        key={method.value}
                                        title={method.label}
                                        subtitle={
                                            method.value === 'linear'
                                                ? 'La valeur se répartit également sur la durée'
                                                : 'La valeur tombe plus vite les premières années'
                                        }
                                        status={
                                            settings.defaultDepreciationMethod === method.value
                                                ? { icon: CheckCircle, tone: 'positive' }
                                                : undefined
                                        }
                                        value={
                                            settings.defaultDepreciationMethod === method.value ? 'Retenue' : undefined
                                        }
                                        valueTone={
                                            settings.defaultDepreciationMethod === method.value ? 'positive' : undefined
                                        }
                                        onOpen={() => apply({ defaultDepreciationMethod: method.value })}
                                    />
                                ))}
                            </RuleGroup>

                            <RuleGroup header="Durée et fin de vie">
                                <RuleGroup.Row
                                    title="Durée"
                                    subtitle="Au bout de laquelle un objet ne vaut plus rien au bilan"
                                    trailing={
                                        <InputField
                                            type="number"
                                            aria-label="Durée en années"
                                            value={String(settings.defaultDepreciationYears)}
                                            onChange={(event) =>
                                                apply({ defaultDepreciationYears: Number(event.target.value) })
                                            }
                                            className="w-24"
                                        />
                                    }
                                />
                                <RuleGroup.Row
                                    title="Valeur résiduelle"
                                    subtitle="Ce qu'il vaut encore à la fin, en pourcentage"
                                    trailing={
                                        <InputField
                                            type="number"
                                            aria-label="Valeur résiduelle en pourcentage"
                                            value={String(settings.salvageValuePercent)}
                                            onChange={(event) =>
                                                apply({ salvageValuePercent: Number(event.target.value) })
                                            }
                                            className="w-24"
                                        />
                                    }
                                />
                            </RuleGroup>

                            <RuleGroup header="Ce que porte chaque type" headerTrailing={`${typesWithOwnPlan} sur ${categories.length}`}>
                                {categories.map((category) => (
                                    <RuleGroup.Row
                                        key={category.id}
                                        title={category.name}
                                        value={
                                            category.defaultDepreciation?.years
                                                ? `${category.defaultDepreciation.years} ans`
                                                : 'Prend le défaut'
                                        }
                                        valueTone={category.defaultDepreciation?.years ? undefined : 'muted'}
                                    />
                                ))}
                            </RuleGroup>

                            <Notice>
                                <strong className="font-medium text-on-surface">La devise et l'année fiscale sont ailleurs.</strong>{' '}
                                Elles ne changent pas un calcul mais une lecture.
                            </Notice>

                            <p className="text-[12px] leading-[17px] text-text-muted">
                                Aucun bouton d'enregistrement : chaque réglage s'applique quand on le pose.
                            </p>
                        </>
                    )}

                    {view === 'sources' && (
                        <>
                            <RuleGroup note="L'état d'une source, c'est ce qu'elle a renvoyé et quand. Une source qui ne dit plus rien depuis six jours est le seul fait qui mérite d'être remonté au sommaire.">
                                {SOURCES.map((source) => {
                                    const enabled = Boolean(settings[source.enabledKey]);
                                    const state = sourceState.get(source.id);
                                    const days = state?.last ? daysSince(state.last) : null;
                                    const stale = enabled && (days === null || days >= 2);

                                    return (
                                        <RuleGroup.Row
                                            key={source.id}
                                            title={source.title}
                                            subtitle={source.subtitle}
                                            status={
                                                !enabled
                                                    ? undefined
                                                    : stale
                                                      ? { icon: Clock, tone: 'pending' }
                                                      : { icon: CheckCircle, tone: 'positive' }
                                            }
                                            value={
                                                !enabled
                                                    ? 'Désactivée'
                                                    : days === null
                                                      ? 'Rien reçu'
                                                      : days === 0
                                                        ? `${state?.count} machines aujourd'hui`
                                                        : `Rien depuis ${days} j`
                                            }
                                            valueTone={!enabled ? 'muted' : stale ? 'pending' : 'positive'}
                                            onOpen={() => openSourceSheet(source.id)}
                                        />
                                    );
                                })}
                            </RuleGroup>

                            <RuleGroup
                                header="Alimenter à la main"
                                note="Une machine remontée n'entre pas au parc toute seule : elle attend une validation dans Tâches."
                            >
                                <RuleGroup.Row
                                    title="Importer des fichiers de remontée"
                                    subtitle="JSON, tableau, ou NDJSON"
                                    onOpen={() => setFeedSheetOpen(true)}
                                />
                                <RuleGroup.Row
                                    title="Validation manuelle obligatoire"
                                    subtitle="Sans elle, une machine reconnue entre au parc sans être vue"
                                    trailing={
                                        <Toggle
                                            checked={settings.autoCollectionRequireManualValidation}
                                            onChange={(value) =>
                                                apply({ autoCollectionRequireManualValidation: value })
                                            }
                                        />
                                    }
                                />
                            </RuleGroup>
                        </>
                    )}
                </Reading>
            </div>

            {/* ── La feuille d'une source : la seule exception au geste ─────────────
                Une clé d'API et une URL **valent ensemble ou pas du tout** — à moitié
                saisies, elles cassent la collecte. C'est le seul pied de l'écran. */}
            <BottomSheet
                open={openSource !== null}
                onClose={() => setOpenSource(null)}
                title={SOURCES.find((source) => source.id === openSource)?.title}
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[14px] font-medium text-on-surface">Source active</span>
                        <Toggle
                            checked={Boolean(
                                sourceDraft[
                                    SOURCES.find((source) => source.id === openSource)?.enabledKey ??
                                        'autoCollectionAgentEnabled'
                                ]
                            )}
                            onChange={(value) => {
                                const key = SOURCES.find((source) => source.id === openSource)?.enabledKey;
                                if (key) setSourceDraft((draft) => ({ ...draft, [key]: value }));
                            }}
                        />
                    </div>

                    {openSource === 'agent' && (
                        <>
                            <InputField
                                label="Clé d'API"
                                value={sourceDraft.autoCollectionAgentApiKey}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionAgentApiKey: event.target.value,
                                    }))
                                }
                                placeholder="NEEMBA_AGENT_KEY"
                            />
                            <InputField
                                label="Fréquence de remontée (minutes)"
                                type="number"
                                value={String(sourceDraft.autoCollectionHeartbeatMinutes)}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionHeartbeatMinutes: Number(event.target.value),
                                    }))
                                }
                            />
                            <p className="text-[12px] leading-[17px] text-text-secondary">
                                En dessous de 15 minutes, l'agent parle plus qu'il n'observe.
                            </p>
                            <InputField
                                label="URL de l'API"
                                value={sourceDraft.autoCollectionApiBaseUrl}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionApiBaseUrl: event.target.value,
                                    }))
                                }
                                placeholder="http://localhost:8787"
                            />
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[14px] text-on-surface">Renvoyer les remontées à l'API</span>
                                <Toggle
                                    checked={sourceDraft.autoCollectionForwardToApi}
                                    onChange={(value) =>
                                        setSourceDraft((draft) => ({ ...draft, autoCollectionForwardToApi: value }))
                                    }
                                />
                            </div>
                            <Button variant="text" size="sm" onClick={testApiConnection} className="self-start">
                                Tester la connexion
                            </Button>
                        </>
                    )}

                    {openSource === 'active_directory' && (
                        <>
                            <InputField
                                label="Contrôleur de domaine"
                                value={sourceDraft.autoCollectionAdHost}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({ ...draft, autoCollectionAdHost: event.target.value }))
                                }
                                placeholder="dc01.tracker.local"
                            />
                            <InputField
                                label="Base DN"
                                value={sourceDraft.autoCollectionAdBaseDn}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionAdBaseDn: event.target.value,
                                    }))
                                }
                                placeholder="OU=Computers,DC=tracker,DC=local"
                            />
                            <InputField
                                label="Compte de service"
                                value={sourceDraft.autoCollectionAdServiceAccount}
                                onChange={(event) =>
                                    setSourceDraft((draft) => ({
                                        ...draft,
                                        autoCollectionAdServiceAccount: event.target.value,
                                    }))
                                }
                                placeholder="svc-neemba-ldap"
                            />
                        </>
                    )}

                    {openSource === 'network_scan' && (
                        <InputField
                            label="Plages IP (séparées par une virgule)"
                            value={sourceDraft.autoCollectionNetworkRanges}
                            onChange={(event) =>
                                setSourceDraft((draft) => ({
                                    ...draft,
                                    autoCollectionNetworkRanges: event.target.value,
                                }))
                            }
                            placeholder="10.10.0.0/24, 10.20.0.0/24"
                        />
                    )}

                    <Notice>
                        Une machine remontée <strong className="font-medium text-on-surface">n'entre pas au parc toute seule</strong> :
                        elle attend une validation dans Tâches.
                    </Notice>

                    {sourceError && (
                        <p className="flex gap-2 text-[12px] leading-[17px] text-error">
                            <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                            <span>{sourceError}</span>
                        </p>
                    )}

                    <div className="mt-3 flex items-center gap-3 border-t border-outline-variant pt-3.5">
                        <Button variant="text" onClick={() => setOpenSource(null)}>
                            Annuler
                        </Button>
                        <Button variant="filled" onClick={saveSource} className="flex-1">
                            Enregistrer la source
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/* Le mot de passe — l'ancien bouton « Mettre à jour » n'avait pas de `onClick`. */}
            <PasswordSheet
                open={passwordSheetOpen}
                onClose={() => setPasswordSheetOpen(false)}
                userId={currentUser?.id}
            />

            <BottomSheet
                open={feedSheetOpen}
                onClose={() => setFeedSheetOpen(false)}
                title="Importer des remontées"
            >
                <FileDropzone
                    onFileSelect={(file) => importCheckInFiles([file])}
                    onFilesSelect={importCheckInFiles}
                    multiple
                    accept=".json,.ndjson,.txt"
                    label="Déposer les fichiers de remontée"
                    subLabel="JSON (objet, tableau ou checkins[]) et NDJSON"
                />
            </BottomSheet>
        </div>
    );
};

/** Changer son propre mot de passe — trois champs, un pied, et rien d'autre. */
const PasswordSheet: React.FC<{ open: boolean; onClose: () => void; userId?: string }> = ({
    open,
    onClose,
    userId,
}) => {
    const { showToast } = useToast();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    useEffect(() => {
        if (!open) {
            setCurrent('');
            setNext('');
            setConfirm('');
            setError(null);
        }
    }, [open]);

    const submit = async () => {
        if (!userId) return;
        if (next.length < 8) {
            setError('Le nouveau mot de passe fait au moins 8 caractères.');
            return;
        }
        if (next !== confirm) {
            setError('Les deux saisies ne sont pas identiques.');
            return;
        }

        setPending(true);
        try {
            await authService.changePassword(userId, current, next);
            showToast('Mot de passe modifié.', 'success');
            onClose();
        } catch {
            setError("Le mot de passe actuel n'a pas été reconnu. Rien n'a été modifié.");
        } finally {
            setPending(false);
        }
    };

    return (
        <BottomSheet open={open} onClose={onClose} title="Mot de passe">
            <div className="flex flex-col gap-3">
                <InputField
                    label="Mot de passe actuel"
                    type="password"
                    value={current}
                    onChange={(event) => setCurrent(event.target.value)}
                />
                <InputField
                    label="Nouveau mot de passe"
                    type="password"
                    value={next}
                    onChange={(event) => setNext(event.target.value)}
                />
                <InputField
                    label="Confirmer"
                    type="password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                />

                {error && (
                    <p className="flex gap-2 text-[12px] leading-[17px] text-error">
                        <Icon glyph={Warning} size={18} className="mt-px shrink-0" />
                        <span>{error}</span>
                    </p>
                )}

                <div className="mt-3 flex items-center gap-3 border-t border-outline-variant pt-3.5">
                    <Button variant="text" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button variant="filled" onClick={submit} disabled={pending} className="flex-1">
                        Changer le mot de passe
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};

export default SettingsPage;
