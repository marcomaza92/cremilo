"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  // TODO: validate form data to avoid type-casting
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data: dataUser } = await supabase.auth.signInWithPassword(
    data
  );

  if (error) {
    console.log(error);
    redirect("/");
  }
  console.log(dataUser);
  revalidatePath("/", "layout");
  redirect("/");
}