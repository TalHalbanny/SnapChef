import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase configuration. Check your .env file and ensure keys start with VITE_");
  }

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RegisterData {
    userName: string;
    email: string;
    password: string;
  }

interface LoginData {
  GivenUserName: string,
  GivenPassword: string
}

  //sending function acts as bridge from app.tsx to index.js, as registry.
  
  export const authService = {

    register: async (userData: RegisterData) => {
      try {
        const response = await fetch('http://localhost:5000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Registration failed');
        }
  
        return await response.json();
      } catch (error) {
        console.error("Auth Service Error:", error);
        throw error;
      }
    }
  };