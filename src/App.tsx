import { useMemo } from 'react';
import { useStore } from './store';
import { SearchBar } from './components/SearchBar/SearchBar';
import { DomainDiagram } from './components/DomainDiagram/DomainDiagram';
import { StructureViewer } from './components/StructureViewer/StructureViewer';
import { SequenceViewer } from './components/SequenceViewer/SequenceViewer';
import { ErrorBanner } from './components/ui/ErrorBanner';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { HamburgerMenu } from './components/ui/HamburgerMenu';
import { mwPlugin } from './plugins/analysis/mwPlugin';
import { piPlugin } from './plugins/analysis/piPlugin';
import { PTMType } from './types/protein';

export default function App() {
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const proteinData = useStore((s) => s.proteinData);
  const domains = useStore((s) => s.domains);
  const clearProtein = useStore((s) => s.clearProtein);
  const startResidue = useStore((s) => s.startResidue);
  const endResidue = useStore((s) => s.endResidue);

  const constructSequence = useMemo(() => {
    if (!proteinData) return '';
    if (startResidue != null && endResidue != null) {
      return proteinData.sequence.value.slice(startResidue - 1, endResidue);
    }
    return proteinData.sequence.value;
  }, [proteinData, startResidue, endResidue]);

  const construct = useMemo(() => ({
    startResidue,
    endResidue,
    selectionStep: startResidue != null ? 'complete' as const : 'none' as const,
  }), [startResidue, endResidue]);

  const stats = useMemo(() => {
    if (!proteinData || !constructSequence) return null;
    const mwData = mwPlugin.analyze(constructSequence, proteinData, construct).data as { averageMass: number };
    const piData = piPlugin.analyze(constructSequence, proteinData, construct).data as { pI: number };

    const ssCount = proteinData.ptms.filter((p) => {
      if (p.type !== PTMType.DISULFIDE) return false;
      if (startResidue != null && endResidue != null) {
        return p.position >= startResidue && p.position <= endResidue;
      }
      return true;
    }).length;

    return {
      mw: mwData.averageMass / 1000,
      pI: piData.pI,
      ssBonds: Math.floor(ssCount / 2),
      residues: constructSequence.length,
    };
  }, [proteinData, constructSequence, construct, startResidue, endResidue]);

  const hasConstruct = startResidue != null && endResidue != null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', color: '#0f172a', overflow: 'hidden' }}>

      {/* Left sidebar */}
      <div style={{
        width: 210,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #e2e8f0',
        background: '#ffffff',
      }}>
        {/* Title + hamburger */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px 0 12px',
          height: 40,
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0,
        }}>
          <HamburgerMenu />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em' }}>
            Construct Designer
          </span>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <SearchBar />
        </div>

        {/* Protein info */}
        {proteinData && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>
              {proteinData.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{proteinData.organism}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, fontFamily: 'monospace' }}>
              {proteinData.uniprotId} · {proteinData.sequence.length} aa
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, color: hasConstruct ? '#2563eb' : '#94a3b8' }}>
              {hasConstruct ? `Construct ${startResidue}–${endResidue}` : 'Full protein'}
            </div>
            <StatRow label="MW" value={`${stats.mw.toFixed(1)} kDa`} />
            <StatRow label="pI" value={stats.pI.toFixed(2)} />
            <StatRow label="SS bonds" value={stats.ssBonds.toString()} />
            <StatRow label="Length" value={`${stats.residues} aa`} />
          </div>
        )}
      </div>

      {/* Right main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {error && (
          <div style={{ padding: '6px 16px', flexShrink: 0 }}>
            <ErrorBanner message={error} onDismiss={() => clearProtein()} />
          </div>
        )}

        {status === 'loading' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#64748b' }}>
            <LoadingSpinner size={28} />
            <span>Loading…</span>
          </div>
        )}

        {status === 'idle' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, userSelect: 'none' }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>🧬</div>
            <p style={{ fontSize: 14, margin: 0, color: '#64748b' }}>Enter a UniProt ID to begin</p>
            <p style={{ fontSize: 12, margin: 0, color: '#94a3b8' }}>Try P04637 · P01308 · P00533</p>
          </div>
        )}

        {status === 'ready' && proteinData && (
          <>
            <div style={{ flexShrink: 0, borderBottom: '1px solid #e2e8f0' }}>
              <DomainDiagram
                domains={domains}
                sequenceLength={proteinData.sequence.length}
                ptms={proteinData.ptms}
              />
            </div>
            <div style={{ flexShrink: 0, borderBottom: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <SequenceViewer protein={proteinData} />
            </div>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              <StructureViewer />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
