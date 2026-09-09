import React, { useState, useMemo, useEffect } from 'react';
import { EnvelopeSimple, LockSimple } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import ScreenState from '../../../components/ui/ScreenState';
import { TextArea } from '../../../components/ui/TextArea';
import { FieldLabel, FormNote, FormSection } from '../../../components/ui/FormParts';
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
    const { addUser, updateUser, users, events, locationData, serviceManagers } = useData();
    const { role: currentRole, user: currentUser } = useAccessControl();
    const currentUserId = currentUser?.id;
    const currentUserName = currentUser?.name;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        department: '',
        role: 'User' as UserRole,
        country: '',
        site: '',
        managerId: '',
        note: '',
    });

    const isEditMode = !!userId;
    const editedUser = useMemo(
        () => (userId ? users.find((entry) => entry.id === userId) : undefined),
        [userId, users],
    );

    const formatDay = (value?: string) =>
        value
            ? new Date(value).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
              })
            : undefined;

    /* « Observé — jamais saisi » : deux faits que l'application constate. La date de
       création n'est **pas un champ du compte** — elle se relève sur le journal, où
       l'événement de création la porte ; à défaut, sur la date d'invitation. Ce qui
       n'est ni écrit ni relevé s'affiche vide, plutôt qu'inventé. */
    const createdEvent = useMemo(
        () =>
            userId
                ? events
                      .filter(
                          (event) =>
                              event.targetType === 'USER' &&
                              event.targetId === userId &&
                              event.type === 'CREATE',
                      )
                      .sort(
                          (a, b) =>
                              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
                      )[0]
                : undefined,
        [events, userId],
    );

    const createdOn = formatDay(createdEvent?.timestamp) ?? formatDay(editedUser?.invitedAt) ?? '—';
    const lastAccess = formatDay(editedUser?.lastLogin) ?? 'Jamais';

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
                    note: userToEdit.managerNote?.text || '',
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
            const trimmedNote = formData.note.trim();
            const decision = updateUser(userId, {
                name: formData.name,
                phone: formData.phone,
                department: formData.department,
                role: formData.role,
                country: formData.country,
                site: formData.site,
                managerId: formData.managerId,
                /* La note de gestionnaire est datée et signée : sans auteur, une note
                   ne se discute pas — on ne sait pas à qui la reprocher ni la
                   demander. Vidée, elle disparaît plutôt que de rester en coquille. */
                managerNote: trimmedNote
                    ? {
                          text: trimmedNote,
                          authorId: currentUserId || '',
                          authorName: currentUserName || '',
                          updatedAt: new Date().toISOString(),
                      }
                    : undefined,
                avatar:
                    editedUser?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formData.name || 'User')}`,
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
                    showToast("Compte créé, mais l'invitation n'est pas partie.", 'warning');
                });

            // Notification Feedback Spécifique
            if (formData.managerId) {
                const managerName =
                    users.find((u) => u.id === formData.managerId)?.name || 'Le manager';
                // Toast étendu pour confirmer la notification
                setTimeout(() => {
                    showToast(`Compte créé, invitation envoyée à ${managerName}.`, 'success');
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

    /* **Créer un compte ne passe plus par cet écran.** 05.3 le remplace par une
       feuille de trois réponses, ouverte depuis la liste : l'adresse, le rôle, le
       site. Le reste, la personne le porte. Cet écran reste ce qu'il est devenu —
       **compléter une fiche** —, et le dit quand on y arrive sans fiche. */
    if (!isEditMode) {
        return (
            <ScreenState
                icon={EnvelopeSimple}
                title="Un compte se crée par invitation"
                description="Trois réponses suffisent — l'adresse, le rôle, le site. La personne complète le reste à sa première connexion."
                actions={
                    <Button variant="filled" onClick={onCancel}>
                        Revenir à l'équipe
                    </Button>
                }
            />
        );
    }

    return (
        <FullScreenFormLayout
            title="Modifier la fiche"
            onCancel={onCancel}
            onSave={handleSubmit}
            saveLabel="Enregistrer"
            submitButtonLocation="header"
            className="bg-background"
        >
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4">
                {/* ── Identité ─────────────────────────────────────────────────── */}
                <FormSection title="Identité">
                    <div>
                        <FieldLabel>Nom</FieldLabel>
                        <InputField
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Prénom et nom"
                            error={errors.name}
                        />
                    </div>

                    {/* **L'adresse est l'identifiant de connexion : lecture seule.**
                        La changer déplacerait le compte sans déplacer la personne —
                        et rien ne relierait plus l'ancienne connexion à la fiche. */}
                    <div>
                        <FieldLabel note="identifiant de connexion">Adresse</FieldLabel>
                        <p className="bg-surface-container text-on-surface-variant flex min-h-12 items-center gap-2.5 rounded-md px-3.5 text-[16px] leading-6">
                            <Icon glyph={LockSimple} size={18} />
                            {formData.email}
                        </p>
                    </div>

                    <div>
                        <FieldLabel note="facultatif">Téléphone</FieldLabel>
                        <InputField
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+228"
                        />
                    </div>
                </FormSection>

                {/* ── Organisation ─────────────────────────────────────────────── */}
                <FormSection title="Organisation">
                    <div className="flex gap-3">
                        <div className="min-w-0 flex-1">
                            <FieldLabel>Pays</FieldLabel>
                            <SelectField
                                name="country"
                                options={locationData.countries.map((entry) => ({
                                    value: entry,
                                    label: entry,
                                }))}
                                value={formData.country}
                                onChange={handleChange}
                                placeholder="Choisir"
                                error={errors.country}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <FieldLabel>Site</FieldLabel>
                            <SelectField
                                name="site"
                                options={availableSites.map((entry) => ({
                                    value: entry,
                                    label: entry,
                                }))}
                                value={formData.site}
                                onChange={handleChange}
                                disabled={!formData.country}
                                placeholder={formData.country ? 'Choisir' : "D'abord un pays"}
                                error={errors.site}
                            />
                        </div>
                    </div>

                    <div>
                        <FieldLabel>Service</FieldLabel>
                        <SelectField
                            name="department"
                            options={availableDepartments.map((entry) => ({
                                value: entry,
                                label: entry,
                            }))}
                            value={formData.department}
                            onChange={handleChange}
                            disabled={!formData.site}
                            placeholder={formData.site ? 'Choisir' : "D'abord un site"}
                        />
                    </div>

                    {/* Le manager est **proposé** par le service, et se change : la
                        proposition n'est pas une décision. Il était affiché dans un
                        champ désactivé, donc impossible à corriger quand le service
                        n'en portait pas. */}
                    <div>
                        <FieldLabel note="proposé par le service">Manager</FieldLabel>
                        <SelectField
                            name="managerId"
                            options={[
                                { value: '', label: 'Aucun manager' },
                                ...users
                                    .filter((entry) => entry.id !== userId)
                                    .map((entry) => ({
                                        value: entry.id,
                                        label: `${entry.name} · ${entry.department || entry.site || '—'}`,
                                    })),
                            ]}
                            value={formData.managerId}
                            onChange={handleChange}
                            placeholder="Aucun manager"
                        />
                    </div>
                </FormSection>

                {/* ── Accès ────────────────────────────────────────────────────── */}
                <FormSection title="Accès">
                    <div>
                        <FieldLabel>Rôle</FieldLabel>
                        <SelectField
                            name="role"
                            options={roles}
                            value={formData.role}
                            onChange={handleChange}
                        />
                        <FormNote>{getRoleDescription(formData.role)}</FormNote>
                    </div>

                    {/* Le code personnel ne se saisit pas ici : il se pose par la
                        personne, et se réinitialise depuis sa fiche. L'écran dit son
                        état, comme la planche. */}
                    <div>
                        <FieldLabel>Code PIN</FieldLabel>
                        <p className="bg-surface-container text-on-surface-variant flex min-h-12 items-center gap-2.5 rounded-md px-3.5 text-[16px] leading-6">
                            <Icon glyph={LockSimple} size={18} />
                            {editedUser?.pin ? 'Défini' : 'Non défini'}
                        </p>
                        <FormNote>
                            Il se réinitialise depuis la fiche. Sans lui, une remise se prouve par
                            signature.
                        </FormNote>
                    </div>
                </FormSection>

                {/* ── Note ─────────────────────────────────────────────────────── */}
                <FormSection title="Note" caption="gestionnaires seulement">
                    <TextArea
                        value={formData.note}
                        onChange={(event) =>
                            setFormData((prev) => ({ ...prev, note: event.target.value }))
                        }
                        rows={3}
                        aria-label="Note de gestionnaire"
                        placeholder="Un mot sur ce compte."
                    />
                </FormSection>

                {/* ── Observé ──────────────────────────────────────────────────── */}
                <FormSection title="Observé" caption="jamais saisi">
                    <div className="flex flex-col">
                        <div className="flex min-h-12 items-center justify-between gap-4 py-3 text-[16px] leading-6">
                            <span className="text-on-surface-variant">Créé le</span>
                            <span className="text-on-surface font-medium tabular-nums">
                                {createdOn}
                            </span>
                        </div>
                        <div className="border-outline-variant flex min-h-12 items-center justify-between gap-4 border-t py-3 text-[16px] leading-6">
                            <span className="text-on-surface-variant">Dernier accès</span>
                            <span
                                className={
                                    editedUser?.lastLogin
                                        ? 'text-on-surface font-medium tabular-nums'
                                        : 'text-text-tertiary'
                                }
                            >
                                {lastAccess}
                            </span>
                        </div>
                    </div>
                </FormSection>
            </div>
        </FullScreenFormLayout>
    );
};

export default AddUserPage;
