
import React from 'react';

// Navigation
// Added 'settings' to ViewType to resolve navigation and title mapping errors
export type ViewType = 'dashboard' | 'equipment' | 'equipment_details' | 'add_equipment' | 'edit_equipment' | 'import_equipment' | 'users' | 'user_details' | 'add_user' | 'edit_user' | 'import_users' | 'approvals' | 'new_request' | 'management' | 'add_category' | 'add_model' | 'import_models' | 'category_details' | 'model_details' | 'locations' | 'import_locations' | 'audit' | 'audit_details' | 'reports' | 'assignment_wizard' | 'return_wizard' | 'finance' | 'settings' | 'admin_users';

export type UserRole = 'SuperAdmin' | 'Admin' | 'Manager' | 'User';

// --- SYSTEM SETTINGS ---
export interface AppSettings {
  // Apparence
  theme: 'light' | 'dark' | 'system';
  accentColor: 'yellow' | 'blue' | 'purple' | 'emerald' | 'orange';

  // Finances
  currency: string;
  fiscalYearStart: string;
  defaultDepreciationMethod: 'linear' | 'degressive';
  defaultDepreciationYears: number;
  salvageValuePercent: number;
  renewalThreshold: number;
  roundingRule: 'standard' | 'integer' | 'ceil';
  compactNotation: boolean; // New setting for 1K, 1M formatting
}

// --- FINANCE ---
export type FinanceExpenseType = 'Purchase' | 'License' | 'Maintenance' | 'Service' | 'Cloud';
export type FinanceExpenseStatus = 'Paid' | 'Pending' | 'Recurring';
export type ExtractionConfidence = 'high' | 'medium' | 'low';

export interface FinanceExpense {
  id: string;
  date: string;
  supplier: string;
  amount: number;
  type: FinanceExpenseType;
  status: FinanceExpenseStatus;
  description: string;
  invoiceNumber?: string;
  sourceFileName?: string;
  sourceFileId?: string;
  sourceFileUrl?: string;
  currencyCode?: string;
  extractionSource?: 'filename' | 'content' | 'hybrid';
  textSource?: 'native' | 'ocr' | 'hybrid' | 'none';
  importFingerprint?: string;
  extractionConfidence?: ExtractionConfidence;
  createdAt: string;
}

export interface FinanceExpenseInsertResult {
  ok: boolean;
  expense?: FinanceExpense;
  duplicateOf?: FinanceExpense;
  reason?: string;
}

export interface FinanceBudgetItem {
  category: string;
  type: FinanceExpenseType;
  allocated: number;
  spent: number;
}

export interface FinanceBudget {
  year: number;
  status: 'En cours' | 'Clôturé' | 'Archivé';
  totalAllocated: number;
  items: FinanceBudgetItem[];
  updatedAt: string;
  sourceFileName?: string;
}

// Entities
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: UserRole;
  avatar: string;
  lastLogin?: string;

  // Location & Hierarchy
  country?: string;
  site?: string;
  managerId?: string;
  managedCountries?: string[];

  // SharePoint Fields (merged)
  status?: 'active' | 'inactive' | 'pending';
  mustChangePassword?: boolean;
}

// SharePoint List Schema
export interface AppUser {
  id: string; // SharePoint ID
  Title: string; // Full Name
  MicrosoftEmail: string;
  FirstName?: string;
  LastName?: string;
  Role: UserRole;
  Status: 'active' | 'inactive' | 'pending';
  TemporaryPassword?: string | null;
  MustChangePassword: boolean;
  LastLoginDate?: string;
  CreatedDate: string;
  CreatedBy: string; // Email or Name
  InvitationSentDate?: string;
  Notes?: string;
}

export interface EquipmentDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: string;
  date: string;
}

export interface FinancialData {
  purchasePrice: number;
  purchaseDate: string;
  supplier?: string;
  invoiceNumber?: string;
  depreciationMethod: 'linear' | 'degressive';
  depreciationYears: number; // Duration in years
  salvageValue?: number; // Residual value
}

// 3.2 - Statuts d'attribution
export type AssignmentStatus =
  | 'NONE'                      // Disponible
  | 'RESERVED'                  // Réservé pour demande approuvée
  | 'WAITING_MANAGER_APPROVAL'  // 🆕 Admin a attribué -> En attente validation Manager
  | 'WAITING_IT_PROCESSING'     // 🆕 Validé par Manager -> En attente action IT
  | 'WAITING_DOTATION_APPROVAL' // 🆕 Sélectionné par IT -> En attente validation dotation Manager
  | 'PENDING_DELIVERY'          // Manager a validé (ou direct) -> En attente confirmation User
  | 'PENDING_RETURN'            // 🆕 Restitution initiée, en attente de traitement IT
  | 'CONFIRMED'                 // User a confirmé réception
  | 'DISPUTED';                 // User a signalé un problème

