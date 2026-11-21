// Political Party Name Normalizer & Flag Registry

export const PARTY_REGISTRY = {
  // Specific splinter/regional factions prioritized first
  SS_UBT: {
    code: 'SS_UBT',
    name: 'Shiv Sena (UBT)',
    aliases: ['SHIV SENA (UBT)', 'SS(UBT)', 'SS (UBT)', 'SS-UBT', 'SHIV SENA UBT', 'UBT', 'SHIV SENA (THACKERAY)', 'SHIV SENA (UDDHAV BALASAHEB THACKERAY)'],
    flagUrl: '/PartyImages/SS(UBT).png'
  },
  SS: {
    code: 'SS',
    name: 'Shiv Sena',
    aliases: ['SHIV SENA', 'SHS', 'SS', 'SHIV SENA (SHINDE)', 'SHIV SENA SHINDE', 'SHS PARTY', 'SHIVSENA'],
    flagUrl: '/PartyImages/Shiv_Sena.webp'
  },
  NCP_SP: {
    code: 'NCP_SP',
    name: 'Nationalist Congress Party (Sharadchandra Pawar)',
    aliases: ['NATIONALIST CONGRESS PARTY (SHARADCHANDRA PAWAR)', 'NCP (SP)', 'NCP-SP', 'NCP(SP)', 'NATIONALIST CONGRESS PARTY – SHARADCHANDRA PAWAR', 'SHARADCHANDRA PAWAR'],
    flagUrl: '/PartyImages/NCP-flag.svg.webp'
  },
  NCP: {
    code: 'NCP',
    name: 'Nationalist Congress Party',
    aliases: ['NATIONALIST CONGRESS PARTY', 'NCP', 'NCP (AP)', 'NCP(AP)', 'NATIONALIST CONGRESS PARTY (AJIT PAWAR)', 'NATIONALIST', 'NATIONALIS'],
    flagUrl: '/PartyImages/NCP-flag.svg.webp'
  },
  BJP: {
    code: 'BJP',
    name: 'Bharatiya Janata Party',
    aliases: ['BHARATIYA JANATA PARTY', 'BHARATIYA JANTA PARTY', 'BJP', 'BHARATIYA', 'BJP PARTY'],
    flagUrl: '/PartyImages/BJP.png'
  },
  INC: {
    code: 'INC',
    name: 'Indian National Congress',
    aliases: ['INDIAN NATIONAL CONGRESS', 'INDIAN NATIONAL CONGRESSS', 'INC', 'CONGRESS', 'INDIAN NAT', 'INC PARTY'],
    flagUrl: '/PartyImages/INC.png'
  },
  JMM: {
    code: 'JMM',
    name: 'Jharkhand Mukti Morcha',
    aliases: ['JHARKHAND MUKTI MORCHA', 'JMM', 'MUKTI MORCHA'],
    flagUrl: '/PartyImages/Jharkhand_Mukti_Morcha_flag.svg.webp'
  },
  MNS: {
    code: 'MNS',
    name: 'Maharashtra Navnirman Sena',
    aliases: ['MAHARASHTRA NAVNIRMAN SENA', 'MNS'],
    flagUrl: '/PartyImages/Maharashtra_Navnirman_Sena_Official_Flag.jpg'
  },
  NPP: {
    code: 'NPP',
    name: "National People's Party",
    aliases: ["NATIONAL PEOPLE'S PARTY", "NATIONAL PEOPLES PARTY", 'NPP'],
    flagUrl: '/PartyImages/NPP.png'
  },
  SP: {
    code: 'SP',
    name: 'Samajwadi Party',
    aliases: ['SAMAJWADI PARTY', 'SP', 'SAMAJWADI'],
    flagUrl: '/PartyImages/Samajwadi_Party.png'
  },
  TDP: {
    code: 'TDP',
    name: 'Telugu Desam Party',
    aliases: ['TELUGU DESAM PARTY', 'TDP', 'TELUGU DESAM'],
    flagUrl: '/PartyImages/TDP.jpg'
  },
  NDPP: {
    code: 'NDPP',
    name: 'Nationalist Democratic Progressive Party',
    aliases: ['NATIONALIST DEMOCRATIC PROGRESSIVE PARTY', 'NDPP'],
    flagUrl: '/PartyImages/ndpp.png'
  },
  SKM: {
    code: 'SKM',
    name: 'Sikkim Krantikari Morcha',
    aliases: ['SIKKIM KRANTIKARI MORCHA', 'SKM'],
    flagUrl: '/PartyImages/skm.jfif'
  },
  TVK: {
    code: 'TVK',
    name: 'Tamilaga Vettri Kazhagam',
    aliases: ['TAMILAGA VETTRI KAZHAGAM', 'TVK'],
    flagUrl: '/PartyImages/tvk.webp'
  },
  ZPM: {
    code: 'ZPM',
    name: "Zoram People's Movement",
    aliases: ["ZORAM PEOPLE'S MOVEMENT", "ZORAM PEOPLES MOVEMENT", 'ZPM'],
    flagUrl: '/PartyImages/zpm.jfif'
  },
  AAP: {
    code: 'AAP',
    name: 'Aam Aadmi Party',
    aliases: ['AAM AADMI PARTY', 'AAP'],
    flagUrl: '/PartyImages/India.jpg'
  },
  IND: {
    code: 'IND',
    name: 'Independent',
    aliases: ['INDEPENDENT', 'IND', 'INDEPENDEN', 'OTH', 'OTH PARTY'],
    flagUrl: '/PartyImages/India.jpg'
  }
};

