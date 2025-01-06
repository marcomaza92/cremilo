import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { register } from "./actions";

const Register = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("operations").select();

  console.log(data);
  console.log(error);

  return (
    <form>
      <label htmlFor="email">Email:</label>
      <input id="email" name="email" type="email" required />
      <label htmlFor="password">Password:</label>
      <input id="password" name="password" type="password" required />
      <button formAction={register}>Create User</button>
    </form>
  );
};

export default Register;
