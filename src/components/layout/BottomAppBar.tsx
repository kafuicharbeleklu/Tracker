import React from 'react';
import { cn } from '../../lib/utils';

interface BottomAppBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile bottom shell aligned with the SmartProcure navigation bar.
 */
const BottomAppBar: React.FC<BottomAppBarProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "min-h-16 w-full bg-white/95 backdrop-blur-md border-t border-[var(--color-border-default)] shadow-[0_-1px_10px_rgba(0,0,0,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default BottomAppBar;
