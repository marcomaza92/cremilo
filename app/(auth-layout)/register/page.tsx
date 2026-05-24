import Link from "next/link";
import styles from "./page.module.css";
import { register } from "./actions";

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>;
}

const Register = async ({ searchParams }: RegisterPageProps) => {
  const { error } = await searchParams;

  return (
    <div className={styles.card}>
      <div className={styles.card__stripe} />
      <div className={styles.card__body}>
        <h1 className={styles.card__title}>Create Account</h1>

        {error && (
          <div className={styles.error} role="alert" aria-live="assertive">
            <span className={styles.error__icon} aria-hidden="true">!</span>
            <p className={styles.error__message}>{error}</p>
          </div>
        )}

        <form className={styles.form} action={register} noValidate>
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
              autoComplete="new-password"
              required
              aria-required="true"
            />
          </div>

          <button className={styles.form__submit} type="submit">
            Create Account
          </button>
        </form>

        <p className={styles.card__footer}>
          Already have an account?{" "}
          <Link className={styles.card__link} href="/login">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
