import {
  ArrowDown,
  CheckCircle2,
  Download,
  Gift,
  MailPlus,
  MousePointerClick,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import {
  calculateConversionRate,
} from "@/lib/client-area";
import { getClientReport } from "@/lib/client-data";
import {
  resolveDashboardPeriod,
  type DashboardSearchParams,
} from "@/lib/dashboard-period";
import { requireTenant } from "@/lib/authorization";

const number = new Intl.NumberFormat("pt-BR");

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const { clientId, isAdmin } = await requireTenant();
  const selection = resolveDashboardPeriod(await searchParams);
  const report = await getClientReport(clientId, selection.range);
  const { participants, invitations, referrals, qualified } = report.funnel;
  const steps = [
    ["Participantes", participants, 100, UserPlus],
    [
      "Convites enviados",
      invitations,
      calculateConversionRate(invitations, participants),
      MailPlus,
    ],
    [
      "Indicações registradas",
      referrals,
      calculateConversionRate(referrals, invitations),
      MousePointerClick,
    ],
    [
      "Indicações qualificadas",
      qualified,
      report.qualificationRate,
      CheckCircle2,
    ],
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="INTELIGÊNCIA DA EMPRESA"
        title={`Relatórios, ${selection.label}`}
        description="Acompanhe o funil e os resultados exclusivamente da sua empresa."
        action={isAdmin ? (
          <a className="button secondary" href="/api/admin/export/leads">
            <Download size={17} aria-hidden="true" />
            Exportar leads
          </a>
        ) : undefined}
      />

      <PeriodFilter selection={selection} />

      <section className="panel funnel" id="funil">
        <h2>Funil de indicação</h2>
        <p>Dados reais do período selecionado</p>
        <div>
          {steps.map(([label, value, rate, Icon], index) => (
            <span key={label} style={{ width: `${100 - index * 14}%` }}>
              <Icon aria-hidden="true" />
              <strong>{number.format(value)}</strong>
              <small>
                {label} · {rate}%
              </small>
              {index < steps.length - 1 && (
                <ArrowDown className="funnel-arrow" aria-hidden="true" />
              )}
            </span>
          ))}
        </div>
      </section>

      <section className="insight-grid">
        <article className="panel">
          <span className="eyebrow">LEADS</span>
          <h2>{number.format(report.totals.leads)} leads gerados</h2>
          <p>
            Total registrado pelas campanhas da sua empresa no período.
          </p>
        </article>
        <article className="panel">
          <span className="eyebrow">RECOMPENSAS</span>
          <h2>{number.format(report.totals.rewards)} recompensas liberadas</h2>
          <p className="metric-icon" aria-hidden="true">
            <Gift />
          </p>
          <p>
            Inclui recompensas disponíveis ou resgatadas no período.
          </p>
        </article>
      </section>
    </>
  );
}
