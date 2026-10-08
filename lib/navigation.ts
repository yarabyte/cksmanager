import type { CustomGroup, PageCatalogItem, Role, NavGroup, NavItem } from "./types"
import { hasPermissionWithMatrixAny } from "./permissions"
import { ALL_ROLES } from "./permissions-matrix"
import type { PermissionMatrix } from "./permissions-matrix"
import {
  moduleForPathname,
  rolesAlwaysCanViewBac,
  rolesAlwaysCanViewPatients,
} from "./permissions-access"

const caisseNavChildren: NavItem[] = [
  { label: "Caisse", href: "/caisse", icon: "Wallet" },
  { label: "Clôture", href: "/cloture", icon: "Lock" },
  { label: "Historique", href: "/cloture/historique", icon: "FileText" },
  { label: "Journal de caisse", href: "/caisse/journal", icon: "BookOpen" },
]

const patientsNavItem: NavItem = {
  label: "Patients",
  href: "/patients",
  icon: "Users",
}

const caisseNavItem: NavItem = {
  label: "Gestion de la caisse",
  href: "/caisse",
  icon: "Wallet",
  children: caisseNavChildren,
}

const caisseNavItemAdmin: NavItem = {
  ...caisseNavItem,
  children: [
    caisseNavChildren[0]!,
    { label: "Versements", href: "/caisse/versements", icon: "ArrowUpFromLine" },
    ...caisseNavChildren.slice(1),
  ],
}

const gynecologieNavItem: NavItem = {
  label: "Gynécologie",
  href: "/medical/gynecologie/observation-gynecologique",
  icon: "Flower2",
  children: [
    {
      label: "Observation gynécologique",
      href: "/medical/gynecologie/observation-gynecologique",
      icon: "Flower2",
    },
    {
      label: "Observation obstétricale",
      href: "/medical/gynecologie/observation-obstetricale",
      icon: "Baby",
    },
  ],
}

const medicalNavItems: NavItem[] = [
  { label: "Paramètres", href: "/medical/parametres", icon: "Activity" },
  { label: "Antécédents", href: "/medical/antecedents", icon: "FolderHeart" },
  gynecologieNavItem,
  { label: "Salle d'attente", href: "/medical/salle-attente", icon: "Clock" },
]

const configurationChildrenBase: NavItem[] = [
  { label: "Actes médicaux", href: "/configuration/actes", icon: "FileText" },
  { label: "Assureurs", href: "/configuration/assureurs", icon: "Building2" },
  {
    label: "Catalogue pharmacie",
    href: "/configuration/pharmacie",
    icon: "Package",
  },
  { label: "Kits actes & pharma", href: "/configuration/kits", icon: "LayoutGrid" },
  { label: "Paramètres clinique", href: "/configuration/parametres", icon: "Settings" },
]

function configurationNavItem(extraChildren: NavItem[] = []): NavItem {
  return {
    label: "Configuration",
    href: "/configuration/actes",
    icon: "Settings",
    children: [...configurationChildrenBase, ...extraChildren],
  }
}

/** Fusionne les menus de plusieurs rôles (union des entrées). */
export function getNavigationForRoles(roles: Role[]): NavGroup[] {
  if (roles.length === 0) return getNavigationForRole("Front Office")
  if (roles.length === 1) return getNavigationForRole(roles[0]!)

  const groupLabels: string[] = []
  const groupItems = new Map<string, Map<string, NavItem>>()

  for (const role of roles) {
    for (const group of getNavigationForRole(role)) {
      const label = group.label ?? ""
      if (!groupItems.has(label)) {
        groupItems.set(label, new Map())
        groupLabels.push(label)
      }
      const items = groupItems.get(label)!
      for (const item of group.items) {
        const existing = items.get(item.href)
        if (!existing) {
          items.set(item.href, { ...item, children: item.children ? [...item.children] : undefined })
          continue
        }
        if (item.children?.length) {
          const childMap = new Map(
            (existing.children ?? []).map((c) => [c.href, c]),
          )
          for (const child of item.children) {
            if (!childMap.has(child.href)) childMap.set(child.href, child)
          }
          existing.children = [...childMap.values()]
        }
      }
    }
  }

  return groupLabels.map((label) => ({
    label: label || undefined,
    items: [...(groupItems.get(label)?.values() ?? [])],
  }))
}

