import type { ReactNode } from "react";
import styles from "./campaign-layout.module.css";

type CampaignLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function CampaignLayout({ children }: CampaignLayoutProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header} aria-label="Cabeçalho da campanha" />
      <main className={styles.container}>{children}</main>
    </div>
  );
}
