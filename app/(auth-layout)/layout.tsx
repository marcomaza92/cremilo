import Link from "next/link";
import styles from "./layout.module.css";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header>
        <nav>
          <ul>
            <li>
              <Link href={"/"}>Homepage</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>{children}</main>
      <footer>This is the auth footer</footer>
    </>
  );
};

export default AuthLayout;
