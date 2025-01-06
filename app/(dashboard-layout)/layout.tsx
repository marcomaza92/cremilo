import Link from "next/link";
import styles from "./layout.module.css";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header>
        <nav>
          <ul>
            <li>
              <Link href={"/"}>Overview</Link>
            </li>
            <li>
              <Link href={"/"}>Debts</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
};

export default DashboardLayout;
