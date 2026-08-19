import type { 
  User, 
  Patient, 
  Visite, 
  Facture, 
  Acte, 
  Assureur, 
  Activity,
  Portefeuille,
  PortefeuilleTransaction
} from "./types"

// Users
export const users: User[] = [
  {
    id: "u1",
    firstName: "Jean-Pierre",
    lastName: "Mbarga",
    email: "jp.mbarga@cks-clinic.cm",
    role: "Admin",
    avatar: "",
    active: true,
  },
  {
    id: "u2",
    firstName: "Marie",
    lastName: "Nguemo",
    email: "m.nguemo@cks-clinic.cm",
    role: "Manager",
    avatar: "",
    active: true,
  },
  {
    id: "u3",
    firstName: "Dr. Paul",
    lastName: "Fotso",
    email: "p.fotso@cks-clinic.cm",
    role: "Médecin",
    avatar: "",
    active: true,
  },
  {
    id: "u4",
    firstName: "Dr. Carine",
    lastName: "Ekambi",
    email: "c.ekambi@cks-clinic.cm",
    role: "Médecin",
    avatar: "",
    active: true,
  },
  {
    id: "u5",
    firstName: "Sylvie",
    lastName: "Atangana",
    email: "s.atangana@cks-clinic.cm",
    role: "Front Office",
    avatar: "",
    active: true,
  },
  {
    id: "u6",
    firstName: "Georges",
    lastName: "Nkodo",
    email: "g.nkodo@cks-clinic.cm",
    role: "Caisse",
    avatar: "",
    active: true,
  },
  {
    id: "u7",
    firstName: "Florence",
    lastName: "Essomba",
    email: "f.essomba@cks-clinic.cm",
    role: "Pharmacie",
    avatar: "",
    active: true,
  },
]

// Insurance Providers
export const assureurs: Assureur[] = [
  {
    id: "ins1",
    name: "CNPS",
    coverageRate: 80,
    contactName: "Service Assurance",
    contactEmail: "assurance@cnps.cm",
    contactPhone: "+237 222 234 567",
    active: true,
  },
  {
    id: "ins2",
    name: "Activa Assurances",
    coverageRate: 70,
    contactName: "Bureau Santé",
    contactEmail: "sante@activa.cm",
    contactPhone: "+237 222 345 678",
    active: true,
  },
  {
    id: "ins3",
    name: "Chanas Assurances",
    coverageRate: 75,
    contactName: "Direction Médicale",
    contactEmail: "medical@chanas.cm",
    contactPhone: "+237 222 456 789",
    active: true,
  },
  {
    id: "ins4",
    name: "Allianz Cameroun",
    coverageRate: 85,
    contactName: "Service Clients",
    contactEmail: "clients@allianz.cm",
    contactPhone: "+237 222 567 890",
    active: true,
  },
  {
    id: "ins5",
    name: "AXA Cameroun",
    coverageRate: 80,
    contactName: "Département Santé",
    contactEmail: "sante@axa.cm",
    contactPhone: "+237 222 678 901",
    active: true,
  },
]