// Navigation menu structure per role
export function getNavigationForRole(role: Role): NavGroup[] {
  const baseNav: NavGroup[] = [
    {
      items: [
        {
          label: "Tableau de bord",
          href: "/dashboard",
          icon: "LayoutDashboard",
        },
      ],
    },
  ]

  switch (role) {
    case "Admin":
      return [
        ...baseNav,
        {
          label: "Gestion",
          items: [
            patientsNavItem,
            { label: "Visites", href: "/visites", icon: "Stethoscope" },
            {
              label: "Feuille de circulation",
              href: "/feuilles-circulation",
              icon: "ScrollText",
              module: "feuilleCirculation",
            },
            {
              label: "Prescriptions",
              href: "/prescriptions",
              icon: "ClipboardList",
            },
            {
              label: "Hospitalisation",
              href: "/hospitalisation",
              icon: "BedDouble",
              module: "hospitalisation",
            },
            { label: "Facturation", href: "/facturation", icon: "Receipt", children: [
              { label: "Factures", href: "/facturation", icon: "Receipt" },
              { label: "Avoirs", href: "/facturation/avoirs", icon: "Undo2" },
              { label: "Bac à facture", href: "/facturation/bac", icon: "Inbox" },
              { label: "Bordereaux", href: "/facturation/bordereaux", icon: "FileText" },
              { label: "Recouvrement", href: "/facturation/recouvrement", icon: "CreditCard" },
              { label: "Payé", href: "/facturation/paye", icon: "ClipboardCheck" },
            ] },
            {
              label: "Pharmacie",
              href: "/pharmacie/stock",
              icon: "Pill",
              children: [
                { label: "Stock", href: "/pharmacie/stock", icon: "Package" },
                { label: "Approvisionnements", href: "/pharmacie/approvisionnements", icon: "Truck" },
                { label: "Magasins", href: "/pharmacie/magasins", icon: "Warehouse" },
                { label: "Pharmacies", href: "/pharmacie/officines", icon: "Pill" },
                { label: "Transferts", href: "/pharmacie/transferts", icon: "ArrowLeftRight" },
                { label: "Sorties", href: "/pharmacie/sorties", icon: "PackageCheck" },
                { label: "Retours", href: "/pharmacie/retours", icon: "Undo2" },
              ],
            },
            caisseNavItemAdmin,
            { label: "Rapports", href: "/rapports", icon: "BarChart3" },
            configurationNavItem([
              { label: "Postes de caisse", href: "/configuration/caisses", icon: "Wallet" },
              { label: "Utilisateurs", href: "/configuration/utilisateurs", icon: "UserCog" },
            ]),
          ],
        },
        {
          label: "Médical",
          items: medicalNavItems,
        },
      ]

    case "Manager":
      return [
        ...baseNav,
        {
          label: "Gestion",
          items: [
            patientsNavItem,
            { label: "Visites", href: "/visites", icon: "Stethoscope" },
            {
              label: "Feuille de circulation",
              href: "/feuilles-circulation",
              icon: "ScrollText",
              module: "feuilleCirculation",
            },
            {
              label: "Prescriptions",
              href: "/prescriptions",
              icon: "ClipboardList",
            },
            {
              label: "Hospitalisation",
              href: "/hospitalisation",
              icon: "BedDouble",
              module: "hospitalisation",
            },
            { label: "Facturation", href: "/facturation", icon: "Receipt", children: [
              { label: "Factures", href: "/facturation", icon: "Receipt" },
              { label: "Avoirs", href: "/facturation/avoirs", icon: "Undo2" },
              { label: "Bac à facture", href: "/facturation/bac", icon: "Inbox" },
              { label: "Bordereaux", href: "/facturation/bordereaux", icon: "FileText" },
              { label: "Recouvrement", href: "/facturation/recouvrement", icon: "CreditCard" },
              { label: "Payé", href: "/facturation/paye", icon: "ClipboardCheck" },
            ] },
            {
              label: "Pharmacie",
              href: "/pharmacie/stock",
              icon: "Pill",
              children: [
                { label: "Stock", href: "/pharmacie/stock", icon: "Package" },
                { label: "Approvisionnements", href: "/pharmacie/approvisionnements", icon: "Truck" },
                { label: "Magasins", href: "/pharmacie/magasins", icon: "Warehouse" },
                { label: "Pharmacies", href: "/pharmacie/officines", icon: "Pill" },
                { label: "Transferts", href: "/pharmacie/transferts", icon: "ArrowLeftRight" },
                { label: "Sorties", href: "/pharmacie/sorties", icon: "PackageCheck" },
                { label: "Retours", href: "/pharmacie/retours", icon: "Undo2" },
              ],
            },
            caisseNavItem,
            { label: "Rapports", href: "/rapports", icon: "BarChart3" },
            configurationNavItem(),
          ],
        },
        {
          label: "Médical",
          items: medicalNavItems,
        },
      ]

    case "Médecin":
      return [
        ...baseNav,
        {
          label: "Médical",
          items: medicalNavItems,
        },
      ]

    case "Sage femme":
      return [
        ...baseNav,
        {
          label: "Suivi",
          items: [
            patientsNavItem,
            { label: "Visites", href: "/visites", icon: "Stethoscope" },
            {
              label: "Hospitalisation",
              href: "/hospitalisation",
              icon: "BedDouble",
              module: "hospitalisation",
            },
            {
              label: "Feuille de circulation",
              href: "/feuilles-circulation",
              icon: "ScrollText",
              module: "feuilleCirculation",
            },
            { label: "Prescriptions", href: "/prescriptions", icon: "ClipboardList" },
          ],
        },
        {
          label: "Médical",
          items: medicalNavItems,
        },
      ]

    case "Front Office":
      return [
        ...baseNav,
        {
          label: "Accueil",
          items: [
            patientsNavItem,
            { label: "Rendez-vous", href: "/rendez-vous", icon: "CalendarCheck" },
            { label: "Visites", href: "/visites", icon: "UserPlus" },
            {
              label: "Feuille de circulation",
              href: "/feuilles-circulation",
              icon: "ScrollText",
              module: "feuilleCirculation",
            },
            { label: "Bac à facture", href: "/facturation/bac", icon: "Inbox" },
          ],
        },
      ]

    case "Caisse":
      return [
        ...baseNav,
        {
          label: "Encaissements",
          items: [
            patientsNavItem,
            caisseNavItem,
            { label: "Factures", href: "/facturation", icon: "Receipt", children: [
              { label: "Factures", href: "/facturation", icon: "Receipt" },
              { label: "Avoirs", href: "/facturation/avoirs", icon: "Undo2" },
              { label: "Bac à facture", href: "/facturation/bac", icon: "Inbox" },
              { label: "Recouvrement", href: "/facturation/recouvrement", icon: "CreditCard" },
              { label: "Payé", href: "/facturation/paye", icon: "ClipboardCheck" },
            ] },
            { label: "Assurances", href: "/assurances", icon: "Shield" },
          ],
        },
      ]

    case "Pharmacie":
      return [
        ...baseNav,
        {
          label: "Pharmacie",
          items: [
            { label: "Stock", href: "/pharmacie/stock", icon: "Package" },
            { label: "Approvisionnements", href: "/pharmacie/approvisionnements", icon: "Truck" },
            { label: "Magasins", href: "/pharmacie/magasins", icon: "Warehouse" },
            { label: "Pharmacies", href: "/pharmacie/officines", icon: "Pill" },
            { label: "Transferts", href: "/pharmacie/transferts", icon: "ArrowLeftRight" },
            { label: "Sorties", href: "/pharmacie/sorties", icon: "PackageCheck" },
            { label: "Retours", href: "/pharmacie/retours", icon: "Undo2" },
          ],
        },
      ]

    case "Commis Pharmacie":
      return [
        ...baseNav,
        {
          label: "Dispensation",
          items: [
            { label: "Sorties produits", href: "/pharmacie/sorties", icon: "PackageCheck" },
            { label: "Retours patients", href: "/pharmacie/retours", icon: "Undo2" },
          ],
        },
      ]

    default:
      return baseNav
  }
}

