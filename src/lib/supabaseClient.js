/* ==========================================================================
   SUPABASE CLIENT - Supabase client initialization

   Initializes and exports the Supabase client for authentication and database
   operations. Uses Supabase CDN for ES module compatibility (no build process).

   Dependencies: Supabase CDN, config.js (SUPABASE_URL, SUPABASE_ANON_KEY)
   Used by: authService.js, syncService.js (future)
   ========================================================================== */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "config";

// Import Supabase from CDN (ES module)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm";

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
