import React, { useEffect, useRef, useState } from 'react';
import { Check, Flashlight, TextAa, Warning, X } from '@phosphor-icons/react';

import Icon from './Icon';
import Button from './Button';
import { cn } from '../../lib/utils';
import { useCameraDeScan, type EtatCamera } from '../../hooks/useCameraDeScan';

/**
 * Canevas de scan — planche **17.3** (composant partagé, 3 emplois de scan).
 *
 * Une vue, **deux modes** : `simple` pour l'attribution et la saisie, `batch` pour
 * l'inventaire physique, qui enchaîne **sans refermer la caméra**.
 *
 * **N1 — le cadre de visée est l'instruction.** Il dit que le scan est actif *et* à
 * quelle distance tenir l'appareil ; sans lui, on approche et on recule jusqu'à ce
 * que ça marche. Une phrase sous le cadre suffit — deux ne se lisent pas, caméra
 * en main.
 *
 * **N2 — la valeur lue s'écrit en clair avant d'être acceptée.** Un code mal lu
 * ressemble à un code bien lu : l'écriture est la seule vérification possible. Et
 * « Saisir à la main » reste toujours accessible — un code abîmé ne se scanne pas.
 *
 * **N3 — visuel *et* haptique.** L'inventaire se fait debout, en local technique,
 * souvent bruyant : le retour doit être perceptible sans regarder l'écran. La vue
 * déclenche donc une vibration à chaque lecture, quand l'appareil sait le faire.
 *
 * **N4 — le lot compte et qualifie.** « 23 sur 41 attendus », et l'écart nommé à
 * part : un compteur qui monte sans dénominateur ne dit pas si la campagne avance.
 * La clôture est **explicite** — en mode lot, la caméra ne se referme jamais
 * d'elle-même.
 *
 * **La caméra lit** (09/10). La vue « ne décodait rien » : le flux et la lecture
 * devaient venir de l'appelant, et aucun ne les fournissait — le viseur s'ouvrait sur
 * une surface sombre, et seule la saisie au clavier enregistrait quoi que ce soit.
 * Quand l'appelant passe `onLecture`, la vue ouvre la caméra arrière
 * (`useCameraDeScan`) : code-barres et QR lus en continu là où le navigateur sait les
 * décoder, texte de l'étiquette lu en photo partout ailleurs. Elle ne sait toujours
 * pas **ce que le code désigne** : la lecture repart chez l'appelant, qui renvoie son
 * verdict en `hit` / `hits` — c'est ce qui lui permet de servir tous ses emplois sans
 * en connaître aucun.
 */

export interface ScanHit {
    id: string;
    /** La valeur lue, écrite **en clair** (N2). */
    code: string;
    /** Ce que la valeur désigne — « Numéro de série · Dell Latitude 5540 ». */
    detail: string;
    /**
     * `expected` : attendu, et retrouvé. `exception` : scanné, et non attendu ici
     * (« Écart », au sens du lexique §Audit). L'écart porte une icône **et** un mot
     * — jamais la couleur seule (I3).
     */
    kind?: 'expected' | 'exception';
}

interface ScanViewProps {
    mode: 'simple' | 'batch';
    /** Absent : la bascule de mode n'est pas montrée (un emploi qui n'a qu'un mode). */
    onModeChange?: (mode: 'simple' | 'batch') => void;
    onClose: () => void;
    /** Un fond fourni par l'appelant — la galerie. Il remplace la caméra. */
    preview?: React.ReactNode;
    /**
     * **Une lecture de la caméra** (09/10) — le code tel qu'il est lu, avant tout verdict.
     * Présent : la vue ouvre la caméra. L'appelant le traite comme une saisie à la main.
     */
    onLecture?: (code: string) => void;
    /**
     * Parmi les codes lus en photo, celui que l'appelant reconnaît passe devant, rendu
     * comme il l'écrit (`codeConnu`).
     */
    reconnaitre?: (code: string) => string | undefined;
    /** L'instruction sous le cadre — **une** phrase (N1). */
    tip?: React.ReactNode;

    /** Mode simple — la lecture en attente d'acceptation. */
    hit?: ScanHit | null;
    /** Le verbe de l'acceptation. Jamais « OK » : le bouton porte ce qu'il fait. */
    acceptLabel?: string;
    onAccept?: (hit: ScanHit) => void;
    onRetry?: () => void;
    /** Toujours proposé (N2) : un code abîmé ne se scanne pas. */
    onManualEntry?: () => void;
    /**
     * La saisie à la main **tenue par la vue**, quand l'appelant n'a pas de surface à
     * lui pour la porter. Le champ s'ouvre dans le pied, sous le cadre, et ce qui est
     * tapé ressort par ici — la vue ne décode toujours rien, elle recueille. Sans ce
     * prop, `onManualEntry` reprend la main (c'est le cas de la campagne d'audit, dont
     * la saisie accepte aussi le contenu d'un QR et vit dans sa propre feuille).
     */
    onManualSubmit?: (code: string) => void;

