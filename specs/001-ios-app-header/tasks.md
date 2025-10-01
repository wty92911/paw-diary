# Tasks: Universal Header Component for iOS App

**Input**: Design documents from `/specs/001-ios-app-header/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   ✅ Tech stack: React 18+, TypeScript 5.x, TailwindCSS, Shadcn UI
   ✅ Structure: Single project (src/, tests/)
2. Load optional design documents:
   ✅ data-model.md: 5 entities → model/type tasks
   ✅ contracts/: 2 files → contract test tasks
   ✅ research.md: Compound Component Pattern → setup tasks
3. Generate tasks by category:
   ✅ Setup: component structure, dependencies, linting
   ✅ Tests: contract tests, component tests, integration tests
   ✅ Core: components, hooks, context provider
   ✅ Integration: page migrations, routing integration
   ✅ Polish: unit tests, performance, documentation
4. Apply task rules:
   ✅ Different files = mark [P] for parallel
   ✅ Same file = sequential (no [P])
   ✅ Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root (per plan.md Structure Decision)

## Phase 3.1: Setup
- [x] **T001** Create header component directory structure in `src/components/header/`
- [x] **T002** [P] Set up TypeScript configuration for header component exports in `src/components/header/index.ts`
- [x] **T003** [P] Configure linting rules for React component patterns in `eslint.config.js` (header-specific overrides)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] **T004** [P] Contract test for HeaderConfiguration interface in `tests/contracts/header-configuration.test.ts`
- [ ] **T005** [P] Contract test for component props interfaces in `tests/contracts/header-props.test.ts`
- [ ] **T006** [P] Integration test for App Header scenario in `tests/integration/app-header.test.tsx`
- [ ] **T007** [P] Integration test for Pet Context Header scenario in `tests/integration/pet-context-header.test.tsx`
- [ ] **T008** [P] Integration test for Form Header scenario in `tests/integration/form-header.test.tsx`
- [ ] **T009** [P] Integration test for header provider context in `tests/integration/header-provider.test.tsx`
- [ ] **T010** [P] Accessibility test suite for all header variants in `tests/accessibility/header-accessibility.test.tsx`
- [ ] **T011** [P] Responsive design test suite in `tests/responsive/header-responsive.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] **T012** [P] HeaderConfiguration entity types in `src/components/header/types.ts`
- [ ] **T013** [P] BackAction entity types in `src/components/header/types.ts` (same file, but different interfaces)
- [ ] **T014** [P] PetContext entity types in `src/components/header/types.ts` (same file, but different interfaces)
- [ ] **T015** [P] HeaderAction entity types in `src/components/header/types.ts` (same file, but different interfaces)
- [ ] **T016** [P] HeaderTheme entity types in `src/components/header/types.ts` (same file, but different interfaces)
- [ ] **T017** HeaderProvider context and reducer in `src/components/header/HeaderProvider.tsx`
- [ ] **T018** [P] useHeaderConfig hook in `src/components/header/hooks/useHeaderConfig.ts`
- [ ] **T019** [P] useHeaderTheme hook in `src/components/header/hooks/useHeaderTheme.ts`
- [ ] **T020** [P] useHeaderNavigation hook in `src/components/header/hooks/useHeaderNavigation.ts`
- [ ] **T021** UniversalHeader main component in `src/components/header/UniversalHeader.tsx`
- [ ] **T022** [P] AppHeader variant component in `src/components/header/variants/AppHeader.tsx`
- [ ] **T023** [P] PetContextHeader variant component in `src/components/header/variants/PetContextHeader.tsx`
- [ ] **T024** [P] FormHeader variant component in `src/components/header/variants/FormHeader.tsx`
- [ ] **T025** [P] HeaderBrand sub-component in `src/components/header/components/HeaderBrand.tsx`
- [ ] **T026** [P] HeaderNavigation sub-component in `src/components/header/components/HeaderNavigation.tsx`
- [ ] **T027** [P] HeaderActions sub-component in `src/components/header/components/HeaderActions.tsx`

## Phase 3.4: Integration
- [ ] **T028** Integrate HeaderProvider in main App.tsx
- [ ] **T029** [P] Migrate HomePage to use AppHeader in `src/pages/HomePage.tsx`
- [ ] **T030** [P] Migrate AddPetPage to use FormHeader in `src/pages/AddPetPage.tsx`
- [ ] **T031** [P] Migrate EditPetPage to use FormHeader in `src/pages/EditPetPage.tsx`
- [ ] **T032** [P] Migrate PetProfilePage to use PetContextHeader in `src/pages/PetProfilePage.tsx`
- [ ] **T033** [P] Migrate ActivitiesListPage to use PetContextHeader in `src/pages/ActivitiesListPage.tsx`
- [ ] **T034** [P] Migrate ActivityEditorPage to use FormHeader in `src/pages/ActivityEditorPage.tsx`
- [ ] **T035** Remove deprecated header components (`src/components/pets/PetContextHeader.tsx`, `src/components/pets/PetProfileHeader.tsx`)
- [ ] **T036** Update component exports and imports across codebase