// Medical Acts
export const actes: Acte[] = [
  {
    id: "a1",
    code: "CONS01",
    label: "Consultation générale",
    category: "Consultation",
    standardPrice: 15000,
    insuredPrice: 10000,
    active: true,
  },
  {
    id: "a2",
    code: "CONS02",
    label: "Consultation spécialisée",
    category: "Consultation",
    standardPrice: 25000,
    insuredPrice: 18000,
    active: true,
  },
  {
    id: "a3",
    code: "LAB01",
    label: "Bilan sanguin complet",
    category: "Laboratoire",
    standardPrice: 35000,
    insuredPrice: 25000,
    active: true,
  },
  {
    id: "a4",
    code: "LAB02",
    label: "Test de glycémie",
    category: "Laboratoire",
    standardPrice: 5000,
    insuredPrice: 3500,
    active: true,
  },
  {
    id: "a5",
    code: "LAB03",
    label: "Analyse urinaire",
    category: "Laboratoire",
    standardPrice: 8000,
    insuredPrice: 5500,
    active: true,
  },
  {
    id: "a6",
    code: "IMG01",
    label: "Radiographie standard",
    category: "Imagerie",
    standardPrice: 20000,
    insuredPrice: 15000,
    active: true,
  },
  {
    id: "a7",
    code: "IMG02",
    label: "Échographie abdominale",
    category: "Imagerie",
    standardPrice: 30000,
    insuredPrice: 22000,
    active: true,
  },
  {
    id: "a8",
    code: "IMG03",
    label: "Scanner",
    category: "Imagerie",
    standardPrice: 75000,
    insuredPrice: 55000,
    active: true,
  },
  {
    id: "a9",
    code: "CHI01",
    label: "Petite chirurgie",
    category: "Chirurgie",
    standardPrice: 50000,
    insuredPrice: 35000,
    active: true,
  },
  {
    id: "a10",
    code: "SOIN01",
    label: "Pansement simple",
    category: "Soins",
    standardPrice: 5000,
    insuredPrice: 3000,
    active: true,
  },
  {
    id: "a11",
    code: "SOIN02",
    label: "Injection intramusculaire",
    category: "Soins",
    standardPrice: 3000,
    insuredPrice: 2000,
    active: true,
  },
  {
    id: "a12",
    code: "SOIN03",
    label: "Perfusion",
    category: "Soins",
    standardPrice: 15000,
    insuredPrice: 10000,
    active: true,
  },
]

// Patients
export const patients: Patient[] = [
  {
    id: "p1",
    firstName: "Emmanuel",
    lastName: "Ndongo",
    birthDate: "1985-03-15",
    phone: "+237 699 123 456",
    email: "e.ndongo@email.cm",
    gender: "M",
    address: "Quartier Bastos, Yaoundé",
    insuranceProviderId: "ins1",
    insuranceNumber: "CNPS-2024-001234",
    lastVisitDate: "2024-01-15",
    createdAt: "2023-06-10",
  },
  {
    id: "p2",
    firstName: "Béatrice",
    lastName: "Fouda",
    birthDate: "1990-07-22",
    phone: "+237 677 234 567",
    email: "b.fouda@email.cm",
    gender: "F",
    address: "Quartier Messa, Yaoundé",
    insuranceProviderId: "ins2",
    insuranceNumber: "ACT-2024-005678",
    lastVisitDate: "2024-01-14",
    createdAt: "2023-08-15",
  },
  {
    id: "p3",
    firstName: "Michel",
    lastName: "Tchana",
    birthDate: "1978-11-08",
    phone: "+237 655 345 678",
    gender: "M",
    address: "Quartier Nlongkak, Yaoundé",
    lastVisitDate: "2024-01-12",
    createdAt: "2023-04-20",
  },
  {
    id: "p4",
    firstName: "Christelle",
    lastName: "Mvondo",
    birthDate: "1995-02-28",
    phone: "+237 698 456 789",
    email: "c.mvondo@email.cm",
    gender: "F",
    address: "Quartier Omnisport, Yaoundé",
    insuranceProviderId: "ins4",
    insuranceNumber: "ALZ-2024-009012",
    lastVisitDate: "2024-01-10",
    createdAt: "2023-09-05",
  },
  {
    id: "p5",
    firstName: "Patrick",
    lastName: "Eyinga",
    birthDate: "1982-06-14",
    phone: "+237 676 567 890",
    gender: "M",
    address: "Quartier Essos, Yaoundé",
    insuranceProviderId: "ins3",
    insuranceNumber: "CHN-2024-003456",
    lastVisitDate: "2024-01-08",
    createdAt: "2023-07-12",
  },
  {
    id: "p6",
    firstName: "Yvonne",
    lastName: "Bella",
    birthDate: "1988-09-03",
    phone: "+237 654 678 901",
    email: "y.bella@email.cm",
    gender: "F",
    address: "Quartier Mokolo, Yaoundé",
    lastVisitDate: "2024-01-05",
    createdAt: "2023-05-18",
  },
  {
    id: "p7",
    firstName: "François",
    lastName: "Owona",
    birthDate: "1970-12-25",
    phone: "+237 699 789 012",
    gender: "M",
    address: "Quartier Biyem-Assi, Yaoundé",
    insuranceProviderId: "ins5",
    insuranceNumber: "AXA-2024-007890",
    lastVisitDate: "2024-01-03",
    createdAt: "2023-03-08",
  },
  {
    id: "p8",
    firstName: "Diane",
    lastName: "Mekongo",
    birthDate: "1992-04-17",
    phone: "+237 677 890 123",
    email: "d.mekongo@email.cm",
    gender: "F",
    address: "Quartier Nkolbisson, Yaoundé",
    insuranceProviderId: "ins1",
    insuranceNumber: "CNPS-2024-002345",
    lastVisitDate: "2024-01-02",
    createdAt: "2023-10-22",
  },
  {
    id: "p9",
    firstName: "Alain",
    lastName: "Biyong",
    birthDate: "1965-08-30",
    phone: "+237 655 901 234",
    gender: "M",
    address: "Quartier Nsimeyong, Yaoundé",
    lastVisitDate: "2023-12-28",
    createdAt: "2023-02-14",
  },
  {
    id: "p10",
    firstName: "Solange",
    lastName: "Ngono",
    birthDate: "1998-01-10",
    phone: "+237 698 012 345",
    email: "s.ngono@email.cm",
    gender: "F",
    address: "Quartier Mimboman, Yaoundé",
    insuranceProviderId: "ins2",
    insuranceNumber: "ACT-2024-006789",
    lastVisitDate: "2023-12-20",
    createdAt: "2023-11-30",
  },
  {
    id: "p11",
    firstName: "Hervé",
    lastName: "Ndi",
    birthDate: "1975-05-20",
    phone: "+237 676 123 456",
    gender: "M",
    address: "Quartier Emana, Yaoundé",
    insuranceProviderId: "ins4",
    insuranceNumber: "ALZ-2024-010123",
    lastVisitDate: "2023-12-15",
    createdAt: "2023-06-25",
  },
  {
    id: "p12",
    firstName: "Madeleine",
    lastName: "Abena",
    birthDate: "1983-10-12",
    phone: "+237 654 234 567",
    email: "m.abena@email.cm",
    gender: "F",
    address: "Quartier Ekounou, Yaoundé",
    lastVisitDate: "2023-12-10",
    createdAt: "2023-04-05",
  },
]

