import { MEDIA } from '../../constants/breakpoints';
import React from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import CloseButton from '../ui/CloseButton';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface FullScreenLayoutProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  headerContent?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  className?: string;
}

export const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({
  title,
  onClose,
  onBack,
  headerContent,
  headerActions,
  children,
  footerActions,
  className,
}) => {
  const isCompactLandscape = useMediaQuery(MEDIA.belowExpandedLandscape);
  const useSymmetricHeader = Boolean(headerContent) && !headerActions;

  return (
    <div className={cn('fixed inset-0 z-50 bg-surface flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-medium2', className)}>
      {/* Header — MD3 Top App Bar */}
      <div className="bg-surface border-b border-outline-variant shadow-elevation-1 flex-shrink-0 relative z-20">
        <div className={cn('max-w-5xl mx-auto px-page-sm medium:px-page', isCompactLandscape ? 'py-2' : 'py-3')}>
          {useSymmetricHeader ? (
            <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-2">
              <div className="flex items-center justify-start">
                {onBack ? (
                  <Button
                    variant="text"
                    size="sm"
                    onClick={onBack}
                    className="w-10 h-10 min-h-10 min-w-10 p-0 text-on-surface-variant hover:text-on-surface border-none shadow-none rounded-lg"
                    aria-label="Retour"
                  >
                    <MaterialIcon name="arrow_back" size={20} />
                  </Button>
                ) : (
                  <span className="w-10 h-10" aria-hidden="true" />
                )}
              </div>

              <h1 className={cn('section-title text-center leading-snug line-clamp-2 medium:line-clamp-1 px-1', isCompactLandscape && 'text-title-medium')}>
                {title}
              </h1>

              <div className="flex items-center justify-end">
                <CloseButton onClick={onClose} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                {onBack && (
                  <Button
                    variant="text"
                    size="sm"
                    onClick={onBack}
                    className="w-10 h-10 min-h-10 min-w-10 p-0 text-on-surface-variant hover:text-on-surface border-none shadow-none rounded-lg"
                    aria-label="Retour"
                  >
                    <MaterialIcon name="arrow_back" size={24} />
                  </Button>
                )}
                <h1 className={cn('section-title leading-snug line-clamp-2 medium:line-clamp-1', isCompactLandscape && 'text-title-medium')}>
                  {title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {headerActions}
                <CloseButton onClick={onClose} />
              </div>
            </div>
          )}
        </div>

        {headerContent && (
          <div className={cn('max-w-5xl mx-auto px-page-sm medium:px-page', isCompactLandscape ? 'pb-2' : 'pb-4')}>
            {headerContent}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto w-full scroll-smooth">
        <div className={cn('max-w-5xl mx-auto px-page-sm medium:px-page', isCompactLandscape ? 'py-4' : 'py-8')}>
          {children}
        </div>
      </div>

      {/* Footer */}
      {footerActions && (
        <div className={cn('bg-surface border-t border-outline-variant sticky bottom-0 z-20 shadow-elevation-2', isCompactLandscape ? 'p-3' : 'p-4')}>
          <div className="max-w-5xl mx-auto flex justify-end gap-3">
            {footerActions}
          </div>
        </div>
      )}
    </div>
  );
};


