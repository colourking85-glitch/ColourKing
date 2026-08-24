export type ScreenMeta = {
  id: string;
  title: string;
  titleNl: string;
  module: string;
  route: string;
};

export const MODULE_COLORS: Record<string, string> = {
  LD: 'bg-amber-900/30 text-amber-400',
  KL: 'bg-purple-900/30 text-purple-400',
  VH: 'bg-blue-900/30 text-blue-400',
  ES: 'bg-green-900/30 text-green-400',
  JB: 'bg-cyan-900/30 text-cyan-400',
  PT: 'bg-orange-900/30 text-orange-400',
  FA: 'bg-emerald-900/30 text-emerald-400',
  DO: 'bg-rose-900/30 text-rose-400',
  AP: 'bg-indigo-900/30 text-indigo-400',
  TS: 'bg-sky-900/30 text-sky-400',
  RP: 'bg-violet-900/30 text-violet-400',
  BW: 'bg-lime-900/30 text-lime-400',
  PU: 'bg-pink-900/30 text-pink-400',
  SY: 'bg-slate-700/30 text-slate-400',
};

export const SCREEN_REGISTRY: Record<string, ScreenMeta> = {
  // Dashboard
  '/app': { id: 'RP01', title: 'Dashboard', titleNl: 'Dashboard', module: 'RP', route: '/app' },

  // Leads
  '/app/leads': { id: 'LD05', title: 'Leads Inbox', titleNl: 'Leads Inbox', module: 'LD', route: '/app/leads' },
  '/app/leads/nieuw': { id: 'LD01', title: 'Create Lead', titleNl: 'Lead Aanmaken', module: 'LD', route: '/app/leads/nieuw' },
  '/app/leads/[id]': { id: 'LD10', title: 'Lead Detail', titleNl: 'Lead Detail', module: 'LD', route: '/app/leads/[id]' },

  // Customers
  '/app/klanten': { id: 'KL05', title: 'Customer List', titleNl: 'Klantenlijst', module: 'KL', route: '/app/klanten' },
  '/app/klanten/nieuw': { id: 'KL01', title: 'Create Customer', titleNl: 'Klant Aanmaken', module: 'KL', route: '/app/klanten/nieuw' },
  '/app/klanten/[id]': { id: 'KL02', title: 'Customer Detail', titleNl: 'Klantgegevens', module: 'KL', route: '/app/klanten/[id]' },

  // Vehicles
  '/app/voertuigen': { id: 'VH05', title: 'Vehicle List', titleNl: 'Voertuigenlijst', module: 'VH', route: '/app/voertuigen' },
  '/app/voertuigen/nieuw': { id: 'VH01', title: 'Create Vehicle', titleNl: 'Voertuig Aanmaken', module: 'VH', route: '/app/voertuigen/nieuw' },

  // Offers
  '/app/offertes': { id: 'ES05', title: 'Offer List', titleNl: 'Offertelijst', module: 'ES', route: '/app/offertes' },
  '/app/offertes/new': { id: 'ES01', title: 'Create Offer', titleNl: 'Offerte Aanmaken', module: 'ES', route: '/app/offertes/new' },

  // Jobs
  '/app/jobs': { id: 'JB05', title: 'Job List', titleNl: 'Opdrachtlijst', module: 'JB', route: '/app/jobs' },
  '/app/jobs/nieuw': { id: 'JB01', title: 'Create Job', titleNl: 'Opdracht Aanmaken', module: 'JB', route: '/app/jobs/nieuw' },
  '/app/jobs/[id]': { id: 'JB10', title: 'Job Detail', titleNl: 'Opdrachtdetail', module: 'JB', route: '/app/jobs/[id]' },
  '/app/jobs/board': { id: 'JB15', title: 'Job Board', titleNl: 'Werkplaatsbord', module: 'JB', route: '/app/jobs/board' },

  // Parts
  '/app/onderdelen': { id: 'PT05', title: 'Parts List', titleNl: 'Onderdelenlijst', module: 'PT', route: '/app/onderdelen' },

  // Invoices
  '/app/facturen': { id: 'FA05', title: 'Invoice List', titleNl: 'Facturenlijst', module: 'FA', route: '/app/facturen' },

  // Documents
  '/app/documenten': { id: 'DO05', title: 'Document Archive', titleNl: 'Documentarchief', module: 'DO', route: '/app/documenten' },

  // Appointments
  '/app/afspraken': { id: 'AP05', title: 'Appointment Calendar', titleNl: 'Afsprakenkalender', module: 'AP', route: '/app/afspraken' },

  // Tasks & Planning
  '/app/planning': { id: 'TS10', title: 'Timesheet / Planner', titleNl: 'Werkplanning', module: 'TS', route: '/app/planning' },

  // Reports
  '/app/rapportage': { id: 'RP10', title: 'Reports', titleNl: 'Rapportage', module: 'RP', route: '/app/rapportage' },

  // VAT
  '/app/btw': { id: 'BW05', title: 'VAT Dashboard', titleNl: 'BTW Dashboard', module: 'BW', route: '/app/btw' },

  // Purchases
  '/app/inkoop': { id: 'PU05', title: 'Purchase Register', titleNl: 'Inkoopregister', module: 'PU', route: '/app/inkoop' },

  // Settings
  '/app/instellingen': { id: 'SY01', title: 'Settings', titleNl: 'Instellingen', module: 'SY', route: '/app/instellingen' },
};

export function getScreen(pathname: string): ScreenMeta | undefined {
  return SCREEN_REGISTRY[pathname];
}

export function getScreenById(id: string): ScreenMeta | undefined {
  return Object.values(SCREEN_REGISTRY).find((s) => s.id === id);
}

export function searchScreens(query: string): ScreenMeta[] {
  const q = query.toLowerCase();
  return Object.values(SCREEN_REGISTRY).filter(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.titleNl.toLowerCase().includes(q)
  );
}
