"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DASHBOARD_PERIOD_VALUES,
  presetDateRange,
  type DashboardPeriod,
} from "@/lib/dashboard-period";

export function PeriodFilter({ selection }: { selection: DashboardPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dateFrom, setDateFrom] = useState(selection.dateFrom);
  const [dateTo, setDateTo] = useState(selection.dateTo);

  useEffect(() => {
    setDateFrom(selection.dateFrom);
    setDateTo(selection.dateTo);
    if (
      searchParams.get("period") === selection.period &&
      searchParams.get("dateFrom") === selection.dateFrom &&
      searchParams.get("dateTo") === selection.dateTo
    ) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("period", selection.period);
    params.set("dateFrom", selection.dateFrom);
    params.set("dateTo", selection.dateTo);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, selection]);

  function navigate(period: DashboardPeriod["period"], from: string, to: string) {
    if (!from || !to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    params.set("dateFrom", from);
    params.set("dateTo", to);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function selectPreset(value: (typeof DASHBOARD_PERIOD_VALUES)[number]) {
    const range = presetDateRange(value);
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    navigate(value, range.dateFrom, range.dateTo);
  }

  return (
    <nav className="period-filter" aria-label="Período das métricas">
      {DASHBOARD_PERIOD_VALUES.map((value) => (
        <button
          className={selection.period === value ? "active" : ""}
          key={value}
          onClick={() => selectPreset(value)}
          type="button"
        >
          Últimos {value} dias
        </button>
      ))}
      <div
        className={`custom-period ${selection.period === "custom" ? "active" : ""}`}
      >
        <label>
          <span>De</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              const value = event.target.value;
              setDateFrom(value);
              navigate("custom", value, dateTo);
            }}
          />
        </label>
        <label>
          <span>Até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              const value = event.target.value;
              setDateTo(value);
              navigate("custom", dateFrom, value);
            }}
          />
        </label>
      </div>
    </nav>
  );
}
