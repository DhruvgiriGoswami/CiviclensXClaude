import { useEffect, useRef } from 'react';
import { getPinnedLocationInfoWindowContent, getTicketInfoWindowContent } from '../utils/mapInfoWindowTemplates';
import { isLocationInIndia } from '../utils/mapHelpers';
import { getFilteredTickets } from '../utils/ticketHelpers';

export function useMapMarkers({
  googleMapRef,
  isMapReady,
  pinnedLocation,
  userLocation = null,
  selectedUnit,
  tickets = [],
  isPinningMode = false,
  onStartPinning = null,
  onPinLocationSelect = null,
  hoveredTicketId = null,
  focusedTicketId = null,
  onInspectTicket = null,
}) {
  const markersRef = useRef([]);
  const onStartPinningRef = useRef(onStartPinning);
  const onPinLocationSelectRef = useRef(onPinLocationSelect);
  const isPinningModeRef = useRef(isPinningMode);

  useEffect(() => { onStartPinningRef.current = onStartPinning; }, [onStartPinning]);
  useEffect(() => { onPinLocationSelectRef.current = onPinLocationSelect; }, [onPinLocationSelect]);
  useEffect(() => { isPinningModeRef.current = isPinningMode; }, [isPinningMode]);

  // Effect to toggle BOUNCE animation when a ticket is hovered in sidebar
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;
    markersRef.current.forEach((m) => {
      if (m && m.ticketId) {
        if (hoveredTicketId && m.ticketId === hoveredTicketId) {
          if (m.getAnimation() !== window.google.maps.Animation.BOUNCE) {
            m.setAnimation(window.google.maps.Animation.BOUNCE);
          }
        } else if (!focusedTicketId || m.ticketId !== focusedTicketId) {
          m.setAnimation(null);
        }
      }
    });
  }, [hoveredTicketId, focusedTicketId]);

  // Effect to make marker jump 3 times when "Focus on Map" is clicked
  useEffect(() => {
    if (!googleMapRef.current || !window.google || !focusedTicketId) return;
    const targetMarker = markersRef.current.find(
      (m) => m && (m.ticketId === focusedTicketId || String(m.ticketId) === String(focusedTicketId))
    );
    if (targetMarker) {
      const pos = targetMarker.getPosition();
      if (pos) {
        googleMapRef.current.panTo(pos);
        googleMapRef.current.setZoom(17);
      }
      targetMarker.setAnimation(window.google.maps.Animation.BOUNCE);
      const timer = setTimeout(() => {
        targetMarker.setAnimation(null);
      }, 2100); // 3 bounce jumps (approx 700ms per bounce in Google Maps)
      return () => clearTimeout(timer);
    }
  }, [focusedTicketId]);

  useEffect(() => {
    if (!googleMapRef.current || !window.google || !isMapReady) return;
    const map = googleMapRef.current;

    markersRef.current.forEach((m) => {
      if (m && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(m);
      }
      if (m && typeof m.setMap === 'function') {
        m.setMap(null);
      }
    });
    markersRef.current = [];

    // 1. User Current Location Marker
    if (userLocation && typeof userLocation.lat === 'number') {
      const isInIndia = isLocationInIndia(userLocation.lat, userLocation.lng);

      const userMarker = new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: map,
        title: isInIndia ? "Your Current Location" : "International Visitor Location",
        animation: window.google.maps.Animation.DROP,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: isInIndia ? "#00B4D8" : "#E63946",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
        },
      });

      const infoContent = isInIndia
        ? `
          <div style="padding: 10px 12px; color: #0F172A;">
            <div style="font-weight: 700; font-size: 13px; color: #0284C7; display: flex; align-items: center; gap: 6px;">
              Your Current Location
            </div>
            <div style="font-size:12px; color: #64748B; margin-top: 4px;">
              Lat: ${userLocation.lat.toFixed(5)}, Lng: ${userLocation.lng.toFixed(5)}
            </div>
          </div>
        `
        : `
          <div style="padding: 12px 14px; color: #0F172A; text-align: center; max-width: 240px;">
            <div style="font-weight: 800; font-size: 13px; color: #E63946; display: flex; align-items: center; justify-content: center; gap: 6px;">
              CivicLens is Made for India
            </div>
            <div style="font-size: 12px; color: #1E293B; margin-top: 6px; font-weight: 700; line-height: 1.3;">
              Thanks for visiting from outside India.
            </div>
            <div style="font-size:12px; color: #64748B; margin-top: 6px; border-top: 1px solid #E2E8F0; padding-top: 4px;">
              Viewing from Lat: ${userLocation.lat.toFixed(4)}, Lng: ${userLocation.lng.toFixed(4)}
            </div>
          </div>
        `;

      const userWindow = new window.google.maps.InfoWindow({
        content: infoContent,
      });

      if (!isInIndia) {
        userWindow.open(map, userMarker);
      }

      userMarker.addListener('click', () => userWindow.open(map, userMarker));
      markersRef.current.push(userMarker);
    }


    // 2. Pinned Issue Location Marker
    if (pinnedLocation && typeof pinnedLocation.lat === 'number') {
      const pinMarker = new window.google.maps.Marker({
        position: { lat: pinnedLocation.lat, lng: pinnedLocation.lng },
        map: map,
        title: "Pinned Issue Location — Click pin to re-position location",
        animation: window.google.maps.Animation.DROP,
        cursor: "pointer",
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: "#E63946",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
          scale: 1.9,
          anchor: new window.google.maps.Point(12, 24),
        },
      });

      const pinWindow = new window.google.maps.InfoWindow({
        content: getPinnedLocationInfoWindowContent(pinnedLocation.lat, pinnedLocation.lng),
      });

      pinMarker.addListener('click', () => {
        if (isPinningModeRef.current) {
          if (onPinLocationSelectRef.current) {
            onPinLocationSelectRef.current({ lat: pinnedLocation.lat, lng: pinnedLocation.lng });
          }
        } else {
          if (onStartPinningRef.current) {
            onStartPinningRef.current();
          } else {
            pinWindow.open(map, pinMarker);
          }
        }
      });
      markersRef.current.push(pinMarker);
    }

    // 3. Grievance Ticket Markers for Ward / Corporation / District
    if (selectedUnit?.unitId && tickets && tickets.length > 0) {
      const unitTickets = getFilteredTickets(tickets, selectedUnit, selectedUnit.unitType);
      unitTickets.forEach((t) => {
        if (t.latitude && t.longitude) {
          const tMarker = new window.google.maps.Marker({
            position: { lat: t.latitude, lng: t.longitude },
            map: map,
            title: t.category || "Civic Grievance",
            icon: {
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
              fillColor: t.upvotes >= 5 ? "#E63946" : "#F59E0B",
              fillOpacity: 0.9,
              strokeWeight: 1.5,
              strokeColor: "#FFFFFF",
              scale: 1.5,
              anchor: new window.google.maps.Point(12, 24),
            },
          });
          tMarker.ticketId = t.ticketId;

          const tWindow = new window.google.maps.InfoWindow({
            content: getTicketInfoWindowContent(t),
          });

          tMarker.addListener('click', () => {
            if (onInspectTicket) {
              onInspectTicket(t);
            } else {
              tWindow.open(map, tMarker);
            }
          });

          if (hoveredTicketId && t.ticketId === hoveredTicketId) {
            tMarker.setAnimation(window.google.maps.Animation.BOUNCE);
          }

          markersRef.current.push(tMarker);
        }
      });
    }
  }, [googleMapRef, isMapReady, pinnedLocation, userLocation, selectedUnit, tickets, onInspectTicket]);

  return { markersRef };
}


