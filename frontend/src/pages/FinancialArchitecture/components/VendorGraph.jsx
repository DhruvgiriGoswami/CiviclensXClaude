import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Building, UserCheck, FileSpreadsheet, Info, ShieldCheck } from 'lucide-react';
import { VENDOR_HISTORY_DEMO } from '../data/vendorDemoData';

export function VendorGraph() {
  const [selectedElement, setSelectedElement] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0.9);
  const [panOffset, setPanOffset] = useState({ x: 40, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const { vendorName, registrationNo, metrics, relationshipGraph } = VENDOR_HISTORY_DEMO;

  // Custom coordinate map ensuring generous spacing (no text clipping or overlapping)
  const NODE_COORDINATES = {
    v_apex: { x: 550, y: 250, label: vendorName, type: "PRIMARY CONTRACTOR", subtitle: "VND-001 (Primary)" },
    dir_rajesh: { x: 180, y: 60, label: "Rajesh V. Sharma", type: "DIRECTOR", subtitle: "Director (51% Stake)" },
    dir_sunil: { x: 920, y: 60, label: "Sunil K. Mehta", type: "DIRECTOR", subtitle: "Director (49% Stake)" },
    rel_metal: { x: 100, y: 250, label: "Apex Mining & Aggregates", type: "RELATED COMPANY", subtitle: "Common Director (98% match)" },
    rel_bitumen: { x: 1000, y: 250, label: "Trident Logistics Pvt Ltd", type: "SUPPLIER", subtitle: "Sub-contractor / Transporter" },
    past_prj1: { x: 140, y: 460, label: "TMC Road Rehab Phase I (2024)", type: "PAST CONTRACT", subtitle: "Awarded ₹14.2 Cr (+22% Var)" },
    past_prj2: { x: 550, y: 460, label: "KDMC Flyover Approach (2025)", type: "PAST CONTRACT", subtitle: "Awarded ₹28.0 Cr (Delayed 6 mo)" },
    tnd_current: { x: 960, y: 460, label: "TND-2026-0142 (Current Ward 150)", type: "TENDER", subtitle: "Lowest Bidder P1 (₹6.20 Cr)" }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetView = () => {
    setZoomLevel(0.9);
    setPanOffset({ x: 40, y: 20 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.vendor-node-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch event handlers for touchscreens (Phones & iPads)
  const handleTouchStart = (e) => {
    if (e.target.closest('.vendor-node-card')) return;
    if (e.touches && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="w-full bg-[#0B0E17] light:bg-white border border-slate-800 light:border-slate-300 rounded-2xl p-6 text-slate-100 light:text-slate-900 font-sans shadow-xl">
      {/* Section Header */}
      <div className="mb-6 pb-4 border-b border-slate-800 light:border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 light:text-cyan-700 tracking-wider">
            CORPORATE INTELLIGENCE & MOVABLE GRAPH
          </span>
          <h2 className="text-xl font-bold text-slate-100 light:text-slate-900">
            Vendor Relationship & Lineage Graph
          </h2>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-0.5">
            Public record directorships, related-party entities, and historical municipal performance profile.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-800 font-bold">
            CIN: {registrationNo}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Columns: Movable Workspace Canvas */}
        <div className="lg:col-span-2 bg-slate-950/90 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-2xl p-4 relative overflow-hidden financial-canvas-bg min-h-[480px] flex flex-col justify-between select-none">
          
          {/* Header Bar inside graph with Zoom & Drag Controls */}
          <div className="text-[10px] font-mono font-bold text-slate-400 light:text-slate-600 uppercase mb-2 flex items-center justify-between z-10">
            <span className="flex items-center gap-1.5 text-cyan-400 light:text-cyan-700">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              PUBLIC-RECORD RELATIONSHIP MAP (MOVABLE & ZOOMABLE)
            </span>

            <div className="flex items-center gap-1 bg-slate-900 light:bg-white border border-slate-800 light:border-slate-300 rounded-lg p-1 shadow">
              <button
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-cyan-400 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-cyan-400 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="p-1 rounded hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 light:text-slate-700 hover:text-cyan-400 transition-colors text-[10px] font-mono font-bold"
                title="Reset View"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Canvas Workspace */}
          <div
            className="flex-1 w-full relative cursor-grab active:cursor-grabbing min-h-[420px] touch-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div
              className="absolute inset-0 transition-transform duration-75"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: "top left"
              }}
            >
              {/* SVG Connecting Edges */}
              <svg className="absolute inset-0 w-[1600px] h-[800px] pointer-events-none z-0">
                {relationshipGraph.edges.map((edge, idx) => {
                  const fromNodeKey = Object.keys(NODE_COORDINATES).find(k => k === edge.from || (k === 'v_apex' && edge.from === 'dir_rajesh'));
                  const fromCoord = NODE_COORDINATES[fromNodeKey || 'v_apex'];
                  const toCoord = NODE_COORDINATES.v_apex;

                  // Compute center anchors
                  const x1 = fromCoord ? fromCoord.x + 110 : 550;
                  const y1 = fromCoord ? fromCoord.y + 35 : 250;
                  const x2 = toCoord.x + 110;
                  const y2 = toCoord.y + 35;

                  return (
                    <g key={idx}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#0EA5E9"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        strokeOpacity="0.6"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Render Vendor Nodes */}
              {Object.entries(NODE_COORDINATES).map(([key, n]) => {
                const isCentral = key === 'v_apex';
                const isSelected = selectedElement?.key === key;

                return (
                  <div
                    key={key}
                    onClick={() => setSelectedElement({ key, ...n })}
                    className={`absolute vendor-node-card z-10 p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all duration-200 shadow-xl select-none w-56 ${
                      isCentral
                        ? 'bg-cyan-950/90 light:bg-cyan-50 border-2 border-cyan-400 text-cyan-200 light:text-cyan-900 shadow-cyan-500/30 ring-2 ring-cyan-400 scale-105'
                        : isSelected
                        ? 'bg-slate-900 light:bg-slate-200 border-2 border-amber-400 text-white light:text-slate-900 scale-105'
                        : n.type === 'DIRECTOR'
                        ? 'bg-slate-900/90 light:bg-white border-amber-500/50 text-amber-200 light:text-amber-800'
                        : n.type === 'RELATED COMPANY'
                        ? 'bg-slate-900/90 light:bg-white border-rose-500/50 text-rose-200 light:text-rose-800'
                        : 'bg-slate-900/90 light:bg-white border-slate-700 light:border-slate-300 text-slate-200 light:text-slate-800'
                    }`}
                    style={{ left: `${n.x}px`, top: `${n.y}px` }}
                  >
                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 light:text-slate-600 mb-0.5 truncate">
                      {n.type}
                    </div>
                    <div className="font-bold truncate text-xs text-slate-100 light:text-slate-900">
                      {n.label}
                    </div>
                    <div className="text-[10px] text-slate-400 light:text-slate-600 truncate mt-0.5">
                      {n.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400 light:text-slate-600 flex items-center gap-1 z-10 pt-2 border-t border-slate-800 light:border-slate-200">
            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>Click any entity card to inspect public-record filings. Drag or zoom to explore graph layout.</span>
          </div>
        </div>

        {/* Right Column: Performance Track Record & Node Inspector */}
        <div className="bg-slate-950/80 light:bg-slate-50 border border-slate-800 light:border-slate-300 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 light:text-slate-600 mb-3 tracking-wider">
              Historical Track Record (37 Contracts)
            </h3>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-400 light:text-slate-600">Total Lifetime Value:</span>
                <span className="font-bold text-cyan-300 light:text-cyan-700">{metrics.totalLifetimeContractValue}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-400 light:text-slate-600">Avg Initial Bid Discount:</span>
                <span className="font-bold text-amber-300 light:text-amber-700">{metrics.averageBidDiscount}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-400 light:text-slate-600">Avg Post-Award Variation:</span>
                <span className="font-bold text-rose-300 light:text-rose-700">{metrics.averageContractVariation}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-400 light:text-slate-600">Delayed Projects:</span>
                <span className="font-bold text-amber-300 light:text-amber-700">{metrics.delayedProjectsCount}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 shadow-sm">
                <span className="text-slate-400 light:text-slate-600">Quality Review Flags:</span>
                <span className="font-bold text-rose-400 light:text-rose-700">{metrics.qualityReviewFlags}</span>
              </div>
            </div>
          </div>

          {/* Selected Node Detail Box */}
          {selectedElement ? (
            <div className="p-3 rounded-xl bg-cyan-950/40 light:bg-cyan-50 border border-cyan-900/60 light:border-cyan-200 text-xs font-mono space-y-1">
              <div className="font-bold text-cyan-300 light:text-cyan-800 uppercase">{selectedElement.label}</div>
              <div className="text-[10px] text-cyan-400 light:text-cyan-700 font-bold">{selectedElement.type}</div>
              <p className="text-slate-300 light:text-slate-700 text-[11px] font-sans pt-1">
                {selectedElement.subtitle} &bull; Cross-referenced with Ministry of Corporate Affairs (MCA21) public filings.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 text-[10px] font-mono text-slate-500 light:text-slate-600 text-center shadow-sm">
              Click any node in the graph workspace to inspect public-record relationship evidence.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
