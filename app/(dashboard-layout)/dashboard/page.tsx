import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { createOperation } from "./actions";
import { UserData, UserInfo } from "@/types/user";

const initialUser: UserInfo = {
  id: "",
  first_name: "Franco",
  last_name: "Milazzo",
  birthday: "24-07-1990",
  age: 18,
  address: "Fake St. 123",
  city: "Salta",
  country: "Argentina",
  role: 0,
};

const Dashboard = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  const { data: userInfo }: UserData = await supabase
    .from("users")
    .select()
    .eq("id", data.user.id);

  const currentUser = { ...initialUser };

  if (userInfo && userInfo[0]) {
    Object.keys(initialUser).forEach((key) => {
      const typedKey = key as keyof UserInfo;
      if (
        userInfo[0][typedKey] !== undefined ||
        userInfo[0][typedKey] !== null
      ) {
        (currentUser as any)[typedKey] = userInfo[0][typedKey];
      } else {
        (currentUser as any)[typedKey] = (initialUser as any)[typedKey];
        console.log(
          `Key ${typedKey} is missing in userInfo, setting default value.`,
          (initialUser as any)[typedKey],
        );
      }
    });
  }

  console.log(currentUser);

  return (
    <div>
      <h1 className="color-base-turquoise">
        Hello {currentUser.first_name} {currentUser.last_name}
      </h1>
      <p>Registered email: {data.user.email}</p>

      <h2 className="color-base-purple">Dashboard</h2>
      <form action={createOperation}>
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
            <option defaultValue="Choose a category"></option>
            <option value="comida">Comida</option>
            <option value="transporte">Transporte</option>
            <option value="recreacion">Recreación</option>
            <option value="isis">Isis</option>
            <option value="salidas">Salidas</option>
            <option value="delivery">Delivery</option>
            <option value="salud">Salud</option>
            <option value="servicios">Servicios</option>
            <option value="tarjetas">Tarjetas</option>
            <option value="mascotas">Mascotas</option>
            <option value="bazar">Bazar</option>
          </select>
        </label>
        <label htmlFor="paymentMethod">
          <span>Payment Method</span>
          <select name="paymentMethod" id="paymentMethod">
            <option defaultValue="Choose a category"></option>
            <option value="tarjeta6305">Tarjeta 6305</option>
            <option value="tarjeta8137">Tarjeta 8137</option>
            <option value="efectivo">Efectivo</option>
            <option value="efectivo">Debito</option>
            <option value="efectivo">Transferencia</option>
          </select>
        </label>
      </form>
    </div>
  );
};

export default Dashboard;
