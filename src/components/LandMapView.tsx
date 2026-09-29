import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Info,
  Building2,
  TreePine,
  Waves,
  Zap,
  Navigation,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowLeft,
} from 'lucide-react';
import {
  LandParcel,
  sampleLandParcels,
  getParcelById,
  ProjectCorridor,
  sampleProjectCorridors,
} from '../data/citizenData';
import { UserRole } from '../types';

interface LandMapViewProps {
  initialParcelId?: string | null;
  onOpenParcelDossier?: (parcel: LandParcel) => void;
  currentRole?: UserRole;
  isCitizenView?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

export type GISCategory = 'COMPLETED' | 'STATIC' | 'ACTIVE' | 'PENDING' | 'DELAYED_RISK';

export function classifyParcel(parcel: LandParcel): 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'DELAYED_RISK' {
  // Red: Delayed / High Risk
  if (
    parcel.acquisitionStatus.toLowerCase().includes('stay') ||
    parcel.acquisitionStatus.toLowerCase().includes('delayed') ||
    parcel.stage === 'Objections' ||
    parcel.color === '#DC2626'
  ) {
    return 'DELAYED_RISK';
  }
  // Green: Completed
  if (
    parcel.possessionStatus === 'Completed' ||
    parcel.handoverStatus === 'Completed' ||
    parcel.stage === 'Handover' ||
    parcel.acquisitionStatus.toLowerCase().includes('disbursed') ||
    parcel.color === '#16A34A'
  ) {
    return 'COMPLETED';
  }
  // Pending
  if (
    parcel.possessionStatus === 'Pending' ||
    parcel.handoverStatus === 'Pending' ||
    parcel.stage === 'Survey' ||
    parcel.stage === 'Proposal' ||
    parcel.stage === 'Notification'
  ) {
    return 'PENDING';
  }
  // Active / In Progress
  return 'ACTIVE';
}

export function getGISCategoryMeta(category: GISCategory) {
  switch (category) {
    case 'COMPLETED':
      return {
        label: 'Completed',
        color: '#16A34A',
        badgeBg: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      };
    case 'STATIC':
      return {
        label: 'Static / Fixed Project Area',
        color: '#2563EB',
        badgeBg: 'bg-blue-100 text-blue-900 border border-blue-300',
      };
    case 'ACTIVE':
      return {
        label: 'Active / In Progress',
        color: '#EA580C',
        badgeBg: 'bg-orange-100 text-orange-900 border border-orange-300',
      };
    case 'PENDING':
      return {
        label: 'Active / Pending',
        color: '#EA580C',
        badgeBg: 'bg-amber-100 text-amber-900 border border-amber-300',
      };
    case 'DELAYED_RISK':
      return {
        label: 'Delayed / High Risk',
        color: '#DC2626',
        badgeBg: 'bg-red-100 text-red-900 border border-red-300',
      };
  }
}

export const LandMapView: React.FC<LandMapViewProps> = ({
  initialParcelId,
  onOpenParcelDossier,
  currentRole,
  isCitizenView = false,
  onBack,
  backLabel,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const polygonMapRef = useRef<Record<string, L.Polygon>>({});

  // Layer Controls State
  const [layerVisibility, setLayerVisibility] = useState({
    projectAlignment: true,
    completedSections: true,
    activeSections: true,
    pendingSections: true,
    landParcels: true,
    riskAreas: true,
  });
  const [showLayerControls, setShowLayerControls] = useState(false);

  const [selectedParcel, setSelectedParcel] = useState<LandParcel>(() => {
    if (initialParcelId) {
      const found = getParcelById(initialParcelId);
      if (found) return found;
    }
    // Check URL hash if arriving from a direct parcel link
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#parcel=')) {
      const hashId = window.location.hash.replace('#parcel=', '');
      const found = getParcelById(hashId);
      if (found) return found;
    }
    return sampleLandParcels[0];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSurroundingTab, setActiveSurroundingTab] = useState<
    'overview' | 'villages' | 'landuse' | 'roads' | 'water' | 'infrastructure'
  >('overview');

  // Filter parcels for search
  const filteredParcels = useMemo(() => {
    if (!searchQuery.trim()) return sampleLandParcels;
    const q = searchQuery.toLowerCase();
    return sampleLandParcels.filter(
      (p) =>
        p.parcelNumber.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q) ||
        p.village.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: selectedParcel.centerCoordinates,
        zoom: 14,
        zoomControl: true,
      });

      // Free OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Layers (Corridors, Parcels, Highlights)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    polygonMapRef.current = {};

    // 1. STATIC / FIXED PROJECT AREA (BLUE)
    // Project alignment, Fixed corridor, Right-of-Way, Static project boundary
    if (layerVisibility.projectAlignment) {
      sampleProjectCorridors.forEach((corridor) => {
        // Static Right-of-Way (RoW) Footprint Boundary Polygon
        const rowPolygon = L.polygon(corridor.rowPolygonCoordinates, {
          color: '#1D4ED8', // Deep Blue border
          weight: 2,
          fillColor: '#2563EB', // Blue fill
          fillOpacity: 0.18,
          dashArray: '5, 5',
        });

        const corridorPopup = document.createElement('div');
        corridorPopup.className = 'text-xs font-sans p-2 space-y-2 min-w-[240px]';
        corridorPopup.innerHTML = `
          <div class="border-b border-slate-200 pb-1.5 flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">${corridor.projectId}</span>
              <h4 class="font-bold text-sm text-blue-900 font-serif leading-tight">Fixed Right-of-Way (RoW)</h4>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
              Static / Fixed Area
            </span>
          </div>
          <div class="space-y-1 text-slate-700 text-[11px]">
            <div><span class="text-slate-500">Project ID:</span> <strong class="font-mono text-slate-900">${corridor.projectId}</strong></div>
            <div><span class="text-slate-500">Project Name:</span> <strong class="text-slate-900">${corridor.projectName}</strong></div>
            <div><span class="text-slate-500">Village:</span> <strong class="text-slate-900">${corridor.village}</strong></div>
            <div><span class="text-slate-500">District:</span> ${corridor.district} (${corridor.state})</div>
            <div><span class="text-slate-500">Corridor Footprint:</span> <strong>${corridor.totalAreaHa} Ha</strong> (${corridor.rowWidthMeters}m standard RoW)</div>
            <div><span class="text-slate-500">Acquisition Stage:</span> <span class="font-semibold text-slate-900">${corridor.acquisitionStage}</span></div>
            <div><span class="text-slate-500">Current Status:</span> <span class="font-medium text-slate-800">${corridor.status}</span></div>
          </div>
        `;
        rowPolygon.bindPopup(corridorPopup);
        rowPolygon.addTo(layerGroup);

        // Project Alignment Centerline Polyline
        const centerline = L.polyline(corridor.centerlineCoordinates, {
          color: '#2563EB', // Blue
          weight: 4,
          opacity: 0.9,
          dashArray: '8, 6',
        });
        centerline.bindPopup(corridorPopup);
        centerline.addTo(layerGroup);
      });
    }

    // 2. LAND PARCELS & SECTIONS (COMPLETED, ACTIVE, PENDING, DELAYED/HIGH RISK)
    if (layerVisibility.landParcels) {
      sampleLandParcels.forEach((parcel) => {
        const category = classifyParcel(parcel);

        // Layer visibility filtering
        if (category === 'COMPLETED' && !layerVisibility.completedSections) return;
        if (category === 'ACTIVE' && !layerVisibility.activeSections) return;
        if (category === 'PENDING' && !layerVisibility.pendingSections) return;
        if (category === 'DELAYED_RISK' && !layerVisibility.riskAreas) return;

        const isSelected = parcel.id === selectedParcel.id;
        const meta = getGISCategoryMeta(category);

        // Colored polygon highlighting acquisition area using standardized colors
        const polygon = L.polygon(parcel.polygonCoordinates, {
          color: isSelected ? '#0F172A' : meta.color,
          weight: isSelected ? 3.5 : 2,
          fillColor: meta.color,
          fillOpacity: isSelected ? 0.65 : 0.4,
          dashArray: isSelected ? undefined : '3, 3',
        });

        // Interactive popup with required information (NO citizen private info)
        const popupContent = document.createElement('div');
        popupContent.className = 'text-xs font-sans p-2 space-y-2 min-w-[240px]';
        popupContent.innerHTML = `
          <div class="border-b border-slate-200 pb-1.5 flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">${parcel.projectId}</span>
              <h4 class="font-bold text-sm text-slate-900 font-serif leading-tight">${parcel.parcelNumber}</h4>
            </div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.badgeBg}">
              ${meta.label}
            </span>
          </div>
          <div class="space-y-1 text-slate-700 text-[11px]">
            <div><span class="text-slate-500">Project ID:</span> <strong class="font-mono text-slate-900">${parcel.projectId}</strong></div>
            <div><span class="text-slate-500">Project Name:</span> <strong class="text-slate-900">${parcel.projectName}</strong></div>
            <div><span class="text-slate-500">Village:</span> <strong class="text-slate-900">${parcel.village}</strong></div>
            <div><span class="text-slate-500">District:</span> ${parcel.district} (${parcel.state})</div>
            <div><span class="text-slate-500">Parcel / Survey No:</span> <strong class="font-mono text-slate-900">${parcel.parcelNumber}</strong></div>
            <div><span class="text-slate-500">Land Area:</span> <strong>${parcel.areaHectares} Ha</strong> (${parcel.areaAcres} Acres)</div>
            <div><span class="text-slate-500">Acquisition Stage:</span> <span class="font-semibold text-slate-900">${parcel.stage}</span></div>
            <div><span class="text-slate-500">Current Status:</span> <span class="font-medium text-slate-800">${parcel.acquisitionStatus}</span></div>
          </div>
        `;

        polygon.bindPopup(popupContent);

        polygon.on('click', () => {
          setSelectedParcel(parcel);
        });

        polygon.addTo(layerGroup);
        polygonMapRef.current[parcel.id] = polygon;
      });
    }

    // Fly to selected parcel and open popup
    const targetPolygon = polygonMapRef.current[selectedParcel.id];
    if (targetPolygon) {
      map.flyTo(selectedParcel.centerCoordinates, 15, { duration: 0.8 });
      targetPolygon.openPopup();
    }
  }, [selectedParcel, layerVisibility]);

