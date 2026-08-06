import React, { useState, useMemo } from 'react';

import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import SelectField from '../../../components/ui/SelectField';
import { TextArea } from '../../../components/ui/TextArea';
import { GLOSSARY, getCategoryLabel } from '../../../constants/glossary';
import { approvalRequiresManagerGate } from '../../../lib/businessRules';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { FullScreenFormLayout } from '../../../components/layout/FullScreenFormLayout';

const NewRequestPage = () => {
    const { navigate } = useAppNavigation();
    const { addApproval, users, categories } = useData();
    const { showToast } = useToast();
    const { user: currentUser, role } = useAccessControl();

    const [formData, setFormData] = useState({
        beneficiaryId: currentUser?.id || '', // Default to self
        category: '',
        reason: '',
        urgency: 'normal' as 'low' | 'normal' | 'high',
    });

    // Les options viennent du catalogue, jamais d'une liste écrite ici : une valeur
    // absente des catégories produit un équipement que rien ne joint — ni icône, ni
    // amortissement, ni filtre. C'était le cas de « Headset » et « Autre ».
    const categoryOptions = useMemo(
        () =>
            categories
                // Un type non attribuable ne se remet pas en main propre : il n'y a
                // rien à demander (planche 06.4, arbitrage `assignable` du 05/08).
                .filter((category) => category.assignable)
                .map((category) => ({ value: category.name, label: getCategoryLabel(category.name) }))
                .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
        [categories]
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Audit 14H: Populate potential beneficiaries based on role
    const potentialBeneficiaries = useMemo(() => {
        if (!currentUser) return [];

        const selfOption = { value: currentUser.id, label: 'Moi-même' };

        if (role === 'User') return [selfOption];

        if (role === 'Manager') {
            // Managers see their direct reports
            const team = users.filter(u => u.managerId === currentUser.id).map(u => ({
                value: u.id,
                label: u.name
            }));
            return [selfOption, ...team];
        }

        if (role === 'Admin' || role === 'SuperAdmin') {
            // Admins see everyone
            const all = users.map(u => ({
                value: u.id,
                label: u.name
            }));
            // Avoid duplicate self
            return all.filter(u => u.value !== currentUser.id).concat([selfOption]);
        }

        return [selfOption];
    }, [users, currentUser, role]);

    const selectedBeneficiary = users.find(u => u.id === formData.beneficiaryId) || currentUser;

    // Find manager name of the BENEFICIARY (not necessarily the requester)
    const beneficiaryManager = selectedBeneficiary?.managerId ? users.find(u => u.id === selectedBeneficiary.managerId) : null;

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.category) {
            newErrors.category = GLOSSARY.ERROR_REQUIRED;
        }

        if (!formData.reason.trim()) {
            newErrors.reason = 'Dites ce que vous avez et ce qui ne va plus.';
        } else if (formData.reason.length < 20) {
            // Le seuil reste, son message non : une règle qu'on découvre en la ratant
            // est une règle mal placée (planche 06.4).
            newErrors.reason = 'Une phrase suffit : ce que vous avez, et ce qui ne va plus.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !currentUser || !selectedBeneficiary) return;

        setIsSubmitting(true);

        // Simulate delay
        setTimeout(() => {
            const isDelegated = currentUser.id !== selectedBeneficiary.id;
            // Routage §9.9 : sans manager-du-bénéficiaire distinct du demandeur
            // (bénéficiaire sans manager, ou déléguée soumise par son manager),
            // la demande part directement au traitement IT — c'est ce que
            // l'encart sous le formulaire promet.
            const requiresManagerGate = approvalRequiresManagerGate(
                {
                    requesterId: currentUser.id,
                    beneficiaryId: selectedBeneficiary.id,
                    beneficiaryName: selectedBeneficiary.name,
                },
                users,
            );

            addApproval({
                // Mandatory New Fields
                requesterId: currentUser.id,
                requesterName: currentUser.name,
                requesterRole: currentUser.role,

                beneficiaryId: selectedBeneficiary.id,
                beneficiaryName: selectedBeneficiary.name,

                isDelegated: isDelegated,

                equipmentCategory: formData.category,
                reason: formData.reason,
                urgency: formData.urgency,

                status: requiresManagerGate ? 'WAITING_MANAGER_APPROVAL' : 'WAITING_IT_PROCESSING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),

                // Legacy Fields (kept for UI compatibility)
                requester: currentUser.name,
                equipmentName: `Demande: ${formData.category}`,
                equipmentType: formData.category,
                requestType: 'Attribution',
                requestDate: 'Aujourd\'hui',
                image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=100&h=100&fit=crop'
            });

            const successMsg = isDelegated
                ? `Demande créée pour ${selectedBeneficiary.name} avec succès`
                : requiresManagerGate
                    ? 'Votre demande a été transmise à votre manager'
                    : "Votre demande a été transmise à l'équipe IT";

            showToast(successMsg, 'success');
            navigate('/approvals');
            setIsSubmitting(false);
        }, 800);
    };

    return (
        <FullScreenFormLayout
            title="Demander un équipement"
            onCancel={() => navigate('/approvals')}
            onSave={handleSubmit}
            saveLabel={isSubmitting ? 'Envoi en cours' : 'Envoyer la demande'}
            isSaving={isSubmitting}
        >
            <div className="max-w-xl mx-auto">
                <div className="bg-surface rounded-card border border-outline-variant p-6 shadow-elevation-1 space-y-6">

                    {/* Audit 14H: Beneficiary Selection */}
                    {(role === 'Manager' || role === 'Admin' || role === 'SuperAdmin') && (
                        <SelectField
                            label="Pour qui est cette demande ?"
                            name="beneficiaryId"
                            options={potentialBeneficiaries}
                            value={formData.beneficiaryId}
                            onChange={(e) => setFormData({ ...formData, beneficiaryId: e.target.value })}
                            required
                        />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <SelectField
                            label="Type d'équipement"
                            name="category"
                            options={categoryOptions}
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            error={errors.category}
                            required
                        />

                        <SelectField
                            label="Urgence"
                            name="urgency"
                            // Deux crans, pas trois : relevé dans `ApprovalRow`, seule
                            // « Urgente » a un effet — « Basse » et « Normale » rendent
                            // identiquement partout (planche 06.4).
                            options={[
                                { value: 'normal', label: 'Normale' },
                                { value: 'high', label: 'Urgente' },
                            ]}
                            value={formData.urgency}
                            onChange={(e) => setFormData({ ...formData, urgency: e.target.value as 'low' | 'normal' | 'high' })}
                        />
                    </div>

                    <TextArea
                        label="Raison de la demande"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        error={errors.reason}
                        placeholder="Ex: Mon ordinateur actuel est trop lent pour mes tâches quotidiennes..."
                        rows={3}
                        required
                    />

                    <div className="p-4 bg-primary-container/40 border border-primary/10 rounded-lg">
                        <p className="text-body-medium text-on-surface">
                            {/* Un émoji est un dessin qu'on n'a pas choisi (registre §2.34). */}
                            Demande pour <strong>{selectedBeneficiary?.name}</strong>.
                            {beneficiaryManager && beneficiaryManager.id !== currentUser?.id
                                ? <span> Elle part à <strong>{beneficiaryManager.name}</strong>, qui la validera.</span>
                                : <span> Elle part directement à l'informatique.</span>
                            }
                        </p>
                    </div>
                </div>
            </div>
        </FullScreenFormLayout>
    );
};

export default NewRequestPage;