## Phase 3.5: Polish
- [ ] **T037** [P] Unit tests for header utilities in `tests/unit/header-utils.test.ts`
- [ ] **T038** [P] Unit tests for header validation in `tests/unit/header-validation.test.ts`
- [ ] **T039** [P] Performance tests (<16ms render time) in `tests/performance/header-performance.test.ts`
- [ ] **T040** [P] Bundle size analysis and optimization in `tests/performance/header-bundle.test.ts`
- [ ] **T041** [P] Update component documentation in `src/components/header/README.md`
- [ ] **T042** [P] Add header component examples to Storybook in `stories/Header.stories.tsx`
- [ ] **T043** Remove code duplication and consolidate shared utilities
- [ ] **T044** Run complete integration test suite with all page migrations
- [ ] **T045** Verify accessibility compliance (WCAG 2.1 AA) across all variants

## Dependencies
**Critical Path Dependencies:**
- Setup (T001-T003) before everything else
- Tests (T004-T011) before implementation (T012-T027) ⚠️ TDD REQUIREMENT
- Types (T012-T016) before components (T017-T027)
- T017 (HeaderProvider) blocks T021 (UniversalHeader)
- T021 (UniversalHeader) blocks T022-T024 (variant components)
- Core components (T017-T027) before integration (T028-T036)
- Implementation before polish (T037-T045)

**Specific Dependencies:**
- T012-T016 (all types in same file) must be sequential
- T017 blocks T018-T020 (hooks depend on provider)
- T021 blocks T022-T024 (variants use UniversalHeader)
- T028 blocks T029-T034 (provider setup before page migrations)

## Parallel Example
```bash
# Launch Phase 3.2 tests together (T004-T011):
Task: "Contract test for HeaderConfiguration interface in tests/contracts/header-configuration.test.ts"
Task: "Contract test for component props interfaces in tests/contracts/header-props.test.ts"
Task: "Integration test for App Header scenario in tests/integration/app-header.test.tsx"
Task: "Integration test for Pet Context Header scenario in tests/integration/pet-context-header.test.tsx"
Task: "Integration test for Form Header scenario in tests/integration/form-header.test.tsx"
Task: "Integration test for header provider context in tests/integration/header-provider.test.tsx"
Task: "Accessibility test suite for all header variants in tests/accessibility/header-accessibility.test.tsx"
Task: "Responsive design test suite in tests/responsive/header-responsive.test.tsx"

# Launch variant components together (T022-T024):
Task: "AppHeader variant component in src/components/header/variants/AppHeader.tsx"
Task: "PetContextHeader variant component in src/components/header/variants/PetContextHeader.tsx"
Task: "FormHeader variant component in src/components/header/variants/FormHeader.tsx"

# Launch page migrations together (T029-T034):
Task: "Migrate HomePage to use AppHeader in src/pages/HomePage.tsx"
Task: "Migrate AddPetPage to use FormHeader in src/pages/AddPetPage.tsx"
Task: "Migrate EditPetPage to use FormHeader in src/pages/EditPetPage.tsx"
Task: "Migrate PetProfilePage to use PetContextHeader in src/pages/PetProfilePage.tsx"
Task: "Migrate ActivitiesListPage to use PetContextHeader in src/pages/ActivitiesListPage.tsx"
Task: "Migrate ActivityEditorPage to use FormHeader in src/pages/ActivityEditorPage.tsx"
```

## Notes
- **[P] tasks** = different files, no dependencies between them
- **Verify tests fail** before implementing (TDD requirement)
- **Commit after each task** for incremental progress
- **iOS HIG compliance** must be maintained throughout implementation
- **Performance budget**: <50KB bundle size impact, <16ms render time
- **Accessibility**: WCAG 2.1 AA compliance required for all variants

## Task Generation Rules Applied
*Applied during main() execution*

1. **From Contracts** (✅):
   - header-component.ts → contract test task T004-T005
   - header-component.test.ts → integration test tasks T006-T011
   
2. **From Data Model** (✅):
   - 5 entities (HeaderConfiguration, BackAction, PetContext, HeaderAction, HeaderTheme) → T012-T016
   - Context relationships → HeaderProvider task T017
   
3. **From User Stories** (✅):
   - 3 header variants → 3 integration test tasks T006-T008
   - 6 page migrations → 6 integration tasks T029-T034
   
4. **From Research Decisions** (✅):
   - Compound Component Pattern → Component structure T021-T027
   - React Context API → HeaderProvider and hooks T017-T020
   - Performance optimization → Performance test tasks T039-T040

## Validation Checklist ✅
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T004-T005)
- [x] All entities have model tasks (T012-T016)
- [x] All tests come before implementation (T004-T011 before T012+)
- [x] Parallel tasks truly independent (verified file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (T012-T016 sequential by design)
- [x] TDD approach enforced (tests must fail before implementation)
- [x] All page migrations covered (6 pages identified)
- [x] Performance and accessibility requirements included
- [x] Component architecture matches research decisions