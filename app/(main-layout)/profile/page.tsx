import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { updateProfile } from "./actions";
import type { UserData, UserInfo } from "@/types/user";

const Profile = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  const { data: userInfo }: UserData = await supabase
    .from("users")
    .select()
    .eq("id", data.user.id);

  const [currentUser] = userInfo ?? [];

  return (
    <div>
      {/* TODO: Add auth conditional so it won't render when it's not logged in */}
      <h1 className="color-base-purple">Profile</h1>
      <form action={updateProfile}>
        <label htmlFor="firstName">
          <span>First Name</span>
          <input
            defaultValue={currentUser.first_name}
            name="firstName"
            id="firstName"
            type="text"
          />
        </label>
        <label htmlFor="lastName">
          <span>Last Name</span>
          <input
            defaultValue={currentUser.last_name}
            name="lastName"
            id="lastName"
            type="text"
          />
        </label>
        <label htmlFor="birthday">
          <span>Birthday</span>
          <input
            defaultValue={currentUser.birthday}
            name="birthday"
            id="birthday"
            type="date"
          />
        </label>
        <label htmlFor="age">
          <span>Age</span>
          <input
            defaultValue={currentUser.age}
            name="age"
            id="age"
            type="number"
          />
        </label>
        <label htmlFor="address">
          <span>Address</span>
          <input
            defaultValue={currentUser.address}
            name="address"
            id="address"
            type="text"
          />
        </label>
        <label htmlFor="city">
          <span>City</span>
          <select name="city" id="city">
            <option defaultValue="Choose a city"></option>
            <option value="cordoba">Córdoba</option>
            <option value="buenosAires">Buenos Aires</option>
            <option value="rioNegro">Rio Negro</option>
            <option value="rioNegro">Chubut</option>
            <option value="rioNegro">Salta</option>
          </select>
        </label>
        <label htmlFor="country">
          <span>Country</span>
          <select name="country" id="country">
            <option defaultValue="Choose a country"></option>
            <option value="argentina">Argentina</option>
            <option value="mexico">Mexico</option>
            <option value="espana">España</option>
            <option value="estadosUnidos">Estados Unidos</option>
            <option value="estadosUnidos">Holanda</option>
          </select>
        </label>
        <label htmlFor="role">
          <span>Role</span>
          <select name="role" id="role">
            <option defaultValue={currentUser.role}>{currentUser.role}</option>
            <option value={0}>Admin</option>
            <option value={1}>User</option>
          </select>
        </label>
      </form>
    </div>
  );
};

export default Profile;
