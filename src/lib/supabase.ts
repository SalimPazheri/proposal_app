import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Customer = {
  id: string;
  user_id: string;
  company_name: string;
  company_address: string;
  company_tel: string;
  company_email: string;
  city: string;
  country: string;
  contact_person: string;
  contact_email: string;
  created_at: string;
  updated_at: string;
};
