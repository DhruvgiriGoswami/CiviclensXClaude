import React from 'react';

/**
 * Accurate India Official Sovereign Border Loader
 * Renders ONLY the animated SVG sovereign border in the exact center of the map/screen.
 * Pure SVG icon floating with NO black box, NO background, and NO text.
 */
// Simplified India outline in a 900 x 1000 box, shared with the intro.
export const INDIA_PATH = "M 235,40 C 230,35 210,35 200,45 C 190,55 170,40 165,55 C 160,70 185,110 200,125 C 215,140 230,165 240,185 C 245,195 240,205 235,215 C 230,225 215,235 205,245 C 195,255 195,275 190,290 C 185,305 155,305 140,315 C 125,325 95,325 80,335 C 65,345 50,340 35,355 C 20,370 10,400 25,420 C 40,440 65,455 80,445 C 95,435 90,460 70,470 C 50,480 30,470 15,485 C 0,500 10,520 25,525 C 40,530 65,510 80,505 C 95,500 110,515 125,520 C 140,525 150,545 145,565 C 140,585 145,605 153,630 C 165,670 185,720 210,775 C 235,830 265,885 290,925 C 300,940 315,955 330,955 C 345,955 360,935 375,900 C 395,855 415,800 435,745 C 455,690 470,645 475,625 C 480,605 460,585 470,565 C 480,545 500,535 515,520 C 530,505 540,510 550,490 C 560,470 580,470 600,450 C 620,430 635,445 650,425 C 665,405 650,360 645,345 C 640,330 620,325 615,315 C 610,305 615,290 630,285 C 645,280 660,315 680,325 C 700,335 725,300 745,300 C 765,300 805,250 820,245 C 835,240 855,255 870,270 C 885,285 890,300 880,315 C 870,330 845,330 840,345 C 835,360 855,380 845,395 C 835,410 815,395 800,410 C 785,425 780,460 760,465 C 740,470 735,440 720,440 C 705,440 690,470 680,475 C 670,480 665,455 650,445 C 635,435 625,445 620,425 C 615,405 625,375 610,375 C 595,375 595,415 590,435 C 585,455 575,440 565,425 C 550,405 540,410 525,400 C 510,390 495,405 480,395 C 465,385 450,370 435,360 C 420,350 405,360 390,350 C 375,340 365,315 355,300 C 345,285 330,290 320,275 C 310,260 315,240 325,225 C 335,210 355,215 365,200 C 380,185 375,155 385,135 C 395,115 425,120 435,100 C 445,80 430,55 420,35 C 410,15 390,5 375,5 C 360,5 350,30 335,40 C 320,50 300,50 290,30 C 280,10 260,10 250,25 Z";

export const IndiaMapLoader = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <style>{`
        @keyframes trace-accurate-map-reverse {
          0% {
            stroke-dashoffset: 4500;
            stroke: #ff9933; /* Saffron */
          }
          40% {
            stroke: #ff9933;
          }
          50% {
            stroke: #ffffff; /* White phase with glow */
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.95));
          }
          60% {
            stroke: #128807; /* Green */
          }
          100% {
            stroke-dashoffset: -4500;
            stroke: #128807;
          }
        }

        .map-boundary-accurate {
          fill: none;
          stroke: #ff9933;
          stroke-width: 36;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 4500;
          stroke-dashoffset: 4500;
          animation: trace-accurate-map-reverse 4s ease-in-out infinite;
        }
      `}</style>

      {/* Pure Floating SVG Icon in exact center of screen */}
      <div className="w-24 h-28 relative filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
        <svg viewBox="0 0 900 1000" className="w-full h-full overflow-visible">
          <path
            className="map-boundary-accurate"
            d={INDIA_PATH}
          />
        </svg>
      </div>
    </div>
  );
};

export default IndiaMapLoader;
