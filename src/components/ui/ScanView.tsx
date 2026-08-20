import React, { useEffect, useRef } from 'react';
import { Check, Warning, X } from '@phosphor-icons/react';

import Icon from './Icon';
import Button from './Button';
import { cn } from '../../lib/utils';

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
 * **Ce que ce composant ne fait pas, et c'est délibéré : il ne décode rien.** Le
 * flux vidéo et la lecture du code appartiennent à l'appelant, qui les passe en
 * `preview` et renvoie ses lectures en `hit` / `hits`. La vue est le cadre, pas le
 * lecteur — c'est ce qui lui permet de servir les quatre emplois (numéro de série
 * 04.3, code-barres 06.1, facture 15.1, campagne d'audit) sans en connaître aucun.
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
    /** Le flux de la caméra. Sans lui, la vue rend sa surface sombre au repos. */
    preview?: React.ReactNode;
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

    /** Mode lot — les lectures de la campagne, la plus récente en tête. */
    hits?: ScanHit[];
    /** Le dénominateur : ce que le périmètre attend (N4). */
    expected?: number;
    /** Le verbe de la clôture. Le compte y est repris par l'appelant. */
    finishLabel?: string;
    onFinish?: () => void;

    className?: string;
}

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
                        dense ? 'text-[15px]' : 'text-base',
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
    tip,
    hit,
    acceptLabel = 'Utiliser ce numéro',
    onAccept,
    onRetry,
    onManualEntry,
    hits = [],
    expected,
    finishLabel = 'Clôturer le lot',
    onFinish,
    className,
}) => {
    const lastHitId = useRef<string | null>(null);
    const latest = mode === 'batch' ? hits[0] : hit;

    // N3 — une lecture se sent, elle ne se lit pas seulement.
    useEffect(() => {
        if (!latest || latest.id === lastHitId.current) return;
        lastHitId.current = latest.id;
        vibrate(latest.kind === 'exception' ? [40, 60, 40] : 30);
    }, [latest]);

    const exceptions = hits.filter((h) => h.kind === 'exception').length;
    const defaultTip =
        mode === 'batch'
            ? 'Enchaînez les équipements. La caméra reste ouverte.'
            : 'Cadrez le numéro de série ou le code-barres. Tenez l’appareil à environ 20 cm.';

    return (
        <div className={cn('bg-inverse-surface relative flex min-h-dvh flex-col', className)}>
            {/* La caméra occupe tout ; le chrome se pose dessus. */}
            <div className="absolute inset-0 overflow-hidden">{preview}</div>

            <div className="text-inverse-on-surface relative z-10 flex min-h-14 items-center gap-1 px-2 py-1">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer le scan"
                    className="touch-target focus-visible:ring-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-md outline-none hover:bg-white/10 focus-visible:ring-2"
                >
                    <Icon glyph={X} />
                </button>

                {onModeChange && (
                    <div
                        className="ml-auto flex rounded-md bg-white/[0.13] p-[3px]"
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
                <div
                    aria-hidden="true"
                    className={cn('relative w-[250px]', mode === 'batch' ? 'h-[120px]' : 'h-40')}
                >
                    <span className="border-primary absolute top-0 left-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-r-0 border-b-0" />
                    <span className="border-primary absolute top-0 right-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-b-0 border-l-0" />
                    <span className="border-primary absolute bottom-0 left-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-t-0 border-r-0" />
                    <span className="border-primary absolute right-0 bottom-0 h-[30px] w-[30px] rounded-xs border-[2.5px] border-t-0 border-l-0" />
                    <span className="bg-primary/50 absolute inset-x-2 top-1/2 h-0.5 blur-[3px]" />
                    <span className="bg-primary/75 absolute inset-x-2 top-1/2 h-0.5" />
                </div>
                <p className="text-body-medium text-on-nav-surface-variant mt-4 max-w-[270px] text-center">
                    {tip ?? defaultTip}
                </p>
            </div>

            {/* Le pied porte la lecture, et rien ne s'accepte sans qu'elle soit écrite. */}
            <div className="rounded-t-card bg-surface relative z-10 px-5 pt-3.5 pb-4">
                {mode === 'simple' ? (
                    <>
                        {hit ? (
                            <>
                                <ScanHitRow hit={hit} />
                                <div className="mt-3 flex gap-3">
                                    {onRetry && (
                                        <Button
                                            variant="tonal"
                                            onClick={onRetry}
                                            className="shrink-0"
                                        >
                                            Reprendre
                                        </Button>
                                    )}
                                    {onAccept && (
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

                        {onManualEntry && (
                            <Button variant="text" onClick={onManualEntry} className="mt-1.5 px-0">
                                Saisir à la main si le code est abîmé
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        {/* N4 — le compte porte son dénominateur, et l'écart se dit à part. */}
                        <p className="mb-2.5 flex items-baseline gap-2">
                            <span className="font-brand text-on-surface text-[30px] font-semibold tracking-tight tabular-nums">
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
            </div>
        </div>
    );
};

export default ScanView;
