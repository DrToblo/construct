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
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="UniProt ID"
          disabled={loading}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '6px 8px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '5px',
            color: '#0f172a',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '6px 10px',
            background: loading ? '#e2e8f0' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          {loading && <LoadingSpinner size={12} />}
          {loading ? '…' : 'Load'}
        </button>
      </form>
      <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
        {EXAMPLES.map((id) => (
          <button
            key={id}
            onClick={() => loadExample(id)}
            disabled={loading}
            style={{
              padding: '1px 6px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '10px',
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
