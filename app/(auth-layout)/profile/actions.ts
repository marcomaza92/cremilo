"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData) {
  console.log(formData);

  revalidatePath("/profile", "page");
  redirect("/profile");
}
