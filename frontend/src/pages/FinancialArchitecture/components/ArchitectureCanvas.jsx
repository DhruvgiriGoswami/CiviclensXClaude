import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { ARCHITECTURE_NODES, ARCHITECTURE_CONNECTIONS, FLOW_MODES } from '../data/architectureData';
import { ArchitectureNode } from './ArchitectureNode';
import { FlowModeSelector } from './FlowModeSelector';

export function ArchitectureCanvas({ selectedNode, onSelectNode }) {
  const [activeMode, setActiveMode] = useState(FLOW_MODES.MONEY);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 30, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.35));
  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 30, y: 20 });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.architecture-node-card')) return;
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
    if (e.target.closest('.architecture-node-card')) return;
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

  // Line colors depending on flow mode
  const getLineColor = () => {
    if (activeMode === FLOW_MODES.MONEY) return "#10B981"; // Emerald
    if (activeMode === FLOW_MODES.CONTROL) return "#B8475F"; // Wine, matches the Control chip
    return "#818CF8"; // Indigo
  };

  const getFlowLabel = (conn) => {
    if (activeMode === FLOW_MODES.MONEY) return conn.moneyLabel || conn.label;
    if (activeMode === FLOW_MODES.CONTROL) return conn.controlLabel || conn.label;
    return conn.dataLabel || conn.label;
  };

  return (
    <div className="w-full flex flex-col h-full bg-dark-900 light:bg-[#F8FAFC] text-slate-100 light:text-slate-900 relative overflow-hidden select-none">
      {/* Flow Mode Switcher Header */}
      <div className="px-4 sm:px-6 py-3 bg-dark-800 light:bg-white border-b border-white/[0.06] light:border-slate-200/80 z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <FlowModeSelector activeMode={activeMode} onSelectMode={setActiveMode} />

        {/* Canvas Controls */}
        <div role="group" aria-label="Canvas zoom" className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.06] light:bg-slate-100">
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-white active:scale-[0.94] transition-[background-color,color,transform] duration-150"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-9 h-9 inline-flex items-center justify-center rounded-full text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-white active:scale-[0.94] transition-[background-color,color,transform] duration-150"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10 light:bg-slate-300 mx-0.5"></div>
          <button
            onClick={handleResetView}
            className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-medium rounded-full text-slate-300 light:text-slate-600 hover:text-white light:hover:text-slate-900 hover:bg-white/[0.08] light:hover:bg-white active:scale-[0.94] transition-[background-color,color,transform] duration-150"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Workspace Canvas */}
      <div
        className="flex-1 w-full relative cursor-grab active:cursor-grabbing overflow-hidden financial-canvas-bg min-h-[560px] touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Render Grid Overlay */}
        <div
          className="absolute inset-0 transition-transform duration-75"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "top left"
          }}
        >
          {/* SVG Connecting Flow Lines & Animated Particles */}
          <svg className="absolute inset-0 w-[3000px] h-[1400px] pointer-events-none z-0">
            <defs>
              <marker
                id="arrowhead-emerald"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#10B981" />
              </marker>
              <marker
                id="arrowhead-wine"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#B8475F" />
              </marker>
              <marker
                id="arrowhead-indigo"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#818CF8" />
              </marker>
            </defs>

            {ARCHITECTURE_CONNECTIONS.map((conn) => {
              const fromNode = ARCHITECTURE_NODES.find((n) => n.id === conn.from);
              const toNode = ARCHITECTURE_NODES.find((n) => n.id === conn.to);

              if (!fromNode || !toNode) return null;

              const cardWidth = 256;
              const cardHeight = 130;

              let x1, y1, x2, y2;

              if (conn.direction === "right") {
                // Exit right edge of fromNode -> enter left edge of toNode
                x1 = fromNode.x + cardWidth;
                y1 = fromNode.y + cardHeight / 2;
                x2 = toNode.x;
                y2 = toNode.y + cardHeight / 2;
              } else if (conn.direction === "down") {
                // Exit bottom of fromNode -> enter top of toNode
                x1 = fromNode.x + cardWidth / 2;
                y1 = fromNode.y + cardHeight;
                x2 = toNode.x + cardWidth / 2;
                y2 = toNode.y;
              } else {
                // Direction left: exit left of fromNode -> enter right of toNode
                x1 = fromNode.x;
                y1 = fromNode.y + cardHeight / 2;
                x2 = toNode.x + cardWidth;
                y2 = toNode.y + cardHeight / 2;
              }

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              const labelText = getFlowLabel(conn);
              // Dynamic badge width calculation
              const badgeWidth = Math.max(labelText.length * 7.5 + 24, 120);
              const halfBadgeWidth = badgeWidth / 2;

              const markerId =
                activeMode === FLOW_MODES.MONEY
                  ? "url(#arrowhead-emerald)"
                  : activeMode === FLOW_MODES.CONTROL
                  ? "url(#arrowhead-wine)"
                  : "url(#arrowhead-indigo)";

              return (
                <g key={conn.id}>
                  {/* Background line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={getLineColor()}
                    strokeWidth="3"
                    strokeOpacity="0.25"
                  />
                  {/* Animated flow path */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={getLineColor()}
                    strokeWidth="2.5"
                    markerEnd={markerId}
                    className="financial-flow-line"
                  />
                  {/* Floating flow label badge dynamically sized to text */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-halfBadgeWidth}
                      y="-13"
                      width={badgeWidth}
                      height="26"
                      rx="13"
                      className="fill-dark-800 light:fill-white"
                      stroke={getLineColor()}
                      strokeWidth="1"
                      strokeOpacity="0.7"
                    />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      className="fill-slate-100 light:fill-slate-900"
                      fontSize="12"
                      fontWeight="500"
                    >
                      {labelText}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Render Nodes */}
          {ARCHITECTURE_NODES.map((node) => (
            <div
              key={node.id}
              className="absolute architecture-node-card z-10"
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
            >
              <ArchitectureNode
                node={node}
                isSelected={selectedNode?.id === node.id}
                onSelect={onSelectNode}
              />
            </div>
          ))}
        </div>

        {/* Bottom Helper Bar */}
        <div className="absolute bottom-4 left-4 right-4 max-w-[calc(100%-2rem)] sm:max-w-max z-10 bg-dark-800/90 light:bg-white/90 backdrop-blur border border-white/[0.08] light:border-slate-200 rounded-full px-4 py-2 text-xs text-slate-300 light:text-slate-700 flex items-center gap-2 shadow-lg">
          <Info className="w-3.5 h-3.5 text-crimson-400 flex-shrink-0" />
          <span>Click any node to inspect institutional specifications & linked records. Drag canvas to navigate.</span>
        </div>
      </div>
    </div>
  );
}