/**
 * Normalizes any party string input to canonical key and party object
 */
export function normalizeParty(partyStr) {
  if (!partyStr || typeof partyStr !== 'string') {
    return { code: 'OTHER', name: 'Independent / Other', flagUrl: '/PartyImages/India.jpg' };
  }

  const clean = partyStr.trim().toUpperCase();

  // 1. Exact match on code or alias first (prevents substring false matches like 'SS' in 'CONGRESS')
  for (const key of Object.keys(PARTY_REGISTRY)) {
    const p = PARTY_REGISTRY[key];
    if (key === clean || p.aliases.some(alias => alias === clean)) {
      return p;
    }
  }

  // 2. Contains match: check if clean string contains full alias (prioritized order)
  for (const key of Object.keys(PARTY_REGISTRY)) {
    const p = PARTY_REGISTRY[key];
    if (p.aliases.some(alias => clean.includes(alias))) {
      return p;
    }
  }

  // 3. Fallback pattern matching for common abbreviations or regional naming
  if (clean.includes('BJP') || clean.includes('JANATA') || clean.includes('JANTA')) return PARTY_REGISTRY.BJP;
  if (clean.includes('UBT') || clean.includes('THACKERAY')) return PARTY_REGISTRY.SS_UBT;
  if (clean.includes('SHIV SENA') || clean.includes('SHS')) return PARTY_REGISTRY.SS;
  if (clean.includes('NCP') || clean.includes('NATIONALIST')) return PARTY_REGISTRY.NCP;
  if (clean.includes('CONGRESS') || clean.includes('INC')) return PARTY_REGISTRY.INC;
  if (clean.includes('TDP') || clean.includes('TELUGU DESAM')) return PARTY_REGISTRY.TDP;
  if (clean.includes('JMM') || clean.includes('MUKTI MORCHA')) return PARTY_REGISTRY.JMM;
  if (clean.includes('SAMAJWADI')) return PARTY_REGISTRY.SP;
  if (clean.includes('MNS')) return PARTY_REGISTRY.MNS;
  if (clean.includes('NDPP')) return PARTY_REGISTRY.NDPP;
  if (clean.includes('SKM')) return PARTY_REGISTRY.SKM;
  if (clean.includes('TVK')) return PARTY_REGISTRY.TVK;
  if (clean.includes('ZPM')) return PARTY_REGISTRY.ZPM;

  return { code: 'OTHER', name: partyStr.trim(), flagUrl: '/PartyImages/India.jpg' };
}
