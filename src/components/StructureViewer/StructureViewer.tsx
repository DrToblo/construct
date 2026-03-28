import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { useMolstar } from './useMolstar';
import { useResidueSelection } from './useResidueSelection';
import type { MolstarHandle } from '../../types/plugins';
import { constructHighlightPlugin } from '../../plugins/structure/constructHighlightPlugin';
import { ptmOverlayPlugin } from '../../plugins/structure/ptmOverlayPlugin';
import { ppiSurfacePlugin } from '../../plugins/structure/ppiSurfacePlugin';
import { PTMType } from '../../types/protein';
import { PTM_COLOR_HEX, PPI_COLOR_HEX } from '../../constants/ptmColors';
import '../../styles/molstar-overrides.css';

const PTM_LABELS: Record<PTMType, string> = {
  [PTMType.PHOSPHORYLATION]: 'Phosphorylation',
  [PTMType.DISULFIDE]: 'Disulfide',
  [PTMType.GLYCOSYLATION]: 'Glycosylation',
  [PTMType.OTHER]: 'Other PTM',
};

const EMPTY_CONSTRUCT = { startResidue: null, endResidue: null, selectionStep: 'none' as const };

export function StructureViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [molstarHandle, setMolstarHandle] = useState<MolstarHandle | null>(null);
  const [structureReady, setStructureReady] = useState(false);

  const structureUrl = useStore((s) => s.structureUrl);
  const structureSource = useStore((s) => s.structureSource);
  const proteinData = useStore((s) => s.proteinData);
  const selectionStep = useStore((s) => s.selectionStep);
  const setStartResidue = useStore((s) => s.setStartResidue);
  const setEndResidue = useStore((s) => s.setEndResidue);
  const beginSelection = useStore((s) => s.beginSelection);
  const resetSelection = useStore((s) => s.resetSelection);
  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);
  const activePtmTypes = useStore((s) => s.activePtmTypes);
  const showPpiSurfaces = useStore((s) => s.showPpiSurfaces);
  const togglePtmType = useStore((s) => s.togglePtmType);
  const togglePpiSurfaces = useStore((s) => s.togglePpiSurfaces);

  const handleReady = useCallback((handle: MolstarHandle) => {
    setMolstarHandle(handle);
  }, []);

  const handleDispose = useCallback(() => {
    setMolstarHandle(null);
  }, []);

  const { loadStructure } = useMolstar(containerRef, handleReady, handleDispose);

  const proteinDataRef = useRef(proteinData);
  proteinDataRef.current = proteinData;

  // Load structure when URL changes; mark ready when done
  useEffect(() => {
    if (!structureUrl || !molstarHandle) return;
    let cancelled = false;
    setStructureReady(false);
    loadStructure(structureUrl).then(() => {
      if (cancelled) return;
      // Re-apply construct highlight if an active selection exists
      const { selectionStep, startResidue, endResidue } = useStore.getState();
      const pd = proteinDataRef.current;
      if (pd && selectionStep === 'complete' && startResidue != null && endResidue != null) {
        constructHighlightPlugin.apply(molstarHandle, pd, { startResidue, endResidue, selectionStep });
      }
      setStructureReady(true);
    });
    return () => { cancelled = true; };
  }, [structureUrl, molstarHandle, loadStructure]);

  // Re-apply PTM overlay when structure is ready or active types change
  useEffect(() => {
    if (!structureReady || !molstarHandle || !proteinData) return;
    const filtered = { ...proteinData, ptms: proteinData.ptms.filter((p) => activePtmTypes.includes(p.type)) };
    if (filtered.ptms.length > 0) {
      ptmOverlayPlugin.apply(molstarHandle, filtered, EMPTY_CONSTRUCT);
    } else {
      ptmOverlayPlugin.remove(molstarHandle);
    }
  }, [structureReady, molstarHandle, proteinData, activePtmTypes]);

  // Re-apply PPI surface overlay when structure is ready or toggle changes
  useEffect(() => {
    if (!structureReady || !molstarHandle || !proteinData) return;
    if (showPpiSurfaces && proteinData.ppiSurfaces.length > 0) {
      ppiSurfacePlugin.apply(molstarHandle, proteinData, EMPTY_CONSTRUCT);
    } else {
      ppiSurfacePlugin.remove(molstarHandle);
    }
  }, [structureReady, molstarHandle, proteinData, showPpiSurfaces]);

  // Apply/remove construct highlight when selection changes
  useEffect(() => {
    if (!molstarHandle || !proteinData || selectionStep !== 'complete' || startResidue == null || endResidue == null) {
      if (molstarHandle) constructHighlightPlugin.remove(molstarHandle);
      return;
    }
    constructHighlightPlugin.apply(molstarHandle, proteinData, { startResidue, endResidue, selectionStep });
  }, [molstarHandle, proteinData, selectionStep, startResidue, endResidue]);

  const handleResidueClick = useCallback(
    (seqId: number) => {
      if (selectionStep === 'selectingStart') {
        setStartResidue(seqId);
      } else if (selectionStep === 'selectingEnd') {
        setEndResidue(seqId);
      }
    },
    [selectionStep, setStartResidue, setEndResidue],
  );

  useResidueSelection({
    handle: molstarHandle,
    selectionStep,
    onResidueClick: handleResidueClick,
  });

  function getSelectionBannerText() {
    if (selectionStep === 'selectingStart') return 'Click a residue in the viewer to set the START of your construct';
    if (selectionStep === 'selectingEnd') return `Start: ${startResidue} — Click a residue to set the END`;
    return null;
  }

  const bannerText = getSelectionBannerText();

  // Build overlay button list — only for PTM types present in this protein
  const ptmTypesInProtein = proteinData
    ? ([PTMType.DISULFIDE, PTMType.PHOSPHORYLATION, PTMType.GLYCOSYLATION, PTMType.OTHER] as const).filter(
        (t) => proteinData.ptms.some((p) => p.type === t),
      )
    : [];

  const hasPpi = (proteinData?.ppiSurfaces.length ?? 0) > 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Selection mode banner */}
      {bannerText && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            background: '#fefce8',
            border: '1px solid #fef08a',
            borderRadius: '6px',
            padding: '6px 14px',
            color: '#854d0e',
            fontSize: '13px',
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {bannerText}
        </div>
      )}

      {/* Overlay toggle panel */}
      {(ptmTypesInProtein.length > 0 || hasPpi) && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {ptmTypesInProtein.map((type) => {
            const count = proteinData!.ptms.filter((p) => p.type === type).length;
            const active = activePtmTypes.includes(type);
            const hex = PTM_COLOR_HEX[type];
            return (
              <button
                key={type}
                onClick={() => togglePtmType(type)}
                style={overlayBtnStyle(hex, active)}
                title={active ? `Hide ${PTM_LABELS[type]}` : `Show ${PTM_LABELS[type]}`}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? hex : '#9ca3af', flexShrink: 0 }} />
                {PTM_LABELS[type]}
                <span style={{ color: '#9ca3af', fontSize: '10px' }}>({count})</span>
              </button>
            );
          })}
          {hasPpi && (
            <button
              onClick={togglePpiSurfaces}
              style={overlayBtnStyle(PPI_COLOR_HEX, showPpiSurfaces)}
              title={showPpiSurfaces ? 'Hide PPI surfaces' : 'Show PPI surfaces'}
            >
              <span style={{ width: 8, height: 8, borderRadius: '2px', background: showPpiSurfaces ? PPI_COLOR_HEX : '#9ca3af', flexShrink: 0 }} />
              PPI Surfaces
              <span style={{ color: '#9ca3af', fontSize: '10px' }}>({proteinData!.ppiSurfaces.length})</span>
            </button>
          )}
        </div>
      )}

      {/* RCSB warning */}
      {structureSource === 'rcsb' && (
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '8px',
            zIndex: 20,
            background: '#f5f5f4',
            border: '1px solid #e7e5e4',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#78716c',
            fontSize: '11px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          Using RCSB PDB structure (residue numbering may differ from UniProt)
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          zIndex: 20,
          display: 'flex',
          gap: '6px',
        }}
      >
        {selectionStep === 'none' || selectionStep === 'complete' ? (
          <button onClick={beginSelection} style={toolbarBtnStyle('#2563eb')}>
            {selectionStep === 'complete' ? 'Reselect Construct' : 'Select Construct'}
          </button>
        ) : (
          <button onClick={resetSelection} style={toolbarBtnStyle('#dc2626')}>
            Cancel
          </button>
        )}
        {selectionStep === 'complete' && startResidue != null && endResidue != null && (
          <span
            style={{
              padding: '5px 10px',
              background: '#eff6ff',
              border: '1px solid #dbeafe',
              borderRadius: '5px',
              color: '#2563eb',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Construct: {startResidue}–{endResidue}
          </span>
        )}
      </div>

      {/* Mol* container */}
      <div
        ref={containerRef}
        className="molstar-container"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

function overlayBtnStyle(color: string, active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 8px',
    background: active ? 'white' : '#f9fafb',
    border: `1px solid ${active ? color : '#d1d5db'}`,
    borderRadius: '4px',
    color: active ? '#1f2937' : '#9ca3af',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    opacity: active ? 1 : 0.65,
    transition: 'opacity 0.15s, border-color 0.15s',
  };
}

function toolbarBtnStyle(bg: string): React.CSSProperties {
  return {
    padding: '5px 12px',
    background: bg,
    border: 'none',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  };
}
