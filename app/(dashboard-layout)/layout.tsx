import Link from "next/link";
import styles from "./layout.module.css";
import { Providers } from "@/app/providers";
import DashboardSidebar from "./Sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Providers>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/dashboard" className={styles.header__brand}>
            Crémilo
          </Link>
        </header>
        <div className={styles.body}>
          <DashboardSidebar />
          <main className={styles.main}>{children}</main>
        </div>
      </div>
    </Providers>
  );
};

export default DashboardLayout;
