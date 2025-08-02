import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const HEALTH_SECRET = process.env.HEALTH_SECRET || 'abcdefghijklmnopqrstuvwxyz1234567890';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not set.');
}

const supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { secret } = req.query;
  if (secret !== HEALTH_SECRET) {
    console.log(`[HEALTH] Unauthorized access attempt at ${new Date().toISOString()}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Query a single record from a table (e.g., jobs)
  const { data, error } = await supabase.from('jobs').select('*').limit(1);
  if (error) {
    console.log(`[HEALTH] Supabase query failed at ${new Date().toISOString()}: ${error.message}`);
    return res.status(500).json({ error: 'Supabase query failed', details: error.message });
  }
  console.log(`[HEALTH] Health check successful at ${new Date().toISOString()}`);
  return res.status(200).json({ status: 'ok', data });
}
