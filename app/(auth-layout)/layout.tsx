import Link from "next/link";
import styles from "./layout.module.css";
import { AUTH_URLS } from "@/utils/constants/data";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header>
        <nav>
          <ul>
            {AUTH_URLS.map(({ href, label }) => (
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
      <footer>This is the auth footer</footer>
    </>
  );
};

export default AuthLayout;
