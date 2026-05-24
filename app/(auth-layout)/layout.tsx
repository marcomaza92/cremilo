import Link from "next/link";
import styles from "./layout.module.css";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link className={styles.header__brand} href="/">
          Crémilo
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
};

export default AuthLayout;
