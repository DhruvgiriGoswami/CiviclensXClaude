import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { Header } from './components/Header';
import { LevelBreadcrumb } from './components/LevelBreadcrumb';
import { MapContainer } from './components/MapContainer';
import { Sidebar } from './components/Sidebar';
import { NationalLeadersBar } from './components/NationalLeadersBar';
import { LeaderRatingModal } from './components/LeaderRatingModal';
import { LeaderReviewsModal } from './components/LeaderReviewsModal';
import { GrievanceModal } from './components/GrievanceModal';
import { TicketDetailsModal } from './components/TicketDetailsModal';
import { AppTour } from './components/AppTour';
import { ThemeProvider } from './context/ThemeContext';

import { complaintsApi, authorityApi } from './services/api';
import { getMediaUrl } from './utils/ticketHelpers';
import { CentralAuthorityDashboard } from './components/centralAuthority/CentralAuthorityDashboard';

import CivicLensIntro from "./components/civicLensIntro/CivicLensIntro";
import FinancialArchitecture from "./pages/FinancialArchitecture/FinancialArchitecture";
import FollowTheRupee from "./pages/FollowTheRupee/FollowTheRupee";

export function AppContent({ navigateTo }) {
  // Intro State
  const INTRO_STORAGE_KEY = "civiclens_intro_seen";

  const [showIntro, setShowIntro] = useState(() => {
    // First visit only. In development, add ?intro to the URL to replay it.
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('intro')) return true;
    try {
      return localStorage.getItem(INTRO_STORAGE_KEY) !== "true";
    } catch {
      return false;
    }
  });
  const [showTour, setShowTour] = useState(false);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null); // Default null for India Macro View
  const [selectedState, setSelectedState] = useState(null); // Default null for India Macro View
  const [currentLevel, setCurrentLevel] = useState('NATIONAL'); // Default NATIONAL so India Map & Leaders show first!

  // Modals, Sidebar & Pinning state (Sidebar collapsed by default on mobile for immediate map & button access)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024;
    }
    return false;
  });
  const [isNationalLeadersOpen, setIsNationalLeadersOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [ratingsSummary, setRatingsSummary] = useState({});
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [isPinningMode, setIsPinningMode] = useState(false);

  // Hover & Modal Inspection states for Districts & Tickets
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [hoveredTicketId, setHoveredTicketId] = useState(null);
  const [inspectedTicket, setInspectedTicket] = useState(null);
  const [focusedTicketId, setFocusedTicketId] = useState(null);

  // Persistent upvoted tickets list
  const [upvotedTicketIds, setUpvotedTicketIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('civiclens_upvoted_tickets') || '[]');
    } catch {
      return [];
    }
  });

  const handleUpvoteTicket = (ticketId) => {
    if (!ticketId) return;
    const cleanId = Number(ticketId) || ticketId;
    if (upvotedTicketIds.includes(cleanId)) return;

    setUpvotedTicketIds(prev => {
      const next = [...prev, cleanId];
      try {
        localStorage.setItem('civiclens_upvoted_tickets', JSON.stringify(next));
      } catch {}
      return next;
    });

    setTickets(prev => prev.map(t => {
      if (t.ticketId === cleanId || t.ticketId === ticketId) {
        return { ...t, upvotes: (t.upvotes || 0) + 1 };
      }
      return t;
    }));

    setInspectedTicket(prev => {
      if (prev && (prev.ticketId === cleanId || prev.ticketId === ticketId)) {
        return { ...prev, upvotes: (prev.upvotes || 0) + 1 };
      }
      return prev;
    });

    // Persist upvote to backend database
    complaintsApi.upvoteComplaint(cleanId)
      .then(res => {
        if (res && typeof res.upvotes === 'number') {
          setTickets(prev => prev.map(t => {
            if (t.ticketId === cleanId || t.ticketId === ticketId) {
              return { ...t, upvotes: res.upvotes };
            }
            return t;
          }));
          setInspectedTicket(prev => {
            if (prev && (prev.ticketId === cleanId || prev.ticketId === ticketId)) {
              return { ...prev, upvotes: res.upvotes };
            }
            return prev;
          });
        }
      })
      .catch(err => {
        console.warn('Backend upvote persistence warning:', err.message);
      });
  };

  // All complaints are dynamically loaded from the PostgreSQL database & S3
  const [tickets, setTickets] = useState([]);

  // Initial load: Fetch all live complaints dynamically from database
  useEffect(() => {
    complaintsApi.listComplaints({ page_size: 100 })
      .then(data => {
        if (data && data.items && data.items.length > 0) {
          const liveTickets = data.items.map(item => {
            const firstMedia = item.media && item.media.length > 0 ? item.media[0] : null;
            const mediaUrl = firstMedia ? getMediaUrl(firstMedia.storage_url) : null;
            return {
              ticketId: item.complaint_id,
              unitId: item.resolved_geo_unit_id || 'IN-NATIONAL',
              category: item.category || "General Grievance",
              description: item.description || item.title,
              latitude: item.latitude,
              longitude: item.longitude,
              status: item.status || "OPEN",
              severity: item.priority || "HIGH",
              upvotes: typeof item.upvotes === 'number' ? item.upvotes : 3,
              reporter: item.user_id ? `Citizen #${item.user_id}` : "Citizen",
              createdAt: new Date(item.created_at).toLocaleDateString("en-IN"),
              photo: mediaUrl,
              mediaUrl: mediaUrl,
              media: item.media || [],
            };
          });
          setTickets(liveTickets);
        }
      })
      .catch(err => console.warn('Initial complaints fetch note:', err.message));

    // Fetch live ratings summary for all politicians and bureaucrats across India
    authorityApi.getRatingsSummary()
      .then(res => {
        if (res && res.ratings) {
          setRatingsSummary(res.ratings);
        }
      })
      .catch(err => console.warn('Ratings summary initial fetch note:', err));
  }, []);

  // Fetch complaints, political representatives, and officers dynamically for selected ward
  useEffect(() => {
    if (!selectedUnit?.unitId) return;

    // 1. Fetch complaints for selected ward from API
    complaintsApi.listComplaints({ geo_unit_id: selectedUnit.unitId, page_size: 50 })
      .then(data => {
        // If the API returns valid items
        if (data && data.items && data.items.length > 0) {
          const wardTickets = data.items.map(item => {
            const firstMedia = item.media && item.media.length > 0 ? item.media[0] : null;
            const mediaUrl = firstMedia ? getMediaUrl(firstMedia.storage_url) : null;
            return {
              ticketId: item.complaint_id,
              unitId: item.resolved_geo_unit_id || selectedUnit.unitId,
              category: item.category || "General Grievance",
              description: item.description || item.title,
              latitude: item.latitude,
              longitude: item.longitude,
              status: item.status || "OPEN",
              severity: item.priority || "HIGH",
              upvotes: typeof item.upvotes === 'number' ? item.upvotes : 3,
              reporter: item.user_id === 4 ? "Dhruv Sharma" : item.user_id === 5 ? "Yash Sharma" : (item.user_id ? `User #${item.user_id}` : "Dhruv"),
              createdAt: new Date(item.created_at).toLocaleDateString("en-IN"),
              photo: mediaUrl,
              mediaUrl: mediaUrl,
              media: item.media || [],
            };
          });

          setTickets(prev => {
            const existingIds = new Set(wardTickets.map(t => t.ticketId));
            const otherTickets = prev.filter(t => !existingIds.has(t.ticketId));
            return [...wardTickets, ...otherTickets];
          });
        } else {
          // OPTIONAL: Clear tickets or handle empty states when changing wards
          // setTickets([]); 
        }
      })
      .catch(err => console.warn('Backend complaints fetch info:', err.message));


    // 2. Fetch political representatives from backend API
    authorityApi.getPoliticalRepresentatives(selectedUnit.unitId)
      .then(pols => {
        if (pols && pols.length > 0) {
          const formattedPols = pols.map(mainPol => {
            const nameClean = mainPol.person?.full_name?.replace('[DEMO] ', '') || mainPol.person?.full_name || mainPol.person_name || mainPol.name;
            return {
              name: nameClean,
              title: mainPol.role_title || mainPol.designation || "Elected Corporator",
              party: mainPol.party?.abbreviation || mainPol.party?.name || mainPol.party || "BJP",
              roleType: "POLITICAL_RECOMMENDER",
              photo: mainPol.photo_url || null,
              authority: `Elected representative for ${selectedUnit.unitName}. Recommends civic development funds.`
            };
          });

          setSelectedUnit(prev => {
            if (prev?.unitId !== selectedUnit.unitId) return prev;
            return {
              ...prev,
              politicalVoice: formattedPols[0],
              politicalVoices: formattedPols
            };
          });
        }
      })
      .catch(err => console.warn('Political rep fetch info:', err.message));

    // 3. Fetch administrative officers from backend API
    authorityApi.getOfficers(selectedUnit.unitId)
      .then(offs => {
        if (offs && offs.length > 0) {
          const mainOff = offs[0];
          const nameClean = mainOff.person?.full_name?.replace('[DEMO] ', '') || mainOff.person?.full_name;
          setSelectedUnit(prev => {
            if (prev?.unitId !== selectedUnit.unitId) return prev;
            return {
              ...prev,
              administrativeSpender: {
                ...prev.administrativeSpender,
                name: nameClean || prev.administrativeSpender?.name,
                title: mainOff.designation || mainOff.person?.designation || prev.administrativeSpender?.title,
                authority: `Oversees project execution for ${prev.unitName}.`
              }
            };
          });
        }
      })
      .catch(err => console.warn('Officer fetch info:', err.message));
  }, [selectedUnit?.unitId]);

  const autoCollapseSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarCollapsed(true);
    }
  };

  // Map & Level Handlers
  const handleSelectUnit = (unit) => {
    if (!unit) return;
    setSelectedUnit(unit);
    if (unit.unitType === 'MUNICIPAL_CORPORATION') {
      setCurrentLevel('CORPORATION');
    } else if (unit.unitType === 'DISTRICT' || (unit.unitId && unit.unitId.includes('-DIST-'))) {
      setCurrentLevel('DISTRICT');
    } else {
      setCurrentLevel('WARD');
    }
    const stId = unit.stateId || (unit.unitId ? unit.unitId.split('-')[1] : null) || (unit.unitId?.includes('BHAVNAGAR') ? 'GJ' : 'MH');
    setSelectedState(prev => prev?.stateId === stId ? prev : { stateId: stId });
    autoCollapseSidebarOnMobile();
  };

  const handleSelectState = (stateObj) => {
    if (!stateObj) return;
    setSelectedState(stateObj);
    setSelectedUnit(null);
    setCurrentLevel('STATE');
    autoCollapseSidebarOnMobile();
  };

  const handleSelectDistrict = (districtName, stateId, customUnit) => {
    setCurrentLevel('DISTRICT');
    if (customUnit && customUnit.unitId) {
      const stId = customUnit.stateId || stateId || selectedState?.stateId || 'MH';
      setSelectedUnit(customUnit);
      if (!selectedState || selectedState.stateId !== stId) {
        setSelectedState({ stateId: stId });
      }
      autoCollapseSidebarOnMobile();
      return;
    }
    if (districtName) {
      const cleanName = districtName.replace(/\s+District$/i, '').trim();
      const stId = stateId || selectedState?.stateId || selectedUnit?.stateId || 'MH';
      const distUnitId = `IN-${stId}-DIST-${cleanName.toUpperCase().replace(/[\s\-_]+/g, '')}`;
      setSelectedUnit({
        unitId: distUnitId,
        id: distUnitId,
        unitName: `${cleanName} District`,
        districtName: cleanName,
        unitType: 'DISTRICT',
        stateId: stId,
        coordinates: selectedUnit?.coordinates
      });
      if (!selectedState || selectedState.stateId !== stId) {
        setSelectedState({ stateId: stId });
      }
      autoCollapseSidebarOnMobile();
    }
  };

  const handleSelectCorporation = (corpUnit) => {
    if (!corpUnit) return;
    setSelectedUnit(corpUnit);
    setCurrentLevel('CORPORATION');
    const stId = corpUnit.stateId || (corpUnit.unitId ? corpUnit.unitId.split('-')[1] : null) || (corpUnit.unitId?.includes('BHAVNAGAR') ? 'GJ' : 'MH');
    setSelectedState(prev => prev?.stateId === stId ? prev : { stateId: stId });
    autoCollapseSidebarOnMobile();
  };

  const handleSelectWard = (wardUnit) => {
    if (!wardUnit) return;
    setSelectedUnit(wardUnit);
    setCurrentLevel('WARD');
    const stId = wardUnit.stateId || (wardUnit.unitId ? wardUnit.unitId.split('-')[1] : null) || (wardUnit.unitId?.includes('BHAVNAGAR') ? 'GJ' : 'MH');
    setSelectedState(prev => prev?.stateId === stId ? prev : { stateId: stId });
    autoCollapseSidebarOnMobile();
  };

  const handleResetToNational = () => {
    setCurrentLevel('NATIONAL');
    setSelectedState(null);
    setSelectedUnit(null);
    autoCollapseSidebarOnMobile();
  };

  // Rating Submitted Handler
  const handleRatingSubmitted = ({ leaderId, leaderName, leaderType, newRating, newVotes }) => {
    // 1. Immediately update local ratingsSummary state for instant reactivity across all cards
    setRatingsSummary(prev => {
      const next = { ...prev };
      const data = {
        average_rating: newRating,
        total_reviews: newVotes
      };
      if (leaderName) {
        next[leaderName] = data;
        next[leaderName.trim().toLowerCase()] = data;
      }
      if (leaderId) {
        next[String(leaderId)] = data;
      }
      return next;
    });

    // 2. Also re-fetch live ratings summary from DB in background
    authorityApi.getRatingsSummary()
      .then(res => {
        if (res && res.ratings) {
          setRatingsSummary(res.ratings);
        }
      })
      .catch(err => console.warn('Ratings summary refresh note:', err));

    if (selectedUnit) {
      setSelectedUnit(prevUnit => {
        if (!prevUnit) return prevUnit;
        const updatedUnit = { ...prevUnit };
        if (updatedUnit.highlightedLeader) {
          const hName = (updatedUnit.highlightedLeader.name || '').trim().toLowerCase();
          const curName = (leaderName || '').trim().toLowerCase();
          if (hName === curName || (leaderId && updatedUnit.highlightedLeader.id === leaderId)) {
            updatedUnit.highlightedLeader = {
              ...updatedUnit.highlightedLeader,
              userRating: newRating,
              totalVotes: newVotes
            };
          }
        }
        if (leaderType === 'POLITICAL' && updatedUnit.politicalVoice) {
          updatedUnit.politicalVoice = {
            ...updatedUnit.politicalVoice,
            userRating: newRating,
            totalVotes: newVotes
          };
        } else if (updatedUnit.administrativeSpender) {
          updatedUnit.administrativeSpender = {
            ...updatedUnit.administrativeSpender,
            userRating: newRating,
            totalVotes: newVotes
          };
        }
        return updatedUnit;
      });

      setUnits(prevUnits => prevUnits.map(u => {
        if (u.unitId !== selectedUnit.unitId) return u;

        const updatedUnit = { ...u };
        if (leaderType === 'POLITICAL' && updatedUnit.politicalVoice) {
          updatedUnit.politicalVoice = {
            ...updatedUnit.politicalVoice,
            userRating: newRating,
            totalVotes: newVotes
          };
        } else if (updatedUnit.administrativeSpender) {
          updatedUnit.administrativeSpender = {
            ...updatedUnit.administrativeSpender,
            userRating: newRating,
            totalVotes: newVotes
          };
        }
        return updatedUnit;
      }));
    }
  };

  // Grievance Handlers
  const handleTicketCreated = (newTicket) => {
    setTickets(prev => [newTicket, ...prev]);
    setPinnedLocation(null);
    if (selectedUnit) {
      setUnits(prev => prev.map(u => u.unitId === selectedUnit.unitId ? {
        ...u,
        openTicketsCount: u.openTicketsCount + 1,
        totalTicketsCount: u.totalTicketsCount + 1
      } : u));
    }
  };


  return (
    <div className="h-screen h-[100dvh] w-full min-h-[100dvh] flex flex-col bg-[#0B0D12] light:bg-[#F8FAFC] text-slate-100 light:text-slate-900 overflow-hidden font-sans transition-colors">

      {/* Top Main Navigation Header */}
      <Header
        onOpenNationalLeaders={() => setIsNationalLeadersOpen(true)}
        onOpenTour={() => setShowTour(true)}
        onOpenFollowRupee={() => navigateTo('/follow-the-rupee')}
        onSelectUnit={handleSelectUnit}
        onSelectState={handleSelectState}
        allUnits={units}
        selectedUnit={selectedUnit}
      />

      {/* GIS Zoom Level Breadcrumb Indicator */}
      <LevelBreadcrumb
        currentLevel={currentLevel}
        selectedState={selectedState}
        selectedUnit={selectedUnit}
        onResetToNational={handleResetToNational}
        onSelectState={handleSelectState}
        onSelectDistrict={handleSelectDistrict}
        onSelectCorporation={handleSelectCorporation}
        onSelectWard={handleSelectWard}
      />

      {/* Main App Canvas Layout: Interactive Undistorted GIS Map + Dynamic Right Sidebar Spotlight */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Floating Pin Mode Banner */}
        {isPinningMode && (
          <div className="absolute top-3 sm:top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-3 lg:pr-[420px]">
            <div className="pointer-events-auto bg-crimson-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-2xl text-xs flex items-center justify-between sm:justify-center gap-2 sm:gap-3 border border-crimson-400 max-w-[94vw] sm:max-w-md">
              <span className="truncate font-bold text-xs sm:text-xs">
                <span className="sm:hidden">Tap the map to mark the spot</span>
                <span className="hidden sm:inline">Click the map to mark where the problem is</span>
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsPinningMode(false);
                    setIsGrievanceModalOpen(true);
                  }}
                  className="px-2.5 sm:px-3 py-1 bg-white text-slate-900 rounded-lg font-bold text-xs hover:bg-slate-200 transition-colors shadow flex-shrink-0 cursor-pointer active:scale-95"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setIsPinningMode(false);
                    setPinnedLocation(null);
                  }}
                  className="px-2.5 sm:px-3 py-1 bg-slate-900/90 text-slate-200 border border-white/20 rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors shadow flex-shrink-0 cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <MapContainer
          units={units}
          selectedUnit={selectedUnit}
          onSelectUnit={handleSelectUnit}
          currentLevel={currentLevel}
          selectedState={selectedState}
          onSelectState={handleSelectState}
          onResetToNational={handleResetToNational}
          tickets={tickets}
          pinnedLocation={pinnedLocation}
          isPinningMode={isPinningMode}
          onStartPinning={() => {
            setIsGrievanceModalOpen(false);
            setIsPinningMode(true);
          }}
          isIntroActive={showIntro}
          onPinLocationSelect={(coords) => {
            setPinnedLocation(coords);
            setIsPinningMode(false);
            setIsGrievanceModalOpen(true);
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          hoveredDistrict={hoveredDistrict}
          hoveredTicketId={hoveredTicketId}
          focusedTicketId={focusedTicketId}
          onInspectTicket={(ticket) => setInspectedTicket(ticket)}
        />

        {/* Floating Quick "Report Issue" Action Button - Positioned cleanly below zoom controls on mobile */}
        {!isPinningMode && (
          <div className={`fixed z-40 transition-all duration-300 pointer-events-auto ${
            isSidebarCollapsed
              ? 'bottom-16 sm:bottom-16 lg:bottom-6 right-3 sm:right-6'
              : 'hidden lg:block bottom-6 right-3 sm:right-6 lg:right-[444px]'
          }`}>
            <button
              onClick={() => setIsGrievanceModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-bold shadow-2xl border border-white/25 transition-all duration-200 active:scale-95 cursor-pointer group"
              title="Report a problem"
            >
              <div className="relative flex items-center justify-center">
                <Camera className="w-4 h-4 text-white relative z-10 group-hover:rotate-12 transition-transform" />
              </div>
              <span>Report a problem</span>
            </button>
          </div>
        )}

        <Sidebar
          unit={selectedUnit}
          currentLevel={currentLevel}
          selectedState={selectedState}
          onSelectState={handleSelectState}
          onSelectUnit={handleSelectUnit}
          allUnits={units}
          onRateLeader={(leader, type) => setRatingTarget({ leader, type })}
          onRaiseTicket={() => {
            setIsGrievanceModalOpen(true);
          }}
          onUpvoteTicket={handleUpvoteTicket}
          upvotedTicketIds={upvotedTicketIds}
          onOpenNationalLeaders={() => setIsNationalLeadersOpen(true)}
          tickets={tickets}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onHoverDistrict={setHoveredDistrict}
          onSelectDistrict={handleSelectDistrict}
          onHoverTicket={setHoveredTicketId}
          onInspectTicket={(ticket) => setInspectedTicket(ticket)}
          onViewReviews={(ldr, type) => setReviewTarget({ leader: ldr, type })}
          ratingsSummary={ratingsSummary}
        />
      </main>

      {/* Modals */}
      <NationalLeadersBar
        isOpen={isNationalLeadersOpen}
        onClose={() => setIsNationalLeadersOpen(false)}
        onSelectState={handleSelectState}
        onViewReviews={(ldr, type) => setReviewTarget({ leader: ldr, type })}
        onRateLeader={(ldr, type) => setRatingTarget({ leader: ldr, type })}
        ratingsSummary={ratingsSummary}
      />

      <LeaderRatingModal
        isOpen={!!ratingTarget}
        onClose={() => setRatingTarget(null)}
        leader={ratingTarget?.leader}
        leaderType={ratingTarget?.type}
        unit={selectedUnit}
        onRatingSubmitted={handleRatingSubmitted}
      />

      <LeaderReviewsModal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        leader={reviewTarget?.leader}
        leaderType={reviewTarget?.type}
        onRateClick={(ldr, type) => {
          setReviewTarget(null);
          setRatingTarget({ leader: ldr, type });
        }}
      />

      <GrievanceModal
        isOpen={isGrievanceModalOpen}
        onClose={() => {
          setIsGrievanceModalOpen(false);
          setIsPinningMode(false);
          setPinnedLocation(null);
        }}
        unit={selectedUnit}
        allUnits={units}
        onTicketCreated={handleTicketCreated}
        onViewTicket={(t) => setInspectedTicket(t)}
        onUpvoteTicket={handleUpvoteTicket}
        pinnedLocation={pinnedLocation}
        onPinLocationSelect={(coords) => setPinnedLocation(coords)}
        onStartPinning={() => {
          setIsGrievanceModalOpen(false);
          setIsPinningMode(true);
        }}
      />

      {/* Ticket Details & User Photo Inspection Modal */}
      <TicketDetailsModal
        isOpen={!!inspectedTicket}
        onClose={() => setInspectedTicket(null)}
        ticket={inspectedTicket}
        onUpvoteTicket={handleUpvoteTicket}
        upvotedTicketIds={upvotedTicketIds}
        onFocusOnMap={(targetTicket) => {
          if (!targetTicket) return;
          const lat = Number(targetTicket.latitude) || Number(targetTicket.lat);
          const lng = Number(targetTicket.longitude) || Number(targetTicket.lng);
          const tid = targetTicket.ticketId || targetTicket.complaint_id;
          if (lat && lng) {
            setFocusedTicketId(tid);
            setSelectedUnit(prev => ({
              ...prev,
              coordinates: { lat, lng }
            }));
          }
        }}
      />

      {/* 3-Step Guided Interactive Onboarding Tour */}
      <AppTour
        isOpen={showTour}
        onClose={() => setShowTour(false)}
        onExpandPanel={() => setIsSidebarCollapsed(false)}
        onNavigate={navigateTo}
      />

      {/* First-visit cinematic intro */}
      {showIntro && (
        <CivicLensIntro
          onComplete={() => {
            setShowIntro(false);
            setShowTour(true);
          }}
        />
      )}

    </div>
  );
}

export function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  // Route check for exact public route: /central-Authority
  const isCentralAuthorityRoute =
    currentPath.toLowerCase() === '/central-authority' ||
    currentPath === '/central-Authority';

  // Route check for public route: /financial-architecture
  const isFinancialArchitectureRoute =
    currentPath.toLowerCase() === '/financial-architecture' ||
    currentPath === '/financial-Architecture';

  const isFollowRupeeRoute = currentPath.toLowerCase() === '/follow-the-rupee';

  return (
    <ThemeProvider>
      {isFollowRupeeRoute ? (
        <FollowTheRupee onBackToMap={() => navigateTo('/')} />
      ) : isFinancialArchitectureRoute ? (
        <FinancialArchitecture onBackToMap={() => navigateTo('/')} />
      ) : isCentralAuthorityRoute ? (
        <CentralAuthorityDashboard onBackToMap={() => navigateTo('/')} />
      ) : (
        <AppContent navigateTo={navigateTo} />
      )}
    </ThemeProvider>
  );
}
