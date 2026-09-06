"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

/**
 * Server Action: Sign In with Email & Password
 */
export async function signInAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Please provide both email and password." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, error: "Invalid email or password." };
      }
      return { success: false, error: error.message };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication service error.";
    return { success: false, error: message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server Action: Sign Up with Email & Password
 */
export async function signUpAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Please provide both email and password." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("User already registered")) {
        return {
          success: false,
          error: "An account with this email already exists. Please sign in.",
        };
      }
      return { success: false, error: error.message };
    }

    // If email confirmation is required and session is not immediately active
    if (data.user && !data.session) {
      return {
        success: true,
        error: "Account created. If required, check your email for confirmation or sign in now.",
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration service error.";
    return { success: false, error: message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Server Action: Sign Out
 */
export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore sign out errors
  }

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Helper: Get current authenticated user
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
