import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } =
    Constants.expoConfig?.extra ?? {};

  console.log('ENV URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('ENV KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);


  if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are not set!');
  }

  if (!supabase) {
    supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY);
  }

  return supabase;
}
