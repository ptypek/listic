import type { SupabaseClient } from "@supabase/supabase-js";

export async function deleteUserAccount(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user account:", error);
    throw new Error("Failed to delete user account.");
  }
}