// Person Avatar Fallback Resolver Engine
// Rules:
// 1. All internet URLs (http/https) are blocked to prevent external calls.
// 2. Known leaders & state CMs map to local /leader_images/ assets.
// 3. Bureaucrats missing photo -> Indian flag (/PartyImages/India.jpg).
// 4. Politicians missing photo -> Party Flag/Logo emblem.

import { normalizeParty } from './partyNormalizer';

export const INDIA_FLAG_AVATAR = '/PartyImages/India.jpg';

const LOCAL_LEADER_MAP = {
  // Prime Minister & President
  'narendra modi': '/leader_images/narendra_modi.jpg',
  'droupadi murmu': '/leader_images/droupadi_murmu.jpg',

  // Union Cabinet / Executive Heads
  'nirmala sitharaman': '/leader_images/nirmala-sitharaman_FinanceMinister.jpg',
  'k. sanjay murthy': '/leader_images/KSanjayMurthi_CAG.png',
  'sanjay murthy': '/leader_images/KSanjayMurthi_CAG.png',
  'sanjay malhotra': '/leader_images/Sanjay_Malhotra_RBI.jpg',

  // 28 States & UTs Leaders
  'a. revanth reddy': '/leader_images/A_Revanth_Reddy_Telangana.jpg',
  'revanth reddy': '/leader_images/A_Revanth_Reddy_Telangana.jpg',
  'anumula revanth reddy': '/leader_images/A_Revanth_Reddy_Telangana.jpg',

  'bhagwant mann': '/leader_images/Bhagwant_Singh_Mann_Punjab.jpg',
  'bhagwant singh mann': '/leader_images/Bhagwant_Singh_Mann_Punjab.jpg',

  'bhajan lal sharma': '/leader_images/Bhajan_Lal_Sharma_Rajasthan.jpg',
  'bhajanlal sharma': '/leader_images/Bhajan_Lal_Sharma_Rajasthan.jpg',

  'bhupendra patel': '/leader_images/Bhupendra_Patel_Gujarat.webp',
  'bhupendrabhai patel': '/leader_images/Bhupendra_Patel_Gujarat.webp',

  'c. joseph vijay': '/leader_images/C_Joseph_Vijay_Tamil_Nadu.png',
  'c joseph vijay': '/leader_images/C_Joseph_Vijay_Tamil_Nadu.png',
  'joseph vijay': '/leader_images/C_Joseph_Vijay_Tamil_Nadu.png',

  'conrad sangma': '/leader_images/Conrad_Kongkal_Sangma_Meghalaya.jpg',
  'conrad kongkal sangma': '/leader_images/Conrad_Kongkal_Sangma_Meghalaya.jpg',

  'd.k. shivakumar': '/leader_images/DK_Shivakumar_Karnataka.png',
  'dk shivakumar': '/leader_images/DK_Shivakumar_Karnataka.png',

  'devendra fadnavis': '/leader_images/Devendra_Fadnavis_Maharashtra.png',

  'hemant soren': '/leader_images/Hemant_Soren_Jharkhand.png',

  'himanta biswa sarma': '/leader_images/Himanta_Biswa_Sarma_Assam.webp',

  'lalduhoma': '/leader_images/Lalduhoma_Mizoram.jpg',

  'manik saha': '/leader_images/Manik_Saha_Tripura.jpg',
  'dr. manik saha': '/leader_images/Manik_Saha_Tripura.jpg',

  'mohan charan majhi': '/leader_images/Mohan_Charan_Majhi_Odisha.jpg',

  'mohan yadav': '/leader_images/Mohan_Yadav_Madhya_Pradesh.jpg',
  'dr. mohan yadav': '/leader_images/Mohan_Yadav_Madhya_Pradesh.jpg',

  'n. chandrababu naidu': '/leader_images/N_Chandrababu_Naidu_Andhra_Pradesh.webp',
  'chandrababu naidu': '/leader_images/N_Chandrababu_Naidu_Andhra_Pradesh.webp',

  'n. rangasamy': '/leader_images/N_Rangaswamy_Puducherry.jpg',
  'n. rangaswamy': '/leader_images/N_Rangaswamy_Puducherry.jpg',

  'nayab singh saini': '/leader_images/Nayab_Singh_Saini_Haryana.jpg',
  'nayab saini': '/leader_images/Nayab_Singh_Saini_Haryana.jpg',

  'neiphiu rio': '/leader_images/Neiphiu_Rio_Nagaland.jpg',

  'omar abdullah': '/leader_images/Omar_Abdullah_Jammu_and_Kashmir.jpg',

  'pema khandu': '/leader_images/Pema_Khandu_Arunachal_Pradesh.webp',

  'pramod sawant': '/leader_images/Pramod_Sawant_Goa.webp',
  'dr. pramod sawant': '/leader_images/Pramod_Sawant_Goa.webp',

  'prem singh tamang': '/leader_images/Prem_Singh_Tamang_Sikkim.jpg',

  'pushkar singh dhami': '/leader_images/Pushkar_Singh_Dhami_Uttarakhand.jpg',

  'rekha gupta': '/leader_images/Rekha_Gupta_Delhi.webp',

  'samrat choudhary': '/leader_images/Samrat_Choudhary_Bihar.webp',

  'sukhvinder singh sukhu': '/leader_images/Sukhvinder_Singh_Sukhu_Himachal_Pradesh.jpg',

  'suvendu adhikari': '/leader_images/Suvendu_Adhikari_West_Bengal.png',

  'v. d. satheesan': '/leader_images/VD_Satheesan_Kerala.png',
  'vd satheesan': '/leader_images/VD_Satheesan_Kerala.png',

  'vishnu deo sai': '/leader_images/Vishnu_Deo_Sai_Chhattisgarh.webp',

  'yogi adityanath': '/leader_images/Yogi_Adityanath_Uttar_Pradesh.jpg',

  'yumnam khemchand singh': '/leader_images/Yumnam_Khemchand_Singh_Manipur.jpg',
  'y. khemchand singh': '/leader_images/Yumnam_Khemchand_Singh_Manipur.jpg',
};

