"use client";

import { useSummary } from "@/app/hooks/useSummary";
import styles from "./SummaryBoxes.module.css";

function formatAmount(amount: number, currency: string): string {
  if (currency === "USD") {
    return `USD ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `ARS ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface SummaryCardProps {
  title: string;
  amount: number;
  currency: string;
  variant: "income" | "outcome" | "remaining";
}

function SummaryCard({ title, amount, currency, variant }: SummaryCardProps) {
  return (
    <article className={`${styles.card} ${styles[`card--${variant}`]}`}>
      <p className={styles.card__title}>{title}</p>
      <p className={styles.card__amount}>{formatAmount(amount, currency)}</p>
      <p className={styles.card__currency} aria-hidden="true">{currency}</p>
    </article>
  );
}

export default function SummaryBoxes() {
  const { data, isLoading, isError } = useSummary();

  if (isLoading) {
    return (
      <div className={styles.grid} aria-busy="true" aria-label="Loading summary">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${styles.card} ${styles["card--skeleton"]}`} />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className={styles.grid} role="region" aria-label="Financial summary">
      <SummaryCard
        title="Total income"
        amount={data.totalIncome}
        currency={data.currency}
        variant="income"
      />
      <SummaryCard
        title="Total outcome"
        amount={data.totalOutcome}
        currency={data.currency}
        variant="outcome"
      />
      <SummaryCard
        title="Current remaining"
        amount={data.remaining}
        currency={data.currency}
        variant="remaining"
      />
    </div>
  );
}
