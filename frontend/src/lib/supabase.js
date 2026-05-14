import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://anijbpnrmiwxtubecxgf.supabase.co",    // ← Supabase URL'ini buraya yaz
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuaWpicG5ybWl3eHR1YmVjeGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MzY4NzYsImV4cCI6MjA5NDMxMjg3Nn0.N1oWWibtgB1Ib0rqUbN-Y96bENkSOpTmeuUF2rfa4Qs"  // ← Anon Key'i buraya yaz
);