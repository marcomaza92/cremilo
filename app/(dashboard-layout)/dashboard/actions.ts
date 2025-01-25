"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOperation(formData: FormData) {
  console.log(formData);
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // TODO: Add better error redirection (Maybe a toast with an "after logout" message)
    redirect("/login");
  }

  revalidatePath("/login", "page");
  redirect("/login");
}
