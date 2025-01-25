import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { login } from "./actions";

const Login = async () => {
  return (
    <section>
      <form action={login}>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required />
        <label htmlFor="password">Password:</label>
        <input id="password" name="password" type="password" required />
        <button type="submit">Log in</button>
      </form>
      <div className="">
        <h3>oAuth Options for Login</h3>
      </div>
    </section>
  );
};

export default Login;
