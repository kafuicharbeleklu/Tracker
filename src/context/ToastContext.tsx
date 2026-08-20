import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Snackbar, { SnackbarMessage } from '../components/ui/Snackbar';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    action?: { label: string; onClick: () => void };
}

interface ToastContextType {
    showToast: (
        message: string,
        type?: ToastType,
        action?: { label: string; onClick: () => void },
    ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback(
        (
            message: string,
            type: ToastType = 'info',
            action?: { label: string; onClick: () => void },
        ) => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts((prev) => [...prev, { id, message, type, action }]);
        },
        [],
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const messages: SnackbarMessage[] = useMemo(
        () =>
            toasts.map((toast) => ({
                id: toast.id,
                message: toast.message,
                action: toast.action,
                variant: toast.type,
                // 17.5 : un retour transitoire s'efface au bout de 4 secondes, avec ou
                // sans action. La durée n'est pas négociable par message — au-delà, ce
                // n'est plus un retour transitoire, c'est que le tri a été mal fait.
                duration: 4000,
            })),
        [toasts],
    );

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Snackbar messages={messages} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
