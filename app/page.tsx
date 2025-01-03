import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";

const Home = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("transactions").select();

  console.log(data);
  console.log(error);

  return <h1 className="test">Crémilo</h1>;
};

export default Home;