export interface Equipment {
  id: string;
  name: string;
  assetId: string;
  type: string; // Linked to Category name
  model: string;
  status:
    | 'Disponible'
    | 'Attribué'
    | 'En attente'
    | 'En réparation'
    | 'En maintenance préventive'
    | 'Retiré'
    | 'Perdu'
    | 'Réformé'
    | 'Manquant'
    | string;

  // 3.2 - Workflow Status & Traçabilité
  assignmentStatus?: AssignmentStatus;

  // Traçabilité attribution
  assignedBy?: string;      // ID Admin qui a attribué
  assignedByName?: string;  // Snapshot nom
  assignedAt?: string;      // Date attribution

  // Validation Manager (Nouveau)
  managerValidationBy?: string;
  managerValidationAt?: string;

  // Confirmation utilisateur
  confirmedBy?: string;     // ID User qui a confirmé
  confirmedAt?: string;     // Date confirmation
  handoverProof?: string;   // URL signature/photo

  // Réservation
  reservedFor?: string;     // ID Approval liée
  reservedAt?: string;

  // Litige
  disputeReason?: string;
  disputedAt?: string;

  // Restitution
  returnRequestedBy?: string;
  returnRequestedAt?: string;
  returnInspectedAt?: string;
  lastReturnCondition?: string;

  operationalStatus?: 'Actif' | 'Inactif' | 'Retiré';
  image: string;
  user?: Partial<User> | null;

  // Specs
  serialNumber?: string;
  hostname?: string; // Added hostname
  os?: string;
  ram?: string;
  storage?: string;
  securityAgents?: {
    sentinelOne: boolean;
    matrix42: boolean;
    manageEngine: boolean;
    lastCheckedAt: string;
  };

  // Financial & Dates
  financial?: FinancialData; // New Financial Object
  warrantyEnd?: string;

  // Maintenance / Repair
  repairStartDate?: string;
  repairEndDate?: string;

  // Location
  country?: string;
  site?: string;
  department?: string;

  // Notes
  notes?: string;

  // Files
  documents?: EquipmentDocument[];
}

// Management
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  iconName?: string;
  // 🆕 CONFIGURATION AMORTISSEMENT PAR DÉFAUT
  defaultDepreciation: {
    method: 'linear' | 'degressive';
    years: number;
    salvageValuePercent: number; // Ex: 10%
  };
}

export interface Model {
  id: string;
  name: string;
  type: string;
  count: number;
  image: string;
  brand?: string;
  specs?: string;
}

// 3.2 - Workflow multi-étapes pour Approval
export interface ValidationStep {
  role: 'Manager' | 'Admin' | 'CFO' | 'User'; // Qui valide
  status: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
  validatedBy?: string;   // ID validateur
  validatedAt?: string;   // Date validation
  reason?: string;        // Raison (si rejet)
}

export type ApprovalStatus =
  | 'Pending'           // Legacy
  | 'Processing'        // Legacy
  | 'WaitingManager'    // Legacy
  | 'WaitingUser'       // Legacy
  | 'WAITING_MANAGER_APPROVAL' // 🆕 Spec Phase 1
  | 'WAITING_IT_PROCESSING'    // 🆕 Spec Phase 2
  | 'WAITING_DOTATION_APPROVAL'// 🆕 Spec Phase 3
  | 'PENDING_DELIVERY'         // 🆕 Spec Phase 4
  | 'Approved'          // Legacy
  | 'Rejected'
  | 'Completed'
  | 'Cancelled'
  | 'Expired';

// 3.2 - Mise à jour Approval
export interface Approval {
  id: string;

  // 👇 DISTINCTION Demandeur/Bénéficiaire
  requesterId: string;      // Qui crée la demande
  requesterName: string;
  requesterRole: UserRole;

  beneficiaryId: string;    // Qui recevra l'équipement
  beneficiaryName: string;

  isDelegated: boolean;     // true si requesterId !== beneficiaryId

  // Détails demande
  equipmentCategory: string;
  equipmentModel?: string;
  reason: string;
  urgency: 'low' | 'normal' | 'high';
  estimatedCost?: number;   // 👈 NOUVEAU pour contrôle budgétaire

  // Workflow de validation
  validationSteps: ValidationStep[];
  currentStep: number;      // Index de l'étape en cours

