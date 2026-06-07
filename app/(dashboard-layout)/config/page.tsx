import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ConfigPage from "./ConfigPage";

const Config = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return <ConfigPage />;
};

export default Config;
