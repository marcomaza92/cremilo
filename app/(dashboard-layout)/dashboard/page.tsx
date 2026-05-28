import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { createOperation } from "./actions";
import { UserData, UserInfo } from "@/types/user";
import ExpensesSection from "./ExpensesSection";
import IngresosSection from "./IngresosSection";

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
    <div className={styles.page}>
      <header className={styles.page__header}>
        <h1 className={styles.page__greeting}>
          Hello, {currentUser.first_name}
        </h1>
        <p className={styles.page__email}>{data.user.email}</p>
      </header>

      <main className={styles.page__content}>
        <IngresosSection />
        <ExpensesSection />
      </main>
    </div>
  );
};

export default Dashboard;
