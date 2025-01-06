import Link from "next/link";
import styles from "./layout.module.css";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <header>
        <nav>
          <ul>
            <li>
              <Link href={"/"}>Homepage</Link>
            </li>
            <li>
              <Link href={"/about"}>About</Link>
            </li>
            <li>
              <Link href={"/login"}>Login</Link>
            </li>
            <li>
              <Link href={"/register"}>Register</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>{children}</main>
      <footer>This is the footer</footer>
    </>
  );
};

export default MainLayout;
