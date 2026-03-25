# Construct Designer: Architecture & Intended Use

## 🧬 Project Overview
**Construct Designer** is a specialized web application for protein engineers and structural biologists. It streamlines the workflow of designing protein "constructs"—truncated or modified versions of a protein—for experimental research such as protein expression, crystallization, or functional assays.

---

## 🎯 Intended Use

The application allows researchers to:
1.  **Fetch Protein Metadata**: Instantly retrieve sequences, names, organisms, and post-translational modifications (PTMs) from **UniProt**.
2.  **Analyze Domain Architecture**: Visualize functional domains and families using data from **InterPro**.
3.  **Explore 3D Structures**: View and interact with 3D structural models from **AlphaFold DB** or **RCSB PDB** using the integrated **Molstar** viewer.
4.  **Define Constructs**: Select specific sub-sequences (residue ranges) to evaluate as potential experimental constructs.
5.  **Real-time Biophysical Analysis**: Monitor the Molecular Weight (MW), Isoelectric Point (pI), Net Charge, and Amino Acid Composition of the selected construct in real-time.
6.  **Modular Annotations**: Overlay PTMs, domain boundaries, and quality metrics (like pLDDT) onto both 1D and 3D views.

---

## 🏗️ Technical Architecture

### 1. Core Tech Stack
-   **Framework**: [React 19](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/).
-   **Build Tool**: [Vite](https://vitejs.dev/) (optimized for speed and modern ESM).
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Modular slice-based state).
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [PostCSS](https://postcss.org/).
-   **Molecular Visualization**: [Molstar](https://molstar.org/) (High-performance 3D viewer).

### 2. Module Breakdown

#### **Store (`src/store`)**
Uses a centralized Zustand store divided into functional slices:
-   `proteinSlice`: Manages the lifecycle of fetching and storing protein/domain data.
-   `constructSlice`: Tracks the user's current residue range selection (`startResidue` to `endResidue`).
-   `pluginSlice`: Manages the activation state of various analysis and structure visualization plugins.

#### **Services (`src/services`)**
Clean API wrappers for biological data providers:
-   `uniprot.ts`: Fetches sequence and PTM data.
-   `interpro.ts`: Retrieves domain and family annotations.
-   `alphafold.ts` / `rcsb.ts`: Handles structural model URLs and metadata.

#### **Components (`src/components`)**
-   **StructureViewer**: Integrates Molstar, providing hooks for structural plugins to interact with the 3D scene.
-   **SequenceViewer**: A high-density 1D view for selecting residue ranges.
-   **DomainDiagram**: A visual map of the protein's domain architecture.
-   **AnalysisPanel**: A modular dashboard that renders active analysis plugins.

#### **Plugins (`src/plugins`)**
The application uses a modular plugin architecture to keep the core logic lean:
-   **Analysis Plugins**: (e.g., `mwPlugin`, `piPlugin`, `chargePlugin`) Perform sequence-based biophysical calculations.
-   **Structure Plugins**: (e.g., `ptmOverlayPlugin`, `plddtColorPlugin`, `constructHighlightPlugin`) Inject logic into the Molstar viewer to highlight or color the 3D structure based on specific data.

---

## 🔄 Data Flow

1.  **Search**: User enters a UniProt ID.
2.  **Ingestion**: The `proteinSlice` triggers parallel fetches to UniProt and InterPro.
3.  **Update**: The global store updates, triggering a re-render of all viewers (1D Diagram, 3D Structure, Sequence, and Analysis).
4.  **Interaction**:
    -   Selecting a range in the **SequenceViewer** or **DomainDiagram** updates the `constructSlice`.
    -   The **AnalysisPanel** observes the range change and triggers the active **Analysis Plugins** to recalculate metrics.
    -   The **StructureViewer** highlights the selected range in 3D via the `constructHighlightPlugin`.

---

## 📂 Directory Structure Highlights

-   `src/components`: UI building blocks.
-   `src/plugins`: Modular extensions for analysis and 3D visualization.
-   `src/services`: External API communication.
-   `src/store/slices`: Encapsulated state logic.
-   `src/types`: Shared domain models (Protein, Domain, PTM, etc.).