const STATE_CM_PHOTO_MAP = {
  'AP': '/leader_images/N_Chandrababu_Naidu_Andhra_Pradesh.webp',
  'AR': '/leader_images/Pema_Khandu_Arunachal_Pradesh.webp',
  'AS': '/leader_images/Himanta_Biswa_Sarma_Assam.webp',
  'BR': '/leader_images/Samrat_Choudhary_Bihar.webp',
  'CG': '/leader_images/Vishnu_Deo_Sai_Chhattisgarh.webp',
  'GA': '/leader_images/Pramod_Sawant_Goa.webp',
  'GJ': '/leader_images/Bhupendra_Patel_Gujarat.webp',
  'HR': '/leader_images/Nayab_Singh_Saini_Haryana.jpg',
  'HP': '/leader_images/Sukhvinder_Singh_Sukhu_Himachal_Pradesh.jpg',
  'JH': '/leader_images/Hemant_Soren_Jharkhand.png',
  'KA': '/leader_images/DK_Shivakumar_Karnataka.png',
  'KL': '/leader_images/VD_Satheesan_Kerala.png',
  'MP': '/leader_images/Mohan_Yadav_Madhya_Pradesh.jpg',
  'MH': '/leader_images/Devendra_Fadnavis_Maharashtra.png',
  'MN': '/leader_images/Yumnam_Khemchand_Singh_Manipur.jpg',
  'ML': '/leader_images/Conrad_Kongkal_Sangma_Meghalaya.jpg',
  'MZ': '/leader_images/Lalduhoma_Mizoram.jpg',
  'NL': '/leader_images/Neiphiu_Rio_Nagaland.jpg',
  'OD': '/leader_images/Mohan_Charan_Majhi_Odisha.jpg',
  'PB': '/leader_images/Bhagwant_Singh_Mann_Punjab.jpg',
  'RJ': '/leader_images/Bhajan_Lal_Sharma_Rajasthan.jpg',
  'SK': '/leader_images/Prem_Singh_Tamang_Sikkim.jpg',
  'TN': '/leader_images/C_Joseph_Vijay_Tamil_Nadu.png',
  'TG': '/leader_images/A_Revanth_Reddy_Telangana.jpg',
  'TR': '/leader_images/Manik_Saha_Tripura.jpg',
  'UP': '/leader_images/Yogi_Adityanath_Uttar_Pradesh.jpg',
  'UK': '/leader_images/Pushkar_Singh_Dhami_Uttarakhand.jpg',
  'WB': '/leader_images/Suvendu_Adhikari_West_Bengal.png',
  'DL': '/leader_images/Rekha_Gupta_Delhi.webp',
  'JK': '/leader_images/Omar_Abdullah_Jammu_and_Kashmir.jpg',
  'PY': '/leader_images/N_Rangaswamy_Puducherry.jpg',
};

