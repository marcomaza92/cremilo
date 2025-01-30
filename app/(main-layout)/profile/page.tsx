import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import styles from "./page.module.css";
import { updateProfile } from "./actions";
import type { UserData } from "@/types/user";

const Profile = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  const usersData = await supabase.from("users").select();

  console.log(usersData.data);

  const user: UserData = {
    firstName: "lalala",
  };

  return (
    <div>
      {/* TODO: Add auth conditional so it won't render when it's not logged in */}
      <h1 className="color-base-purple">Profile</h1>
      <form action={updateProfile}>
        <label htmlFor="firstName">
          <span>First Name</span>
          <input
            defaultValue={user.firstName}
            name="firstName"
            id="firstName"
            type="text"
          />
        </label>
        <label htmlFor="lastName">
          <span>Last Name</span>
          <input name="lastName" id="lastName" type="text" />
        </label>
        <label htmlFor="birthday">
          <span>Birthday</span>
          <input name="birthday" id="birthday" type="date" />
        </label>
        <label htmlFor="age">
          <span>Age</span>
          <input name="age" id="age" type="number" />
        </label>
        <label htmlFor="address">
          <span>Address</span>
          <input name="address" id="address" type="text" />
        </label>
        <label htmlFor="city">
          <span>City</span>
          <select name="city" id="city">
            <option selected value="Choose a city"></option>
            <option value="cordoba">Córdoba</option>
            <option value="rioNegro">Rio Negro</option>
          </select>
        </label>
        <label htmlFor="country">
          <span>Country</span>
          <select name="country" id="country">
            <option selected value="Choose a country"></option>
            <option value="argentina">Argentina</option>
            <option value="estadosUnidos">Estados Unidos</option>
          </select>
        </label>
        <label htmlFor="role">
          <span>Role</span>
          <select name="role" id="role">
            <option selected value="Choose a role"></option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </label>
      </form>
    </div>
  );
};

export default Profile;
