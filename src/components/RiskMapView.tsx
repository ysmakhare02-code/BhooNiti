import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Project, Language, AuthUser } from '../types';
import { translations } from '../data/translations';
import {
  Filter,
  RotateCcw,
  MapPin,
  Layers,
  ChevronRight,
  Info,
  Building,
  Landmark,
} from 'lucide-react';
import { getScopedProjects } from '../data/permissions';

interface RiskMapViewProps {
  projects: Project[];
  currentLang: Language;
  currentUser?: AuthUser;
  onSelectProject: (projectId: string) => void;
}

type MapLevel = 'India' | 'State' | 'Project';

export const RiskMapView: React.FC<RiskMapViewProps> = ({
  projects,
  currentLang,
  currentUser,
  onSelectProject,
}) => {
  const t = translations[currentLang];
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Drill-down level & selection state
  const [mapLevel, setMapLevel] = useState<MapLevel>('India');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Scoped projects
  const scopedProjects = useMemo(() => {
    return currentUser ? getScopedProjects(projects, currentUser) : projects;
  }, [projects, currentUser]);

  // Distinct states and districts
  const allStates = useMemo(
    () => Array.from(new Set(scopedProjects.map((p) => p.state))).sort(),
    [scopedProjects]
  );

  const availableDistricts = useMemo(() => {
    const subset =
      selectedState === 'ALL'
        ? scopedProjects
        : scopedProjects.filter((p) => p.state === selectedState);
    return Array.from(new Set(subset.map((p) => p.district))).sort();
  }, [scopedProjects, selectedState]);

  const allTypes = useMemo(
    () => Array.from(new Set(scopedProjects.map((p) => p.type))).sort(),
    [scopedProjects]
  );

  // Filtered projects based on active dropdowns
  const filteredProjects = useMemo(() => {
    return scopedProjects.filter((p) => {
      if (selectedRisk !== 'ALL' && p.riskLevel !== selectedRisk) return false;
      if (selectedType !== 'ALL' && p.type !== selectedType) return false;
      if (selectedState !== 'ALL' && p.state !== selectedState) return false;
      if (selectedDistrict !== 'ALL' && p.district !== selectedDistrict) return false;
      return true;
    });
  }, [scopedProjects, selectedRisk, selectedType, selectedState, selectedDistrict]);

  // Color helper based on average risk score
  const getRiskColor = (score: number) => {
    if (score >= 75) return '#C62828'; // Critical
    if (score >= 60) return '#D96C00'; // High
    if (score >= 35) return '#D99A00'; // Moderate
    return '#287D4A'; // Low
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 78.9],
        zoom: 5,
        minZoom: 4,
        maxZoom: 16,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

  // 2. Render Layers based on current level
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // -------------------------------------------------------------
    // LEVEL 1: INDIA (State Bubbles)
    // -------------------------------------------------------------
    if (mapLevel === 'India') {
      // Group projects by state (using scopedProjects filtered by risk/type)
      const stateMap: Record<string, Project[]> = {};
      scopedProjects
        .filter((p) => {
          if (selectedRisk !== 'ALL' && p.riskLevel !== selectedRisk) return false;
          if (selectedType !== 'ALL' && p.type !== selectedType) return false;
          return true;
        })
        .forEach((p) => {
          if (!stateMap[p.state]) stateMap[p.state] = [];
          stateMap[p.state].push(p);
        });

      Object.entries(stateMap).forEach(([state, projs]) => {
        const count = projs.length;
        const avgRisk = Math.round(
          projs.reduce((acc, curr) => acc + curr.riskScore, 0) / count
        );
        const avgLat =
          projs.reduce((acc, curr) => acc + curr.coordinates[0], 0) / count;
        const avgLng =
          projs.reduce((acc, curr) => acc + curr.coordinates[1], 0) / count;

        const color = getRiskColor(avgRisk);
        const bubbleSize = Math.max(34, Math.min(60, 24 + count * 5));

        const icon = L.divIcon({
          className: 'state-bubble-marker',
          html: `
            <div style="
              width: ${bubbleSize}px;
              height: ${bubbleSize}px;
              background-color: ${color};
              color: white;
              border-radius: 50%;
              border: 3px solid #ffffff;
              box-shadow: 0 3px 8px rgba(0,0,0,0.35);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-family: sans-serif;
              transition: transform 0.15s ease;
            ">
              <span style="font-size: 13px; font-weight: 800; line-height: 1;">${count}</span>
              <span style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.95;">${state.slice(0, 3)}</span>
            </div>
          `,
          iconSize: [bubbleSize, bubbleSize],
          iconAnchor: [bubbleSize / 2, bubbleSize / 2],
        });

        const marker = L.marker([avgLat, avgLng], { icon });

        // Tooltip
        marker.bindTooltip(
          `<strong>${state}</strong><br/>${count} Projects &bull; Avg Delay Risk: ${avgRisk}%<br/><span style="color:#123B63; font-size:10px;">Click to drill down into districts &rarr;</span>`,
          { direction: 'top', offset: [0, -bubbleSize / 2] }
        );

        // Click handler zooms into state level
        marker.on('click', () => {
          setSelectedState(state);
          setSelectedDistrict('ALL');
          setMapLevel('State');
          map.flyTo([avgLat, avgLng], 7, { duration: 1 });
        });

        marker.addTo(layers);
      });
    }

    // -------------------------------------------------------------
    // LEVEL 2: STATE (District Bubbles)
    // -------------------------------------------------------------
    else if (mapLevel === 'State') {
      const stateProjects = scopedProjects.filter((p) => {
        if (selectedState !== 'ALL' && p.state !== selectedState) return false;
        if (selectedRisk !== 'ALL' && p.riskLevel !== selectedRisk) return false;
        if (selectedType !== 'ALL' && p.type !== selectedType) return false;
        return true;
      });

      const districtMap: Record<string, Project[]> = {};
      stateProjects.forEach((p) => {
        if (!districtMap[p.district]) districtMap[p.district] = [];
        districtMap[p.district].push(p);
      });

      Object.entries(districtMap).forEach(([district, projs]) => {
        const count = projs.length;
        const avgRisk = Math.round(
          projs.reduce((acc, curr) => acc + curr.riskScore, 0) / count
        );
        const avgLat =
          projs.reduce((acc, curr) => acc + curr.coordinates[0], 0) / count;
        const avgLng =
          projs.reduce((acc, curr) => acc + curr.coordinates[1], 0) / count;

        const color = getRiskColor(avgRisk);
        const bubbleSize = Math.max(30, Math.min(52, 22 + count * 6));

        const icon = L.divIcon({
          className: 'district-bubble-marker',
          html: `
            <div style="
              width: ${bubbleSize}px;
              height: ${bubbleSize}px;
              background-color: ${color};
              color: white;
              border-radius: 50%;
              border: 2.5px solid #ffffff;
              box-shadow: 0 3px 6px rgba(0,0,0,0.3);
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              font-family: sans-serif;
            ">
              <span style="font-size: 12px; font-weight: 800; line-height: 1;">${count}</span>
              <span style="font-size: 8px; font-weight: 600; text-transform: uppercase; opacity: 0.9;">Proj</span>
            </div>
          `,
          iconSize: [bubbleSize, bubbleSize],
          iconAnchor: [bubbleSize / 2, bubbleSize / 2],
        });

        const marker = L.marker([avgLat, avgLng], { icon });

        marker.bindTooltip(
          `<strong>${district} District</strong><br/>${count} Projects &bull; Avg Delay Risk: ${avgRisk}%<br/><span style="color:#123B63; font-size:10px;">Click to view project site markers &rarr;</span>`,
          { direction: 'top', offset: [0, -bubbleSize / 2] }
        );

        marker.on('click', () => {
          setSelectedDistrict(district);
          setMapLevel('Project');
          map.flyTo([avgLat, avgLng], 9, { duration: 1 });
        });

        marker.addTo(layers);
      });
    }

    // -------------------------------------------------------------
    // LEVEL 3: PROJECT (Individual Markers)
    // -------------------------------------------------------------
    else if (mapLevel === 'Project') {
      filteredProjects.forEach((p) => {
        const color =
          p.riskLevel === 'CRITICAL'
            ? '#C62828'
            : p.riskLevel === 'HIGH'
            ? '#D96C00'
            : p.riskLevel === 'MODERATE'
            ? '#D99A00'
            : '#287D4A';

        const customIcon = L.divIcon({
          className: 'custom-risk-marker',
          html: `
            <div style="
              background-color: ${color};
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2.5px solid #ffffff;
              box-shadow: 0 2px 5px rgba(0,0,0,0.35);
              cursor: pointer;
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker(p.coordinates, { icon: customIcon });

        const popupContent = `
          <div style="font-family: 'Noto Sans', sans-serif; font-size: 12px; min-width: 220px; padding: 4px 2px;">
            <div style="font-size: 10px; font-weight: bold; color: #123B63; font-family: monospace;">${p.id}</div>
            <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">${p.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${p.tehsil}, ${p.district}, ${p.state}</div>
            
            <div style="display: flex; align-items: center; gap: 6px; margin: 8px 0; padding: 4px 6px; background-color: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color};"></span>
              <span style="font-weight: bold; color: ${color}; font-size: 11px;">${p.riskLevel} (${p.delayProbability}%)</span>
              <span style="font-size: 11px; color: #475569;">Stage: <strong>${p.currentStage}</strong></span>
            </div>

            <div style="font-size: 11px; color: #334155; margin-bottom: 8px;">
              <strong>Primary Risk Driver:</strong> ${p.topRiskFactors[0]?.name || 'Routine monitoring'}
            </div>

            <button 
              id="popup-btn-${p.id}" 
              style="width: 100%; background-color: #123B63; color: white; border: none; padding: 6px 10px; font-size: 11px; font-weight: bold; border-radius: 4px; cursor: pointer;"
            >
              Investigate Full Dossier &rarr;
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const btn = document.getElementById(`popup-btn-${p.id}`);
          if (btn) {
            btn.onclick = () => onSelectProject(p.id);
          }
        });

        marker.addTo(layers);
      });
    }
  }, [
    mapLevel,
    filteredProjects,
    scopedProjects,
    selectedRisk,
    selectedType,
    selectedState,
    selectedDistrict,
    onSelectProject,
  ]);

  // Level transition helpers
  const handleSelectLevel = (newLevel: MapLevel) => {
    setMapLevel(newLevel);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (newLevel === 'India') {
      setSelectedState('ALL');
      setSelectedDistrict('ALL');
      map.flyTo([21.5, 78.9], 5, { duration: 1 });
    } else if (newLevel === 'State') {
      setSelectedDistrict('ALL');
      if (selectedState !== 'ALL') {
        const stateProjects = scopedProjects.filter((p) => p.state === selectedState);
        if (stateProjects.length > 0) {
          map.flyTo(stateProjects[0].coordinates, 7, { duration: 1 });
        }
      } else {
        map.flyTo([21.5, 78.9], 6, { duration: 1 });
      }
    } else if (newLevel === 'Project') {
      if (filteredProjects.length > 0) {
        map.flyTo(filteredProjects[0].coordinates, 9, { duration: 1 });
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedRisk('ALL');
    setSelectedState('ALL');
    setSelectedDistrict('ALL');
    setSelectedType('ALL');
    setMapLevel('India');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.5, 78.9], 5, { duration: 1 });
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#123B63]" />
            <h1 className="text-xl font-bold text-slate-900 font-serif">
              {t.navRiskMap}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographical dispersion of land acquisition projects across Indian states categorized by delay probability.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C62828]" />
            <span>Critical (&gt;75%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D96C00]" />
            <span>High (60-74%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99A00]" />
            <span>Moderate (35-59%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#287D4A]" />
            <span>Low (&lt;35%)</span>
          </div>
        </div>
      </div>

      {/* Drill-down Navigation & Level Toggle */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">
            Hierarchy:
          </span>

          <button
            onClick={() => handleSelectLevel('India')}
            className={`font-semibold px-2 py-1 rounded transition ${
              mapLevel === 'India'
                ? 'bg-[#123B63] text-white font-bold'
                : 'text-[#123B63] hover:bg-slate-100'
            }`}
          >
            India
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

          <button
            onClick={() => {
              if (selectedState !== 'ALL') {
                handleSelectLevel('State');
              }
            }}
            disabled={selectedState === 'ALL'}
            className={`font-semibold px-2 py-1 rounded transition ${
              mapLevel === 'State'
                ? 'bg-[#123B63] text-white font-bold'
                : selectedState !== 'ALL'
                ? 'text-[#123B63] hover:bg-slate-100'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            {selectedState === 'ALL' ? 'State' : selectedState}
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

          <button
            onClick={() => {
              if (selectedDistrict !== 'ALL') {
                handleSelectLevel('Project');
              }
            }}
            disabled={selectedDistrict === 'ALL'}
            className={`font-semibold px-2 py-1 rounded transition ${
              mapLevel === 'Project'
                ? 'bg-[#123B63] text-white font-bold'
                : selectedDistrict !== 'ALL'
                ? 'text-[#123B63] hover:bg-slate-100'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            {selectedDistrict === 'ALL' ? 'District' : selectedDistrict}
          </button>
        </div>

        {/* Level Toggle & Synthetic notice */}
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-md shadow-2xs border border-slate-300 p-0.5 bg-slate-100 text-xs font-semibold">
            <button
              onClick={() => handleSelectLevel('India')}
              className={`px-3 py-1 rounded transition ${
                mapLevel === 'India'
                  ? 'bg-white text-[#123B63] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              India
            </button>
            <button
              onClick={() => handleSelectLevel('State')}
              className={`px-3 py-1 rounded transition ${
                mapLevel === 'State'
                  ? 'bg-white text-[#123B63] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              State
            </button>
            <button
              onClick={() => handleSelectLevel('Project')}
              className={`px-3 py-1 rounded transition ${
                mapLevel === 'Project'
                  ? 'bg-white text-[#123B63] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Project
            </button>
          </div>

          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded font-medium flex items-center gap-1">
            <Info className="w-3 h-3 text-amber-600" />
            <span>Project locations are synthetic.</span>
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters:</span>
        </div>

        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="p-1.5 rounded border border-slate-300 bg-white"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="CRITICAL">🔴 Critical Risk (&gt;75%)</option>
          <option value="HIGH">🟠 High Risk (60-74%)</option>
          <option value="MODERATE">🟡 Moderate Risk (35-59%)</option>
          <option value="LOW">🟢 Low Risk (&lt;35%)</option>
        </select>

        <select
          value={selectedState}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedState(val);
            setSelectedDistrict('ALL');
            if (val !== 'ALL') {
              setMapLevel('State');
              const stProjs = scopedProjects.filter((p) => p.state === val);
              if (stProjs.length > 0 && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(stProjs[0].coordinates, 7);
              }
            } else {
              setMapLevel('India');
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([21.5, 78.9], 5);
              }
            }
          }}
          className="p-1.5 rounded border border-slate-300 bg-white"
        >
          <option value="ALL">All States</option>
          {allStates.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrict}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedDistrict(val);
            if (val !== 'ALL') {
              setMapLevel('Project');
              const distProjs = scopedProjects.filter((p) => p.district === val);
              if (distProjs.length > 0 && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(distProjs[0].coordinates, 9);
              }
            }
          }}
          className="p-1.5 rounded border border-slate-300 bg-white"
        >
          <option value="ALL">All Districts</option>
          {availableDistricts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="p-1.5 rounded border border-slate-300 bg-white"
        >
          <option value="ALL">All Project Types</option>
          {allTypes.map((tp) => (
            <option key={tp} value={tp}>
              {tp}
            </option>
          ))}
        </select>

        <span className="text-slate-400">|</span>

        <span className="text-slate-600 font-semibold">
          Current Level: <strong className="text-[#123B63]">{mapLevel}</strong> (
          {mapLevel === 'India'
            ? `${allStates.length} States`
            : mapLevel === 'State'
            ? `${availableDistricts.length} Districts`
            : `${filteredProjects.length} Project Sites`}
          )
        </span>

        <button
          onClick={handleResetFilters}
          className="ml-auto text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Map Container */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div
          ref={mapContainerRef}
          className="w-full h-[540px] z-10"
          style={{ minHeight: '500px' }}
        />
        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
          <span>
            {mapLevel === 'India'
              ? 'Click a state bubble to drill down into district distribution.'
              : mapLevel === 'State'
              ? 'Click a district bubble to inspect project site markers.'
              : 'Click on any project marker to inspect risk indices and access the decision-support dossier.'}
          </span>
          <span className="text-slate-400">OpenStreetMap &bull; Leaflet Engine</span>
        </div>
      </div>
    </div>
  );
};
