export const APP_ROUTES = {
  dashboard: "/dashboard",
  campaigns: "/dashboard/campaigns",
  campaignCreate: "/dashboard/campaigns/new",
  campaignDetails: (id: string) => `/dashboard/campaigns/${encodeURIComponent(id)}`,
  campaignEdit: (id: string) => `/dashboard/campaigns/${encodeURIComponent(id)}/edit`,
  leads: "/dashboard/leads",
  participants: "/dashboard/participants",
  invitations: "/dashboard/invitations",
  rewards: "/dashboard/rewards",
  reports: "/dashboard/reports",
  emails: "/dashboard/emails",
  integrations: "/dashboard/integrations",
  fraud: "/dashboard/fraud",
  settings: "/dashboard/settings",
  login: "/login",
  publicCampaign: (slug: string) => `/c/${encodeURIComponent(slug)}`,
} as const;

export const ADMIN_API_ROUTES = {
  campaigns: "/api/admin/campaigns",
  campaign: (id: string) => `/api/admin/campaigns/${encodeURIComponent(id)}`,
  overview: "/api/admin/overview",
  data: (resource: string) => `/api/admin/data/${encodeURIComponent(resource)}`,
  exportLeads: "/api/admin/export/leads",
} as const;
