// /utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qoibjwvlhzpycepqgfjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvaWJqd3ZsaHpweWNlcHFnZmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NzAyODgsImV4cCI6MjA2MTU0NjI4OH0.CMfO1DFEiPbcPQlcNVllYTFqcVVXBBH5YKZ5yeP2y78';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
