import Link from "next/link";
import styles from "./layout.module.css";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const navUrls = [
    { href: "/", label: "Homepage" },
    { href: "/about", label: "About" },
    { href: "/login", label: "Login" },
    { href: "/register", label: "Register" },
  ];

  return (
    <>
      <header>
        <nav>
          <ul>
            {navUrls.map(({ href, label }) => (
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
