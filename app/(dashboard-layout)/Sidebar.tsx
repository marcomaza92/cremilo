"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_URLS } from "@/utils/constants/data";
import styles from "./Sidebar.module.css";

const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Dashboard navigation">
        <ul className={styles.nav}>
          {DASHBOARD_URLS.map(({ href, label }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`${styles.navLink} ${isActive ? styles.navLink__active : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
