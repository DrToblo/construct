import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { useMolstar } from './useMolstar';
import { useResidueSelection } from './useResidueSelection';
import type { MolstarHandle } from '../../types/plugins';
import '../../styles/molstar-overrides.css';

export function StructureViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [molstarHandle, setMolstarHandle] = useState<MolstarHandle | null>(null);

  const structureUrl = useStore((s) => s.structureUrl);
  const structureSource = useStore((s) => s.structureSource);
  const selectionStep = useStore((s) => s.selectionStep);
  const setStartResidue = useStore((s) => s.setStartResidue);
  const setEndResidue = useStore((s) => s.setEndResidue);
  const beginSelection = useStore((s) => s.beginSelection);
  const resetSelection = useStore((s) => s.resetSelection);
  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);

  const handleReady = useCallback((handle: MolstarHandle) => {
    setMolstarHandle(handle);
  }, []);

  const handleDispose = useCallback(() => {
    setMolstarHandle(null);
  }, []);

  const { loadStructure } = useMolstar(containerRef, handleReady, handleDispose);

  // Load structure when URL changes
  useEffect(() => {
    if (structureUrl && molstarHandle) {
      loadStructure(structureUrl);
    }
  }, [structureUrl, molstarHandle, loadStructure]);

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
            background: '#854d0e',
            border: '1px solid #ca8a04',
            borderRadius: '6px',
            padding: '6px 14px',
            color: '#fef08a',
            fontSize: '13px',
            fontWeight: 600,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {bannerText}
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
            background: '#1c1917',
            border: '1px solid #78716c',
            borderRadius: '6px',
            padding: '4px 10px',
            color: '#a8a29e',
            fontSize: '11px',
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
          <button onClick={beginSelection} style={toolbarBtnStyle('#1d4ed8')}>
            {selectionStep === 'complete' ? 'Reselect Construct' : 'Select Construct'}
          </button>
        ) : (
          <button onClick={resetSelection} style={toolbarBtnStyle('#7f1d1d')}>
            Cancel
          </button>
        )}
        {selectionStep === 'complete' && startResidue != null && endResidue != null && (
          <span
            style={{
              padding: '5px 10px',
              background: '#14532d',
              border: '1px solid #16a34a',
              borderRadius: '5px',
              color: '#86efac',
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