  // Synchronize when initialParcelId prop changes
  useEffect(() => {
    if (initialParcelId) {
      const found = getParcelById(initialParcelId);
      if (found) setSelectedParcel(found);
    }
  }, [initialParcelId]);

  // Handle URL hash changes (Direct parcel links opening this page)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.startsWith('#parcel=')) {
        const hashId = window.location.hash.replace('#parcel=', '');
        const found = getParcelById(hashId);
        if (found) setSelectedParcel(found);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectParcel = (parcel: LandParcel) => {
    setSelectedParcel(parcel);
    if (typeof window !== 'undefined') {
      window.location.hash = `parcel=${parcel.id}`;
    }
  };

  const surrounding = selectedParcel.surroundingData;

  return (
    <div className="space-y-4">
      {/* Back Button Navigation when arrived from another view */}
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-[#123B63] hover:text-blue-900 border border-slate-300 rounded text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel || 'Back'}</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#123B63]" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              Land Acquisition Cadastral GIS Map
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            OpenStreetMap geospatial layer demarcating acquired parcel boundaries, Right-of-Way (RoW) corridors, and surrounding topography.
          </p>
        </div>

        {/* Parcel Jump Selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedParcel.id}
              onChange={(e) => {
                const found = getParcelById(e.target.value);
                if (found) handleSelectParcel(found);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#123B63]"
              aria-label="Select Land Parcel"
            >
              {sampleLandParcels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.parcelNumber} — {p.village}, {p.district} ({p.stage})
                </option>
              ))}
            </select>
          </div>

          {onOpenParcelDossier && (
            <button
              onClick={() => onOpenParcelDossier(selectedParcel)}
              className="px-3 py-1.5 bg-[#123B63] hover:bg-[#0e2f50] text-white text-xs font-semibold rounded inline-flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Parcel Dossier</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map & Surrounding Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Container (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded overflow-hidden shadow-xs flex flex-col min-h-[520px]">
          {/* Map Top Bar */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-semibold text-slate-800 truncate max-w-xs">
                Active Corridor: {selectedParcel.projectName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLayerControls(!showLayerControls)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-[11px] transition shadow-2xs"
                title="Toggle GIS Layer Controls"
              >
                <Layers className="w-3.5 h-3.5 text-[#123B63]" />
                <span>Layers ({Object.values(layerVisibility).filter(Boolean).length}/6)</span>
                {showLayerControls ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
              </button>
              <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
                {selectedParcel.centerCoordinates[0].toFixed(4)}°N, {selectedParcel.centerCoordinates[1].toFixed(4)}°E
              </div>
            </div>
          </div>

          {/* Leaflet Map Target with Layer Controls */}
          <div className="relative flex-1 w-full min-h-[440px]">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

            {/* Interactive Layer Controls Overlay Panel */}
            {showLayerControls && (
              <div className="absolute top-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-xs rounded shadow-lg border border-slate-300 p-2.5 text-xs min-w-[210px] space-y-1.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-[#123B63]" />
                    <span>Layer Controls</span>
                  </span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setLayerVisibility({ projectAlignment: true, completedSections: true, activeSections: true, pendingSections: true, landParcels: true, riskAreas: true })}
                      className="text-[#123B63] hover:underline font-bold"
                    >
                      All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setLayerVisibility({ projectAlignment: false, completedSections: false, activeSections: false, pendingSections: false, landParcels: false, riskAreas: false })}
                      className="text-slate-500 hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* 1. Project Alignment (Blue) */}
                <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="font-medium text-slate-800 text-[11px]">Project Alignment</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.projectAlignment}
                    onChange={(e) => setLayerVisibility({ ...layerVisibility, projectAlignment: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                  />
                </label>

                {/* 2. Completed Sections (Green) */}
                <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-medium text-slate-800 text-[11px]">Completed Sections</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.completedSections}
                    onChange={(e) => setLayerVisibility({ ...layerVisibility, completedSections: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                </label>

                {/* 3. Active Sections (Orange) */}
                <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                    <span className="font-medium text-slate-800 text-[11px]">Active Sections</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.activeSections}
                    onChange={(e) => setLayerVisibility({ ...layerVisibility, activeSections: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 h-3.5 w-3.5"
                  />
                </label>

                {/* 4. Pending Sections (Orange/Amber) */}
                <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-medium text-slate-800 text-[11px]">Pending Sections</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.pendingSections}
                    onChange={(e) => setLayerVisibility({ ...layerVisibility, pendingSections: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
                  />
                </label>

                {/* 5. Land Parcels (Cadastral outlines) */}
                <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs border border-slate-700 bg-slate-200" />
                    <span className="font-medium text-slate-800 text-[11px]">Land Parcels</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.landParcels}
                    onChange={(e) => setLayerVisibility({ ...layerVisibility, landParcels: e.target.checked })}
                    className="rounded text-slate-800 focus:ring-slate-500 h-3.5 w-3.5"
                  />
                </label>

                {/* 6. Risk Areas (Red) */}
                <label className="flex items-center justify-between gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                    <span className="font-medium text-slate-800 text-[11px]">Risk Areas</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layerVisibility.riskAreas}
                    onChange={(e) => setLayerVisibility({ ...layerVisibility, riskAreas: e.target.checked })}
                    className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Clear GIS Legend */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#123B63]" />
                <span>GIS Legend:</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                <span className="w-3 h-3 rounded-xs border border-emerald-700 bg-emerald-500" />
                <span className="font-bold text-emerald-900 text-[11px]">Green</span>
                <span className="text-slate-600 text-[11px]">= Completed</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                <span className="w-3 h-3 rounded-xs border border-blue-700 bg-blue-500" />
                <span className="font-bold text-blue-900 text-[11px]">Blue</span>
                <span className="text-slate-600 text-[11px]">= Static / Fixed Project Area</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-orange-200 shadow-2xs">
                <span className="w-3 h-3 rounded-xs border border-orange-700 bg-orange-500" />
                <span className="font-bold text-orange-900 text-[11px]">Orange</span>
                <span className="text-slate-600 text-[11px]">= Active / In Progress</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-red-200 shadow-2xs">
                <span className="w-3 h-3 rounded-xs border border-red-700 bg-red-600" />
                <span className="font-bold text-red-900 text-[11px]">Red</span>
                <span className="text-slate-600 text-[11px]">= Delayed / High Risk</span>
              </span>
            </div>
            <span className="italic text-[10px] text-slate-500 hidden md:inline">
              Click any polygon or alignment to view statutory GIS metadata
            </span>
          </div>
        </div>

        {/* Surrounding Area Data Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            {/* Header with Mandatory "Sample Data" label as requested */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-[#123B63]" />
                  Surrounding Area Data
                </h3>
                <p className="text-[11px] text-slate-500">
                  Adjacent environmental and infrastructure landscape for {selectedParcel.parcelNumber}
                </p>
              </div>

              {/* MANDATORY LABEL: Sample Data */}
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 tracking-wider uppercase shadow-2xs">
                Sample Data
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 pt-3 pb-2 text-xs border-b border-slate-100">
              {[
                { id: 'overview', label: 'Summary' },
                { id: 'villages', label: 'Nearby Villages' },
                { id: 'landuse', label: 'Land Use' },
                { id: 'roads', label: 'Roads & Access' },
                { id: 'water', label: 'Water Bodies' },
                { id: 'infrastructure', label: 'Infrastructure' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSurroundingTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    activeSurroundingTab === tab.id
                      ? 'bg-[#123B63] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="pt-3 text-xs space-y-3 max-h-[380px] overflow-y-auto">
              {/* Tab 1: Overview Summary */}
              {activeSurroundingTab === 'overview' && (
                <div className="space-y-3">
                  <div className="p-3 rounded bg-blue-50/60 border border-blue-200 text-blue-900 space-y-1">
                    <span className="font-bold text-xs block">
                      Target Parcel: {selectedParcel.parcelNumber} &bull; {selectedParcel.village}
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      Situated in village <strong>{selectedParcel.village}</strong>, Taluka {selectedParcel.taluka}. Surrounded by agricultural holdings with primary frontage toward {surrounding.roads[0]?.name}.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 block">Nearby Settlement:</span>
                      <strong className="text-slate-900">{surrounding.nearbyVillages[0]?.name}</strong>
                      <span className="text-slate-500 block text-[10px] mt-0.5">
                        {surrounding.nearbyVillages[0]?.distanceKm} km {surrounding.nearbyVillages[0]?.direction}
                      </span>
                    </div>

                    <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 block">Primary Highway:</span>
                      <strong className="text-slate-900">{surrounding.roads[0]?.name}</strong>
                      <span className="text-slate-500 block text-[10px] mt-0.5">
                        {surrounding.roads[0]?.distanceMeters}m distance
                      </span>
                    </div>

                    <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 block">Canal / Water Feeder:</span>
                      <strong className="text-slate-900">{surrounding.waterBodies[0]?.name}</strong>
                      <span className="text-slate-500 block text-[10px] mt-0.5">
                        {surrounding.waterBodies[0]?.distanceMeters}m away
                      </span>
                    </div>

                    <div className="p-2.5 rounded border border-slate-200 bg-slate-50">
                      <span className="text-slate-500 block">Corridor Utility:</span>
                      <strong className="text-slate-900 truncate block">
                        {surrounding.infrastructure[0]?.name}
                      </strong>
                      <span className="text-emerald-700 block text-[10px] mt-0.5">
                        {surrounding.infrastructure[0]?.clearanceStatus}
                      </span>
                    </div>
                  </div>

                  {/* Other Parcels Under Acquisition */}
                  <div className="border border-slate-200 rounded p-2.5 space-y-2">
                    <span className="font-bold text-slate-800 text-[11px] block">
                      Adjacent Parcels in this Corridor:
                    </span>
                    <div className="space-y-1.5">
                      {surrounding.otherParcels.map((adj) => (
                        <div
                          key={adj.parcelNumber}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-50 border border-slate-100 text-[11px]"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{adj.parcelNumber}</span>
                            <span className="text-slate-500 ml-1.5 font-mono text-[10px]">({adj.areaHa} Ha)</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono">
                            {adj.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Villages */}
              {activeSurroundingTab === 'villages' && (
                <div className="space-y-2">
                  {surrounding.nearbyVillages.map((v) => (
                    <div
                      key={v.name}
                      className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{v.name}</div>
                        <div className="text-[11px] text-slate-500">Gram Panchayat: {v.gramPanchayat}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-blue-900 font-mono">{v.distanceKm} km</span>
                        <span className="text-slate-500 block text-[10px]">{v.direction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Land Use */}
              {activeSurroundingTab === 'landuse' && (
                <div className="space-y-3">
                  {surrounding.landUse.map((lu) => (
                    <div key={lu.category} className="space-y-1">
                      <div className="flex justify-between font-semibold text-slate-800 text-xs">
                        <span>{lu.category}</span>
                        <span className="font-mono text-[#123B63]">{lu.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#123B63] h-full rounded-full"
                          style={{ width: `${lu.percentage}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 italic">{lu.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Roads */}
              {activeSurroundingTab === 'roads' && (
                <div className="space-y-2">
                  {surrounding.roads.map((road) => (
                    <div key={road.name} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{road.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {road.type}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Distance: {road.distanceMeters} meters</span>
                        <span className="text-slate-500">{road.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 5: Water Bodies */}
              {activeSurroundingTab === 'water' && (
                <div className="space-y-2">
                  {surrounding.waterBodies.map((wb) => (
                    <div key={wb.name} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{wb.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                          {wb.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <span>Distance from parcel: {wb.distanceMeters} meters</span>
                        <p className="text-slate-500 mt-0.5 italic">Engineering Mitigation: {wb.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 6: Infrastructure */}
              {activeSurroundingTab === 'infrastructure' && (
                <div className="space-y-2">
                  {surrounding.infrastructure.map((inf) => (
                    <div key={inf.name} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{inf.name}</span>
                        <span className="text-[10px] font-mono text-slate-500">{inf.agency}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span>Buffer Distance: {inf.distanceMeters}m</span>
                        <span className="font-semibold text-emerald-700">{inf.clearanceStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Footer in Panel */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Survey: Joint Demarcation (JMS)
            </span>
            {onOpenParcelDossier && (
              <button
                onClick={() => onOpenParcelDossier(selectedParcel)}
                className="text-[#123B63] hover:underline font-bold text-xs inline-flex items-center gap-1"
              >
                <span>Full Notice Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
