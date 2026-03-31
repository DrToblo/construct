# Construct Designer — Project Reference

A protein engineering web app for designing construct boundaries. Load a UniProt ID → see domain architecture, 3D structure, sequence, and biophysical analysis. Select a residue range interactively; the selection syncs across all views.

**Stack:** React 19 + TypeScript, Vite, Zustand, Molstar 3D viewer, Tailwind CSS 4, PostCSS, Express (backend).
**Dev:** run two processes — `npm run server` (Express on :3000) + `npm run dev` (Vite on :5173, proxies `/api` → :3000).
**Production:** `node server.js` serves both the API and the built static files on port 3000.

---

## Layout (App.tsx)

```
Left sidebar (210px)                    Right main (flex: 1)
─────────────────────                   ──────────────────────────────────────
Header + hamburger menu                 DomainDiagram   ← full width; drag to select; PTM
SearchBar                                               diamonds + TM bars + E.coli track
Protein info (name, organism, ID)       Sequence        ← full width; scrollable; draggable handles
Stats (MW, pI, SS bonds, length)        ────────────────────────────────────
InteractionList (scrollable, flex:1)    StructureViewer (68%)  │  AnalysisPanel (32%)
```

---

## Source tree

```
server.js                            Express API server; POST /api/mmseqs-search + serves dist/
sol.fasta                            Curated E. coli-expressed protein fragments (search target)
src/
├── App.tsx                          Main layout; wires all panels together
├── main.tsx                         React entry point
│
├── store/
│   ├── index.ts                     Zustand store (combines slices); exports useStore
│   └── slices/
│       ├── proteinSlice.ts          Protein data, domains, structureUrl, status, loadProtein();
│       │                            also solubilityHits + solubilityStatus; triggers mmseqs
│       │                            search after loadProtein resolves
│       ├── constructSlice.ts        startResidue, endResidue, selectionStep, setRange()
│       └── pluginSlice.ts           activeStructurePluginIds, activeAnalysisPluginIds,
│                                    activePtmTypes, showTmRegions
│
├── types/
│   ├── protein.ts                   ProteinData, Domain, PTM, PTMType, TransmembraneRegion,
│   │                                SolubilityHit
│   ├── construct.ts                 ConstructSelection, SelectionStep
│   └── plugins.ts                   StructurePlugin, AnalysisPlugin, MolstarHandle
│
├── services/                        All external API calls
│   ├── uniprot.ts                   fetchUniprotEntry(id) → ProteinData (incl. ptms, tmRegions)
│   ├── interpro.ts                  fetchInterproDomains(id) → Domain[]
│   ├── alphafold.ts                 fetchAlphaFoldStructure(id) → { cifUrl }
│   ├── rcsb.ts                      fetchRcsbByUniprot(id) → { cifUrl }  (fallback)
│   ├── pdbe.ts                      fetchPdbEntries(id) → PDBEntry[]
│   └── mmseqs.ts                    searchSolubility(sequence, uniprotId) → SolubilityHit[]
│                                    calls POST /api/mmseqs-search
│
├── components/
│   ├── SearchBar/SearchBar.tsx      UniProt ID input; calls store.loadProtein()
│   │
│   ├── DomainDiagram/
│   │   ├── DomainDiagram.tsx        SVG diagram; drag-to-select residue range; TM region row
│   │   │                            (dark bars, labeled "TM"); E.coli solubility row (green
│   │   │                            bars, fragment ID label + identity % tooltip); PTM diamond
│   │   │                            row; draggable start/end handles
│   │   ├── DomainTrack.tsx          One SVG row per domain source database
│   │   ├── DomainTooltip.tsx        Hover tooltip for domain boxes
│   │   ├── ConstructOverlay.tsx     Green overlay for committed selection (with labels)
│   │   ├── DragOverlay.tsx          Blue dashed overlay shown while actively dragging
│   │   └── PdbTrack.tsx             Optional PDB coverage track (toggled via hamburger menu)
│   │
│   ├── SequenceViewer/
│   │   ├── SequenceViewer.tsx       Single-line horizontal sequence; PyMOL-style tick numbers
│   │   │                            below; PTM dots above; orange band + bold letters for
│   │   │                            selection; draggable start/end handles for fine adjustment;
│   │   │                            auto-scrolls to selection (suppressed during drag)
│   │   ├── ResidueToken.tsx         (legacy; no longer used)
│   │   └── PTMMarker.tsx            (legacy; no longer used)
│   │
│   ├── StructureViewer/
│   │   ├── StructureViewer.tsx      Molstar container; toolbar (Select/Reselect/Cancel);
│   │   │                            overlay toggle buttons for PTM types and TM regions;
│   │   │                            wires constructHighlight, ptmOverlay, tmRegion, plddt plugins
│   │   ├── useMolstar.ts            Hook: initialises Mol* plugin, exposes loadStructure()
│   │   └── useResidueSelection.ts   Hook: forwards 3D residue clicks to store during
│   │                                selectingStart / selectingEnd steps
│   │
│   ├── AnalysisPanel/AnalysisPanel.tsx  Runs active analysis plugins on construct slice;
│   │                                    shows MW, pI, composition, charge
│   │
│   ├── InteractionList/InteractionList.tsx  Known protein-protein interactions from UniProt;
│   │                                         partner name + experiment count bar chart;
│   │                                         expandable subunit/complex text; lives in sidebar
│   │                                         (flex:1, scrollable — can hold many entries)
│   │
│   └── ui/
│       ├── HamburgerMenu.tsx        Toggle domain sources, PDB tracks, structure plugins
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
│       ├── constructHighlightPlugin.ts  setStructureOverpaint → orange (#ea580c) for selected
│       │                                range; applied/removed reactively by StructureViewer
│       ├── plddtColorPlugin.ts      AlphaFold pLDDT confidence colouring (auto-applied)
│       ├── ptmOverlayPlugin.ts      PTM residue highlighting as spacefill spheres; grouped by
│       │                            type; toggled per-type via overlay buttons
│       └── tmRegionPlugin.ts        Transmembrane region highlighting as black spacefill;
│                                    toggled via "TM Regions" overlay button
│
├── styles/
│   └── molstar-overrides.css        Hides Mol* built-in UI chrome
│
└── constants/
    ├── aminoAcids.ts                Residue mass constants for MW calculation
    └── ptmColors.ts                 PTM_COLOR_HEX / PTM_COLOR_RGB per PTMType
```

