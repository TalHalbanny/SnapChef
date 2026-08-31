import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";
const ADMIN_EMAIL = "admin@snapchef.app";

export interface AuthUser {
  email: string;
  userName: string;
}

interface RegisterParams {
  userName: string;
  email: string;
  password: string;
}

interface LoginParams {
  username: string;
  password: string;
}

type UserRow = {
  username: string;
  email: string;
  password: string;
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration");
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }

  return client;
}

function toAuthUser(row: Pick<UserRow, "username" | "email">) {
  return {
    user: {
      email: row.email,
      user_metadata: { display_name: row.username },
    },
  };
}

function isDuplicateUserError(message: string) {
  return (
    message.includes("duplicate") ||
    message.includes("already exists") ||
    message.includes("unique")
  );
}

export const authService = {
  ensureAdminUser: async () => {
    const supabase = getSupabase();
    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("username")
      .eq("username", ADMIN_USERNAME)
      .maybeSingle();

    if (lookupError) {
      throw new Error(lookupError.message);
    }

    if (existing) {
      return;
    }

    const { error: insertError } = await supabase.from("users").insert({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (insertError && !isDuplicateUserError(insertError.message)) {
      throw new Error(insertError.message);
    }
  },

  register: async ({ userName, email, password }: RegisterParams) => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .insert({
        username: userName,
        email,
        password,
      })
      .select("username, email")
      .single();

    if (error) {
      if (isDuplicateUserError(error.message)) {
        throw new Error("User already registered with this email");
      }
      throw error;
    }

    return toAuthUser(data);
  },

  login: async ({ username, password }: LoginParams) => {
    const supabase = getSupabase();
    const identifier = username.trim();

    const { data: byUsername, error: usernameError } = await supabase
      .from("users")
      .select("username, email, password")
      .eq("username", identifier)
      .eq("password", password)
      .maybeSingle();

    if (usernameError) {
      throw new Error(usernameError.message);
    }

    if (byUsername) {
      return toAuthUser(byUsername);
    }

    const { data: byEmail, error: emailError } = await supabase
      .from("users")
      .select("username, email, password")
      .eq("email", identifier)
      .eq("password", password)
      .maybeSingle();

    if (emailError) {
      throw new Error(emailError.message);
    }

    if (!byEmail) {
      throw new Error("Invalid email or password");
    }

    return toAuthUser(byEmail);
  },
};
