// Run with `npm test`. Hackathon complaints must land in the same area lists as citizen tickets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditTicket, getFilteredTickets } from './ticketHelpers.js';

const row = { complaint_id: 'BMC25-000005', lat: 19.0005, lon: 72.8347, issue_state: 'fixed', category: 'Pothole',
  description: 'paani bhar gaya', status: 'Resolved', upvotes: 35, received_at: '2025-06-01T08:26', unit_id: 'IN-MH-BMC-WARD-203' };

test('a hackathon complaint becomes a read-only ticket in its ward', () => {
  const t = auditTicket(row);
  assert.equal(t.source, 'audit');
  assert.equal(t.unitId, 'IN-MH-BMC-WARD-203');
  assert.equal(t.latitude, 19.0005);
  assert.equal(getFilteredTickets([t], { unitId: 'IN-MH-BMC-WARD-203', unitName: 'Ward 203' }, 'WARD').length, 1);
  assert.equal(getFilteredTickets([t], { unitId: 'IN-MH-BMC-WARD-40', unitName: 'Ward 40' }, 'WARD').length, 0);
});

test('BMC tickets show under the corporation and both Mumbai districts, not other BMCs', () => {
  const t = auditTicket(row);
  assert.equal(getFilteredTickets([t], { unitId: 'IN-MH-BMC', unitName: 'BMC' }, 'CORPORATION').length, 1);
  for (const [unitId, unitName] of [['IN-MH-DIST-MUMBAI_CITY', 'Mumbai City District'], ['IN-MH-DIST-SUB_URBAN_MUMBAI', 'Mumbai Suburban District']]) {
    assert.equal(getFilteredTickets([t], { unitId, unitName, unitType: 'DISTRICT' }, 'DISTRICT').length, 1, unitId);
  }
  const bhopal = auditTicket({ ...row, unit_id: 'IN-MP-BMC-WARD-1' });
  assert.equal(getFilteredTickets([bhopal], { unitId: 'IN-MH-DIST-MUMBAI_CITY', unitName: 'Mumbai City District', unitType: 'DISTRICT' }, 'DISTRICT').length, 0);
});

test('a complaint outside every boundary has no area', () => {
  assert.equal(auditTicket({ ...row, unit_id: null }).unitId, '');
});
