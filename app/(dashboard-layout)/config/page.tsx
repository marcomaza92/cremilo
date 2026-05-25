import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";

const Config = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className={styles.container}>
      <h1>Configuración</h1>
      <p>
        Placeholder route group for I-03. Config sections (Rates, Format,
        Impuesto de Sellos) will be implemented when D-07, D-08, D-09 land
        their respective DEV-XX tickets.
      </p>
    </div>
  );
};

export default Config;
