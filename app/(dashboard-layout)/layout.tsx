import styles from "./layout.module.css";
import { Providers } from "@/app/providers";
import DashboardSidebar from "./Sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Providers>
      <div className={styles.shell}>
        <DashboardSidebar />
        <main className={styles.main}>{children}</main>
      </div>
    </Providers>
  );
};

export default DashboardLayout;
