import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bgqilahhsnydfroiwyqa.supabase.co';
const supabaseAnonKey = 'sb_publishable_HGriQJIAlKCPHtU4yKRuWA_jiQ_n1MV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);