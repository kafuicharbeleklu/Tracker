
import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/authService';
import InputField from '../../../components/ui/InputField';
import Button from '../../../components/ui/Button';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';

const ChangePasswordPage: React.FC = () => {
    const { currentUser, logout, checkAuthStatus } = useAuth();
    const { showToast } = useToast();

    const [tempPass, setTempPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPass !== confirmPass) {
            showToast("Les nouveaux mots de passe ne correspondent pas", "error");
            return;
        }

        if (newPass.length < 8) {
            showToast("Le mot de passe doit contenir au moins 8 caractères", "error");
            return;
        }

        setIsLoading(true);
        try {
            if (!currentUser) throw new Error("No user context");

            await authService.changePassword(currentUser.id, tempPass, newPass);
            showToast("Mot de passe modifié avec succès !", "success");

            // Re-verify auth status to clear the 'mustChangePassword' flag
            await checkAuthStatus();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erreur lors du changement de mot de passe";
            showToast(message, "error");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface p-4">
            <div className="w-full max-w-md bg-surface p-8 rounded-xl shadow-elevation-2 border border-outline-variant space-y-6">

                <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                        <MaterialIcon name="lock_reset" size={32} />
                    </div>
                    <h1 className="text-headline-small">Première Connexion</h1>
                    <p className="text-body-medium text-on-surface-variant mt-2">
                        Veuillez modifier votre mot de passe temporaire pour sécuriser votre compte.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                        label="Mot de passe temporaire"
                        type="password"
                        value={tempPass}
                        onChange={(e) => setTempPass(e.target.value)}
                        placeholder="Reçu par email"
                        required
                    />

                    <div className="space-y-4 pt-2">
                        <InputField
                            label="Nouveau mot de passe"
                            type="password"
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            required
                        />
                        <InputField
                            label="Confirmer le mot de passe"
                            type="password"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            required
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button variant="outlined" type="button" onClick={logout} className="flex-1">
                            Annuler
                        </Button>
                        <Button variant="filled" type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? "Enregistrement..." : "Confirmer"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