function navHasHref(groups: NavGroup[], href: string): boolean {
  return groups.some((group) =>
    group.items.some(
      (item) =>
        item.href === href ||
        (item.children ?? []).some((child) => child.href === href),
    ),
  )
}

/** Retire les items (et sous-items) dont le module de droits n'est pas autorisé pour ces rôles. */
export function filterNavGroupsByPermissions(
  groups: NavGroup[],
  matrix: PermissionMatrix,
  roles: Role[],
): NavGroup[] {
  const isAllowed = (item: NavItem) => {
    if (item.href === "/caisse/versements" && !roles.includes("Admin")) return false
    if (
      (item.href === "/patients" || item.href.startsWith("/patients/")) &&
      rolesAlwaysCanViewPatients(roles)
    ) {
      return true
    }
    if (
      (item.href === "/facturation/bac" || item.href.startsWith("/facturation/bac/")) &&
      rolesAlwaysCanViewBac(roles)
    ) {
      return true
    }
    const module = item.module ?? moduleForPathname(item.href)
    if (!module) return true
    return hasPermissionWithMatrixAny(matrix, roles, module, "view")
  }

  const filtered = groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter(isAllowed)
        .map((item) =>
          item.children
            ? { ...item, children: item.children.filter(isAllowed) }
            : item,
        ),
    }))
    .filter((group) => group.items.length > 0)

  if (
    !hasPermissionWithMatrixAny(matrix, roles, "patients", "view") ||
    navHasHref(filtered, "/patients")
  ) {
    return filtered
  }

  const insert = { ...patientsNavItem }
  if (filtered.length === 0) {
    return [{ items: [insert] }]
  }

  const firstIsDashboardOnly = filtered[0]!.items.every(
    (item) => item.href === "/dashboard",
  )
  if (firstIsDashboardOnly && filtered.length === 1) {
    return [...filtered, { label: "Accueil", items: [insert] }]
  }

  const targetIndex = firstIsDashboardOnly && filtered.length > 1 ? 1 : 0
  return filtered.map((group, i) =>
    i === targetIndex ? { ...group, items: [insert, ...group.items] } : group,
  )
}

