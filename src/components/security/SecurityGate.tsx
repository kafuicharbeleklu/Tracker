import React, { useState } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { validateAdminPIN, logSecurityAction } from '../../lib/security';
import PinField from '../ui/PinField';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../hooks/useHistory';
import SideSheet from '../ui/SideSheet';
import Button from '../ui/Button';
import { TextArea } from '../ui/TextArea';
import DemoBadge from '../ui/DemoBadge';

interface SecurityGateProps {
    /**
     * Action protégée. Retourner `false` signale un refus métier (journalisé
     * `actionOutcome: 'DENIED'`) ; `true`/`void` vaut exécution. Reçoit le motif
     * saisi quand `reasonField` est configuré.
     */
    onVerified: (reason?: string) => boolean | void;
    trigger: React.ReactNode;
    title?: string;
    description?: string;
    level?: 'standard' | 'critical';
    entityId?: string;
    /** Nom lisible de l'entité visée (journal d'audit) — pas le libellé du bouton. */
    entityName?: string;
    /**
     * Saisie de motif au-dessus du pavé PIN (refus/renvoi/annulation, §9.7.2/D18).
     * `required` verrouille la saisie du PIN tant que le motif est vide — la garde
     * métier d'updateApproval reste le filet de sécurité.
     */
    reasonField?: { label: string; required?: boolean; placeholder?: string };
}

/**
 * **La longueur vient du registre, et le pavé du composant partagé.**
 *
 * La garde tenait son propre pavé, sa propre géométrie et sa propre longueur. Elle a
 * suivi §2.1 vers quatre ; le journal du registre a **renégocié à six le 02/09**
 * (« partout : 02.2, 06.2, 07.1, SecurityGate »), et 06.2 dessine six cases depuis le
 * 03/09. Ni la longueur ni la géométrie ne se décident plus ici : `PIN_LENGTH` vit
 * dans `lib/security`, et `PinField` porte les mesures de la planche.
 */

/**
 * Portail de validation (step-up) pour actions sensibles.
 * Facteur unique : code PIN administrateur (vérif. réelle via validateAdminPIN).
 * Les anciennes méthodes « Face / Signature / Empreinte » ont été retirées :
 * elles validaient n'importe qui (fausse sécurité). Cf. docs/AUDIT_MECANISMES_SIMULES.md.
 */
