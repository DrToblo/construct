import { useState, type FormEvent } from 'react';
import { useStore } from '../../store';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const EXAMPLES = ['P04637', 'P01308', 'P00533', 'P68871'];

export function SearchBar() {
  const [input, setInput] = useState('');
  const status = useStore((s) => s.status);
  const loadProtein = useStore((s) => s.loadProtein);
  const clearProtein = useStore((s) => s.clearProtein);
  const resetSelection = useStore((s) => s.resetSelection);

  const loading = status === 'loading';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = input.trim();
    if (!id) return;
    resetSelection();
    loadProtein(id);
  }

  function loadExample(id: string) {
    setInput(id);
    resetSelection();
    clearProtein();
    loadProtein(id);
  }

  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #374151' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="UniProt ID (e.g. P04637)"
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 16px',
            background: loading ? '#374151' : '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {loading && <LoadingSpinner size={14} />}
          {loading ? 'Loading…' : 'Load'}
        </button>
      </form>
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>Examples:</span>
        {EXAMPLES.map((id) => (
          <button
            key={id}
            onClick={() => loadExample(id)}
            disabled={loading}
            style={{
              padding: '2px 8px',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              color: '#93c5fd',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            {id}
          </button>
        ))}
      </div>
    </div>
  );
}
