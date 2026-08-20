import React, { useState, useMemo, useEffect } from 'react';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { UserRole } from '../../../types';
import { authService } from '../../../services/authService';
import InputField from '../../../components/ui/InputField';
import SelectField from '../../../components/ui/SelectField';
import { GLOSSARY } from '../../../constants/glossary';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';
import { useAccessControl } from '../../../hooks/useAccessControl';

type FormChangeEvent =
    | React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    | { target: { name: string; value: string } };

interface AddUserPageProps {
    userId?: string; // Si présent, on est en mode édition
    onCancel: () => void;
    onSave: () => void;
}

const AddUserPage: React.FC<AddUserPageProps> = ({ userId, onCancel, onSave }) => {
    const { showToast } = useToast();
    const { addUser, updateUser, users, locationData, serviceManagers } = useData();
    const { role: currentRole } = useAccessControl();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: 'User' as UserRole,
        country: '',
        site: '',
        managerId: '',
    });

    const isEditMode = !!userId;

    // Chargement des données si édition
    useEffect(() => {
        if (userId) {
            const userToEdit = users.find((u) => u.id === userId);
            if (userToEdit) {
                setFormData({
                    name: userToEdit.name,
                    email: userToEdit.email,
                    phone: userToEdit.phone || '',
                    department: userToEdit.department,
                    role: userToEdit.role,
                    country: userToEdit.country || '',
                    site: userToEdit.site || '',
                    managerId: userToEdit.managerId || '',
                });
            }
        }
    }, [userId, users]);

    // NEW: Auto-assign manager based on selected department
    useEffect(() => {
        if (formData.department && serviceManagers[formData.department]) {
            setFormData((prev) => ({
                ...prev,
                managerId: serviceManagers[formData.department],
            }));
        } else if (formData.department && !serviceManagers[formData.department]) {
            // Si le service n'a pas de manager configuré, on reset ou on laisse vide
            // Optionnel : ne rien faire si on veut laisser une valeur manuelle
            setFormData((prev) => ({ ...prev, managerId: '' }));
        }
    }, [formData.department, serviceManagers]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Cascading Logic
    const availableSites = useMemo(() => {
        return formData.country ? locationData.sites[formData.country] || [] : [];
    }, [formData.country, locationData.sites]);

    const availableDepartments = useMemo(() => {
        return formData.site ? locationData.services[formData.site] || [] : [];
    }, [formData.site, locationData.services]);

    const handleChange = (e: FormChangeEvent) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newData = { ...prev, [name]: value };
            if (name === 'country') {
                newData.site = '';
                newData.department = '';
            }
            if (name === 'site') {
                newData.department = '';
            }
            return newData;
        });
        // Clear error when field is modified
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    // Calcul du nom du manager pour l'affichage (car le champ est désactivé)
    const assignedManagerName = useMemo(() => {
        if (!formData.managerId) return '';
        const mgr = users.find((u) => u.id === formData.managerId);
        return mgr ? mgr.name : '';
    }, [formData.managerId, users]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = 'Le nom est requis';
        if (!formData.email) newErrors.email = "L'email est requis";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format email invalide';
        if (!formData.country) newErrors.country = 'Le pays est requis';
        if (!formData.site) newErrors.site = 'Le site est requis';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) {
            showToast('Veuillez corriger les erreurs dans le formulaire', 'error');
            return;
        }

        if (formData.role === 'SuperAdmin' && currentRole !== 'SuperAdmin') {
            showToast('Seul un SuperAdmin peut attribuer le rôle SuperAdmin.', 'error');
            return;
        }

        if (isEditMode && userId) {
            const decision = updateUser(userId, {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                department: formData.department,
                role: formData.role,
                country: formData.country,
                site: formData.site,
                managerId: formData.managerId,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name || 'User')}`,
            });
            if (!decision.allowed) {
                showToast(
                    decision.reason || 'Mise à jour impossible pour cet utilisateur.',
                    'error',
                );
                return;
            }
            showToast(GLOSSARY.SUCCESS_UPDATE(GLOSSARY.USER), 'success');
        } else {
            // 1. Create App DB User
            const decision = addUser({
                id: Date.now().toString(),
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                department: formData.department,
                role: formData.role,
                country: formData.country,
                site: formData.site,
                managerId: formData.managerId,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name || 'NewUser')}`,
            });
            if (!decision.allowed) {
                showToast(decision.reason || 'Création impossible pour cet utilisateur.', 'error');
                return;
            }

            // 2. Invite to Auth System
            authService
                .createUser({
                    MicrosoftEmail: formData.email,
                    FirstName: formData.name.split(' ')[0] || '',
                    LastName: formData.name.split(' ').slice(1).join(' ') || '',
                    Role: formData.role,
                    Title: formData.name,
                })
                .then(() => {
                    console.log('User invited to Auth System via authService');
                })
                .catch((err) => {
                    console.error('Failed to invite user to Auth System', err);
                    showToast(
                        "Attention: L'utilisateur a été créé localement mais l'invitation Auth a échoué.",
                        'warning',
                    );
                });

            // Notification Feedback Spécifique
            if (formData.managerId) {
                const managerName =
                    users.find((u) => u.id === formData.managerId)?.name || 'Le manager';
                // Toast étendu pour confirmer la notification
                setTimeout(() => {
                    showToast(
                        `Utilisateur créé et invitation envoyée. Notification manager transmise à ${managerName}.`,
                        'success',
                    );
                }, 800);
            } else {
                showToast('Utilisateur créé et invitation envoyée par e-mail.', 'success');
            }
        }

        onSave();
    };

    const roles = [
        { value: 'User', label: 'Utilisateur standard' },
        { value: 'Manager', label: "Manager d'équipe" },
        { value: 'Admin', label: 'Administrateur Pays' },
        ...(currentRole === 'SuperAdmin'
            ? [{ value: 'SuperAdmin', label: 'Super Administrateur' }]
            : []),
    ];

    const getRoleDescription = (role: UserRole) => {
        switch (role) {
            case 'SuperAdmin':
                return 'Accès total à tous les pays et paramètres système.';
            case 'Admin':
                return "Gère l'inventaire et les utilisateurs de ses pays assignés.";
            case 'Manager':
                return 'Peut approuver les demandes de son équipe directe.';
            default:
                return 'Accès restreint à ses propres équipements.';
        }
    };

    return (
        <FullScreenFormLayout
            title={isEditMode ? `Modifier le profil : ${formData.name}` : 'Nouveau collaborateur'}
            onCancel={onCancel}
            onSave={handleSubmit}
            saveLabel={isEditMode ? 'Mettre à jour' : 'Créer le compte'}
        >
            <div className="medium:grid-cols-2 expanded:grid-cols-3 mx-auto grid max-w-6xl grid-cols-1 gap-8">
                {/* COLONNE GAUCHE : IDENTITÉ */}
                <div className="expanded:col-span-2 space-y-6">
                    <section className="bg-surface rounded-card shadow-elevation-1 border-outline-variant border p-6">
                        <div className="border-outline-variant/30 mb-6 flex items-center gap-3 border-b pb-4">
                            <div className="bg-primary/10 text-primary rounded-md p-2">
                                <MaterialIcon name="person" size={20} />
                            </div>
                            <h2 className="text-on-surface text-title-medium font-bold">
                                Informations d'identité
                            </h2>
                        </div>

                        <div className="expanded:grid-cols-2 grid grid-cols-1 gap-6">
                            <InputField
                                label="Nom et Prénom"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ex: Deen TOURE"
                                required
                                error={errors.name}
                                icon={<MaterialIcon name="person_add" size={18} />}
                            />

                            <InputField
                                label="Adresse e-mail"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="deen.toure@tracker.app"
                                required
                                error={errors.email}
                                icon={<MaterialIcon name="mail" size={18} />}
                            />

                            <InputField
                                label="Numéro de téléphone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+221 77 000 00 00"
                                icon={<MaterialIcon name="phone" size={18} />}
                            />
                        </div>
                    </section>

                    <section className="bg-surface rounded-card shadow-elevation-1 border-outline-variant border p-6">
                        <div className="border-outline-variant/30 mb-6 flex items-center gap-3 border-b pb-4">
                            <div className="bg-secondary-container text-secondary rounded-md p-2">
                                <MaterialIcon name="location_on" size={20} />
                            </div>
                            <h2 className="text-on-surface text-title-medium font-bold">
                                Affectation géographique
                            </h2>
                        </div>

                        <div className="medium:grid-cols-2 large:grid-cols-3 grid grid-cols-1 gap-6">
                            <SelectField
                                label="Pays"
                                name="country"
                                options={locationData.countries.map((c) => ({
                                    value: c,
                                    label: c,
                                }))}
                                value={formData.country}
                                onChange={handleChange}
                                required
                                error={errors.country}
                            />

                            <SelectField
                                label="Site"
                                name="site"
                                options={availableSites.map((s) => ({ value: s, label: s }))}
                                value={formData.site}
                                onChange={handleChange}
                                disabled={!formData.country}
                                placeholder="Choisir site"
                                required
                                error={errors.site}
                            />

                            <SelectField
                                label="Service"
                                name="department"
                                options={availableDepartments.map((d) => ({ value: d, label: d }))}
                                value={formData.department}
                                onChange={handleChange}
                                disabled={!formData.site}
                                placeholder="Choisir service"
                            />

                            <div className="medium:col-span-2 large:col-span-3">
                                <InputField
                                    label="Manager direct (N+1)"
                                    name="managerId"
                                    value={
                                        formData.department
                                            ? assignedManagerName || 'Aucun manager configuré'
                                            : 'Sélectionnez un service'
                                    }
                                    disabled
                                    icon={<MaterialIcon name="account_tree" size={18} />}
                                    supportingText="Ce champ est alimenté automatiquement selon le service sélectionné."
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* COLONNE DROITE : APERÇU ET RÔLE */}
                <div className="space-y-6">
                    {/* AVATAR PREVIEW CARD */}
                    <div className="bg-surface-container-high rounded-card shadow-elevation-3 group relative overflow-hidden p-8 text-center">
                        <div className="bg-primary/10 absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="from-primary to-primary-container shadow-elevation-2 mb-4 inline-block rounded-full bg-gradient-to-tr p-1 transition-transform duration-500 group-hover:scale-105">
                                <div className="bg-surface-container-low border-on-surface h-24 w-24 overflow-hidden rounded-full border-4">
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name || 'User')}`}
                                        alt="Aperçu"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                            <h3 className="text-inverse-on-surface text-title-medium line-clamp-2 px-4 font-bold break-words">
                                {formData.name || (isEditMode ? 'Utilisateur' : 'Nouveau Profil')}
                            </h3>
                            <p className="text-on-surface-variant text-label-medium mt-1 font-black tracking-widest uppercase">
                                {formData.role}
                            </p>
                        </div>
                    </div>

                    {/* ROLE SELECTION CARD */}
                    <section className="bg-surface rounded-card shadow-elevation-1 border-outline-variant border p-6">
                        <div className="border-outline-variant/30 mb-6 flex items-center gap-3 border-b pb-4">
                            <div className="bg-tertiary-container text-tertiary rounded-md p-2">
                                <MaterialIcon name="shield" size={20} />
                            </div>
                            <h2 className="text-on-surface text-title-medium font-bold">
                                Accès Système
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <SelectField
                                label="Niveau de permissions"
                                name="role"
                                options={roles}
                                value={formData.role}
                                onChange={handleChange}
                                required
                            />

                            <div className="bg-surface-container border-outline-variant rounded-lg border p-4">
                                <div className="flex items-start gap-2">
                                    <MaterialIcon
                                        name="info"
                                        size={14}
                                        className="text-on-surface-variant mt-0.5 shrink-0"
                                    />
                                    <p className="text-body-small text-on-surface-variant leading-relaxed italic">
                                        {getRoleDescription(formData.role)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4">
                                <div className="text-label-medium text-tertiary flex items-center gap-2 font-bold">
                                    <MaterialIcon name="check_circle" size={14} />
                                    Compte actif
                                </div>
                                {isEditMode ? (
                                    <div className="text-label-medium text-secondary flex items-center gap-2 font-bold">
                                        <MaterialIcon name="sync" size={14} />
                                        Historique conservé
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-label-medium text-secondary flex items-center gap-2 font-bold">
                                            <MaterialIcon name="check_circle" size={14} />
                                            Invitation e-mail envoyée
                                        </div>
                                        {formData.managerId && (
                                            <div className="text-label-medium text-tertiary flex animate-pulse items-center gap-2 font-bold">
                                                <MaterialIcon name="check_circle" size={14} />
                                                Notification manager (Dotation)
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </FullScreenFormLayout>
    );
};

export default AddUserPage;
