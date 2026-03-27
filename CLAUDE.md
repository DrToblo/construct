# Construct Designer — Project Reference

A protein engineering web app for designing construct boundaries. Load a UniProt ID → see domain architecture, 3D structure, sequence, and biophysical analysis. Select a residue range interactively; the selection syncs across all views.

**Stack:** React 19 + TypeScript, Vite, Zustand, Molstar 3D viewer, Tailwind CSS 4, PostCSS.
**Dev server:** `npm run dev` → http://localhost:5173 (or 5175 if already in use).

---

## Layout (App.tsx)

```
Header (protein name, hamburger menu)
SearchBar
DomainDiagram   ← full width; drag to select construct range; shows PTM diamonds
Sequence        ← full width single-line strip; horizontally scrollable; PyMOL-style
────────────────────────────────────
StructureViewer (68%)  │  AnalysisPanel (32%)
```

---

## Source tree

```
src/
├── App.tsx                          Main layout; wires all panels together
├── main.tsx                         React entry point
│
├── store/
│   ├── index.ts                     Zustand store (combines slices); exports useStore
│   └── slices/
│       ├── proteinSlice.ts          Protein data, domains, structureUrl, status, loadProtein()
│       ├── constructSlice.ts        startResidue, endResidue, selectionStep, setRange()
│       └── pluginSlice.ts           activeStructurePluginIds, activeAnalysisPluginIds
│
├── types/
│   ├── protein.ts                   ProteinData, Domain, PTM, PTMType
│   ├── construct.ts                 ConstructSelection, SelectionStep
│   └── plugins.ts                   StructurePlugin, AnalysisPlugin, MolstarHandle
│
├── services/                        All external API calls
│   ├── uniprot.ts                   fetchUniprotEntry(id) → ProteinData
│   ├── interpro.ts                  fetchInterproDomains(id) → Domain[]
│   ├── alphafold.ts                 fetchAlphaFoldStructure(id) → { cifUrl }
│   └── rcsb.ts                      fetchRcsbByUniprot(id) → { cifUrl }  (fallback)
│
├── components/
│   ├── SearchBar/SearchBar.tsx      UniProt ID input; calls store.loadProtein()
│   │
│   ├── DomainDiagram/
│   │   ├── DomainDiagram.tsx        SVG diagram; drag-to-select residue range; PTM row;
│   │   │                            hover cursor; calls store.setRange() on mouseup
│   │   ├── DomainTrack.tsx          One SVG row per domain source database
│   │   ├── DomainTooltip.tsx        Hover tooltip for domain boxes
│   │   ├── ConstructOverlay.tsx     Green overlay for committed selection (with labels)
│   │   └── DragOverlay.tsx          Blue dashed overlay shown while actively dragging
│   │
│   ├── SequenceViewer/
│   │   ├── SequenceViewer.tsx       Single-line horizontal sequence; PyMOL-style tick
│   │   │                            numbers below; PTM dots above; orange band for
│   │   │                            selected range; auto-scrolls to selection
│   │   ├── ResidueToken.tsx         (legacy; no longer used by SequenceViewer)
│   │   └── PTMMarker.tsx            (legacy; no longer used by SequenceViewer)
│   │
│   ├── StructureViewer/
│   │   ├── StructureViewer.tsx      Molstar container; toolbar (Select/Reselect/Cancel);
│   │   │                            wires constructHighlightPlugin when selectionStep=complete
│   │   ├── useMolstar.ts            Hook: initialises Mol* plugin, exposes loadStructure()
│   │   └── useResidueSelection.ts   Hook: forwards 3D residue clicks to store during
│   │                                selectingStart / selectingEnd steps
│   │
│   ├── AnalysisPanel/AnalysisPanel.tsx  Runs active analysis plugins on construct slice;
│   │                                    shows MW, pI, composition, charge
│   │
│   └── ui/
│       ├── HamburgerMenu.tsx        Toggle domain sources, structure plugins, analysis plugins
│       ├── ErrorBanner.tsx
│       └── LoadingSpinner.tsx
│
├── plugins/
│   ├── analysis/
│   │   ├── registry.ts              ANALYSIS_PLUGINS array
│   │   ├── mwPlugin.tsx             Molecular weight
│   │   ├── piPlugin.tsx             Isoelectric point
│   │   ├── compositionPlugin.tsx    Amino acid composition
│   │   └── chargePlugin.tsx         Net charge at pH 7
│   │
│   └── structure/
│       ├── registry.ts              STRUCTURE_PLUGINS array
│       ├── constructHighlightPlugin.ts  Cartoon + orange (#ea580c) for selected range;
│       │                                applied/removed reactively by StructureViewer
│       ├── plddtColorPlugin.ts      AlphaFold pLDDT confidence colouring
│       └── ptmOverlayPlugin.ts      PTM residue highlighting in 3D
│
├── styles/
│   └── molstar-overrides.css        Hides Mol* built-in UI chrome
│
└── constants/
    └── aminoAcids.ts                Residue mass constants for MW calculation
```