/**
 * Checks if a URL is a valid local photo path (not an external HTTP/HTTPS link)
 */
function isValidLocalPhotoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean === '' || clean.toLowerCase() === 'null' || clean.toLowerCase() === 'undefined') return false;
  if (clean.startsWith('http://') || clean.startsWith('https://')) return false;
  return true;
}

/**
 * Extracts normalized alphanumeric word tokens from a name (removing common titles/honorifics)
 */
function getCleanWords(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .toLowerCase()
    .replace(/\b(shri|smt|dr|mr|mrs|ms|hon'ble)\b\.?/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns the exact avatar image URL for any person (Bureaucrat vs Politician) using local assets
 */
export function getPersonAvatar(person, fallbackType = 'POLITICIAN') {
  if (!person) {
    return INDIA_FLAG_AVATAR;
  }

  // 1. Direct photo property match if valid local path
  const photo = person.photo || person.photo_url || person.photoUrl || person.portrait;
  if (isValidLocalPhotoUrl(photo)) {
    return photo.trim();
  }

  // 2. Direct name match in LOCAL_LEADER_MAP (Strict token matching)
  const personName = (person.name || person.full_name || person.cmName || '').trim();
  const personWords = getCleanWords(personName);

  if (personWords.length > 0) {
    const personNorm = personWords.join(' ');
    const partyRaw = (person.party || person.party_name || person.politicalAffiliation || '').toLowerCase();
    const isTVK = partyRaw.includes('tvk') || partyRaw.includes('tamilaga vettri');

    // TVK Vijay check: only belongs to TVK CM of Tamil Nadu
    if (isTVK && personWords.includes('vijay')) {
      return '/leader_images/C_Joseph_Vijay_Tamil_Nadu.png';
    }

    for (const [key, val] of Object.entries(LOCAL_LEADER_MAP)) {
      const keyWords = getCleanWords(key);
      if (keyWords.length === 0) continue;
      const keyNorm = keyWords.join(' ');

      // Exact normalized full name match (e.g. "c joseph vijay", "devendra fadnavis", "lalduhoma")
      if (personNorm === keyNorm) {
        return val;
      }

      // If the mapped key has 2 or more words (e.g. "narendra modi", "joseph vijay"),
      // require all words of the key to appear in the person's name tokens
      if (keyWords.length >= 2 && keyWords.every(w => personWords.includes(w))) {
        return val;
      }
    }
  }

  // 3. Match by State Code in STATE_CM_PHOTO_MAP (Strictly for Chief Ministers / State Executive heads)
  const isChiefMinister =
    Boolean(person.cmName) ||
    person.isChiefMinister === true ||
    person.roleType === 'CHIEF_MINISTER' ||
    person.headTitle === 'Chief Minister' ||
    /chief minister|\bcm\b/i.test(person.role_title || person.designation || person.title || '');

  if (isChiefMinister) {
    const stCode = (person.stateId || person.state_id || person.stateCode || '').replace(/^IN-/, '').toUpperCase();
    if (stCode && STATE_CM_PHOTO_MAP[stCode]) {
      return STATE_CM_PHOTO_MAP[stCode];
    }
  }

  // Determine if Bureaucrat vs Politician
  const isBureaucrat =
    person.personType === 'BUREAUCRAT' ||
    person.type === 'BUREAUCRATIC' ||
    person.type === 'BUREAUCRAT' ||
    person.isBureaucrat === true ||
    person.authorityType === 'DISTRICT_COLLECTOR_DM' ||
    (person.title && (person.title.includes('Collector') || person.title.includes('Magistrate') || person.title.includes('Commissioner') || person.title.includes('IAS')));

  // Rule: Bureaucrat missing local photo -> Indian Flag
  if (isBureaucrat || fallbackType === 'BUREAUCRAT') {
    return INDIA_FLAG_AVATAR;
  }

  // Rule: Politician missing local photo -> Political Party Flag / Emblem
  const partyStr = person.party || person.politicalAffiliation || person.party_name || person.partyName || '';
  const partyInfo = normalizeParty(partyStr);
  return partyInfo.flagUrl || INDIA_FLAG_AVATAR;
}

