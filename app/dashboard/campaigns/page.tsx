import Link from "next/link";
import { ExternalLink, Plus, Target, Users } from "lucide-react";

import { CampaignStatusButton } from "@/components/campaigns/campaign-status-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ListFilters } from "@/components/dashboard/list-filters";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  calculateConversionRate,
  parseListQuery,
} from "@/lib/client-area";
import { getClientCampaigns } from "@/lib/client-data";
import { requireTenant } from "@/lib/authorization";

const statuses = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAUSED", label: "Pausada" },
  { value: "ENDED", label: "Encerrada" },
  { value: "ARCHIVED", label: "Arquivada" },
] as const;

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const { clientId, isAdmin } = await requireTenant();
  const { items, total } = await getClientCampaigns(clientId, query);

  return (
    <>
      <PageHeader
        eyebrow="AQUISIÇÃO"
        title="Campanhas"
        description="Acompanhe campanhas e resultados vinculados à sua empresa."
        action={
          isAdmin ? (
            <Link className="button primary" href="/dashboard/campaigns/new">
              <Plus size={18} aria-hidden="true" />
              Nova campanha
            </Link>
          ) : undefined
        }
      />
      <ListFilters
        search={query.search}
        status={query.status}
        statuses={statuses}
      />
      <section className="campaign-grid">
        {items.map((campaign) => {
          const conversionRate = calculateConversionRate(
            campaign._count.leads,
            campaign._count.invitations,
          );
          return (
            <article className="campaign-card" key={campaign.id}>
              <div className="campaign-cover">
                <StatusBadge status={campaign.status} />
                <strong>{campaign.name.slice(0, 2).toUpperCase()}</strong>
              </div>
              <div className="campaign-content">
                <h2>{campaign.name}</h2>
                <p>
                  {campaign.description ||
                    "Campanha de indicação Growth Loop"}
                </p>
                <div className="campaign-stats">
                  <span>
                    <Users aria-hidden="true" />
                    <strong>{campaign._count.participants}</strong>
                    <small>Participantes</small>
                  </span>
                  <span>
                    <ExternalLink aria-hidden="true" />
                    <strong>{campaign._count.referrals}</strong>
                    <small>Indicações</small>
                  </span>
                  <span>
                    <Target aria-hidden="true" />
                    <strong>{conversionRate}%</strong>
                    <small>Conversão</small>
                  </span>
                </div>
                <div className="card-actions">
                  <Link href={`/dashboard/campaigns/${campaign.id}`}>
                    Ver detalhes
                  </Link>
                  <Link href={`/growth-loop/${campaign.slug}`} target="_blank">
                    Abrir página pública
                  </Link>
                  {isAdmin && (
                    <CampaignStatusButton
                      campaignId={campaign.id}
                      status={campaign.status}
                    />
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {items.length === 0 && (
          <EmptyState
            icon={Target}
            title="Nenhuma campanha disponível"
            description="As campanhas criadas para sua empresa aparecerão aqui."
          />
        )}
      </section>
      <Pagination
        page={query.page}
        pageSize={query.pageSize}
        total={total}
        searchParams={params}
      />
    </>
  );
}