  // Statut global
  status: ApprovalStatus;

  // Équipement attribué (une fois le workflow terminé ou en cours)
  assignedEquipmentId?: string;
  assignedEquipmentName?: string; // Snapshot pour affichage rapide

  // Dates
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;       // Date limite pour attribution

  // --- CHAMPS LEGACY (Maintenance UI existante) ---
  // Ces champs sont conservés temporairement pour compatibilité avec l'interface actuelle
  equipmentName?: string;
  equipmentType?: string;
  requestType?: 'Attribution' | 'Retour' | 'Réparation';
  requester?: string;
  requestDate?: string;
  image: string; // Gardé obligatoire pour l'UI
}

// Reports
export interface Report {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Audit & Locations
export interface AuditCountryStats {
  name: string;
  sites: number;
  completed: number;
  total: number;
}

export interface AuditScanPayload {
  machineName?: string;
  hostname?: string;
  assetId?: string;
  serialNumber?: string;
  os?: string;
  ram?: string;
  storage?: string;
  type?: string;
  model?: string;
  userName?: string;
  userEmail?: string;
  country?: string;
  site?: string;
  service?: string;
  scannedAt?: string;
  agents?: {
    sentinelOne?: boolean;
    matrix42?: boolean;
    manageEngine?: boolean;
  };
}

export type AuditScanResolution = 'found_in_service' | 'found_out_of_service' | 'created';

export interface AuditScanResult {
  ok: boolean;
  resolution?: AuditScanResolution;
  equipmentId?: string;
  equipmentName?: string;
  serviceMatches?: boolean;
  wasUpdated?: boolean;
  message: string;
}

// --- HISTORY & EVENTS (Phase 3) ---

export type EventType =
  | 'CREATE'           // Création équipement/utilisateur
  | 'UPDATE'           // Modification
  | 'DELETE'           // Suppression
  | 'ASSIGN'           // Attribution
  | 'ASSIGN_PENDING'   // Attribution en attente confirmation
  | 'ASSIGN_MANAGER_WAIT' // 🆕 En attente manager
  | 'ASSIGN_MANAGER_OK'   // 🆕 Validé par manager
  | 'ASSIGN_IT_PROCESSING' // 🆕 En cours de traitement IT
  | 'ASSIGN_IT_SELECTED'   // 🆕 Actif sélectionné par IT
  | 'ASSIGN_DOTATION_WAIT' // 🆕 En attente validation dotation
  | 'ASSIGN_DOTATION_OK'   // 🆕 Dotation validée
  | 'ASSIGN_CONFIRMED' // Confirmation réception
  | 'ASSIGN_DISPUTED'  // Litige réception
  | 'RETURN'           // Retour
  | 'REPAIR_START'     // Début réparation
  | 'REPAIR_END'       // Fin réparation
  | 'APPROVAL_CREATE'  // Création demande
  | 'APPROVAL_MANAGER' // Validation manager
  | 'APPROVAL_ADMIN'   // Validation admin
  | 'APPROVAL_REJECT'  // Rejet demande
  | 'LOGIN'            // Connexion
  | 'LOGOUT'           // Déconnexion
  | 'EXPORT'           // Export données
  | 'VIEW_SENSITIVE';  // Consultation données sensibles

export type TargetType = 'EQUIPMENT' | 'USER' | 'APPROVAL' | 'LOCATION' | 'SYSTEM';

export interface HistoryEvent {
  id: string;
  timestamp: string; // ISO 8601
  type: EventType;

  // Acteur (qui a fait l'action)
  actorId: string;
  actorName: string;    // Snapshot pour historique
  actorRole: UserRole;

  // Cible (sur quoi porte l'action)
  targetType: TargetType;
  targetId: string;
  targetName: string;   // Snapshot

  // Détails
  description: string;  // Description humaine
  metadata?: {          // Données techniques
    changes?: Record<string, { from: unknown; to: unknown }>; // Changements trackés
    reason?: string;    // Raison (pour rejets, etc.)
    ipAddress?: string; // IP (pour sécurité)
    location?: string;  // Localisation géographique
    [key: string]: unknown;
  };

  // Flags
  isSystem: boolean;    // Action automatique (timeout, etc.)
  isSensitive: boolean; // Données sensibles (masquer pour Users)
}

// Filtre pour récupération historique
export interface HistoryFilter {
  targetType?: TargetType;
  targetId?: string;
  actorId?: string;
  eventTypes?: EventType[];
  startDate?: string;
  endDate?: string;
  limit?: number;
}

