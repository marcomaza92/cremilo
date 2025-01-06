import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";

const Dashboard = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }
  return (
    <div>
      <h1 className="color-base-turquoise">Hello {data.user.role}</h1>
      <p>Registered email: {data.user.email}</p>

      <h2 className="color-base-purple">Dashboard</h2>
    </div>
  );
};

export default Dashboard;
