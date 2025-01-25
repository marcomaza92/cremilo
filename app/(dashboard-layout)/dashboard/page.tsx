import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { logout } from "./actions";

const Dashboard = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }
  return (
    <div>
      {/* TODO: Change to correct schema to fetch information */}
      <h1 className="color-base-turquoise">Hello {data.user.role}</h1>
      <p>Registered email: {data.user.email}</p>
      <form action={logout}>
        <button type="submit">Log out</button>
      </form>

      <h2 className="color-base-purple">Dashboard</h2>
      <form action="createOperation">
        <label htmlFor="amount">
          <span>Amount</span>
          <input name="amount" id="amount" type="number" />
        </label>
        <label htmlFor="description">
          <span>Description</span>
          <input name="description" id="description" type="text" />
        </label>
        <label htmlFor="category">
          <span>Category</span>
          <select name="category" id="category">
            <option selected value="Choose a category"></option>
            <option value="comida">Comida</option>
            <option value="transporte">Transporte</option>
          </select>
        </label>
        <label htmlFor="paymentMethod">
          <span>Payment Method</span>
          <select name="paymentMethod" id="paymentMethod">
            <option selected value="Choose a category"></option>
            <option value="tarjeta6305">Tarjeta 6305</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </label>
      </form>
    </div>
  );
};

export default Dashboard;
