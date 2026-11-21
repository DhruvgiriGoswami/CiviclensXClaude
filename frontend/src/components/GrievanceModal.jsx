import React, { useState, useRef, useEffect } from 'react';
import { useDialog } from '../hooks/useDialog';
import {
  X, AlertTriangle, MapPin, Camera, ShieldAlert, AlertCircle,
  Upload, CheckCircle2, Crosshair, Trash2, Image, Navigation,
  Sparkles, Globe, ChevronRight, ChevronLeft, Check
} from 'lucide-react';
import { complaintsApi } from '../services/api';
import { isLocationInIndia, findClosestStateForCoordinates } from '../utils/mapHelpers';
import { getMediaUrl } from '../utils/ticketHelpers';

export function GrievanceModal({
  isOpen,
  onViewTicket,
  onClose,
  unit,
  allUnits = [],
  onTicketCreated,
  onUpvoteTicket,
  pinnedLocation,
  onStartPinning,
  onPinLocationSelect,
}) {
  const [step, setStep] = useState(1); // 3-step wizard: 1 = Location, 2 = Category, 3 = Evidence & Details
  const [category, setCategory] = useState('');
  const [addressText, setAddressText] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [photoSource, setPhotoSource] = useState(null); // 'CAMERA' or 'GALLERY'
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [pinError, setPinError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [photoWarning, setPhotoWarning] = useState('');
  const [activeDisclaimer, setActiveDisclaimer] = useState(null);

  // Geolocation & Reverse geocoding states
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isOutsideIndia, setIsOutsideIndia] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Once a spot is pinned, fill the location box with its address (or the coordinates) if it is empty.
  useEffect(() => {
    if (!pinnedLocation || typeof pinnedLocation.lat !== 'number') return;
    const coords = `${pinnedLocation.lat.toFixed(5)}, ${pinnedLocation.lng.toFixed(5)}`;
    const Geocoder = window.google?.maps?.Geocoder;
    if (!Geocoder) {
      setAddressText((prev) => prev || coords);
      return;
    }
    new Geocoder().geocode({ location: pinnedLocation }, (results, status) => {
      const address = status === 'OK' && results?.[0]?.formatted_address;
      setAddressText((prev) => prev || address || coords);
    });
  }, [pinnedLocation]);

  // Clean up preview URL when unmounted or changed
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const dialogRef = useDialog(isOpen, onClose);
  if (!isOpen) return null;

  // Resilient fallback when user opens Report Issue before selecting any unit on map
  const effectiveUnit = unit || {
    unitName: pinnedLocation ? `Geo-Tagged Location (${pinnedLocation.lat.toFixed(4)}, ${pinnedLocation.lng.toFixed(4)})` : 'Civic Zone (Auto Geo-Tagged)',
    unitId: 'LIVE-GPS-REPORT',
    unitType: 'WARD',
    coordinates: { lat: 20.5937, lng: 78.9629 }, // Center of India
  };

  const currentLat = pinnedLocation?.lat || effectiveUnit.coordinates.lat;
  const currentLng = pinnedLocation?.lng || effectiveUnit.coordinates.lng;

  // Reverse geocoding helper (Google Geocoder -> Nominatim fallback)
  const performReverseGeocode = async (lat, lng) => {
    try {
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setAddressText((prev) => prev || results[0].formatted_address); // never overwrite what the user typed
            return;
          }
          fallbackNominatim(lat, lng);
        });
      } else {
        await fallbackNominatim(lat, lng);
      }
    } catch {
      await fallbackNominatim(lat, lng);
    }
  };

  const fallbackNominatim = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setAddressText((prev) => prev || data.display_name);
        }
      }
    } catch (e) {
      console.warn('Reverse geocode fallback notice:', e);
    }
  };

  // Live GPS Acquisition Handler
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    // Browsers (iOS Safari especially) refuse GPS on plain http and report it as "permission denied".
    if (!window.isSecureContext) {
      setLocationError('GPS needs a secure (https) page. Please pinpoint on map or type the address.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    setPinError('');
    setAddressText(''); // a fresh GPS fix gets a fresh address; typing during the lookup still wins

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy);

        if (!isLocationInIndia(lat, lng)) {
          setIsOutsideIndia(true);
          setIsLocating(false);
          return;
        }

        const coords = { lat, lng, accuracy };
        if (onPinLocationSelect) {
          onPinLocationSelect(coords);
        }

        setIsLocating(false);
        await performReverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Unable to get GPS location.';
        if (err.code === 1) {
          msg = 'Location permission denied. Please allow location access in your browser or pinpoint on map.';
        } else if (err.code === 2) {
          msg = 'Location unavailable. Please pinpoint on map.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please try again or pinpoint on map.';
        }
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Client-side image compression to prevent large file sizes and S3 storage bloat
  const compressImage = async (fileToCompress, maxWidth = 1600, maxHeight = 1600, quality = 0.78) => {
    if (!fileToCompress || !fileToCompress.type.startsWith('image/')) return fileToCompress;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileToCompress);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < fileToCompress.size) {
                const compressedFile = new File([blob], fileToCompress.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(fileToCompress);
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => resolve(fileToCompress);
      };
      reader.onerror = () => resolve(fileToCompress);
    });
  };

  // Photo Selection Handler with client-side compression (Camera vs Gallery)
  const handleFileSelect = async (e, source) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setPhotoSource(source);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selected));

      // Asynchronously compress image to lightweight size
      const optimized = await compressImage(selected);
      setFile(optimized);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(optimized));

      // Auto-trigger GPS detection if live camera photo is taken on the spot
      if (source === 'CAMERA' && (!pinnedLocation || typeof pinnedLocation.lat !== 'number')) {
        handleGetLiveLocation();
      }
    }
  };

  const resetForm = () => {
    setStep(1);
    setSubmitError('');
    setPhotoWarning('');
    setCategory('');
    setFieldErrors({});
    setAddressText('');
    setDescription('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPhotoSource(null);
    setPreviewUrl(null);
    setPinError('');
    setLocationError('');
    setIsLocating(false);
    setIsOutsideIndia(false);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRemovePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setPhotoSource(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mandatory Pin Validation: Must pin location on map or via GPS
    // One message per field plus one summary, so people see everything to fix at once.
    const errors = {};
    if (!pinnedLocation || typeof pinnedLocation.lat !== 'number') errors.location = 'Mark where the problem is, using your location or the map.';
    if (!category) errors.category = 'Choose a category.';
    if (!description.trim()) errors.description = 'Describe the problem in a few words.';
    setFieldErrors(errors);
    const count = Object.keys(errors).length;
    if (count) {
      setSubmitError(`Fix ${count === 1 ? 'one thing' : `${count} things`} before submitting: ${Object.values(errors).join(' ')}`);
      if (errors.location) setPinError(errors.location);
      return;
    }

    setPinError('');
    setSubmitError('');
    setIsSubmitting(true);
    try {
      const lat = currentLat;
      const lng = currentLng;
      const targetUnitName = addressText || effectiveUnit.unitName;

      const res = await complaintsApi.createComplaint({
        title: `${category} in ${targetUnitName}`,
        description,
        category,
        latitude: lat,
        longitude: lng,
        priority: (category === 'Report Bribe' || category === 'Women Safety') ? 'CRITICAL' : 'HIGH',
        address_text: addressText || effectiveUnit.unitName,
      });

      if (!res?.complaint_id) throw new Error('The server did not return a ticket number.');

      let uploadedMediaUrl = null;
      if (file) {
        try {
          const mediaRes = await complaintsApi.uploadMedia(res.complaint_id, file);
          if (mediaRes && mediaRes.storage_url) {
            uploadedMediaUrl = getMediaUrl(mediaRes.storage_url);
          }
        } catch (uploadErr) {
          setPhotoWarning(`Your complaint #${res.complaint_id} was filed, but the photo didn't upload (${uploadErr.message}).`);
        }
      }

      // Only show a photo the server actually stored; the local preview would vanish on reload.
      const photoUrl = uploadedMediaUrl;
      const closest = findClosestStateForCoordinates(lat, lng);
      const priority = res?.priority || ((category === 'Report Bribe' || category === 'Women Safety') ? 'CRITICAL' : 'HIGH');
      const created = {
        ticketId: res.complaint_id,
        unitId: effectiveUnit.unitId,
        wardName: effectiveUnit.unitName,
        districtName: effectiveUnit.districtName || (effectiveUnit.unitName?.includes('District') ? effectiveUnit.unitName.replace(/\s+District$/i, '') : undefined),
        districtId: effectiveUnit.unitType === 'DISTRICT' ? effectiveUnit.unitId : effectiveUnit.districtId,
        stateId: effectiveUnit.stateId || closest.stateId || 'MH',
        parentCityDistrict: effectiveUnit.parentCityDistrict || effectiveUnit.unitName,
        category,
        description,
        addressText: addressText || undefined,
        latitude: lat,
        longitude: lng,
        status: res?.status || 'OPEN',
        priority,
        severity: priority,
        upvotes: res?.upvotes ?? res?.upvote_count ?? 0,
        createdAt: 'Just now',
        photo: photoUrl,
        mediaUrl: photoUrl,
      };
      onTicketCreated(created);
      setCreatedTicket(created);
      // No timer: the citizen closes it, so a late click never falls through to the map.
      setIsSuccess(true);
    } catch (err) {
      // Don't pretend it worked: nothing was saved, so tell the citizen and let them retry.
      console.error('Failed to create complaint:', err);
      setSubmitError(`Your complaint was not filed: ${err.message || 'network error'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const CATEGORIES = [
    'Garbage & Waste Management',
    'Roads & Footpaths',
    'Drainage & Sewage',
    'Street Lighting',
    'Water Supply & Pollution',
    'Traffic & Parking',
    'Illegal Encroachment',
    'Public Health & Safety',
    'Parks & Green Spaces',
    'Animal Nuisance',
    'Air & Noise Pollution',
    'Public Property Maintenance',
    'General / Others',
    'Report Bribe',
    'Women Safety',
  ];

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="grievance-heading" className="fixed inset-0 z-50 bg-black/80 flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="glass-panel-crimson light:bg-white light:border-slate-300 w-full sm:max-w-lg min-h-[100dvh] sm:min-h-0 rounded-none sm:rounded-2xl border-0 sm:border border-slate-700/80 shadow-2xl p-4 sm:p-6 relative sm:max-h-[92dvh] overflow-y-auto no-scrollbar sm:my-auto text-slate-100 light:text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-11 h-11 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-300 light:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 light:bg-emerald-100 text-emerald-400 light:text-emerald-700 border border-emerald-500/40 light:border-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 id="grievance-heading" className="text-xl font-bold text-white light:text-slate-900 font-sans">Complaint CL-{createdTicket?.ticketId} filed</h3>
            <p className="text-sm text-slate-300 light:text-slate-700">
              It is on the map in {effectiveUnit.unitName}. Keep the number CL-{createdTicket?.ticketId} to follow it up.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {onViewTicket && createdTicket && (
                <button type="button" onClick={() => { const t = createdTicket; setIsSuccess(false); resetForm(); onClose(); onViewTicket(t); }}
                  className="min-h-[44px] px-4 rounded-xl bg-crimson-700 hover:bg-crimson-800 text-white text-sm font-semibold">
                  View complaint
                </button>
              )}
              <button type="button" onClick={() => { setIsSuccess(false); resetForm(); onClose(); }}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 light:bg-slate-200 text-slate-200 light:text-slate-800 text-sm font-semibold">
                Done
              </button>
            </div>
            {photoWarning && (
              <p role="alert" className="text-xs text-amber-400 light:text-amber-700 font-sans">{photoWarning}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="pr-12">
              <h3 id="grievance-heading" className="text-lg font-bold text-white light:text-slate-900 font-sans">
                {unit ? `Report a problem in ${unit.unitName}` : 'Report a problem'}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-600 font-sans">
                Mark the spot, pick a category and describe what is wrong.
              </p>
            </div>

            {/* 3-Step Wizard Navigation Stepper */}
            <div className="grid grid-cols-3 gap-2 py-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  step === 1
                    ? 'bg-crimson-600 text-white shadow-md'
                    : step > 1
                      ? 'bg-emerald-500/15 text-emerald-400 light:text-emerald-700 border border-emerald-500/30'
                      : 'bg-slate-800/80 text-slate-400 light:bg-slate-200 light:text-slate-600'
                }`}
              >
                {step > 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-white/20 text-xs flex items-center justify-center">1</span>}
                <span className="truncate">Location</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pinnedLocation) setStep(2);
                  else setPinError('Location required before proceeding');
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  step === 2
                    ? 'bg-crimson-600 text-white shadow-md'
                    : step > 2
                      ? 'bg-emerald-500/15 text-emerald-400 light:text-emerald-700 border border-emerald-500/30'
                      : 'bg-slate-800/80 text-slate-400 light:bg-slate-200 light:text-slate-600'
                }`}
              >
                {step > 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span className="w-4 h-4 rounded-full bg-white/20 text-xs flex items-center justify-center">2</span>}
                <span className="truncate">Category</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (pinnedLocation) setStep(3);
                  else setPinError('Location required before proceeding');
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  step === 3
                    ? 'bg-crimson-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 light:bg-slate-200 light:text-slate-600'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white/20 text-xs flex items-center justify-center">3</span>
                <span className="truncate">Details</span>
              </button>
            </div>

            {/* STEP 1: Location Entry & Auto GPS */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Pin Warning Banner */}
                {pinError && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 light:bg-rose-50 border border-rose-500/40 light:border-rose-300 text-rose-400 light:text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                    <span>{pinError}</span>
                  </div>
                )}

                {/* Pinpoint Location Selector & Live GPS */}
                <div className={`p-3.5 rounded-2xl transition-all ${
                  pinError || !pinnedLocation
                    ? 'bg-slate-900/90 light:bg-slate-100 border border-rose-500/60 light:border-rose-400 ring-2 ring-rose-500/30'
                    : 'bg-emerald-950/20 light:bg-emerald-50/50 border border-emerald-500/40 light:border-emerald-300'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5 text-xs font-bold">
                      <MapPin className={`w-4 h-4 flex-shrink-0 ${pinnedLocation ? 'text-emerald-400 light:text-emerald-600' : 'text-crimson-500'}`} />
                      <span className={pinnedLocation ? 'text-emerald-300 light:text-emerald-800' : 'text-slate-200 light:text-slate-800'}>
                        {pinnedLocation ? 'Location marked' : 'Mark the location to continue'}
                      </span>
                    </div>

                    {pinnedLocation && (
                      <span className="text-xs text-emerald-400 light:text-emerald-700 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full truncate max-w-[150px]">
                        {pinnedLocation.lat.toFixed(4)}, {pinnedLocation.lng.toFixed(4)}
                        {pinnedLocation.accuracy ? ` (±${pinnedLocation.accuracy}m)` : ''}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Auto-Detect GPS & Pinpoint on Map */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleGetLiveLocation}
                      disabled={isLocating}
                      className={`text-xs font-bold px-3 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isLocating
                          ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-wait'
                          : !pinnedLocation
                            ? 'bg-crimson-600 hover:bg-crimson-500 text-white border-crimson-400 shadow-md'
                            : 'bg-slate-800 light:bg-slate-200 text-slate-200 light:text-slate-800 border-slate-700 light:border-slate-300 hover:bg-slate-700'
                      }`}
                      title="Detect GPS coordinates directly from your device"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Detecting GPS...' : pinnedLocation ? 'Refresh GPS' : 'Auto-Detect GPS'}</span>
                    </button>

                    {onStartPinning && (
                      <button
                        type="button"
                        onClick={() => {
                          setPinError('');
                          onClose();
                          onStartPinning();
                        }}
                        className="text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-700 light:border-slate-300 bg-slate-900/90 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 text-slate-200 light:text-slate-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Pick custom location on the interactive map"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-crimson-400" />
                        <span>{pinnedLocation ? 'Change on Map' : 'Pinpoint on Map'}</span>
                      </button>
                    )}
                  </div>

                  {locationError && (
                    <div className="mt-2 text-xs text-rose-400 light:text-rose-700 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                      {locationError}
                    </div>
                  )}
                </div>

                {/* Location / Address Textbox */}
                <div>
                  <label className="text-xs text-slate-300 light:text-slate-700 font-bold block mb-1">
                    Location / Address Details (Auto-detected or custom):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near HDFC Bank ATM, Service Road, Sector 4..."
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    className="w-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl p-2.5 text-xs text-slate-100 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:border-crimson-500"
                  />
                </div>

                {/* Next Step Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (!pinnedLocation) {
                      setPinError('Location is required. Please click "Auto-Detect GPS" or "Pinpoint on Map".');
                      return;
                    }
                    setPinError('');
                    setStep(2);
                  }}
                  className="w-full py-3 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                >
                  <span>Next: Choose Category</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Category Selection & Priority Actions */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Priority Safety Actions: Report Bribe & Women Safety */}
                <div>
                  <label className="text-xs text-slate-300 light:text-slate-700 font-bold block mb-1.5">
                    Priority Safety & Integrity Actions:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveDisclaimer('REPORT_BRIBE')}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        category === 'Report Bribe'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-slate-900/90 light:bg-slate-100 text-amber-400 light:text-amber-800 border-amber-500/40 light:border-amber-300 hover:bg-amber-500/20'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Report Bribe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDisclaimer('WOMEN_SAFETY')}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        category === 'Women Safety'
                          ? 'bg-rose-600 text-white border-rose-400 shadow-md font-black'
                          : 'bg-slate-900/90 light:bg-slate-100 text-rose-400 light:text-rose-800 border-rose-500/40 light:border-rose-300 hover:bg-rose-500/20'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Women Safety</span>
                    </button>
                  </div>
                </div>

                {/* Category Dropdown */}
                <div>
                  <label htmlFor="grievance-category" className="text-xs text-slate-300 light:text-slate-700 font-bold block mb-1">Category</label>
                  <select
                    id="grievance-category"
                    value={category}
                    aria-invalid={!!fieldErrors.category}
                    aria-describedby={fieldErrors.category ? 'grievance-category-error' : undefined}
                    onChange={(e) => { setCategory(e.target.value); setFieldErrors((f) => ({ ...f, category: undefined })); }}
                    className="w-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl p-2.5 text-xs text-slate-100 light:text-slate-900 focus:border-crimson-500"
                  >
                    <option value="" disabled>Choose a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-slate-900 light:bg-white text-slate-100 light:text-slate-900">
                        {cat}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && <p id="grievance-category-error" className="mt-1 text-xs text-crimson-400 light:text-crimson-700">{fieldErrors.category}</p>}
                </div>

                {/* Pinned Location Summary */}
                <div className="p-2.5 rounded-xl bg-slate-900/70 light:bg-slate-100 border border-slate-800 light:border-slate-300 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-300 light:text-slate-700 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{addressText || (pinnedLocation ? `${pinnedLocation.lat.toFixed(4)}, ${pinnedLocation.lng.toFixed(4)}` : effectiveUnit.unitName)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-crimson-400 hover:underline flex-shrink-0 ml-2 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Step 2 Back & Next Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-2.5 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-300 light:text-slate-800 font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!category) { setFieldErrors((f) => ({ ...f, category: 'Choose a category.' })); return; }
                      setStep(3);
                    }}
                    className="py-2.5 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Take Photo/Upload & Description, Then Submit */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Photo Evidence Section - Live Camera vs Gallery */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 light:text-slate-700 font-bold flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-crimson-400" />
                      <span>Photo Evidence / Visual Proof:</span>
                    </label>
                  </div>

                  {/* Contextual Guidance */}
                  {category === 'Garbage & Waste Management' || category === 'Roads & Footpaths' || category === 'Drainage & Sewage' || category === 'Street Lighting' ? (
                    <div className="text-xs text-emerald-400 light:text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>A photo taken on the spot helps the ward office find the problem.</span>
                    </div>
                  ) : (category === 'Report Bribe' || category === 'Women Safety') ? (
                    <div className="text-xs text-amber-400 light:text-amber-800 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Confidential: Attach screenshots, records, or files safely from Gallery.</span>
                    </div>
                  ) : null}

                  {/* Hidden native inputs for Camera vs Gallery */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'CAMERA')}
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'GALLERY')}
                  />

                  {!file ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Option 1: Take Live Photo */}
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer ${
                          category === 'Garbage & Waste Management' || category === 'Roads & Footpaths'
                            ? 'bg-crimson-500/15 light:bg-crimson-50 border-crimson-500/50 hover:bg-crimson-500/25 ring-2 ring-crimson-500/30'
                            : 'bg-slate-900/90 light:bg-slate-100 border-slate-800 light:border-slate-300 hover:border-crimson-500/40 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-crimson-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white light:text-slate-900">
                          Take Live Photo
                        </span>
                        <span className="text-xs text-slate-400 light:text-slate-600">
                          Snap on the spot
                        </span>
                      </button>

                      {/* Option 2: Upload from Gallery */}
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-1.5 group cursor-pointer ${
                          category === 'Report Bribe' || category === 'Women Safety'
                            ? 'bg-amber-500/15 light:bg-amber-50 border-amber-500/50 hover:bg-amber-500/25 ring-2 ring-amber-500/30'
                            : 'bg-slate-900/90 light:bg-slate-100 border-slate-800 light:border-slate-300 hover:border-slate-600 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-800 light:bg-slate-300 text-slate-200 light:text-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5 text-crimson-400 light:text-crimson-600" />
                        </div>
                        <span className="text-xs font-bold text-white light:text-slate-900">
                          From Gallery
                        </span>
                        <span className="text-xs text-slate-400 light:text-slate-600">
                          Select photo or file
                        </span>
                      </button>
                    </div>
                  ) : (
                    /* Attached Photo Preview Card */
                    <div className="p-3 rounded-2xl bg-slate-900/95 light:bg-slate-100 border border-slate-800 light:border-slate-300 flex items-center gap-3">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Evidence Preview"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-700 light:border-slate-300 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {photoSource === 'CAMERA' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 light:text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              Live Photo Attached
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-400 light:text-blue-700">
                              <Image className="w-3.5 h-3.5" />
                              Gallery Photo Attached
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-200 light:text-slate-900 truncate mt-0.5">
                          {file.name}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (photoSource === 'CAMERA') {
                              cameraInputRef.current?.click();
                            } else {
                              galleryInputRef.current?.click();
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 light:bg-slate-200 hover:bg-slate-700 text-slate-200 light:text-slate-800 transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center justify-center cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Issue Description */}
                <div>
                  <label htmlFor="grievance-description" className="text-xs text-slate-300 light:text-slate-700 font-bold block mb-1">
                    What is the problem?
                  </label>
                  <textarea
                    id="grievance-description"
                    rows="3"
                    placeholder="For example: a deep pothole outside the bus stop near the school gate"
                    value={description}
                    aria-invalid={!!fieldErrors.description}
                    aria-describedby={fieldErrors.description ? 'grievance-description-error' : undefined}
                    onChange={(e) => { setDescription(e.target.value); setFieldErrors((f) => ({ ...f, description: undefined })); }}
                    className="w-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 rounded-xl p-2.5 text-xs text-slate-100 light:text-slate-900 placeholder-slate-500 light:placeholder-slate-400 focus:border-crimson-500 font-sans"
                  />
                </div>

                {fieldErrors.description && <p id="grievance-description-error" className="-mt-2 text-xs text-crimson-400 light:text-crimson-700">{fieldErrors.description}</p>}

                {submitError && (
                  <p role="alert" className="text-xs text-crimson-400 light:text-crimson-700 font-sans">{submitError}</p>
                )}

                {/* Step 3 Navigation Buttons: Back & Submit */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-300 light:text-slate-800 font-sans font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="col-span-2 py-3 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white font-sans font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Pinning Ticket...</span>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        <span>Submit report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

      </div>

      {/* Outside India Boundary Alert Modal */}
      {isOutsideIndia && (
        <div className="fixed inset-0 z-[70] bg-black/85 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel light:bg-white light:border-slate-300 w-full max-w-sm rounded-3xl border border-slate-700/80 shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white light:text-slate-900 font-sans">
              Outside India's Boundaries
            </h4>
            <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans">
              CivicLens currently covers Indian States, Union Territories, Municipal Corporations and Panchayats. Please pinpoint manually on the map if you are reporting for an area within India.
            </p>
            <button
              type="button"
              onClick={() => setIsOutsideIndia(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer Modals for Priority Actions */}
      {activeDisclaimer && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel light:bg-white light:border-slate-300 w-full max-w-md rounded-3xl border border-slate-700/80 shadow-2xl p-5 sm:p-6 relative text-slate-100 light:text-slate-900 space-y-4">
            
            <button
              type="button"
              onClick={() => setActiveDisclaimer(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-xl bg-slate-800 light:bg-slate-200 hover:bg-slate-700 light:hover:bg-slate-300 text-slate-400 light:text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {activeDisclaimer === 'WOMEN_SAFETY' && (
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 light:text-rose-700 border border-rose-500/30 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>Emergency Notice</span>
                </div>
                
                <h3 className="text-xl font-extrabold text-white light:text-slate-900 font-sans tracking-tight">
                  Women's Safety Modal
                </h3>

                <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans px-1">
                  This app is strictly for reporting and record-keeping. It is not monitored by emergency services. If you are in immediate danger, please call emergency services right now.
                </p>

                <div className="pt-2 space-y-3 flex flex-col items-center">
                  <a
                    href="tel:112"
                    className="w-full py-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all border border-rose-400 active:scale-95"
                  >
                    Call Emergency (112)
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory('Women Safety');
                      setActiveDisclaimer(null);
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 underline transition-colors pt-1"
                  >
                    Continue to Report
                  </button>
                </div>
              </div>
            )}

            {activeDisclaimer === 'REPORT_BRIBE' && (
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 light:text-amber-700 border border-amber-500/30 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>Important Disclaimer</span>
                </div>

                <h3 className="text-xl font-extrabold text-white light:text-slate-900 font-sans tracking-tight">
                  Bribe Complaint Modal
                </h3>

                <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-sans px-1">
                  This platform is an independent logbook for recording incidents of corruption. We do not provide active legal protection, field intervention, or immediate law enforcement response. For official, legal actions or ongoing emergencies, please contact the Anti-Corruption Bureau or local authorities directly.
                </p>

                <div className="pt-2 space-y-2.5 flex flex-col items-center w-full">
                  <a
                    href="tel:1064"
                    className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all border border-amber-300 active:scale-95"
                  >
                    Call Authority Helpline (1064)
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCategory('Report Bribe');
                      setActiveDisclaimer(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 light:text-slate-900 font-bold text-xs transition-all border border-slate-700 light:border-slate-300"
                  >
                    Proceed to Record File
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
