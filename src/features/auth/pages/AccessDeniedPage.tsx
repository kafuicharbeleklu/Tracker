
import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../../components/ui/Button';
import MaterialIcon from '../../../components/ui/MaterialIcon';

/**
 * Accès refusé — planche 17.1, quatrième état.
 *
 * L'écran précédent listait **trois causes possibles** et laissait la personne trier.
 * Le produit sait laquelle est la sienne : la vérification renvoie un motif, et c'est
 * lui qui s'affiche ici. Le motif ne passe plus par un message qui disparaît.
 */
const AccessDeniedPage: React.FC = () => {
    const { logout, accessDeniedReason } = useAuth();

    // Le motif est le titre : c'est le fait, et rien n'est plus important à lire.
    const motif = accessDeniedReason ?? "Votre compte n'a pas accès à cette application.";

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-surface text-on-surface p-6">
            <div className="w-full max-w-sm text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto">
                    <MaterialIcon name="lock" size={40} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-headline-small">{motif}</h1>
                    <p className="text-body-medium text-on-surface-variant">
                        Votre identifiant Microsoft est valide : c'est l'accès à Tracker qui ne
                        l'est pas encore. Prévenez la personne qui gère les comptes de votre
                        entité — elle peut l'ouvrir en une fois.
                    </p>
                </div>

                <Button variant="outlined" onClick={logout} className="w-full">
                    Retour à la connexion
                </Button>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
