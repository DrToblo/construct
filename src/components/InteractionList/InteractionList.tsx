import { useState } from 'react';
import type { ProteinInteraction } from '../../types/protein';

interface InteractionListProps {
  interactions: ProteinInteraction[];
  subunitText: string | null;
}

const SHOW_INITIAL = 8;

export function InteractionList({ interactions, subunitText }: InteractionListProps) {
  const [showAll, setShowAll] = useState(false);
  const [subunitExpanded, setSubunitExpanded] = useState(false);

  if (interactions.length === 0 && !subunitText) return null;

  const selfInteraction = interactions.find((i) => i.isSelf);
  const partners = interactions.filter((i) => !i.isSelf);
  const maxExp = partners[0]?.numberOfExperiments ?? 1;
  const visible = showAll ? partners : partners.slice(0, SHOW_INITIAL);

  return (
    <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0' }}>
      {/* Section header */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, color: '#94a3b8' }}>
        Interactions
        {partners.length > 0 && (
          <span style={{ fontWeight: 400, marginLeft: 4 }}>({partners.length})</span>
        )}
      </div>

      {/* Self-interaction badge */}
      {selfInteraction && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 6,
          padding: '2px 6px',
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 4,
          fontSize: 10,
          color: '#2563eb',
        }}>
          <span>↩</span>
          <span>Homodimer / oligomer</span>
          <span style={{ color: '#93c5fd' }}>· {selfInteraction.numberOfExperiments} exp</span>
        </div>
      )}

      {/* Partner list */}
      {visible.map((partner) => {
        const barWidth = Math.max(4, Math.round((partner.numberOfExperiments / maxExp) * 40));
        const label = partner.partnerGeneName ?? partner.partnerAccession;
        return (
          <div
            key={partner.partnerAccession}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}
            title={`${partner.partnerAccession} · ${partner.numberOfExperiments} experiments${partner.isXenoInteraction ? ' · cross-species' : ''}`}
          >
            {/* Name */}
            <span style={{
              fontSize: 11,
              fontFamily: 'monospace',
              color: '#334155',
              flex: '0 0 72px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {label.length > 10 ? label.slice(0, 9) + '…' : label}
            </span>
            {/* Bar */}
            <div style={{ flex: 1, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${barWidth / 40 * 100}%`, height: '100%', background: partner.isXenoInteraction ? '#f59e0b' : '#3b82f6', borderRadius: 2 }} />
            </div>
            {/* Count */}
            <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace', flex: '0 0 28px', textAlign: 'right' }}>
              {partner.numberOfExperiments}
            </span>
          </div>
        );
      })}

      {/* Show all / show less */}
      {partners.length > SHOW_INITIAL && (
        <button
          onClick={() => setShowAll((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            fontSize: 10,
            color: '#2563eb',
            cursor: 'pointer',
            marginBottom: 4,
          }}
        >
          {showAll ? 'Show fewer ↑' : `Show all ${partners.length} →`}
        </button>
      )}

      {/* Legend: yellow = cross-species */}
      {partners.some((p) => p.isXenoInteraction) && (
        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, marginBottom: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 4, background: '#f59e0b', borderRadius: 1, marginRight: 3, verticalAlign: 'middle' }} />
          cross-species interaction
        </div>
      )}

      {/* Subunit text */}
      {subunitText && (
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => setSubunitExpanded((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              padding: '2px 0',
              fontSize: 10,
              fontWeight: 700,
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span style={{ fontSize: 8 }}>{subunitExpanded ? '▼' : '▶'}</span>
            Subunit / complex context
          </button>
          {subunitExpanded && (
            <p style={{
              margin: '4px 0 0',
              fontSize: 10,
              color: '#475569',
              lineHeight: 1.5,
              maxHeight: 160,
              overflowY: 'auto',
            }}>
              {subunitText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