const SecurityGate: React.FC<SecurityGateProps> = ({
    onVerified,
    trigger,
    title = 'Validation de sécurité',
    description = 'Saisissez votre code PIN administrateur pour confirmer cette action.',
    entityId = 'system',
    entityName,
    reasonField,
}) => {
    const { showToast } = useToast();
    const { currentUser } = useAuth();
    const { logEvent } = useHistory();

    const [isOpen, setIsOpen] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const [pin, setPin] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [reason, setReason] = useState('');

    const actorId = currentUser?.id || 'unknown';
    const reasonMissing = Boolean(reasonField?.required) && reason.trim() === '';

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            setIsValidated(false);
            setIsVerifying(false);
            setPin('');
            setAttempts(0);
            setReason('');
        }, 300);
    };

    const verifyPin = (fullPin: string) => {
        setIsVerifying(true);
        setTimeout(() => {
            setIsVerifying(false);

            if (validateAdminPIN(fullPin)) {
                setIsValidated(true);
                setTimeout(() => {
                    // Journalisation APRÈS le dénouement : le facteur (PIN) et l'issue de
                    // l'action protégée sont deux faits distincts (audit §7.2 / X16).
                    const trimmedReason = reasonField ? reason.trim() || undefined : undefined;
                    const result = onVerified(trimmedReason);
                    const actionOutcome = result === false ? 'DENIED' : 'EXECUTED';
                    logSecurityAction(title, actorId, entityId, 'PIN', 'SUCCESS', actionOutcome);
                    // Piste d'audit persistée (journal HistoryEvent)
                    logEvent({
                        type: 'SECURITY_STEP_UP',
                        actorId,
                        actorName: currentUser?.name || 'Inconnu',
                        actorRole: currentUser?.role || 'User',
                        targetType: 'SYSTEM',
                        targetId: entityId,
                        targetName: entityName || entityId,
                        description: `Step-up PIN validé — action « ${title} » ${actionOutcome === 'EXECUTED' ? 'exécutée' : 'refusée par les règles métier'}`,
                        metadata: {
                            action: title,
                            factorOutcome: 'SUCCESS',
                            actionOutcome,
                            ...(trimmedReason ? { reason: trimmedReason } : {}),
                        },
                        isSystem: false,
                        isSensitive: true,
                    });
                    handleClose();
                }, 1200);
                return;
            }

            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setPin('');
            showToast(`Code incorrect. Tentative ${newAttempts}/3`, 'error');
            logSecurityAction(
                title,
                actorId,
                entityId,
                'PIN',
                newAttempts >= 3 ? 'BLOCKED' : 'FAILED',
                'NOT_RUN',
            );
            if (newAttempts >= 3) handleClose();
        }, 600);
    };

    return (
        <>
            <div onClick={() => setIsOpen(true)} className="contents">
                {trigger}
            </div>

            <SideSheet
                open={isOpen}
                onClose={handleClose}
                title={isValidated ? 'Identité confirmée' : title}
                description={!isValidated ? description : undefined}
                width="standard"
                side="right"
            >
                <div className="flex min-h-[400px] flex-col items-center justify-center py-2">
                    {!isValidated && (
                        <div className="animate-in zoom-in-95 w-full space-y-8 text-center duration-300">
                            <div className="bg-secondary-container text-secondary mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                                <MaterialIcon name="lock" size={32} />
                            </div>
                            <h3 className="text-title-large text-on-surface">
                                Confirmer votre code PIN
                            </h3>
                            <div className="flex justify-center">
                                <DemoBadge title="Contrôle de démonstration — PIN vérifié côté client uniquement" />
                            </div>
                            {reasonField && (
                                <div className="text-left">
                                    <TextArea
                                        label={reasonField.label}
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        required={reasonField.required}
                                        disabled={isVerifying}
                                        rows={3}
                                        maxLength={500}
                                        placeholder={
                                            reasonField.placeholder || 'Expliquez votre décision…'
                                        }
                                        supportingText={
                                            reasonField.required
                                                ? 'Obligatoire — la saisie du PIN se déverrouille avec le motif.'
                                                : 'Optionnel'
                                        }
                                    />
                                </div>
                            )}
                            <PinField
                                value={pin}
                                onChange={setPin}
                                onComplete={verifyPin}
                                state={attempts > 0 ? 'error' : 'idle'}
                                disabled={isVerifying || reasonMissing}
                                label="Code PIN administrateur"
                            />
                            {attempts > 0 && (
                                <p className="text-error text-[14px] leading-5">
                                    Code incorrect ({attempts}/3)
                                </p>
                            )}
                            <Button
                                variant="outlined"
                                onClick={handleClose}
                                className="text-on-surface-variant w-full"
                            >
                                Annuler
                            </Button>
                        </div>
                    )}

                    {isValidated && (
                        <div className="animate-in zoom-in flex flex-col items-center justify-center space-y-6 text-center duration-500">
                            <div className="relative">
                                <div className="bg-tertiary-container text-tertiary shadow-elevation-4 relative z-10 flex h-24 w-24 items-center justify-center rounded-full">
                                    <MaterialIcon
                                        name="check_circle"
                                        size={56}
                                        className="animate-in zoom-in delay-200 duration-500"
                                    />
                                </div>
                                <div className="bg-tertiary/20 absolute inset-0 animate-ping rounded-full"></div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-headline-small text-on-surface">
                                    Identité confirmée
                                </h3>
                                <p className="text-on-surface-variant text-body-large max-w-xs leading-relaxed">
                                    L'authentification a été validée avec succès. L'action va être
                                    exécutée.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </SideSheet>
        </>
    );
};

export default SecurityGate;
