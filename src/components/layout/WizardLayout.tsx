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

    const currentIndex = Math.max(
        0,
        steps.findIndex((step) => step.id === currentStep),
    );
    const currentTitle = steps[currentIndex]?.title ?? '';

    return (
        <div
            className={cn(
                'animate-in fade-in fixed inset-0 z-50 flex h-full flex-col overflow-hidden bg-[var(--tk-color-app-bg)] duration-150 select-none',
                className,
            )}
        >
            {/* Top Bar — planche 00.5 (.topbar) */}
            <header className="bg-surface z-20 flex min-h-[56px] shrink-0 items-center gap-3 border-b border-[var(--tk-color-border-default)] px-4 sm:min-h-[64px] sm:px-6">
                {onBack ? (
                    <Button
                        variant="text"
                        onClick={onBack}
                        aria-label="Retour à l'étape précédente"
                        className="h-10 w-10 min-w-0 p-0 text-[var(--tk-color-text-primary)] hover:bg-[var(--tk-color-surface-muted)]"
                    >
                        <Icon glyph={ArrowLeft} size={20} />
                    </Button>
                ) : (
                    <div className="w-2" />
                )}

                <div className="min-w-0 flex-1">
                    {/*
                      Le titre d'un gabarit est au rang du titre de page — 20 px / 28,
                      Archivo 600, `-0.015em` (§2.15, métrique de `.tbar h2.h1`). Il
                      valait 17 puis 19 selon la largeur : 17 n'est admis que pour un
                      titre de héro inversé et 19 pour les initiales d'un héro
                      d'identité (§2.6). Un titre qui change de rang avec la fenêtre
                      n'a pas de rang.
                    */}
                    <h1 className="font-brand truncate text-[20px] leading-7 font-semibold tracking-[-0.015em] text-[var(--tk-color-text-primary)]">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="truncate text-[12px] text-[var(--tk-color-text-secondary)]">
                            {subtitle}
                        </p>
                    )}
                </div>

                <Button
                    variant="text"
                    onClick={onClose}
                    aria-label="Fermer l'assistant"
                    className="h-10 w-10 min-w-0 p-0 text-[var(--tk-color-text-primary)] hover:bg-[var(--tk-color-surface-muted)]"
                >
                    <Icon glyph={X} size={20} />
                </Button>
            </header>

            {/* Stepper Indicator — planche 00.5 (.pas / .pcount) */}
            {isCompactPortrait ? (
                <div className="bg-surface flex shrink-0 items-center gap-3 border-b border-[var(--tk-color-border-default)] px-4 py-2.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--tk-color-surface-muted)]">
                        <div
                            className="h-full bg-[var(--tk-color-inverse-surface)] transition-all duration-200"
                            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                    <span className="shrink-0 text-[12px] font-medium text-[var(--tk-color-text-secondary)] tabular-nums">
                        Étape {currentIndex + 1} sur {steps.length} · {currentTitle}
                    </span>
                </div>
            ) : (
                <div className="bg-surface flex shrink-0 items-center justify-between border-b border-[var(--tk-color-border-default)] px-6 py-3">
                    <div className="mx-auto flex w-full max-w-[560px] items-center">
                        {steps.map((step, index) => {
                            const isCompleted = step.id < currentStep;
                            const isCurrent = step.id === currentStep;
                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span
                                            className={cn(
                                                'font-brand flex h-[26px] w-[26px] items-center justify-center rounded-full text-[12px] font-semibold tabular-nums',
                                                isCompleted
                                                    ? 'bg-[var(--tk-color-success)] text-white'
                                                    : isCurrent
                                                      ? 'bg-[var(--tk-color-inverse-surface)] text-white'
                                                      : 'bg-[var(--tk-color-surface-muted)] text-[var(--tk-color-text-secondary)]',
                                            )}
                                        >
                                            {isCompleted ? (
                                                <Icon glyph={Check} size={18} />
                                            ) : (
                                                step.id
                                            )}
                                        </span>
                                        <span
                                            className={cn(
                                                'text-[13px] whitespace-nowrap',
                                                isCurrent
                                                    ? 'font-medium text-[var(--tk-color-text-primary)]'
                                                    : 'text-[var(--tk-color-text-secondary)]',
                                            )}
                                        >
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={cn(
                                                'mx-3 h-[1px] min-w-3 flex-1 transition-colors',
                                                step.id < currentStep
                                                    ? 'bg-[var(--tk-color-success)]'
                                                    : 'bg-[var(--tk-color-border-default)]',
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
            <main className="w-full flex-1 overflow-y-auto p-4 pb-24 sm:p-6">
                <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">{children}</div>
            </main>

            {/* Sticky Action Footer — planche 00.5 (.pied .in) */}
            {actions && (
                <footer className="bg-surface z-20 shrink-0 border-t border-[var(--tk-color-border-default)] px-4 py-3.5 sm:px-6">
                    <div className="mx-auto flex w-full max-w-[560px] items-center justify-between gap-3">
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
    <div className={cn('animate-in fade-in flex flex-col gap-4 duration-150', className)}>
        {children}
    </div>
);