    /** Mode lot — les lectures de la campagne, la plus récente en tête. */
    hits?: ScanHit[];
    /** Le dénominateur : ce que le périmètre attend (N4). */
    expected?: number;
    /** Le verbe de la clôture. Le compte y est repris par l'appelant. */
    finishLabel?: string;
    onFinish?: () => void;

    className?: string;
}

/** Ce que la caméra empêche de faire, en une phrase — elle remplace la consigne (N1). */
const CONSIGNE_DE_CAMERA: Partial<Record<EtatCamera, string>> = {
    demande: 'Autorisez la caméra pour lire l’étiquette.',
    refusee:
        'La caméra est refusée. Autorisez-la dans les réglages du navigateur, ou saisissez le code.',
    indisponible: 'Pas de caméra disponible ici. Saisissez le code à la main.',
};

const MODE_LABELS: Record<'simple' | 'batch', string> = {
    simple: 'Simple',
    batch: 'Lot',
};

/** Le retour haptique de N3 — muet là où l'appareil ne sait pas vibrer. */
const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
    }
};

const ScanHitRow: React.FC<{ hit: ScanHit; dense?: boolean }> = ({ hit, dense = false }) => {
    const isException = hit.kind === 'exception';

    return (
        <div
            className={cn(
                'border-outline-variant flex items-center gap-3 border-t first:border-t-0',
                dense ? 'min-h-12' : 'min-h-14',
            )}
        >
            <span
                className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white',
                    isException ? 'bg-warning' : 'bg-success',
                )}
            >
                <Icon
                    glyph={isException ? Warning : Check}
                    size={20}
                    emphasis={isException ? 'regular' : 'fill'}
                />
            </span>
            <div className="min-w-0 flex-1">
                <span
                    className={cn(
                        'font-brand text-on-surface block truncate leading-5 font-semibold tracking-tight',
                        dense ? 'text-ts-control' : 'text-ts-body',
                    )}
                >
                    {hit.code}
                </span>
                <span className="text-body-small text-text-secondary mt-px block truncate">
                    {hit.detail}
                </span>
            </div>
        </div>
    );
};