---

## Key data flows

### Loading a protein
```
SearchBar → store.loadProtein(id)
  → parallel: fetchUniprotEntry, fetchInterproDomains, fetchAlphaFoldStructure
       (AlphaFold 404 → fallback to fetchRcsbByUniprot)
  → store: proteinData, domains, structureUrl, status='ready'
  → App renders all panels
```

### Selecting a construct
Three equivalent entry points, all write to the same store slice:

| Entry point | Mechanism |
|---|---|
| Domain diagram | mousedown+drag → `store.setRange(start, end)` |
| Sequence viewer | (display only; selection shown but not initiated here) |
| 3D viewer | "Select Construct" button → click residues → `setStartResidue` / `setEndResidue` |

When `selectionStep === 'complete'`:
- **DomainDiagram**: renders green `ConstructOverlay` + residue labels
- **SequenceViewer**: orange highlight band + bold orange letters in range
- **StructureViewer**: `constructHighlightPlugin.apply()` → orange cartoon on selected residues
- **AnalysisPanel**: slices construct sequence, runs all active analysis plugins

### Adding a plugin
- **Analysis plugin**: implement `AnalysisPlugin` interface, add to `plugins/analysis/registry.ts`
- **Structure plugin**: implement `StructurePlugin` interface, add to `plugins/structure/registry.ts`
  - Structure plugins in the registry are *not* auto-applied; only `constructHighlightPlugin`
    is wired directly in `StructureViewer.tsx`. Others need similar wiring if needed.

---

## State shape (Zustand)

```ts
// proteinSlice
uniprotId: string | null
proteinData: ProteinData | null      // { uniprotId, name, organism, sequence, ptms }
domains: Domain[]                     // { accession, name, sourceDatabase, start, end }
selectedDomainSources: string[]       // which DB tracks are visible
structureUrl: string | null
structureSource: 'alphafold' | 'rcsb' | null
status: 'idle' | 'loading' | 'error' | 'ready'
error: string | null

// constructSlice
startResidue: number | null           // 1-based
endResidue: number | null             // 1-based; always >= startResidue
selectionStep: 'none' | 'selectingStart' | 'selectingEnd' | 'complete'

// pluginSlice
activeStructurePluginIds: string[]
activeAnalysisPluginIds: string[]
```

---

## Notes / quirks

- **DomainTrack label positioning**: track labels render at `x=4` inside the `translate(LABEL_WIDTH, 0)` group, so they sit just inside the track area rather than the reserved 60px label zone. Minor visual quirk, not a bug that affects functionality.
- **Structure plugin wiring**: `plddtColorPlugin` and `ptmOverlayPlugin` exist in the registry but are not reactively applied (no `useEffect` in StructureViewer connects them). Only `constructHighlightPlugin` is live.
- **RCSB structures**: residue numbering may differ from UniProt; a warning banner appears in the viewer when source is RCSB.
- **vite.config.ts**: has a pre-existing TypeScript error (`format` option type mismatch). Does not affect runtime or `npm run dev`.
