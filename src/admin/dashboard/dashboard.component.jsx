import React, { useEffect, useState } from "react";
import { ApiClient } from "adminjs";

const api = new ApiClient();

const metrics = [
  { key: "leadsGenerated", title: "Leads gerados", accent: "#6D28D9" },
  { key: "leadsInvited", title: "Leads convidados", accent: "#2563EB" },
  {
    key: "invitedLeadsClaimedReward",
    title: "Convidados com 1ª recompensa resgatada",
    accent: "#0F766E",
  },
];

export default function GrowthDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api.getDashboard()
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os indicadores.");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="growth-dashboard">
      <style>{`
        .growth-dashboard {
          padding: 32px;
          min-height: 100%;
          background: #f7f7fb;
        }
        .growth-dashboard__header {
          margin-bottom: 24px;
        }
        .growth-dashboard__header h1 {
          margin: 0 0 8px;
          color: #17151f;
          font-size: 30px;
          line-height: 1.2;
        }
        .growth-dashboard__header p {
          margin: 0;
          color: #716d7d;
          font-size: 14px;
        }
        .growth-dashboard__grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }
        .growth-dashboard__card {
          min-height: 160px;
          padding: 24px;
          border: 1px solid #e8e5ed;
          border-top: 4px solid var(--card-accent);
          border-radius: 14px;
          background: #ffffff;
          box-shadow: 0 10px 30px rgba(40, 31, 61, 0.06);
        }
        .growth-dashboard__card h3 {
          margin: 0 0 24px;
          color: #716d7d;
          font-size: 14px;
          font-weight: 600;
        }
        .growth-dashboard__card h2 {
          margin: 0;
          color: #17151f;
          font-size: 42px;
          line-height: 1;
        }
        .growth-dashboard__error {
          padding: 16px;
          border-radius: 10px;
          background: #fff1f0;
          color: #a61b1b;
        }
        @media (max-width: 900px) {
          .growth-dashboard__grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <header className="growth-dashboard__header">
        <h1>Visão geral de leads</h1>
        <p>Acompanhe os convites e quantos convidados acessaram a primeira recompensa.</p>
      </header>

      {error ? (
        <p className="growth-dashboard__error">{error}</p>
      ) : (
        <section className="growth-dashboard__grid" aria-label="Indicadores de leads">
          {metrics.map((metric) => (
            <article
              className="growth-dashboard__card"
              key={metric.key}
              style={{ "--card-accent": metric.accent }}
            >
              <h3>{metric.title}</h3>
              <h2>{data ? data[metric.key].toLocaleString("pt-BR") : "—"}</h2>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
