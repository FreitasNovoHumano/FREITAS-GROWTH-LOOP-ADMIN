import Link from "next/link";
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
import {
  calculateConversionRate,
  periodSchema,
  periodStart,
} from "@/lib/client-area";
import { getClientReport } from "@/lib/client-data";
import { requireTenant } from "@/lib/authorization";

const number = new Intl.NumberFormat("pt-BR");

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { clientId, isAdmin } = await requireTenant();
  const { period } = await searchParams;
  const parsedPeriod = periodSchema.catch("30").parse(period);
  const selectedPeriod = parsedPeriod === "custom" ? "30" : parsedPeriod;
  const report = await getClientReport(
    clientId,
    { gte: periodStart(Number(selectedPeriod)) },
  );
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
        title="Relatórios"
        description="Acompanhe o funil e os resultados exclusivamente da sua empresa."
        action={isAdmin ? (
          <a className="button secondary" href="/api/admin/export/leads">
            <Download size={17} aria-hidden="true" />
            Exportar leads
          </a>
        ) : undefined}
      />

      <nav className="period-filter" aria-label="Período do relatório">
        {(["7", "30", "90"] as const).map((value) => (
          <Link
            className={selectedPeriod === value ? "active" : ""}
            href={`?period=${value}`}
            key={value}
          >
            Últimos {value} dias
          </Link>
        ))}
      </nav>

      <section className="panel funnel">
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