const ScanView: React.FC<ScanViewProps> = ({
    mode,
    onModeChange,
    onClose,
    preview,
    onLecture,
    reconnaitre,
    tip,
    hit,
    acceptLabel = 'Utiliser ce numéro',
    onAccept,
    onRetry,
    onManualEntry,
    onManualSubmit,
    hits = [],
    expected,
    finishLabel = 'Clôturer le lot',
    onFinish,
    className,
}) => {
    const lastHitId = useRef<string | null>(null);
    const latest = mode === 'batch' ? hits[0] : hit;
    const [manualOpen, setManualOpen] = useState(false);
    const [manualValue, setManualValue] = useState('');
    const cadreRef = useRef<HTMLDivElement | null>(null);
    const camera = useCameraDeScan({
        cadreRef,
        actif: Boolean(onLecture) && !preview,
        /* En mode simple, une lecture attend son verdict : la caméra reste ouverte, rien
           ne se lit par-dessus. */
        enPause: mode === 'simple' && Boolean(hit),
        onCode: (code) => onLecture?.(code),
        reconnaitre,
    });

    const submitManual = () => {
        const value = manualValue.trim();
        if (!value || !onManualSubmit) return;
        onManualSubmit(value);
        setManualValue('');
        setManualOpen(false);
    };

    // N3 — une lecture se sent, elle ne se lit pas seulement.
    useEffect(() => {
        if (!latest || latest.id === lastHitId.current) return;
        lastHitId.current = latest.id;
        vibrate(latest.kind === 'exception' ? [40, 60, 40] : 30);
    }, [latest]);

    /* Échap (P3, 25/09) : il referme la saisie manuelle si elle est ouverte, sinon le viseur —
       sauf si une feuille est posée par-dessus, qui le traite elle-même. */
    useEffect(() => {
        const surTouche = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || document.querySelector('[aria-modal="true"]')) return;
            event.preventDefault();
            if (manualOpen) setManualOpen(false);
            else onClose();
        };
        document.addEventListener('keydown', surTouche);
        return () => document.removeEventListener('keydown', surTouche);
    }, [manualOpen, onClose]);

    const cameraOuverte = camera.etat === 'active';
    const exceptions = hits.filter((h) => h.kind === 'exception').length;
    const defaultTip =
        mode === 'batch'
            ? 'Enchaînez les équipements. La caméra reste ouverte.'
            : 'Cadrez le numéro de série ou le code-barres. Tenez l’appareil à environ 20 cm.';
    const consigne =
        mode === 'simple' && hit && cameraOuverte
            ? 'Vérifiez le code lu avant de continuer.'
            : camera.photo === 'rien'
              ? 'Rien de lisible. Rapprochez-vous de l’étiquette, ou saisissez le code.'
              : (CONSIGNE_DE_CAMERA[camera.etat] ??
                (camera.etat === 'active' && camera.decodeur === 'photo'
                    ? 'Cadrez l’étiquette, puis lisez-la.'
                    : (tip ?? defaultTip)));

    return (
        <div className={cn('bg-inverse-surface relative flex min-h-dvh flex-col', className)}>
            {/* La caméra occupe tout ; le chrome se pose dessus. */}
            <div className="absolute inset-0 overflow-hidden">
                {preview ??
                    (camera.etat !== 'inactive' && (
                        <video
                            ref={camera.videoRef}
                            playsInline
                            muted
                            autoPlay
                            aria-hidden="true"
                            className={cn(
                                'h-full w-full object-cover transition-opacity duration-200',
                                camera.etat === 'active' ? 'opacity-100' : 'opacity-0',
                            )}
                        />
                    ))}
            </div>

            {/* `z-20` : au-dessus du voile que le cadre projette autour de lui. */}
            <div className="text-inverse-on-surface relative z-20 flex min-h-14 items-center gap-1 px-2 py-1">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer le scan"
                    className="touch-target focus-visible:ring-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-2"
                >
                    <Icon glyph={X} />
                </button>

                {/* La lampe, quand l'appareil en a une : les locaux techniques sont sombres. */}
                {camera.lampe.possible && (
                    <button
                        type="button"
                        onClick={() => void camera.basculerLampe()}
                        aria-label={camera.lampe.allumee ? 'Éteindre la lampe' : 'Allumer la lampe'}
                        aria-pressed={camera.lampe.allumee}
                        className={cn(
                            'touch-target focus-visible:ring-primary ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-2',
                            camera.lampe.allumee && 'bg-white/[0.13]',
                        )}
                    >
                        <Icon
                            glyph={Flashlight}
                            emphasis={camera.lampe.allumee ? 'fill' : 'regular'}
                        />
                    </button>
                )}

                {onModeChange && (
                    <div
                        className={cn(
                            'flex rounded-md bg-white/[0.13] p-[3px]',
                            !camera.lampe.possible && 'ml-auto',
                        )}
                        role="group"
                        aria-label="Mode de scan"
                    >
                        {(['simple', 'batch'] as const).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onModeChange(value)}
                                aria-pressed={mode === value}
                                className={cn(
                                    'touch-target text-label-large flex h-10 items-center rounded-sm px-3.5',
                                    'focus-visible:ring-primary outline-none focus-visible:ring-2',
                                    mode === value
                                        ? 'bg-inverse-on-surface text-on-surface'
                                        : 'text-on-nav-surface-variant',
                                )}
                            >
                                {MODE_LABELS[value]}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* N1 — le cadre de visée, et la phrase qui le complète. */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
                {/* **Le cadre découpe l'image** (09/10) : caméra ouverte, tout ce qui l'entoure
                    est voilé — une ombre portée sans flou, immense. C'est ce qui dit où viser,
                    et ce qui garde la consigne lisible sur une étiquette blanche. */}
                <div
                    ref={cadreRef}
                    aria-hidden="true"
                    className={cn(
                        'relative w-[250px] rounded-xs',
                        mode === 'batch' ? 'h-[120px]' : 'h-40',
                        cameraOuverte && 'shadow-[0_0_0_200vmax_rgba(0,0,0,0.62)]',
                    )}
                >
                    <span className="border-primary absolute top-0 left-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-r-0 border-b-0" />
                    <span className="border-primary absolute top-0 right-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-b-0 border-l-0" />
                    <span className="border-primary absolute bottom-0 left-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-t-0 border-r-0" />
                    <span className="border-primary absolute right-0 bottom-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-t-0 border-l-0" />
                    <span className="bg-primary/50 absolute inset-x-2 top-1/2 h-0.5 blur-[3px]" />
                    <span className="bg-primary/75 absolute inset-x-2 top-1/2 h-0.5" />
                </div>
                <p
                    aria-live="polite"
                    className={cn(
                        'text-body-medium relative mt-4 max-w-[270px] text-center',
                        cameraOuverte ? 'text-white' : 'text-on-nav-surface-variant',
                    )}
                >
                    {consigne}
                </p>
                {/* **Lire l'étiquette en photo** — le seul moyen là où le navigateur ne
                    décode pas les codes-barres, et le recours pour une étiquette sans code. */}
                {camera.etat === 'active' && !(mode === 'simple' && hit) && (
                    <button
                        type="button"
                        onClick={() => void camera.lireLEtiquette()}
                        disabled={camera.photo === 'lecture'}
                        className="touch-target text-label-large focus-visible:ring-primary relative mt-4 flex h-11 items-center gap-2 rounded-full bg-white/[0.18] px-4 text-white outline-none hover:bg-white/[0.26] focus-visible:ring-2 disabled:opacity-70"
                    >
                        <Icon glyph={TextAa} size={20} />
                        {camera.photo === 'lecture'
                            ? 'Lecture de l’étiquette…'
                            : 'Lire l’étiquette'}
                    </button>
                )}
            </div>

            {/* Le pied porte la lecture, et rien ne s'accepte sans qu'elle soit écrite. */}
            <div className="rounded-t-card bg-surface relative z-10 px-5 pt-3.5 pb-4">
                {mode === 'simple' ? (
                    <>
                        {hit ? (
                            <>
                                <ScanHitRow hit={hit} />
                                {/* **Un code que rien ne porte ne s'accepte pas** (09/10) : le
                                    bouton d'acceptation fermait le viseur sans rien ouvrir.
                                    Il ne reste que « Reprendre », pleine largeur. */}
                                <div className="mt-3 flex gap-3">
                                    {onRetry && (
                                        <Button
                                            variant="tonal"
                                            onClick={onRetry}
                                            className={
                                                hit.kind === 'exception' ? 'flex-1' : 'shrink-0'
                                            }
                                        >
                                            Reprendre
                                        </Button>
                                    )}
                                    {onAccept && hit.kind !== 'exception' && (
                                        <Button
                                            variant="filled"
                                            onClick={() => onAccept(hit)}
                                            className="flex-1"
                                        >
                                            {acceptLabel}
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className="text-body-medium text-text-secondary min-h-14">
                                En attente d’une lecture.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        {/* N4 — le compte porte son dénominateur, et l'écart se dit à part. */}
                        <p className="mb-2.5 flex items-baseline gap-2">
                            <span className="font-brand text-on-surface text-[1.875rem] font-semibold tracking-tight tabular-nums">
                                {hits.length}
                            </span>
                            <span className="text-body-medium text-text-secondary">
                                {typeof expected === 'number'
                                    ? `scannés sur ${expected} attendus`
                                    : 'scannés'}
                                {exceptions > 0 && (
                                    <>
                                        {' · '}
                                        <b className="text-warning-strong font-medium">
                                            {exceptions} hors campagne
                                        </b>
                                    </>
                                )}
                            </span>
                        </p>

                        <div className="max-h-40 overflow-y-auto">
                            {hits.slice(0, 4).map((h) => (
                                <ScanHitRow key={h.id} hit={h} dense />
                            ))}
                        </div>

                        {onFinish && (
                            <Button variant="tonal" onClick={onFinish} className="mt-3 w-full">
                                {`${finishLabel} (${hits.length})`}
                            </Button>
                        )}
                    </>
                )}

                {/* **« Saisir à la main » vaut pour les deux modes** — 17.3 : *« un code
                    abîmé ne se scanne pas »*, et cette vue ne décode rien par contrat.
                    Elle ne s'affichait que dans le mode simple : en **mode lot**, celui
                    de la campagne d'inventaire, l'écran de scan n'offrait donc aucune
                    façon d'enregistrer une lecture. Le seul geste de 16.2 était mort. */}
                {onManualSubmit ? (
                    manualOpen ? (
                        <div className="mt-2 flex gap-2">
                            <input
                                autoFocus
                                value={manualValue}
                                onChange={(event) => setManualValue(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        submitManual();
                                    }
                                }}
                                aria-label="Code lu sur l’étiquette"
                                placeholder="le code lu sur l’étiquette"
                                className="border-outline-variant bg-surface text-body-large text-on-surface focus:border-primary min-h-12 min-w-0 flex-1 rounded-xs border px-3 outline-none"
                            />
                            <Button
                                variant="tonal"
                                onClick={submitManual}
                                disabled={!manualValue.trim()}
                            >
                                Valider
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="text"
                            onClick={() => setManualOpen(true)}
                            className="mt-1.5 px-0"
                        >
                            Saisir à la main si le code est abîmé
                        </Button>
                    )
                ) : (
                    onManualEntry && (
                        <Button variant="text" onClick={onManualEntry} className="mt-1.5 px-0">
                            Saisir à la main si le code est abîmé
                        </Button>
                    )
                )}
            </div>
        </div>
    );
};

export default ScanView;
