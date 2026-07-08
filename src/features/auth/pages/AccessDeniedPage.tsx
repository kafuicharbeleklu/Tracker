
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import MaterialIcon from '../../../components/ui/MaterialIcon';

const AccessDeniedPage: React.FC = () => {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface p-4">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                    <MaterialIcon name="gpp_bad" size={40} />
                </div>

                <div>
                    <h1 className="text-headline-medium mb-2">Accès Refusé</h1>
                    <p className="text-body-large text-on-surface-variant">
                        Votre compte Microsoft est valide, mais vous n'avez pas l'autorisation d'accéder à cette application.
                    </p>
                </div>

                <div className="bg-surface-container p-4 rounded-md text-left text-body-medium">
                    <p className="font-medium mb-1">Causes possibles :</p>
                    <ul className="list-disc list-inside space-y-1 text-on-surface-variant">
                        <li>Votre compte n'a pas encore été activé par un administrateur.</li>
                        <li>Votre compte a été suspendu ou désactivé.</li>
                        <li>Vous n'êtes pas sur la liste des utilisateurs autorisés.</li>
                    </ul>
                </div>

                <Button variant="outlined" onClick={logout} className="w-full">
                    Retour à la connexion
                </Button>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
