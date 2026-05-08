import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ipjpvkfozfsmhfjzanez.supabase.co";
const supabaseKey = "sb_publishable_jffFGZNquOev9E0DqMF1ZA_WJf9FJXT";

export const supabase = createClient(supabaseUrl, supabaseKey);