// Visits
export const visites: Visite[] = [
  {
    id: "v1",
    patientId: "p1",
    medicId: "u3",
    date: "2024-01-15T09:00:00",
    status: "Terminée",
    type: "Consultation",
    notes: "Contrôle de routine, tension artérielle normale",
    acteIds: ["a1", "a4"],
    createdAt: "2024-01-15T08:30:00",
  },
  {
    id: "v2",
    patientId: "p2",
    medicId: "u4",
    date: "2024-01-15T10:30:00",
    status: "En consultation",
    type: "Suivi",
    notes: "Suivi post-opératoire",
    acteIds: ["a2", "a10"],
    createdAt: "2024-01-15T10:00:00",
  },
  {
    id: "v3",
    patientId: "p3",
    medicId: "u3",
    date: "2024-01-15T11:00:00",
    status: "En attente",
    type: "Consultation",
    acteIds: ["a1"],
    createdAt: "2024-01-15T10:45:00",
  },
  {
    id: "v4",
    patientId: "p4",
    medicId: "u4",
    date: "2024-01-15T14:00:00",
    status: "En attente",
    type: "Contrôle",
    acteIds: ["a2", "a3"],
    createdAt: "2024-01-15T08:00:00",
  },
  {
    id: "v5",
    patientId: "p5",
    medicId: "u3",
    date: "2024-01-14T09:30:00",
    status: "Facturée",
    type: "Consultation",
    notes: "Prescription antibiotiques",
    acteIds: ["a1", "a5"],
    createdAt: "2024-01-14T09:00:00",
  },
  {
    id: "v6",
    patientId: "p6",
    medicId: "u4",
    date: "2024-01-14T11:00:00",
    status: "Facturée",
    type: "Urgence",
    notes: "Douleur abdominale aiguë, échographie prescrite",
    acteIds: ["a2", "a7"],
    createdAt: "2024-01-14T10:30:00",
  },
  {
    id: "v7",
    patientId: "p7",
    medicId: "u3",
    date: "2024-01-13T10:00:00",
    status: "Facturée",
    type: "Suivi",
    notes: "Diabète type 2, ajustement traitement",
    acteIds: ["a2", "a3", "a4"],
    createdAt: "2024-01-13T09:30:00",
  },
  {
    id: "v8",
    patientId: "p8",
    medicId: "u4",
    date: "2024-01-12T15:00:00",
    status: "Facturée",
    type: "Consultation",
    acteIds: ["a1"],
    createdAt: "2024-01-12T14:30:00",
  },
]

