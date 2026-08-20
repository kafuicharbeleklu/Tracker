import React, { useState, useRef } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import { validateAdminPIN, logSecurityAction } from '../../lib/security';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useHistory } from '../../hooks/useHistory';
import SideSheet from '../ui/SideSheet';
import Button from '../ui/Button';
import InputField from '../ui/InputField';
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
 * Longueur du code PIN — **quatre, sans exception** (REGLES-TRANSVERSES.md §2.1,
 * référence dessinée planche 06.2).
 *
 * Cette garde en déclarait **six**, seule dans le produit : les deux assistants
 * d'attribution et de retour étaient déjà à quatre. Le registre avait pourtant
 * prévu le cas de figure — « un autre code (application d'authentification, code
 * de secours, code à usage unique) **n'emprunte pas ce composant** : il se saisit
 * dans un champ ordinaire ». Or ceci *est* un code PIN, celui de l'administrateur :
 * il tombe donc sous la règle, et non sous l'exception.
 *
 * La longueur est nommée une fois et tout en dérive — le pavé, la remise à zéro et
 * le déclenchement de la vérification. Six était écrit à cinq endroits, ce qui est
 * exactement pourquoi la valeur avait pu diverger sans que personne le voie.
 */
const PIN_LENGTH = 4;

const emptyPin = (): string[] => Array<string>(PIN_LENGTH).fill('');

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

  const [pin, setPin] = useState(emptyPin);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [reason, setReason] = useState('');

  const actorId = currentUser?.id || 'unknown';
  const reasonMissing = Boolean(reasonField?.required) && reason.trim() === '';

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setIsValidated(false);
      setIsVerifying(false);
      setPin(emptyPin());
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
      setPin(emptyPin());
      pinRefs.current[0]?.focus();
      showToast(`Code incorrect. Tentative ${newAttempts}/3`, 'error');
      logSecurityAction(title, actorId, entityId, 'PIN', newAttempts >= 3 ? 'BLOCKED' : 'FAILED', 'NOT_RUN');
      if (newAttempts >= 3) handleClose();
    }, 600);
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value !== '' && index < PIN_LENGTH - 1) pinRefs.current[index + 1]?.focus();
    if (index === PIN_LENGTH - 1 && value !== '') {
      verifyPin(newPin.join(''));
    }
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
        <div className="min-h-[400px] flex flex-col items-center justify-center py-2">
          {!isValidated && (
            <div className="w-full space-y-8 animate-in zoom-in-95 duration-300 text-center">
              <div className="mx-auto w-16 h-16 bg-secondary-container text-secondary rounded-full flex items-center justify-center">
                <MaterialIcon name="lock" size={32} />
              </div>
              <h3 className="text-title-large text-on-surface">Confirmer votre code PIN</h3>
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
                    placeholder={reasonField.placeholder || 'Expliquez votre décision…'}
                    supportingText={
                      reasonField.required
                        ? 'Obligatoire — la saisie du PIN se déverrouille avec le motif.'
                        : 'Optionnel'
                    }
                  />
                </div>
              )}
              {/* Pavé §2.1 : quatre cases de 64 × 76, écart de 12 px, chiffre à 34 px en
                  Archivo. Mêmes valeurs que les pavés des assistants d'attribution et de
                  retour — « un seul composant `.pin` » veut dire une seule géométrie, pas
                  seulement un même nombre de cases. Le pavé faisait ici 6 cases de 48 px
                  de haut, à 6 px d'écart. */}
              <div className="flex gap-3 justify-center">
                {pin.map((digit, idx) => (
                  <InputField
                    key={idx}
                    ref={(el) => { pinRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={isVerifying || reasonMissing}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    aria-label={`Chiffre PIN ${idx + 1}`}
                    className="w-[64px] h-[76px] px-0 text-center text-[34px] font-semibold font-['Archivo'] input-pin transition-all duration-short4 ease-emphasized"
                    containerClassName="w-auto"
                  />
                ))}
              </div>
              {attempts > 0 && <p className="text-error text-body-small">PIN incorrect ({attempts}/3)</p>}
              <Button variant="outlined" onClick={handleClose} className="w-full text-on-surface-variant">Annuler</Button>
            </div>
          )}

          {isValidated && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in duration-500">
              <div className="relative">
                <div className="w-24 h-24 bg-tertiary-container rounded-full flex items-center justify-center text-tertiary z-10 relative shadow-elevation-4">
                  <MaterialIcon name="check_circle" size={56} className="animate-in zoom-in duration-500 delay-200" />
                </div>
                <div className="absolute inset-0 bg-tertiary/20 rounded-full animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-headline-small text-on-surface">Identité confirmée</h3>
                <p className="text-on-surface-variant max-w-xs text-body-large leading-relaxed">
                  L'authentification a été validée avec succès. L'action va être exécutée.
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
