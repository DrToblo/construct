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
    <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
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
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              color: '#0f172a',
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
            background: loading ? '#e2e8f0' : '#2563eb',
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
        <span style={{ fontSize: '12px', color: '#64748b' }}>Examples:</span>
        {EXAMPLES.map((id) => (
          <button
            key={id}
            onClick={() => loadExample(id)}
            disabled={loading}
            style={{
              padding: '2px 8px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              color: '#2563eb',
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
