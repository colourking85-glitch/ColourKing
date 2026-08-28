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
  BK: 'bg-teal-900/30 text-teal-400',
  IN: 'bg-yellow-900/30 text-yellow-400',
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
  '/app/klanten/[id]/bewerken': { id: 'KL03', title: 'Edit Customer', titleNl: 'Klant Bewerken', module: 'KL', route: '/app/klanten/[id]/bewerken' },

  // Vehicles
  '/app/voertuigen': { id: 'VH05', title: 'Vehicle List', titleNl: 'Voertuigenlijst', module: 'VH', route: '/app/voertuigen' },
  '/app/voertuigen/nieuw': { id: 'VH01', title: 'Create Vehicle', titleNl: 'Voertuig Aanmaken', module: 'VH', route: '/app/voertuigen/nieuw' },
  '/app/voertuigen/[id]': { id: 'VH10', title: 'Vehicle Detail', titleNl: 'Voertuigdetail', module: 'VH', route: '/app/voertuigen/[id]' },

  // Offers
  '/app/offertes': { id: 'ES05', title: 'Offer List', titleNl: 'Offertelijst', module: 'ES', route: '/app/offertes' },
  '/app/offertes/nieuw': { id: 'ES01', title: 'Create Offer', titleNl: 'Offerte Aanmaken', module: 'ES', route: '/app/offertes/nieuw' },
  '/app/offertes/[id]': { id: 'ES10', title: 'Offer Detail', titleNl: 'Offertedetail', module: 'ES', route: '/app/offertes/[id]' },

  // Jobs
  '/app/jobs': { id: 'JB05', title: 'Job List', titleNl: 'Opdrachtlijst', module: 'JB', route: '/app/jobs' },
  '/app/jobs/nieuw': { id: 'JB01', title: 'Create Job', titleNl: 'Opdracht Aanmaken', module: 'JB', route: '/app/jobs/nieuw' },
  '/app/jobs/[id]': { id: 'JB10', title: 'Job Detail', titleNl: 'Opdrachtdetail', module: 'JB', route: '/app/jobs/[id]' },
  '/app/jobs/board': { id: 'JB15', title: 'Job Board', titleNl: 'Werkplaatsbord', module: 'JB', route: '/app/jobs/board' },

  // Parts
  '/app/onderdelen': { id: 'PT05', title: 'Parts List', titleNl: 'Onderdelenlijst', module: 'PT', route: '/app/onderdelen' },
  '/app/onderdelen/nieuw': { id: 'PT01', title: 'Create Part', titleNl: 'Onderdeel Aanmaken', module: 'PT', route: '/app/onderdelen/nieuw' },

  // Invoices
  '/app/facturen': { id: 'FA05', title: 'Invoice List', titleNl: 'Facturenlijst', module: 'FA', route: '/app/facturen' },
  '/app/facturen/nieuw': { id: 'FA01', title: 'Create Invoice', titleNl: 'Factuur Aanmaken', module: 'FA', route: '/app/facturen/nieuw' },
  '/app/facturen/[id]': { id: 'FA10', title: 'Invoice Detail', titleNl: 'Factuurdetail', module: 'FA', route: '/app/facturen/[id]' },

  // Documents
  '/app/documenten': { id: 'DO05', title: 'Document Archive', titleNl: 'Documentarchief', module: 'DO', route: '/app/documenten' },
  '/app/documenten/[id]': { id: 'DO03', title: 'Document Detail', titleNl: 'Documentdetail', module: 'DO', route: '/app/documenten/[id]' },
  '/app/reparatieopdracht/[id]': { id: 'DO20', title: 'Repair Order', titleNl: 'Reparatieopdracht', module: 'DO', route: '/app/reparatieopdracht/[id]' },
  '/app/afleverbon': { id: 'DO21', title: 'Handover Notes', titleNl: 'Afleverbonnen', module: 'DO', route: '/app/afleverbon' },
  '/app/afleverbon/nieuw': { id: 'DO21', title: 'Create Handover', titleNl: 'Afleverbon Aanmaken', module: 'DO', route: '/app/afleverbon/nieuw' },
  '/app/afleverbon/[id]': { id: 'DO21', title: 'Handover Note', titleNl: 'Afleverbon', module: 'DO', route: '/app/afleverbon/[id]' },

  // Inspections
  '/app/inspecties': { id: 'IN05', title: 'Inspection List', titleNl: 'Inspectielijst', module: 'IN', route: '/app/inspecties' },
  '/app/inspecties/nieuw': { id: 'IN01', title: 'Create Inspection', titleNl: 'Inspectie Aanmaken', module: 'IN', route: '/app/inspecties/nieuw' },
  '/app/inspecties/[id]': { id: 'IN10', title: 'Inspection Detail', titleNl: 'Inspectiedetail', module: 'IN', route: '/app/inspecties/[id]' },

  // Appointments
  '/app/afspraken': { id: 'AP05', title: 'Appointment Calendar', titleNl: 'Afsprakenkalender', module: 'AP', route: '/app/afspraken' },
  '/app/afspraken/nieuw': { id: 'AP01', title: 'Create Appointment', titleNl: 'Afspraak Aanmaken', module: 'AP', route: '/app/afspraken/nieuw' },
  '/app/afspraken/[id]': { id: 'AP10', title: 'Appointment Detail', titleNl: 'Afspraakdetail', module: 'AP', route: '/app/afspraken/[id]' },

  // Tasks & Planning
  '/app/taken': { id: 'TS05', title: 'My Tasks', titleNl: 'Mijn Taken', module: 'TS', route: '/app/taken' },
  '/app/taken/nieuw': { id: 'TS01', title: 'Create Task', titleNl: 'Taak Aanmaken', module: 'TS', route: '/app/taken/nieuw' },
  '/app/planning': { id: 'TS10', title: 'Timesheet / Planner', titleNl: 'Werkplanning', module: 'TS', route: '/app/planning' },

  // Reports
  '/app/rapportage': { id: 'RP10', title: 'Reports', titleNl: 'Rapportage', module: 'RP', route: '/app/rapportage' },

  // VAT
  '/app/btw': { id: 'BW05', title: 'VAT Dashboard', titleNl: 'BTW Dashboard', module: 'BW', route: '/app/btw' },
  '/app/btw-calculator': { id: 'BW40', title: 'BTW Calculator', titleNl: 'BTW Calculator', module: 'BW', route: '/app/btw-calculator' },

  // Purchases
  '/app/inkoop': { id: 'PU05', title: 'Purchase Register', titleNl: 'Inkoopregister', module: 'PU', route: '/app/inkoop' },
  '/app/inkoop/nieuw': { id: 'PU01', title: 'Create Purchase', titleNl: 'Inkoop Aanmaken', module: 'PU', route: '/app/inkoop/nieuw' },

  // Bookkeeping
  '/app/boekhouding': { id: 'BK10', title: 'Bookkeeping Export', titleNl: 'Boekhouding Export', module: 'BK', route: '/app/boekhouding' },

  // Settings
  '/app/instellingen': { id: 'SY01', title: 'Settings', titleNl: 'Instellingen', module: 'SY', route: '/app/instellingen' },
  '/app/instellingen/gebruikers': { id: 'SY02', title: 'Staff Management', titleNl: 'Gebruikersbeheer', module: 'SY', route: '/app/instellingen/gebruikers' },
  '/app/instellingen/nummering': { id: 'SY03', title: 'Number Ranges', titleNl: 'Nummering', module: 'SY', route: '/app/instellingen/nummering' },

  // Monitoring
  '/app/monitoring': { id: 'SY05', title: 'Monitoring', titleNl: 'Monitoring', module: 'SY', route: '/app/monitoring' },

  // Manual
  '/app/handleiding': { id: 'SY10', title: 'Manual', titleNl: 'Handleiding', module: 'SY', route: '/app/handleiding' },

  // Cron Jobs
  '/app/cron-jobs': { id: 'SY15', title: 'Cron Jobs', titleNl: 'Cron Jobs', module: 'SY', route: '/app/cron-jobs' },

  // AI Agent Definitions
  '/app/ai-agents': { id: 'SY20', title: 'AI Agents', titleNl: 'AI Agents', module: 'SY', route: '/app/ai-agents' },

  // Email Monitor
  '/app/instellingen/email-monitor': { id: 'SY25', title: 'IMAP Email Monitor', titleNl: 'IMAP E-mail Monitor', module: 'SY', route: '/app/instellingen/email-monitor' },

  // Google Drive
  '/app/drive': { id: 'SY30', title: 'Google Drive', titleNl: 'Google Drive', module: 'SY', route: '/app/drive' },

  // Infrastructure
  '/app/instellingen/infrastructuur': { id: 'SY35', title: 'Infrastructure', titleNl: 'Infrastructuur', module: 'SY', route: '/app/instellingen/infrastructuur' },

  // Brand/Model Management
  '/app/instellingen/merken': { id: 'SY40', title: 'Brand Management', titleNl: 'Merk/Model Beheer', module: 'SY', route: '/app/instellingen/merken' },

  '/app/instellingen/tarieven': { id: 'SY45', title: 'Labour Rates', titleNl: 'Tarieven', module: 'SY', route: '/app/instellingen/tarieven' },

  // Environment Secrets
  '/app/instellingen/integraties': { id: 'SY50', title: 'Environment Secrets', titleNl: 'Omgevingsgeheimen', module: 'SY', route: '/app/instellingen/integraties' },

  // Analytics
  '/app/analytics': { id: 'AN05', title: 'Site Analytics', titleNl: 'Website Analyse', module: 'SY', route: '/app/analytics' },
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
      !s.route.includes('[') &&
      (s.id.toLowerCase().includes(q) ||
       s.title.toLowerCase().includes(q) ||
       s.titleNl.toLowerCase().includes(q))
  );
}
