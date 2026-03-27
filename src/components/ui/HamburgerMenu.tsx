import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { STRUCTURE_PLUGINS } from '../../plugins/structure/registry';

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const domains = useStore((s) => s.domains);
  const selectedDomainSources = useStore((s) => s.selectedDomainSources);
  const setSelectedDomainSources = useStore((s) => s.setSelectedDomainSources);

  const activeStructureIds = useStore((s) => s.activeStructurePluginIds);
  const toggleStructurePlugin = useStore((s) => s.toggleStructurePlugin);
  const pdbEntries = useStore((s) => s.pdbEntries);
  const showPdbTracks = useStore((s) => s.showPdbTracks);
  const setShowPdbTracks = useStore((s) => s.setShowPdbTracks);

  // Derive unique domain sources from loaded domains
  const availableSources = Array.from(new Set(domains.map((d) => d.sourceDatabase))).sort();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleSource = (source: string) => {
    if (selectedDomainSources.includes(source)) {
      setSelectedDomainSources(selectedDomainSources.filter((s) => s !== source));
    } else {
      setSelectedDomainSources([...selectedDomainSources, source]);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Menu"
      >
        ☰
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '240px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            padding: '12px 0',
            marginTop: '4px',
          }}
        >
          {/* Domain Sources */}
          <div style={{ padding: '0 16px 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Domain Sources
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '12px' }}>
            {availableSources.length === 0 ? (
              <div style={{ padding: '4px 16px', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                No sources available
              </div>
            ) : (
              availableSources.map((source) => (
                <label
                  key={source}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    gap: '8px',
                    color: '#334155',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <input
                    type="checkbox"
                    checked={selectedDomainSources.includes(source)}
                    onChange={() => toggleSource(source)}
                  />
                  {source}
                </label>
              ))
            )}
          </div>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0 12px' }} />

          {/* PDB Structures */}
          <div style={{ padding: '0 16px 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Experimental Structures
          </div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 16px',
              fontSize: '13px',
              cursor: pdbEntries.length === 0 ? 'default' : 'pointer',
              gap: '8px',
              color: pdbEntries.length === 0 ? '#94a3b8' : '#334155',
            }}
            onMouseEnter={(e) => { if (pdbEntries.length > 0) e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <input
              type="checkbox"
              checked={showPdbTracks}
              disabled={pdbEntries.length === 0}
              onChange={(e) => setShowPdbTracks(e.target.checked)}
            />
            {pdbEntries.length === 0
              ? 'No PDB structures found'
              : `Show ${pdbEntries.length} PDB structure${pdbEntries.length !== 1 ? 's' : ''}`}
          </label>

          <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0 12px' }} />

          {/* Structure Plugins */}
          <div style={{ padding: '0 16px 8px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Structure Visuals
          </div>
          <div style={{ marginBottom: '12px' }}>
            {STRUCTURE_PLUGINS.map((p) => (
              <label
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  gap: '8px',
                  color: '#334155',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <input
                  type="checkbox"
                  checked={activeStructureIds.includes(p.id)}
                  onChange={() => toggleStructurePlugin(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
