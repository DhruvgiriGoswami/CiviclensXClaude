import React, { useState, useEffect } from 'react';
import {
  Building, UserCheck, ShieldAlert, Cpu, Award, Star, Mail, Phone, MapPin,
  CheckCircle2, AlertTriangle, ArrowRight, Lock, Plus, Activity, Layers, ThumbsUp,
  ChevronRight, ChevronLeft, Vote
} from 'lucide-react';
import { LeaderCard } from './LeaderCard';
import { NationalSpotlight } from './NationalSpotlight';
import { StateLeadershipSpotlight } from './StateLeadershipSpotlight';
import { geographyApi } from '../services/api';
import { getFilteredTickets } from '../utils/ticketHelpers';

export function Sidebar({
  unit,
  currentLevel,
  selectedState,
  onSelectState,
  onSelectUnit,
  allUnits = [],
  onRateLeader,
  onRaiseTicket,
  onUpvoteTicket,
  upvotedTicketIds = [],
  onOpenNationalLeaders,
  tickets,
  isCollapsed: propIsCollapsed,
  setIsCollapsed: propSetIsCollapsed,
  onHoverDistrict,
  onSelectDistrict,
  onHoverTicket,
  onInspectTicket,
  onViewReviews,
  ratingsSummary = {}
}) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(true);
  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalIsCollapsed;
  const setIsCollapsed = propSetIsCollapsed || setInternalIsCollapsed;
  const [activeTab, setActiveTab] = useState('GRIEVANCES'); // Default to 'GRIEVANCES' (Tickets) as primary tab
  const [wardReps, setWardReps] = useState([]);

  useEffect(() => {
    if (unit?.highlightedLeader) {
      setActiveTab('LEADERSHIP');
    }
  }, [unit?.highlightedLeader, unit?.unitId]);

  useEffect(() => {
    if (unit?.unitId) {
      geographyApi.getRepresentatives(unit.unitId)
        .then(reps => {
          if (Array.isArray(reps) && reps.length > 0) {
            const formatted = reps.map(r => ({
              ...r,
              name: r.name || r.person_name || 'Corporator',
              title: r.role_title || r.designation || 'Municipal Corporator',
              party: r.party || r.party_name || 'BJP',
              authority: r.authority || `Elected Municipal Representative for ${unit.unitName || 'this ward'}.`,
              photo: r.photo_url || r.photo || null,
              userRating: r.user_rating != null ? r.user_rating : null,
              totalVotes: r.total_votes != null ? r.total_votes : 0
            }));
            setWardReps(formatted);
          } else {
            setWardReps([]);
          }
        })
        .catch(() => setWardReps([]));
    } else {
      setWardReps([]);
    }
  }, [unit?.unitId, unit?.unitName]);

  const isBengaluru = unit?.unitId?.startsWith('IN-KA-BBMP') || unit?.stateId === 'KA' || unit?.parentCityDistrict?.includes('Bengaluru') || unit?.isElectionUpcoming;

  const handleMobileAutoCollapse = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  const handleSelectStateWithCollapse = (st) => {
    if (onSelectState) onSelectState(st);
    handleMobileAutoCollapse();
  };

  const handleSelectUnitWithCollapse = (u) => {
    if (onSelectUnit) onSelectUnit(u);
    handleMobileAutoCollapse();
  };

  const handleSelectDistrictWithCollapse = (distName, stId, payload) => {
    if (onSelectDistrict) onSelectDistrict(distName, stId, payload);
    handleMobileAutoCollapse();
  };

  const handleInspectTicketWithCollapse = (t) => {
    if (onInspectTicket) onInspectTicket(t);
    handleMobileAutoCollapse();
  };

  const renderContent = () => {
    // LEVEL 1: NATIONAL ZOOM OUT VIEW - Show President & PM First!
    if (currentLevel === 'NATIONAL') {
      return (
        <div className="h-full overflow-y-auto p-5">
          <NationalSpotlight
            onSelectState={handleSelectStateWithCollapse}
            onOpenNationalLeaders={onOpenNationalLeaders}
          />
        </div>
      );
    }

    // LEVEL 2: STATE ZOOM VIEW - Show Chief Minister, Dy CMs, Governor & State Personnel!
    if (currentLevel === 'STATE') {
      return (
        <div className="h-full overflow-y-auto p-5">
          <StateLeadershipSpotlight
            selectedState={selectedState}
            onSelectUnit={handleSelectUnitWithCollapse}
            units={allUnits}
            onHoverDistrict={onHoverDistrict}
            onSelectDistrict={handleSelectDistrictWithCollapse}
          />
        </div>
      );
    }

    // LEVEL 5: MICRO TIER VIEW (Urban Ward / Gram Panchayat / Corporation / District Level)
    const unitTickets = getFilteredTickets(tickets, unit, currentLevel);

    // Dynamic Unit Type & Badge Detector
    const isCorp = unit?.unitType === 'MUNICIPAL_CORPORATION' || unit?.unitType === 'CORPORATION';
    const isUrbanWard = !isCorp && (
      unit?.unitType === 'URBAN_WARD' ||
      unit?.unitType === 'WARD' ||
      unit?.unitId?.includes('WARD') ||
      unit?.unitId?.includes('Ward') ||
      unit?.unitId?.includes('M_Corp') ||
      unit?.unitId?.includes('JMC') ||
      unit?.unitId?.includes('BMC') ||
      unit?.unitId?.includes('TMC') ||
      unit?.unitId?.includes('NMMC') ||
      unit?.unitId?.includes('KDMC') ||
      unit?.unitId?.includes('PMC') ||
      unit?.unitId?.includes('BBMP') ||
      unit?.unitName?.toLowerCase().includes('ward') ||
      unit?.unitName?.includes('(M Corp.)') ||
      unit?.parentCityDistrict?.toLowerCase().includes('corporation')
    );
    const isDistrict = !isCorp && !isUrbanWard && (
      unit?.unitType === 'DISTRICT' ||
      unit?.unitId?.includes('-DIST-')
    );

    const badgeText = isCorp
      ? '🏛️ Municipal Corporation'
      : isUrbanWard
        ? '🏢 Urban Municipal Ward'
        : isDistrict
          ? '🏛️ District Region'
          : '🌳 Rural Gram Panchayat';

    const badgeStyle = isCorp
      ? 'bg-amber-500/20 text-amber-400 light:text-amber-700 border-amber-500/40'
      : isUrbanWard
        ? 'bg-crimson-500/20 text-crimson-400 light:text-crimson-700 border-crimson-500/40'
        : isDistrict
          ? 'bg-sky-500/20 text-sky-400 light:text-sky-700 border-sky-500/40'
          : 'bg-emerald-500/20 text-emerald-400 light:text-emerald-700 border-emerald-500/40';

    return (
      <div className="flex flex-col h-full overflow-hidden">

        {/* Sidebar Top Header */}
        <div className="p-5 border-b border-slate-800/80 light:border-slate-200 bg-slate-900/90 light:bg-white relative">
          <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap ${badgeStyle}`}>
              {badgeText}
            </span>
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar text-right">
              <span
                className="text-[10px] font-mono text-slate-400 light:text-slate-600 font-bold inline-block whitespace-nowrap"
                title={unit?.unitId}
              >
                ID: {unit?.unitId}
              </span>
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-white light:text-slate-900 font-sans truncate">{unit?.unitName}</h2>
          <p className="text-xs text-slate-400 light:text-slate-600 font-mono flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-crimson-500 flex-shrink-0" />
            <span className="truncate">{unit?.parentCityDistrict}</span>
          </p>

          {/* Navigation Tabs - Tickets Primary (Left), Leaders Secondary (Right) */}
          {(() => {
            const isLeaderHighlighted = (ldr) => {
              if (!unit?.highlightedLeader || !ldr) return false;
              const hName = (unit.highlightedLeader.name || unit.highlightedLeader.person_name || '').trim().toLowerCase();
              const lName = (ldr.name || ldr.person_name || '').trim().toLowerCase();
              if (hName && lName && hName === lName) return true;

              const hId = unit.highlightedLeader.id || unit.highlightedLeader.person_id || unit.highlightedLeader.leader_id || unit.highlightedLeader.rep_id;
              const lId = ldr.id || ldr.person_id || ldr.leader_id || ldr.rep_id || ldr.assignment_id;
              if (hId && lId && String(hId) === String(lId)) return true;

              return false;
            };

            const displayWardReps = unit?.highlightedLeader
              ? wardReps.filter(rep => !isLeaderHighlighted(rep))
              : wardReps;

            const displayPoliticalVoices = (Array.isArray(unit?.politicalVoices) ? unit.politicalVoices : [])
              .filter(voice => !isLeaderHighlighted(voice));

            const displaySingleVoice = unit?.politicalVoice && !isLeaderHighlighted(unit.politicalVoice)
              ? unit.politicalVoice
              : null;

            const displayAdminSpender = unit?.administrativeSpender && !isLeaderHighlighted(unit.administrativeSpender)
              ? unit.administrativeSpender
              : null;

            let actualLeaderCount = 0;
            if (unit?.highlightedLeader) actualLeaderCount++;
            if (isBengaluru) {
              if (displayAdminSpender?.name) actualLeaderCount++;
            } else if (displayWardReps.length > 0) {
              actualLeaderCount += displayWardReps.length;
              if (displayAdminSpender?.name) actualLeaderCount++;
            } else if (displayPoliticalVoices.length > 0) {
              actualLeaderCount += displayPoliticalVoices.length;
              if (displayAdminSpender?.name) actualLeaderCount++;
            } else {
              if (displaySingleVoice?.name) actualLeaderCount++;
              if (displayAdminSpender?.name) actualLeaderCount++;
            }

            const leaderTabLabel = actualLeaderCount > 0 ? `Leaders (${actualLeaderCount})` : 'Leaders';

            return (
              <div className="flex items-center space-x-1 mt-4 bg-slate-950 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-300 text-[11px] font-mono">
                <button
                  onClick={() => setActiveTab('GRIEVANCES')}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${activeTab === 'GRIEVANCES' ? 'bg-crimson-600 text-white font-bold' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                    }`}
                >
                  Tickets ({unitTickets.length})
                </button>
                <button
                  onClick={() => setActiveTab('LEADERSHIP')}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${activeTab === 'LEADERSHIP' ? 'bg-crimson-600 text-white font-bold' : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900'
                    }`}
                >
                  {leaderTabLabel}
                </button>
              </div>
            );
          })()}
        </div>

        {/* Dynamic Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* TAB 1: REGIONAL LEADERSHIP SPOTLIGHT */}
          {activeTab === 'LEADERSHIP' && (() => {
            const isLeaderHighlighted = (ldr) => {
              if (!unit?.highlightedLeader || !ldr) return false;
              const hName = (unit.highlightedLeader.name || unit.highlightedLeader.person_name || '').trim().toLowerCase();
              const lName = (ldr.name || ldr.person_name || '').trim().toLowerCase();
              if (hName && lName && hName === lName) return true;

              const hId = unit.highlightedLeader.id || unit.highlightedLeader.person_id || unit.highlightedLeader.leader_id || unit.highlightedLeader.rep_id;
              const lId = ldr.id || ldr.person_id || ldr.leader_id || ldr.rep_id || ldr.assignment_id;
              if (hId && lId && String(hId) === String(lId)) return true;

              return false;
            };

            const displayWardReps = unit?.highlightedLeader
              ? wardReps.filter(rep => !isLeaderHighlighted(rep))
              : wardReps;

            const displayPoliticalVoices = (Array.isArray(unit?.politicalVoices) ? unit.politicalVoices : [])
              .filter(voice => !isLeaderHighlighted(voice));

            const displaySingleVoice = unit?.politicalVoice && !isLeaderHighlighted(unit.politicalVoice)
              ? unit.politicalVoice
              : null;

            const displayAdminSpender = unit?.administrativeSpender && !isLeaderHighlighted(unit.administrativeSpender)
              ? unit.administrativeSpender
              : null;

            return (
              <div className="space-y-4">
                {unit?.highlightedLeader && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-2 shadow-md">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1">⭐ Selected Representative Profile</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40">Search Target</span>
                    </div>
                    <LeaderCard
                      leader={unit.highlightedLeader}
                      type={unit.highlightedLeader.roleType === 'BUREAUCRAT' ? 'ADMINISTRATIVE' : 'POLITICAL'}
                      onRateClick={onRateLeader}
                      onViewReviews={onViewReviews}
                      ratingsSummary={ratingsSummary}
                    />
                  </div>
                )}

                {/* Political Voice Card / Banner */}
                {isBengaluru ? (
                  <div className="glass-card rounded-2xl p-4 border border-amber-500/40 bg-slate-900/95 light:bg-amber-50/70 text-slate-100 light:text-slate-900 shadow-md relative overflow-hidden space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-amber-500/20 text-amber-400 light:text-amber-700 border-amber-500/40 flex items-center gap-1.5">
                        <Vote className="w-3.5 h-3.5" />
                        🏛 Elections Upcoming
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 light:text-amber-700 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        In 2–3 Months
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-white light:text-slate-900 font-sans">
                        GBA Municipal Ward Elections
                      </h4>
                      <p className="text-xs text-slate-300 light:text-slate-700 mt-1 leading-relaxed">
                        The municipal ward council elections for Greater Bengaluru Authority (GBA) are scheduled in <strong>2–3 months</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 light:bg-white border border-slate-800 light:amber-200 text-xs font-mono space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 light:text-slate-600">Current Governance:</span>
                        <span className="text-amber-400 light:text-amber-700 font-bold">Administrator / Ward Committee</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 light:text-slate-600">Corporator Data:</span>
                        <span className="text-slate-400 light:text-slate-500 italic">No Active Representatives</span>
                      </div>
                    </div>
                  </div>
                ) : displayWardReps.length > 0 ? (
                  displayWardReps.map((rep, idx) => (
                    <LeaderCard
                      key={rep.assignment_id || idx}
                      leader={rep}
                      type="POLITICAL"
                      onRateClick={onRateLeader}
                      onViewReviews={onViewReviews}
                      ratingsSummary={ratingsSummary}
                    />
                  ))
                ) : displayPoliticalVoices.length > 0 ? (
                  displayPoliticalVoices.map((voice, idx) => (
                    <LeaderCard
                      key={idx}
                      leader={voice}
                      type="POLITICAL"
                      onRateClick={onRateLeader}
                      onViewReviews={onViewReviews}
                      ratingsSummary={ratingsSummary}
                    />
                  ))
                ) : displaySingleVoice && displaySingleVoice.name ? (
                  <LeaderCard
                    leader={displaySingleVoice}
                    type="POLITICAL"
                    onRateClick={onRateLeader}
                    onViewReviews={onViewReviews}
                    ratingsSummary={ratingsSummary}
                  />
                ) : null}

                {/* Administrative Spender Card */}
                {displayAdminSpender && displayAdminSpender.name ? (
                  <LeaderCard
                    leader={displayAdminSpender}
                    type="ADMINISTRATIVE"
                    onRateClick={onRateLeader}
                    onViewReviews={onViewReviews}
                    ratingsSummary={ratingsSummary}
                  />
                ) : null}

                {/* Empty state when no leaders exist */}
                {!isBengaluru && !unit?.highlightedLeader && displayWardReps.length === 0 && displayPoliticalVoices.length === 0 && (!displaySingleVoice || !displaySingleVoice.name) && (!displayAdminSpender || !displayAdminSpender.name) && (
                  <div className="text-center p-6 glass-card light:bg-white rounded-2xl border border-slate-800 light:border-slate-200 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 light:bg-slate-100 flex items-center justify-center mx-auto text-slate-400 light:text-slate-600">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white light:text-slate-900 font-sans">No Assigned Representatives</h4>
                    <p className="text-xs text-slate-400 light:text-slate-600 font-mono">Official ward representatives & administrative sign-off authorities will appear here once designated.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 4: CIVIC GRIEVANCES & DISPUTE LOCKS */}
          {activeTab === 'GRIEVANCES' && (
            <div className="space-y-4">
              <button
                onClick={onRaiseTicket}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-crimson-600 to-crimson-700 hover:from-crimson-500 hover:to-crimson-600 text-white text-xs font-sans font-bold uppercase tracking-wider transition-all shadow-lg shadow-crimson-600/30 flex items-center justify-center space-x-2"
              >
                <span>Raise Civic Ticket in {unit?.unitName}</span>
              </button>

              {/* Ticket Filter Header */}
              {(() => {
                const isDistrict = currentLevel === 'DISTRICT' || unit?.unitType === 'DISTRICT' || unit?.unitId?.includes('-DIST-');
                const isCorp = !isDistrict && (currentLevel === 'CORPORATION' || unit?.unitType === 'MUNICIPAL_CORPORATION');
                const levelLabel = isDistrict ? 'District' : isCorp ? 'Corporation' : 'Ward';

                return (
                  <>
                    <div className="text-[10px] font-mono text-slate-400 light:text-slate-600 flex items-center justify-between px-1">
                      <span>Displaying Live {levelLabel} Grievances:</span>
                      <span className="font-bold text-crimson-400">{unitTickets.length} Tickets Found</span>
                    </div>

                    <div className="space-y-3 font-mono text-xs">
                      {unitTickets.length === 0 ? (
                        <div className="text-center p-6 glass-card rounded-2xl border border-slate-800 light:border-slate-200">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                          <h5 className="text-xs font-bold text-white light:text-slate-900">No Active {levelLabel} Tickets</h5>
                          <p className="text-[10px] text-slate-400 light:text-slate-600 mt-1">
                            No active civic grievances reported for {unit?.unitName || 'this region'}. All civic systems operational!
                          </p>
                        </div>
                      ) : (
                        unitTickets.map((t) => {
                          const hasUpvoted = upvotedTicketIds.includes(t.ticketId);

                          return (
                            <div
                              key={t.ticketId}
                              onMouseEnter={() => onHoverTicket && onHoverTicket(t.ticketId)}
                              onMouseLeave={() => onHoverTicket && onHoverTicket(null)}
                              onClick={() => handleInspectTicketWithCollapse(t)}
                              className="glass-card p-3.5 rounded-2xl border border-slate-800 light:border-slate-200 light:bg-white space-y-2.5 shadow-sm hover:border-crimson-500/60 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-crimson-500 font-extrabold text-[11px] truncate max-w-[200px] group-hover:text-crimson-400 transition-colors">{t.category}</span>
                                <div className="flex items-center gap-1.5">
                                  {t.upvotes >= 30 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-crimson-500/20 text-crimson-400 border border-crimson-500/40 animate-pulse">
                                      CRITICAL
                                    </span>
                                  ) : t.upvotes >= 15 ? (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                      HIGH
                                    </span>
                                  ) : null}
                                  <span className="text-[9px] px-2 py-0.5 rounded bg-slate-900 light:bg-slate-100 text-slate-400 light:text-slate-600 border border-slate-800 light:border-slate-200">
                                    {t.createdAt}
                                  </span>
                                </div>
                              </div>

                              {/* Ward / Location Tag */}
                              {t.wardName && (
                                <div className="text-[10px] text-slate-400 light:text-slate-600 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-crimson-500 flex-shrink-0" />
                                  <span className="truncate">{t.wardName} ({t.districtName || t.stateId})</span>
                                </div>
                              )}

                              <p className="text-xs font-sans text-slate-200 light:text-slate-800 font-medium leading-relaxed">{t.description}</p>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-800 light:border-slate-200 text-[10px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!hasUpvoted && onUpvoteTicket) onUpvoteTicket(t.ticketId);
                                  }}
                                  disabled={hasUpvoted}
                                  className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 font-bold ${
                                    hasUpvoted
                                      ? 'bg-crimson-500/20 text-crimson-400 border-crimson-500/40 cursor-default opacity-90'
                                      : 'bg-slate-900 light:bg-slate-100 hover:bg-crimson-500/20 text-slate-300 light:text-slate-800 hover:text-crimson-500 border border-slate-800 light:border-slate-200'
                                  }`}
                                  title={hasUpvoted ? "You have already upvoted this ticket" : "Upvote ticket"}
                                >
                                  <ThumbsUp className={`w-3 h-3 ${hasUpvoted ? 'text-crimson-400 fill-crimson-400' : 'text-crimson-500'}`} />
                                  <span>{hasUpvoted ? `Upvoted (${t.upvotes})` : `Upvote (${t.upvotes})`}</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInspectTicketWithCollapse(t);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 flex items-center gap-1 font-bold text-[10px] transition-colors"
                                >
                                  <span>View Details</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Bottom Bar / Drawer Overlay (<1024px) */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 transition-all duration-300 ease-in-out pointer-events-auto">
        <div
          className={`glass-panel border-t border-slate-800 light:border-slate-200 flex flex-col shadow-2xl transition-all duration-300 rounded-t-3xl ${
            isCollapsed
              ? 'h-12 bg-slate-900/95 light:bg-white overflow-hidden'
              : 'h-[75dvh] max-h-[85dvh] bg-slate-950/98 light:bg-white pb-[env(safe-area-inset-bottom)]'
          }`}
        >
          {/* Mobile Handle Bar */}
          <button
            id="governance-panel-step-mobile"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full h-12 flex items-center justify-between px-4 py-2 bg-slate-900/90 light:bg-slate-100 border-b border-slate-800/60 light:border-slate-200 rounded-t-3xl cursor-pointer hover:bg-slate-800/80 light:hover:bg-slate-200 transition-colors flex-shrink-0"
          >
            <div className="flex items-center space-x-2">
              <span className="w-8 h-1 rounded-full bg-slate-600 light:bg-slate-400 inline-block"></span>
              <span className="text-xs font-bold text-slate-200 light:text-slate-900 font-sans truncate">
                {unit ? unit.unitName : 'Civic Spotlight & Governance Panel'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-crimson-400 light:text-crimson-700 font-bold font-mono">
              <span>{isCollapsed ? 'Expand Panel' : 'Collapse'}</span>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-90'}`} />
            </div>
          </button>

          {/* Drawer Body Content */}
          {!isCollapsed && (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex-1">
                {renderContent()}
              </div>
              <div className="py-2.5 px-4 border-t border-slate-800/80 light:border-slate-200 bg-slate-900/60 light:bg-slate-50 text-center font-mono text-xs text-slate-400 light:text-slate-600 flex-shrink-0">
                Made with ❤️ by{' '}
                <a
                  href="https://www.linkedin.com/in/dhruvgiri-goswami-745b01159/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-crimson-400 light:text-crimson-600 hover:text-crimson-300 font-bold hover:underline"
                >
                  Dhruvgiri Goswami
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Side Panel Layout (>=1024px) */}
      <div className="hidden lg:flex relative flex-col h-full z-20 transition-all duration-300 ease-in-out">
        {/* Floating Expand/Collapse Toggle Tab Button */}
        <button
          id="governance-panel-step"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute top-4 ${isCollapsed ? 'right-4' : '-left-4'} z-30 w-8 h-10 bg-slate-900/90 light:bg-white hover:bg-slate-800 light:hover:bg-slate-100 text-slate-200 light:text-slate-700 border border-slate-700/80 light:border-slate-300 rounded-l-xl flex items-center justify-center shadow-2xl transition-all duration-300 backdrop-blur-md group hover:border-crimson-500`}
          title={isCollapsed ? "Expand Leadership Panel" : "Collapse Panel to Right"}
          aria-label={isCollapsed ? "Expand Panel" : "Collapse Panel"}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-5 h-5 text-crimson-400 group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-300 light:text-slate-600 group-hover:text-crimson-400 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Collapsible Sidebar Body Panel */}
        <aside
          className={`glass-panel border-l border-slate-800 light:border-slate-200 flex flex-col h-full shadow-2xl transition-all duration-300 ease-in-out ${
            isCollapsed
              ? 'w-0 p-0 opacity-0 overflow-hidden border-l-0 pointer-events-none'
              : 'w-[420px] overflow-hidden opacity-100'
          }`}
        >
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden">
              {renderContent()}
            </div>
            <div className="py-2.5 px-4 border-t border-slate-800/80 light:border-slate-200 bg-slate-900/60 light:bg-slate-50 text-center font-mono text-xs text-slate-400 light:text-slate-600 flex-shrink-0">
              Made with ❤️ by{' '}
              <a
                href="https://www.linkedin.com/in/dhruvgiri-goswami-745b01159/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-crimson-400 light:text-crimson-600 hover:text-crimson-300 font-bold hover:underline"
              >
                Dhruvgiri Goswami
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
