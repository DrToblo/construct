import { useStore } from './store';
import { SearchBar } from './components/SearchBar/SearchBar';
import { DomainDiagram } from './components/DomainDiagram/DomainDiagram';
import { StructureViewer } from './components/StructureViewer/StructureViewer';
import { SequenceViewer } from './components/SequenceViewer/SequenceViewer';
import { AnalysisPanel } from './components/AnalysisPanel/AnalysisPanel';
import { ErrorBanner } from './components/ui/ErrorBanner';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

const PANEL_HEADER: React.CSSProperties = {
  padding: '6px 12px',
  borderBottom: '1px solid #1f2937',
  fontSize: 11,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  flexShrink: 0,
  background: '#111827',
};

export default function App() {
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const proteinData = useStore((s) => s.proteinData);
  const domains = useStore((s) => s.domains);
  const clearProtein = useStore((s) => s.clearProtein);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0f1117',
        color: '#e2e8f0',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          height: 44,
          borderBottom: '1px solid #1f2937',
          flexShrink: 0,
          gap: 14,
          background: '#0a0d14',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 800, color: '#60a5fa', letterSpacing: '-0.03em' }}>
          Construct Designer
        </span>
        {proteinData && (
          <span style={{ fontSize: 12, color: '#4b5563' }}>
            {proteinData.name} · <em style={{ fontStyle: 'normal', color: '#6b7280' }}>{proteinData.organism}</em>
            {' '}· {proteinData.sequence.length} aa
          </span>
        )}
      </header>

      {/* Search */}
      <div style={{ flexShrink: 0 }}>
        <SearchBar />
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '6px 20px', flexShrink: 0 }}>
          <ErrorBanner message={error} onDismiss={() => clearProtein()} />
        </div>
      )}

      {/* Loading */}
      {status === 'loading' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: '#6b7280',
          }}
        >
          <LoadingSpinner size={28} />
          <span>Loading protein data…</span>
        </div>
      )}

      {/* Idle */}
      {status === 'idle' && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            userSelect: 'none',
          }}
        >
          <div style={{ fontSize: 52, lineHeight: 1 }}>🧬</div>
          <p style={{ fontSize: 15, margin: 0, color: '#6b7280' }}>Enter a UniProt ID above to begin</p>
          <p style={{ fontSize: 12, margin: 0, color: '#374151' }}>Try P04637 · P01308 · P00533</p>
        </div>
      )}

      {/* Main — visible only when ready */}
      {status === 'ready' && proteinData && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Domain diagram strip */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid #1f2937', maxHeight: 180, overflow: 'hidden' }}>
            <div style={PANEL_HEADER}>Domain Annotations ({domains.length} entries · {proteinData.uniprotId})</div>
            <DomainDiagram domains={domains} sequenceLength={proteinData.sequence.length} />
          </div>

          {/* Content row */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* 3D Viewer (~60%) */}
            <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #1f2937', overflow: 'hidden' }}>
              <div style={PANEL_HEADER}>3D Structure (Mol*)</div>
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                <StructureViewer />
              </div>
            </div>

            {/* Right column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

              {/* Sequence viewer (~40% of right) */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderBottom: '1px solid #1f2937' }}>
                <div style={PANEL_HEADER}>Sequence</div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <SequenceViewer protein={proteinData} />
                </div>
              </div>

              {/* Analysis panel */}
              <div style={{ flex: '0 0 auto', maxHeight: '40%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={PANEL_HEADER}>Analysis</div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <AnalysisPanel protein={proteinData} />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
