import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { login } from "./actions";

const Login = async () => {
  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={login}>Log in</button>
    </form>
  );
};

export default Login;
