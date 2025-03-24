import Link from "next/link";
import styles from "./layout.module.css";
import { NAVIGATION_URLS } from "@/utils/constants/data";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header>
        <nav>
          <ul>
            {NAVIGATION_URLS.map(({ href, label }) => (
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
      <footer>This is the footer</footer>
    </>
  );
};

export default MainLayout;