// Invoices
export const factures: Facture[] = [
  {
    id: "f1",
    patientId: "p5",
    visiteId: "v5",
    items: [
      { acteId: "a1", quantity: 1, unitPrice: 15000, total: 15000 },
      { acteId: "a5", quantity: 1, unitPrice: 8000, total: 8000 },
    ],
    totalAmount: 23000,
    paidAmount: 23000,
    status: "Payée",
    date: "2024-01-14",
    dueDate: "2024-01-28",
    insuranceCoverage: 17250,
    createdAt: "2024-01-14T12:00:00",
  },
  {
    id: "f2",
    patientId: "p6",
    visiteId: "v6",
    items: [
      { acteId: "a2", quantity: 1, unitPrice: 25000, total: 25000 },
      { acteId: "a7", quantity: 1, unitPrice: 30000, total: 30000 },
    ],
    totalAmount: 55000,
    paidAmount: 20000,
    status: "Partielle",
    date: "2024-01-14",
    dueDate: "2024-01-28",
    insuranceCoverage: 0,
    createdAt: "2024-01-14T14:00:00",
  },
  {
    id: "f3",
    patientId: "p7",
    visiteId: "v7",
    items: [
      { acteId: "a2", quantity: 1, unitPrice: 25000, total: 25000 },
      { acteId: "a3", quantity: 1, unitPrice: 35000, total: 35000 },
      { acteId: "a4", quantity: 1, unitPrice: 5000, total: 5000 },
    ],
    totalAmount: 65000,
    paidAmount: 0,
    status: "En attente assureur",
    date: "2024-01-13",
    dueDate: "2024-01-27",
    insuranceCoverage: 52000,
    createdAt: "2024-01-13T12:30:00",
  },
  {
    id: "f4",
    patientId: "p8",
    visiteId: "v8",
    items: [
      { acteId: "a1", quantity: 1, unitPrice: 15000, total: 15000 },
    ],
    totalAmount: 15000,
    paidAmount: 0,
    status: "Impayée",
    date: "2024-01-12",
    dueDate: "2024-01-26",
    insuranceCoverage: 12000,
    createdAt: "2024-01-12T16:00:00",
  },
  {
    id: "f5",
    patientId: "p1",
    visiteId: "v1",
    items: [
      { acteId: "a1", quantity: 1, unitPrice: 15000, total: 15000 },
      { acteId: "a4", quantity: 1, unitPrice: 5000, total: 5000 },
    ],
    totalAmount: 20000,
    paidAmount: 20000,
    status: "Payée",
    date: "2024-01-15",
    dueDate: "2024-01-29",
    insuranceCoverage: 16000,
    createdAt: "2024-01-15T11:00:00",
  },
]

// Portefeuilles (Wallets)
export const portefeuilles: Portefeuille[] = [
  {
    id: "w1",
    patientId: "p1",
    balance: 15000,
    createdAt: "2024-01-10T10:00:00",
    updatedAt: "2024-01-15T11:00:00",
  },
  {
    id: "w2",
    patientId: "p5",
    balance: 5000,
    createdAt: "2024-01-12T09:00:00",
    updatedAt: "2024-01-14T12:00:00",
  },
  {
    id: "w3",
    patientId: "p7",
    balance: 25000,
    createdAt: "2024-01-08T14:00:00",
    updatedAt: "2024-01-13T12:30:00",
  },
]

