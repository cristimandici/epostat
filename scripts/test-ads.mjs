/**
 * Usage:
 *   node scripts/test-ads.mjs seed    — create test ads
 *   node scripts/test-ads.mjs delete  — delete only test ads
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// Read .env.local
const envPath = resolve(__dir, '../.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
);

const URL  = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SRK  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !SRK) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(URL, SRK, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TARGET_EMAIL = 'cristimandici11@gmail.com';
const SEED_MARKER  = '[SEED_TEST]'; // marker in description – used to identify & delete

const TEST_ADS = [
  {
    title: 'iPhone 15 Pro 256GB Natural Titanium',
    description: `Vând iPhone 15 Pro în stare perfectă, folosit 3 luni. Vine cu cutia originală, cablu și încărcător. Nu are nicio zgarietură. ${SEED_MARKER}`,
    price: 5200,
    negotiable: true,
    category_id: 'electronice',
    condition: 'ca-nou',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format'],
    city: 'București',
    location: 'Sectorul 1, București',
    urgent: false,
    views: 142,
    favorites_count: 8,
  },
  {
    title: 'Bicicletă Merida Scultura 400 2023',
    description: `Bicicletă de șosea Merida Scultura 400, mărime M, rulată ~500 km. Cadru carbon, echipare Shimano 105. ${SEED_MARKER}`,
    price: 3800,
    negotiable: true,
    category_id: 'sport',
    condition: 'ca-nou',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format'],
    city: 'Cluj-Napoca',
    location: 'Florești, Cluj',
    urgent: false,
    views: 89,
    favorites_count: 5,
  },
  {
    title: 'Canapea extensibilă 3 locuri + fotoliu',
    description: `Set canapea + fotoliu, culoare gri antracit, stare foarte bună. Extensibila pentru dormit. Dimensiuni canapea: 230x90cm. ${SEED_MARKER}`,
    price: 1200,
    negotiable: true,
    category_id: 'casa',
    condition: 'buna-stare',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format'],
    city: 'Timișoara',
    location: 'Complexul Studențesc, Timișoara',
    urgent: false,
    views: 63,
    favorites_count: 3,
  },
  {
    title: 'BMW Seria 3 320d 2019 Automată',
    description: `BMW 320d, an 2019, automat 8 viteze, 190 CP. Extras comfort, navigație profesională, scaune piele. ITP valabil 2026. Km reali: 78.000. ${SEED_MARKER}`,
    price: 22500,
    negotiable: true,
    category_id: 'auto',
    condition: 'buna-stare',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format'],
    city: 'București',
    location: 'Pipera, București',
    urgent: true,
    views: 310,
    favorites_count: 19,
  },
  {
    title: 'Laptop Dell XPS 15 9530 i9 / RTX 4060',
    description: `Dell XPS 15 9530, procesor Intel Core i9-13900H, RTX 4060 8GB, 32GB RAM DDR5, SSD 1TB NVMe. Display OLED 3.5K. ${SEED_MARKER}`,
    price: 7800,
    negotiable: false,
    category_id: 'electronice',
    condition: 'ca-nou',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format'],
    city: 'Iași',
    location: 'Copou, Iași',
    urgent: false,
    views: 201,
    favorites_count: 12,
  },
  {
    title: 'Jachetă The North Face Nuptse XL',
    description: `Jachetă de puf The North Face Nuptse, mărime XL, culoare bleumarin. Purtată de 2 ori, ca nouă. ${SEED_MARKER}`,
    price: 450,
    negotiable: false,
    category_id: 'moda',
    condition: 'ca-nou',
    images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=800&auto=format'],
    city: 'Brașov',
    location: 'Centru, Brașov',
    urgent: false,
    views: 47,
    favorites_count: 4,
  },
  {
    title: 'Mașină de spălat Bosch 9kg A+++',
    description: `Bosch Serie 6 WAU28PH0BY, 9 kg, 1400 rpm, clasa A+++, EcoSilence. Cumpărată în 2023, garanție restantă 2 ani. ${SEED_MARKER}`,
    price: 1850,
    negotiable: true,
    category_id: 'casa',
    condition: 'ca-nou',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format'],
    city: 'Cluj-Napoca',
    location: 'Mărăști, Cluj-Napoca',
    urgent: false,
    views: 55,
    favorites_count: 2,
  },
  {
    title: 'Trotineta electrică Xiaomi Pro 2',
    description: `Trotineta Xiaomi Mi Scooter Pro 2, autonomie 45 km, viteză max 25 km/h. Cumpărată în 2022, funcționează perfect. ${SEED_MARKER}`,
    price: 900,
    negotiable: true,
    category_id: 'sport',
    condition: 'buna-stare',
    images: ['https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&auto=format'],
    city: 'București',
    location: 'Floreasca, București',
    urgent: false,
    views: 78,
    favorites_count: 6,
  },
  {
    title: 'Apartament 2 camere Floreasca 55mp',
    description: `Vând apartament 2 camere, etaj 3/8, bloc 2015, finisaje premium, loc de parcare inclus. Vedere la parc. ${SEED_MARKER}`,
    price: 145000,
    negotiable: true,
    category_id: 'imobiliare',
    condition: 'nou',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format'],
    city: 'București',
    location: 'Floreasca, Sectorul 1',
    urgent: false,
    views: 420,
    favorites_count: 31,
  },
  {
    title: 'PlayStation 5 + 3 jocuri',
    description: `PS5 disc edition, cumpărat în decembrie 2023, utilizat rar. Include: Spider-Man 2, FIFA 24, God of War Ragnarök. ${SEED_MARKER}`,
    price: 2200,
    negotiable: true,
    category_id: 'electronice',
    condition: 'buna-stare',
    images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&auto=format'],
    city: 'Timișoara',
    location: 'Circumvalațiunii, Timișoara',
    urgent: true,
    views: 188,
    favorites_count: 14,
  },
];

async function seed() {
  // Get user ID by email
  const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) { console.error('Cannot list users:', userErr.message); process.exit(1); }

  const target = users.find(u => u.email === TARGET_EMAIL);
  if (!target) { console.error(`User ${TARGET_EMAIL} not found`); process.exit(1); }

  const sellerId = target.id;
  console.log(`Found user: ${target.email} (${sellerId})`);

  let created = 0;
  for (const ad of TEST_ADS) {
    const { error } = await supabase.from('ads').insert({ ...ad, seller_id: sellerId, status: 'activ' });
    if (error) {
      console.error(`  ✗ Failed: ${ad.title} — ${error.message}`);
    } else {
      console.log(`  ✓ Created: ${ad.title}`);
      created++;
    }
  }
  console.log(`\nDone. Created ${created}/${TEST_ADS.length} test ads.`);
  console.log(`All marked with "${SEED_MARKER}" in description.`);
  console.log(`Run "node scripts/test-ads.mjs delete" to remove them.`);
}

async function deleteSeed() {
  const { data, error } = await supabase
    .from('ads')
    .delete()
    .like('description', `%${SEED_MARKER}%`)
    .select('id, title');

  if (error) { console.error('Delete failed:', error.message); process.exit(1); }

  if (!data || data.length === 0) {
    console.log('No test ads found to delete.');
    return;
  }

  console.log(`Deleted ${data.length} test ads:`);
  data.forEach(ad => console.log(`  ✓ ${ad.title}`));
}

const mode = process.argv[2];
if (mode === 'seed') {
  seed();
} else if (mode === 'delete') {
  deleteSeed();
} else {
  console.log('Usage: node scripts/test-ads.mjs seed | delete');
  process.exit(1);
}
