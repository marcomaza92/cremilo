import Link from "next/link";
import styles from "./page.module.css";
import { login } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const Login = async ({ searchParams }: LoginPageProps) => {
  const { error } = await searchParams;

  return (
    <div className={styles.card}>
      <div className={styles.card__stripe} />
      <div className={styles.card__body}>
        <h1 className={styles.card__title}>Login</h1>

        {error && (
          <div className={styles.error} role="alert" aria-live="assertive">
            <span className={styles.error__icon} aria-hidden="true">!</span>
            <p className={styles.error__message}>{error}</p>
          </div>
        )}

        <form className={styles.form} action={login} noValidate>
          <div className={styles.form__field}>
            <label className={styles.form__label} htmlFor="email">
              Email
            </label>
            <input
              className={styles.form__input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-required="true"
            />
          </div>

          <div className={styles.form__field}>
            <label className={styles.form__label} htmlFor="password">
              Password
            </label>
            <input
              className={styles.form__input}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              aria-required="true"
            />
          </div>

          <button className={styles.form__submit} type="submit">
            Log in
          </button>
        </form>

        <p className={styles.card__footer}>
          No account yet?{" "}
          <Link className={styles.card__link} href="/register">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