---

## Key data flows

### Loading a protein
```
SearchBar → store.loadProtein(id)
  → resets selectedDomainSources to ['pfam'], solubilityHits to []
  → parallel: fetchUniprotEntry, fetchInterproDomains, fetchAlphaFoldStructure, fetchPdbEntries
       (AlphaFold 404 → fallback to fetchRcsbByUniprot)
  → store: proteinData (incl. ptms, tmRegions), domains, structureUrl, pdbEntries, status='ready'
  → immediately sets solubilityStatus='searching', fires searchSolubility() in background
  → on search resolve: solubilityHits=[...], solubilityStatus='done'
  → App renders all panels
```

### E. coli solubility search
```
searchSolubility(sequence, uniprotId)
  → POST /api/mmseqs-search  { sequence, uniprotId }
  → server.js: writes temp FASTA, runs mmseqs easy-search against sol.fasta
               --min-seq-id 0.95  --format-output query,target,pident,qstart,qend
  → returns SolubilityHit[]  { target, identity, queryStart, queryEnd }
  → DomainDiagram renders "E.coli" track: green bars at queryStart–queryEnd
    label = fragment ID (truncated to 14 chars); tooltip = full name + identity %
    "Searching…" shown while in-flight; "No matches" if empty
```

### Selecting a construct
Four equivalent entry points, all write to the same store slice:

| Entry point | Mechanism |
|---|---|
| Domain diagram | mousedown+drag → `store.setRange(start, end)`; handles drag to adjust |
| Sequence viewer | drag orange handles on selection borders → `store.setRange(start, end)` |
| 3D viewer | "Select Construct" button → click residues → `setStartResidue` / `setEndResidue` |

When `selectionStep === 'complete'`:
- **DomainDiagram**: renders green `ConstructOverlay` + residue labels + draggable handles
- **SequenceViewer**: orange highlight band + bold orange letters + draggable handles
- **StructureViewer**: `constructHighlightPlugin.apply()` → orange overpaint on selected residues
- **AnalysisPanel**: slices construct sequence, runs all active analysis plugins

### Adding a plugin
- **Analysis plugin**: implement `AnalysisPlugin` interface, add to `plugins/analysis/registry.ts`
- **Structure plugin**: implement `StructurePlugin` interface; wire a `useEffect` in `StructureViewer.tsx`
  following the same pattern as `ptmOverlayPlugin` or `tmRegionPlugin` (not auto-applied from registry)

---

## State shape (Zustand)