/** Catalogue de toutes les pages existantes (dédupliquées par href), pour composer le menu d'un groupe personnalisé. */
export const PAGE_CATALOG: PageCatalogItem[] = (() => {
  const seen = new Map<string, PageCatalogItem>()
  for (const role of ALL_ROLES) {
    for (const group of getNavigationForRole(role)) {
      for (const item of group.items) {
        if (!seen.has(item.href)) {
          seen.set(item.href, { href: item.href, label: item.label, icon: item.icon })
        }
        for (const child of item.children ?? []) {
          if (!seen.has(child.href)) {
            seen.set(child.href, {
              href: child.href,
              label: `${item.label} — ${child.label}`,
              icon: child.icon,
            })
          }
        }
      }
    }
  }
  return [...seen.values()].filter((p) => p.href !== "/caisse/versements")
})()

/** Menu latéral d'un groupe personnalisé : baseNav + une sélection manuelle de pages. */
export function getNavigationForCustomGroup(group: Pick<CustomGroup, "label" | "pages">): NavGroup[] {
  const pageSet = new Set(group.pages)
  const items = PAGE_CATALOG.filter((p) => pageSet.has(p.href))
  if (items.length === 0) return baseNavGroups()
  return [
    ...baseNavGroups(),
    {
      label: group.label,
      items: items.map((p) => ({ label: p.label, href: p.href, icon: p.icon })),
    },
  ]
}

function baseNavGroups(): NavGroup[] {
  return [
    {
      items: [
        {
          label: "Tableau de bord",
          href: "/dashboard",
          icon: "LayoutDashboard",
        },
      ],
    },
  ]
}

// Breadcrumb mapping
export const breadcrumbLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  medical: "Médical",
  "salle-attente": "Salle d'attente",
  antecedents: "Antécédents",
  gynecologie: "Gynécologie",
  "observation-gynecologique": "Observation gynécologique",
  "observation-obstetricale": "Observation obstétricale",
  voir: "Voir la fiche",
  patients: "Patients",
  visites: "Visites",
  "feuilles-circulation": "Feuille de circulation",
  facturation: "Facturation",
  bac: "Bac à facture",
  bordereaux: "Bordereaux assureurs",
  recouvrement: "Recouvrement",
  paye: "Payé",
  avoirs: "Avoirs",
  pharmacie: "Pharmacie",
  stock: "Stock",
  approvisionnements: "Approvisionnements",
  magasins: "Magasins",
  officines: "Pharmacies",
  transferts: "Transferts",
  sorties: "Sorties",
  "medicaments-sortis": "Médicaments sortis",
  historique: "Historique",
  retours: "Retours",
  caisse: "Caisse",
  versements: "Versements",
  journal: "Journal de caisse",
  configuration: "Configuration",
  actes: "Actes médicaux",
  assureurs: "Assureurs",
  parametres: "Paramètres clinique",
  utilisateurs: "Utilisateurs",
  "formes-galeniques": "Formes galéniques",
  conditionnements: "Conditionnements",
  fournisseurs: "Fournisseurs",
  produits: "Produits",
  kits: "Kits",
  rapports: "Rapports",
  prescriptions: "Prescriptions",
  hospitalisation: "Hospitalisation",
  planning: "Planning",
  "rendez-vous": "Rendez-vous",
  encaissements: "Encaissements",
  assurances: "Assurances",
  cloture: "Clôture",
  caisses: "Postes de caisse",
  ouverture: "Ouverture caisse",
  versement: "Versement",
  dispensation: "Dispensation",
  commandes: "Commandes",
  inventaire: "Inventaire",
  composants: "Composants",
  notifications: "Notifications",
}
