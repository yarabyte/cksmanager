// User & Role Types
export type Role = 
  | "Admin" 
  | "Manager" 
  | "Médecin" 
  | "Front Office" 
  | "Caisse" 
  | "Pharmacie"
  | "Commis Pharmacie"
  | "Sage femme"

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: Role
  avatar?: string
  active: boolean
}

// Patient Types
export type Gender = "M" | "F"

export interface Patient {
  id: string
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  email?: string
  gender: Gender
  address: string
  insuranceProviderId?: string
  insuranceNumber?: string
  lastVisitDate?: string
  createdAt: string
}

// Visit Types
export type VisiteStatus = 
  | "En attente" 
  | "En consultation" 
  | "Terminée" 
  | "Facturée"

export type VisiteType = 
  | "Consultation" 
  | "Urgence" 
  | "Suivi" 
  | "Contrôle"

export interface Visite {
  id: string
  patientId: string
  medicId: string
  date: string
  status: VisiteStatus
  type: VisiteType
  notes?: string
  acteIds: string[]
  createdAt: string
}

// Invoice Types
export type FactureStatus = 
  | "Payée" 
  | "Partielle" 
  | "Impayée" 
  | "En attente assureur"

export interface FactureItem {
  acteId: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Facture {
  id: string
  patientId: string
  visiteId: string
  items: FactureItem[]
  totalAmount: number
  paidAmount: number
  status: FactureStatus
  date: string
  dueDate: string
  insuranceCoverage: number
  createdAt: string
}

// Medical Act Types
export type ActeCategory = 
  | "Consultation" 
  | "Laboratoire" 
  | "Imagerie" 
  | "Chirurgie" 
  | "Soins" 
  | "Pharmacie"

export interface Acte {
  id: string
  code: string
  label: string
  category: ActeCategory
  standardPrice: number
  insuredPrice: number
  active: boolean
}

// Insurance Provider Types
export interface Assureur {
  id: string
  name: string
  logo?: string
  coverageRate: number
  contactName: string
  contactEmail: string
  contactPhone: string
  active: boolean
}

// Permission Types
export type Module =
  | "dashboard"
  | "patients"
  | "visites"
  | "feuilleCirculation"
  | "prescriptions"
  | "facturation"
  | "pharmacie"
  | "caisse"
  | "configuration"
  | "rapports"
  | "assurances"
  | "medical"
  | "planning"
  | "hospitalisation"

export type Action = "view" | "create" | "edit" | "delete"

export interface Permission {
  module: Module
  actions: Action[]
}

// Navigation Types
export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
  children?: NavItem[]
  /** Module de droits (sinon déduit de l'href). */
  module?: Module
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

/** Page sélectionnable dans le menu d'un groupe personnalisé. */
export interface PageCatalogItem {
  href: string
  label: string
  icon: string
}

/**
 * Groupe de droits personnalisé (créé par un Admin), en plus des rôles fixes.
 * Son menu latéral est une sélection manuelle de pages (pas dérivé des permissions).
 */
export interface CustomGroup {
  id: string
  label: string
  pages: string[]
  permissions: Record<Module, Action[]>
}

// Dashboard KPI Types
export interface KPIData {
  label: string
  value: number | string
  change?: number
  changeType?: "increase" | "decrease" | "neutral"
  icon: string
}

// Portefeuille (Wallet) Types
export type PaymentMethod = "Espèces" | "Carte bancaire" | "Mobile Money" | "Virement" | "Chèque"

export interface Portefeuille {
  id: string
  patientId: string
  balance: number
  createdAt: string
  updatedAt: string
}

export interface PortefeuilleTransaction {
  id: string
  portefeuilleId: string
  type: "credit" | "debit"
  amount: number
  method?: PaymentMethod
  factureId?: string
  description: string
  createdAt: string
  userId: string
}

// Activity Feed Types
export interface Activity {
  id: string
  type: "visite" | "facture" | "patient" | "prescription"
  message: string
  timestamp: string
  userId: string
}
