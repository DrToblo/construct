# Construct Designer — Project Reference

A protein engineering web app for designing construct boundaries. Load a UniProt ID → see domain architecture, 3D structure, sequence, and biophysical analysis. Select a residue range interactively; the selection syncs across all views.

**Stack:** React 19 + TypeScript, Vite, Zustand, Molstar 3D viewer, Tailwind CSS 4, PostCSS.
**Dev server:** `npm run dev` → http://localhost:5173 (or 5175 if already in use).

---

## Layout (App.tsx)

```
Header (protein name, hamburger menu)
SearchBar
DomainDiagram   ← full width; drag to select construct range; shows PTM diamonds + TM bars
Sequence        ← full width single-line strip; horizontally scrollable; PyMOL-style; draggable handles
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
│       └── pluginSlice.ts           activeStructurePluginIds, activeAnalysisPluginIds,
│                                    activePtmTypes, showTmRegions
│
├── types/
│   ├── protein.ts                   ProteinData, Domain, PTM, PTMType, TransmembraneRegion
│   ├── construct.ts                 ConstructSelection, SelectionStep
│   └── plugins.ts                   StructurePlugin, AnalysisPlugin, MolstarHandle
│
├── services/                        All external API calls
│   ├── uniprot.ts                   fetchUniprotEntry(id) → ProteinData (incl. ptms, tmRegions)
│   ├── interpro.ts                  fetchInterproDomains(id) → Domain[]
│   ├── alphafold.ts                 fetchAlphaFoldStructure(id) → { cifUrl }
│   ├── rcsb.ts                      fetchRcsbByUniprot(id) → { cifUrl }  (fallback)
│   └── pdbe.ts                      fetchPdbEntries(id) → PDBEntry[]
│
├── components/
│   ├── SearchBar/SearchBar.tsx      UniProt ID input; calls store.loadProtein()
│   │
│   ├── DomainDiagram/
│   │   ├── DomainDiagram.tsx        SVG diagram; drag-to-select residue range; TM region row
│   │   │                            (dark bars, labeled "TM"); PTM diamond row; draggable
│   │   │                            start/end handles; calls store.setRange() on mouseup
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
  → resets selectedDomainSources to ['pfam']
  → parallel: fetchUniprotEntry, fetchInterproDomains, fetchAlphaFoldStructure, fetchPdbEntries
       (AlphaFold 404 → fallback to fetchRcsbByUniprot)
  → store: proteinData (incl. ptms, tmRegions), domains, structureUrl, pdbEntries, status='ready'
  → App renders all panels
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
proteinData: ProteinData | null      // { uniprotId, name, organism, sequence, ptms, tmRegions }
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
