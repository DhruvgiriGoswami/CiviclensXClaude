// Offline stand-in for /api/v1/audit, built from the hackathon CSVs by scripts/build-audit-mock.py.
import data from './mockData.json';
import { rankSearch } from '../../utils/search';
import { formatINR } from '../../utils/format';
import { pageSocialPosts } from '../../utils/socialPosts';

const SEARCH = [
  ...data.search,
  ...Object.values(data.details).flatMap((d) => d.flags.map((f) => ({ type: 'work_order', id: f.wo_id, label: `${f.wo_id}, ${f.road_id}`, ward_code: f.ward_code }))),
];
const notFound = (what) => Object.assign(new Error(`${what} was not found.`), { status: 404 });
const ID_RE = /BMC25-\d{6}/i;
const DEVANAGARI = /[ऀ-ॿ]/;

function ask({ question = '', complaint_id: given }) {
  const id = (given || question.match(ID_RE)?.[0] || '').toUpperCase();
  const trail = data.trails[id];
  const marathi = DEVANAGARI.test(question) && /(आहे|माझ्या|काय|झालं|तक्रार)/.test(question);
  const language = marathi ? 'mr' : DEVANAGARI.test(question) ? 'hi' : 'en';
  if (!trail) {
    const answer = language === 'mr'
      ? 'तक्रार क्रमांक सापडला नाही. कृपया BMC25-001234 सारखा क्रमांक लिहा.'
      : 'We could not find that complaint. Add a number like BMC25-001234 to your question.';
    return { answer, language, source: 'template', complaint_ids: [], wo_ids: [] };
  }
  const wos = trail.work_orders;
  const cost = wos.reduce((s, w) => s + w.cost_inr, 0);
  const failed = wos.some((w) => w.reopened_within_30d);
  const answer = language === 'mr'
    ? `तुमची तक्रार ${id} (${trail.complaint.locality_text}) ${trail.issue.duplicates} इतर तक्रारींसोबत जोडली आहे. ${wos.length ? `${wos.length} काम आदेश दिले, खर्च ${formatINR(cost)}. ${failed ? 'दुरुस्ती 30 दिवसांत पुन्हा खराब झाली.' : 'दुरुस्ती अजून टिकून आहे.'}` : 'अजून कोणताही काम आदेश जोडलेला नाही.'}`
    : trail.summary;
  return { answer, language, source: 'template', complaint_ids: [id], wo_ids: wos.map((w) => w.wo_id) };
}

export async function handleMock(path, body) {
  const [route, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  if (route === '/overview') return data.overview;
  if (route === '/wards') return data.wards;
  if (route === '/wards.geojson') return data.geojson;
  if (route === '/ask') return ask(body || {});
  if (route === '/complaints') return data.points;
  if (route === '/social-posts') return pageSocialPosts(data.social_posts, Number(params.get('limit') || 10), Number(params.get('offset') || 0));
  if (route === '/search') return { results: rankSearch(SEARCH, params.get('q') || '') };
  let m = route.match(/^\/wards\/(.+)\/summary$/);
  if (m) {
    const d = data.details[m[1]];
    if (!d) throw notFound('Ward');
    const w = d.ward;
    const top = d.flags.slice(0, 3);
    return {
      summary_markdown: `## Ward ${w.ward_code}, ${w.ward_name}\n\n- Spent **${formatINR(w.spend_inr)}** of a **${formatINR(w.budget_inr)}** budget.\n- ${formatINR(w.failed_fix_spend_inr)} went on repairs that failed within 30 days.\n- ${w.flag_count} jobs need a closer look, with ${formatINR(w.amount_at_risk_inr)} at risk.\n\n### Check first\n\n${top.map((f) => `- ${f.wo_id}: ${f.reason}`).join('\n')}\n\nThis is a template summary from synthetic data.`,
      source: 'template',
      wo_ids: top.map((f) => f.wo_id),
    };
  }
  m = route.match(/^\/wards\/(.+)$/);
  if (m) {
    if (!data.details[m[1]]) throw notFound('Ward');
    return data.details[m[1]];
  }
  m = route.match(/^\/next-rupee\/(.+)$/);
  if (m) {
    if (!data.plans[m[1]]) throw notFound('Ward');
    return data.plans[m[1]];
  }
  m = route.match(/^\/complaints\/(.+)$/);
  if (m) {
    const t = data.trails[decodeURIComponent(m[1]).toUpperCase()];
    if (!t) throw notFound('Complaint');
    return t;
  }
  throw notFound('Route');
}

export const mockMarathiComplaintId = () => Object.keys(data.trails).find((k) => data.trails[k].complaint.language === 'mr');