// Portefeuille Transactions
export const portefeuilleTransactions: PortefeuilleTransaction[] = [
  {
    id: "wt1",
    portefeuilleId: "w1",
    type: "credit",
    amount: 50000,
    method: "Mobile Money",
    description: "Dépôt initial",
    createdAt: "2024-01-10T10:00:00",
    userId: "u6",
  },
  {
    id: "wt2",
    portefeuilleId: "w1",
    type: "debit",
    amount: 20000,
    factureId: "f5",
    description: "Paiement facture F-f5",
    createdAt: "2024-01-15T11:00:00",
    userId: "u6",
  },
  {
    id: "wt3",
    portefeuilleId: "w1",
    type: "debit",
    amount: 15000,
    description: "Paiement médicaments",
    createdAt: "2024-01-15T11:30:00",
    userId: "u6",
  },
  {
    id: "wt4",
    portefeuilleId: "w2",
    type: "credit",
    amount: 30000,
    method: "Espèces",
    description: "Dépôt",
    createdAt: "2024-01-12T09:00:00",
    userId: "u6",
  },
  {
    id: "wt5",
    portefeuilleId: "w2",
    type: "debit",
    amount: 25000,
    factureId: "f1",
    description: "Paiement facture F-f1",
    createdAt: "2024-01-14T12:00:00",
    userId: "u6",
  },
  {
    id: "wt6",
    portefeuilleId: "w3",
    type: "credit",
    amount: 75000,
    method: "Carte bancaire",
    description: "Dépôt avance",
    createdAt: "2024-01-08T14:00:00",
    userId: "u6",
  },
  {
    id: "wt7",
    portefeuilleId: "w3",
    type: "debit",
    amount: 50000,
    description: "Paiement soins",
    createdAt: "2024-01-13T12:30:00",
    userId: "u6",
  },
]

// Activity Feed
export const activities: Activity[] = [
  {
    id: "act1",
    type: "visite",
    message: "Nouvelle visite enregistrée pour Emmanuel Ndongo",
    timestamp: "2024-01-15T09:00:00",
    userId: "u5",
  },
  {
    id: "act2",
    type: "facture",
    message: "Facture F-2024-005 payée intégralement",
    timestamp: "2024-01-15T11:30:00",
    userId: "u6",
  },
  {
    id: "act3",
    type: "patient",
    message: "Nouveau patient créé: Christelle Mvondo",
    timestamp: "2024-01-14T16:00:00",
    userId: "u5",
  },
  {
    id: "act4",
    type: "prescription",
    message: "Prescription envoyée à la pharmacie pour Patrick Eyinga",
    timestamp: "2024-01-14T12:30:00",
    userId: "u3",
  },
  {
    id: "act5",
    type: "visite",
    message: "Consultation terminée pour Yvonne Bella",
    timestamp: "2024-01-14T11:45:00",
    userId: "u4",
  },
  {
    id: "act6",
    type: "facture",
    message: "Paiement partiel reçu pour facture F-2024-002",
    timestamp: "2024-01-14T14:30:00",
    userId: "u6",
  },
]

// Helper functions
export function getPatientById(id: string): Patient | undefined {
  return patients.find(p => p.id === id)
}

export function getUserById(id: string): User | undefined {
  return users.find(u => u.id === id)
}

export function getAssureurById(id: string): Assureur | undefined {
  return assureurs.find(a => a.id === id)
}

export function getActeById(id: string): Acte | undefined {
  return actes.find(a => a.id === id)
}

export function getVisitesByPatientId(patientId: string): Visite[] {
  return visites.filter(v => v.patientId === patientId)
}

export function getFacturesByPatientId(patientId: string): Facture[] {
  return factures.filter(f => f.patientId === patientId)
}

// Portefeuille helpers
export function getPortefeuilleByPatientId(patientId: string): Portefeuille | undefined {
  return portefeuilles.find(p => p.patientId === patientId)
}

export function getPortefeuilleById(id: string): Portefeuille | undefined {
  return portefeuilles.find(p => p.id === id)
}

export function getTransactionsByPortefeuilleId(portefeuilleId: string): PortefeuilleTransaction[] {
  return portefeuilleTransactions.filter(t => t.portefeuilleId === portefeuilleId)
}

// Get factures with remaining patient balance (for caisse)
export function getFacturesWithPatientBalance(): (Facture & { patientBalance: number })[] {
  return factures
    .map(f => {
      const patientBalance = f.totalAmount - f.paidAmount - f.insuranceCoverage
      return { ...f, patientBalance }
    })
    .filter(f => f.patientBalance > 0)
}

// Current user (for demo purposes)
export const currentUser: User = users[0] // Admin by default