```ts
// proteinSlice
uniprotId: string | null
proteinData: ProteinData | null      // { uniprotId, name, organism, sequence, ptms, tmRegions,
                                     //   processingRegions, interactions, subunitText }
domains: Domain[]                     // { accession, name, sourceDatabase, entryType, start, end }
selectedDomainSources: string[]       // which DB tracks are visible; default ['pfam'] on load
structureUrl: string | null
structureSource: 'alphafold' | 'rcsb' | null
structureChainIds: string[] | null    // null = no chain filtering
defaultStructureUrl / Source / ChainIds  // preserved for reverting PDB selection
pdbEntries: PDBEntry[]
showPdbTracks: boolean
activePdbId: string | null
status: 'idle' | 'loading' | 'error' | 'ready'
error: string | null
solubilityHits: SolubilityHit[]       // { target, identity, queryStart, queryEnd }
solubilityStatus: 'idle' | 'searching' | 'done' | 'error'

// constructSlice
startResidue: number | null           // 1-based
endResidue: number | null             // 1-based; always >= startResidue
selectionStep: 'none' | 'selectingStart' | 'selectingEnd' | 'complete'

// pluginSlice
activeStructurePluginIds: string[]
activeAnalysisPluginIds: string[]
activePtmTypes: PTMType[]             // which PTM types to show in 3D
showTmRegions: boolean                // toggle TM region plugin in 3D
```

---

## DomainDiagram SVG layout (top → bottom)

```
tracksHeight          domain tracks (one row per selectedDomainSources entry)
processingSecHeight   UniProt processing regions (signal, chain, propeptide, …)
tmSecHeight           TM region row (TM_ROW_HEIGHT = 16px)
solSecHeight          E.coli solubility row (SOL_ROW_HEIGHT = 20px); hidden when status='idle'
pdbSecHeight          PDB coverage tracks (optional)
AXIS_HEIGHT           residue number axis
PTM_ROW_HEIGHT        PTM diamond row (optional)
```

All y-offsets are computed as cumulative sums of the above; any new row must update every offset below it and the total `svgHeight`.

---

## Molstar API notes

Molstar's internal APIs are poorly documented. These are the patterns confirmed to work:

| Task | Correct API |
|---|---|
| Load structure | `plugin.builders.data.download()` → `parseTrajectory()` → `hierarchy.applyPreset()` |
| Color specific residues (overpaint) | `setStructureOverpaint(plugin, components, Color, lociGetter)` from `molstar/lib/mol-plugin-state/helpers/structure-overpaint` |
| Clear overpaint | `clearStructureOverpaint(plugin, components)` from same module — clears ALL overpaint on those components |
| Add a new representation for residues | `StateTransforms.Model.StructureSelectionFromExpression` → `StateTransforms.Representation.StructureRepresentation3D` with `type: { name: 'spacefill', params: {} }` and `colorTheme: { name: 'uniform', params: { value: Color } }` |
| Build residue selection | `Script.getStructureSelection(expression, structure)` from `molstar/lib/mol-script/script` |
| Expression → Loci | `StructureSelection.toLociWithSourceUnits(sel)` from `molstar/lib/mol-model/structure/query` |
| Select residue range | `MS.core.rel.inRange([MS.ammp('label_seq_id'), start, end])` |

**Do NOT use** `plugin.managers.structure.component.add()` for coloring — silently does nothing.

**Overpaint conflicts**: `setStructureOverpaint` and `clearStructureOverpaint` share a single overpaint layer per component. Only one plugin should use overpaint at a time (`constructHighlightPlugin`). Other coloring must use the StateTransforms/representation approach to avoid conflicts.

**cartoon vs spacefill via StateTransforms**: `cartoon` representations added via StateTransforms do not reliably apply custom `colorTheme`. Use `spacefill` with `uniform` colorTheme for reliable custom coloring of specific residues/regions.

---

## Notes / quirks

- **Domain source names**: InterPro API returns `source_database` in lowercase (e.g. `'pfam'`, `'smart'`). `selectedDomainSources` must use lowercase to match. Default is `['pfam']`.
- **DomainTrack label positioning**: track labels render at `x=4` inside the `translate(LABEL_WIDTH, 0)` group, so they appear just inside the track area rather than the 60px label zone. Minor visual quirk, not a functional bug.
- **Structure plugin wiring**: plugins in the registry are *not* auto-applied. Each plugin that should be reactive needs a `useEffect` in `StructureViewer.tsx` (see `ptmOverlayPlugin`, `tmRegionPlugin`, `plddtColorPlugin` for the pattern).
- **ResidueToken / PTMMarker**: still exist in `SequenceViewer/` but are no longer used.
- **RCSB structures**: residue numbering may differ from UniProt sequence numbering; a warning banner appears in the structure viewer when source is RCSB.
- **vite.config.ts**: pre-existing TypeScript error (`format` option type mismatch). Does not affect `npm run dev` or runtime behaviour.
- **Express 5**: installed (express@^5). Catch-all SPA route uses regex `/.*/ ` not `'*'` (path-to-regexp v8 requires named wildcards).
- **InteractionList scroll**: the wrapper in App.tsx uses `flex:1, minHeight:0, overflowY:auto` so the list scrolls within the sidebar rather than overflowing it.
