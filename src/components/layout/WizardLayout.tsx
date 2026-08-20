import React from 'react';
import { ArrowLeft, Check, X } from '@phosphor-icons/react';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MEDIA } from '../../constants/breakpoints';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

interface Step {
    id: number;
    title: string;
}

interface WizardLayoutProps {
    title: string;
    subtitle?: string;
    currentStep: number;
    steps: Step[];
    onClose: () => void;
    onBack?: () => void;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export const WizardLayout: React.FC<WizardLayoutProps> = ({
    title,
    subtitle,
    currentStep,
    steps,
    onClose,
    onBack,
    children,
    actions,
    className,
}) => {
    const isCompact = useMediaQuery(MEDIA.compact);
    const isLandscape = useMediaQuery(MEDIA.landscape);
    const isCompactPortrait = isCompact && !isLandscape;

    const currentIndex = Math.max(0, steps.findIndex((step) => step.id === currentStep));
    const currentTitle = steps[currentIndex]?.title ?? '';

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 bg-[var(--tk-color-app-bg)] flex flex-col h-full overflow-hidden select-none animate-in fade-in duration-150',
                className
            )}
        >
            {/* Top Bar — planche 00.5 (.topbar) */}
            <header className="flex items-center gap-3 px-4 sm:px-6 min-h-[56px] sm:min-h-[64px] bg-surface border-b border-[var(--tk-color-border-default)] shrink-0 z-20">
                {onBack ? (
                    <Button
                        variant="text"
                        onClick={onBack}
                        aria-label="Retour à l'étape précédente"
                        className="w-10 h-10 min-w-0 p-0 text-[var(--tk-color-text-primary)] hover:bg-[var(--tk-color-surface-muted)]"
                    >
                        <Icon glyph={ArrowLeft} size={20} />
                    </Button>
                ) : (
                    <div className="w-2" />
                )}

                <div className="flex-1 min-w-0">
                    {/*
                      Le titre d'un gabarit est au rang du titre de page — 20 px / 28,
                      Archivo 600, `-0.015em` (§2.15, métrique de `.tbar h2.h1`). Il
                      valait 17 puis 19 selon la largeur : 17 n'est admis que pour un
                      titre de héro inversé et 19 pour les initiales d'un héro
                      d'identité (§2.6). Un titre qui change de rang avec la fenêtre
                      n'a pas de rang.
                    */}
                    <h1 className="font-brand text-[20px] leading-7 font-semibold tracking-[-0.015em] text-[var(--tk-color-text-primary)] truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[12px] text-[var(--tk-color-text-secondary)] truncate">
                            {subtitle}
                        </p>
                    )}
                </div>

                <Button
                    variant="text"
                    onClick={onClose}
                    aria-label="Fermer l'assistant"
                    className="w-10 h-10 min-w-0 p-0 text-[var(--tk-color-text-primary)] hover:bg-[var(--tk-color-surface-muted)]"
                >
                    <Icon glyph={X} size={20} />
                </Button>
            </header>

            {/* Stepper Indicator — planche 00.5 (.pas / .pcount) */}
            {isCompactPortrait ? (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-surface border-b border-[var(--tk-color-border-default)] shrink-0">
                    <div className="flex-1 h-1 bg-[var(--tk-color-surface-muted)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--tk-color-inverse-surface)] transition-all duration-200"
                            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-[12px] text-[var(--tk-color-text-secondary)] tabular-nums font-medium shrink-0">
                        Étape {currentIndex + 1} sur {steps.length} · {currentTitle}
                    </span>
                </div>
            ) : (
                <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-[var(--tk-color-border-default)] shrink-0">
                    <div className="max-w-[560px] mx-auto w-full flex items-center">
                        {steps.map((step, index) => {
                            const isCompleted = step.id < currentStep;
                            const isCurrent = step.id === currentStep;
                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span
                                            className={cn(
                                                "w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-semibold font-brand tabular-nums",
                                                isCompleted
                                                    ? 'bg-[var(--tk-color-success)] text-white'
                                                    : isCurrent
                                                      ? 'bg-[var(--tk-color-inverse-surface)] text-white'
                                                      : 'bg-[var(--tk-color-surface-muted)] text-[var(--tk-color-text-secondary)]'
                                            )}
                                        >
                                            {isCompleted ? <Icon glyph={Check} size={18} /> : step.id}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[13px] whitespace-nowrap',
                                                isCurrent
                                                    ? 'text-[var(--tk-color-text-primary)] font-medium'
                                                    : 'text-[var(--tk-color-text-secondary)]'
                                            )}
                                        >
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={cn(
                                                'flex-1 min-w-3 h-[1px] mx-3 transition-colors',
                                                step.id < currentStep
                                                    ? 'bg-[var(--tk-color-success)]'
                                                    : 'bg-[var(--tk-color-border-default)]'
                                            )}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Scrollable Content Container — max 560px mesure */}
            <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 pb-24">
                <div className="max-w-[560px] mx-auto w-full flex flex-col gap-4">
                    {children}
                </div>
            </main>

            {/* Sticky Action Footer — planche 00.5 (.pied .in) */}
            {actions && (
                <footer className="shrink-0 bg-surface border-t border-[var(--tk-color-border-default)] px-4 sm:px-6 py-3.5 z-20">
                    <div className="max-w-[560px] mx-auto w-full flex items-center justify-between gap-3">
                        {actions}
                    </div>
                </footer>
            )}
        </div>
    );
};

export const WizardStep: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
}) => (
    <div className={cn('flex flex-col gap-4 animate-in fade-in duration-150', className)}>
        {children}
    </div>
);

