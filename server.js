import express from 'express';
import { execFile } from 'child_process';
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));

const MMSEQS_BIN = process.env.MMSEQS_BIN || 'mmseqs';
const SOL_FASTA = process.env.SOL_FASTA || join(__dirname, 'sol.fasta');

app.post('/api/mmseqs-search', (req, res) => {
  const { sequence, uniprotId } = req.body;
  if (!sequence || typeof sequence !== 'string') {
    return res.status(400).json({ error: 'sequence required' });
  }

  const tmpDir = mkdtempSync(join(tmpdir(), 'mmseqs-'));
  const queryFasta = join(tmpDir, 'query.fasta');
  const resultFile = join(tmpDir, 'results.tsv');
  const mmseqsTmp = join(tmpDir, 'tmp');

  writeFileSync(queryFasta, `>${uniprotId || 'query'}\n${sequence}\n`);

  execFile(
    MMSEQS_BIN,
    [
      'easy-search',
      queryFasta,
      SOL_FASTA,
      resultFile,
      mmseqsTmp,
      '--min-seq-id', '0.95',
      '--format-output', 'query,target,pident,qstart,qend',
      '-v', '0',
    ],
    (err) => {
      try {
        if (err) {
          console.error('mmseqs error:', err.message);
          return res.status(500).json({ error: 'mmseqs search failed' });
        }

        let hits = [];
        try {
          const tsv = readFileSync(resultFile, 'utf8');
          hits = tsv.trim().split('\n').filter(Boolean).map(line => {
            const [, target, pident, qstart, qend] = line.split('\t');
            return {
              target,
              identity: parseFloat(pident),
              queryStart: parseInt(qstart, 10),
              queryEnd: parseInt(qend, 10),
            };
          });
        } catch {
          // No result file = no hits
        }

        res.json({ hits });
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  );
});

// Serve static files (production)
app.use(express.static(join(__dirname, 'dist')));
app.get(/.*/, (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
