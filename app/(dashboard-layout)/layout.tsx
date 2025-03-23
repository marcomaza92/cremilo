import Link from "next/link";
import styles from "./layout.module.css";
import { DASHBOARD_URLS } from "@/utils/constants/data";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header>
        <nav>
          <ul>
            {DASHBOARD_URLS.map(({ href, label }) => (
              <li key={href}>
                <Link className="color-base-green" href={href}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
};

export default DashboardLayout;
