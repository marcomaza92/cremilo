"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_URLS } from "@/utils/constants/data";
import { logout } from "./actions";
import styles from "./Sidebar.module.css";

const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__brand}>
        <Link href="/dashboard" className={styles.sidebar__brandLink}>
          <h1 className={styles.sidebar__brandText}>CREMILO</h1>
        </Link>
      </div>

      <nav aria-label="Dashboard navigation" className={styles.nav}>
        <ul className={styles.nav__list}>
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
                  {label.toUpperCase()}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action={logout} className={styles.sidebar__footer}>
        <button type="submit" className={styles.sidebar__logout}>
          LOGOUT
        </button>
      </form>
    </aside>
  );
};

export default DashboardSidebar;
