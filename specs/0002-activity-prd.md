# Pawdiary — Activity Interaction & UX Spec (PM Draft)

## 0) Why this doc

You split the app into multiple pages and discovered that “one giant, ever-mutating form per category” doesn’t scale. This spec defines a **unified interaction model** that keeps activities powerful but easy, eliminates form thrash, and fits your pet-first navigation.

---

## 1) Goals & Non-Goals

**Goals**

* Enable **fast capture in ≤3 taps** for common actions.
* Keep the UI **category-agnostic at first**, then progressively disclose details.
* Reuse **composable input blocks** instead of swapping entire forms.
* Make it **mobile-first** with silky gestures, and **desktop-pleasant** with shortcuts.
* Keep activities **tightly scoped to the active pet**.

**Non-Goals**

* Cloud sync and AI insights (later phases).
* Redesigning data schema (existing tables work; UX maps to them).

---

## 2) Core UX Principles

1. **Three Modes, One Mental Model**

   * **Quick Log** (bottom sheet; 1–2 inputs + Save)
   * **Guided Flow** (template + 2–4 blocks; still fast)
   * **Advanced Edit** (full editor with all blocks & attachments)

2. **Composable Blocks > Category Forms**
   Activities are built by stacking **Blocks** (e.g., Measurement, Rating, Timer, Location, Cost, Reminder).
   Category “forms” are **just templates** that pre-select blocks + defaults.

3. **Pet Context Is Sacred**
   All capture inherits the **active pet**; switching pets mid-flow is allowed but explicit.

4. **Progressive Disclosure**
   Start minimal; reveal depth on demand (Expand “More details”, “Add attachment”, etc.).

5. **Speed by Default**

   * Autofill date/time = now
   * Remember **last used subcategory** per category per pet
   * Smart defaults (e.g., last weight unit, last food brand)

---

## 3) Information Architecture

* **Home (Pet Carousel)** → **Pet Profile (Header + Tabs)**
  Tabs: **Timeline** | Stats | Settings

  * **FAB** on Timeline: “Add Activity”
* **Add Activity Entry Points**

  1. FAB on Timeline
  2. Long-press on day header → “Add activity to this date”
  3. Quick Actions on empty states (e.g., “Log a meal”)

---

## 4) Interaction Model (End-to-End)

### 4.1 Quick Log (Bottom Sheet)

* **Trigger**: FAB → Category Picker (5 chips) → Template chips (contextual)
* **UI**: Compact sheet (60% height). 1–2 blocks tops.
* **Examples**

  * Diet → “Regular Feeding” → Blocks: Portion, Time.
    Save. (Optional “+ Add Notes” expands inline)
  * Growth → “Weight” → Blocks: Weight (value+unit), Time.
* **Success**: Toast “Saved • Undo” + inline insert into Timeline.

**Why**: 80% of entries.

### 4.2 Guided Flow (Full-screen, 2–4 blocks)

* **Trigger**: From Quick Log tap “More details” **or** pick complex template (e.g., “Vet Visit”).
* **UI**: Full-screen wizard; steps = blocks. Progress indicator at top.
* **Examples**

  * Health → “Vet Visit”
    Blocks: Clinic/Vet, Symptoms (chips), Diagnosis/Plan, Attachments, Cost, Reminder.
  * Lifestyle → “Walk/Exercise”
    Blocks: Timer (Start/Stop or manual duration), Mood, Location, Weather (auto if allowed).
* **Success**: Review card → Save.

### 4.3 Advanced Edit (Tabbed Editor)

* **Trigger**: Edit existing activity **or** “Open full editor”
* **Tabs**: **Summary** | Details | Attachments | Reminders | Costs | History
  (Tabs are dynamic—only those with relevant blocks appear)
* **Use cases**: Receipt OCR corrections, complex medical notes, multiple attachments.

---

## 5) Category → Template → Blocks

### Block Library (reusable across categories)

* **Title & Notes** (rich text, tags)
* **Subcategory** (chip set)
* **Time & Date** (defaults to now; supports backfill)
* **Measurement** (weight/height with unit & context)
* **Rating** (1–5 with emoji)
* **Portion** (amount + unit; remembers last brand/product)
* **Timer** (start/stop; manual input)
* **Location** (search or “Home/Park/Vet”; GPS optional)
* **Weather** (auto if permission; editable text otherwise)
* **Checklist** (symptoms, training tasks)
* **Attachment** (photo/document/video + thumbnail)
* **Cost** (amount + currency + category; ties to Expenses)
* **Reminder** (date/time; repeats)
* **People** (vet name/clinic, trainer)
* **Recurrence** (for recurring diet/medication)

> Implementation note: each block maps cleanly to your `activity_data` JSON; no schema changes required.

### Templates (defaults & block sets)

**Health**

* Birth (Summary, Details, Attachment)
* Vaccination (Subcategory, People, Attachment, Reminder)
* Checkup/Vet Visit (People, Checklist: symptoms, Diagnosis/Treatment, Attachment, Cost, Reminder)
* Medication (Checklist: meds, Recurrence, Reminder)

**Growth**

* Weight (Measurement: weight, Time)
* Height (Measurement: height)
* Milestone (Title, Notes, Comparison Photos)

**Diet**

* Regular Feeding (Portion, Time; optional Rating)
* Treats (Portion, Rating)
* Food Change (Old/New, Notes, Reminder to check reaction)

**Lifestyle**

* Exercise/Walk (Timer or Duration, Location, Weather, Mood)
* Play (Duration, Mood, Social Interactions)
* Training (Checklist: skills; Rating; Reminder)
* Grooming (Subcategory, Attachment, Cost)

**Expense**

* Purchase (Attachment \[Receipt OCR], Cost, Vendor, Category, Recurrence)
* Insurance (Cost, Recurrence, Reminder)

---

## 6) Navigation & Gestures

* **Pet Switching**: Horizontal swipe on header (keeps position & filters).
* **Add**: FAB bottom-right; on iOS scrolls away subtly and reappears on up-scroll.
* **Bottom Sheet**: Category Picker (5 icons + labels), recent templates row.
* **Long-Press** Activity Card: Quick actions (Edit, Duplicate, Share, Delete).
* **Timeline Grouping Toggle**: Daily | Weekly | Monthly; preserves scroll position.
* **Lightbox**: Tap photo → full-screen; swipe between attachments.

Keyboard (desktop):

* `A` = Add activity
* `/` = Search
* `E` = Edit selected card
* `Cmd/Ctrl+K` = Command palette (future NLP quick add)

---

## 7) Timeline Behavior

* **Reverse chrono**, infinite scroll, virtualized list.
* **Atoms**: Activity Card (category color stripe, title, key facts, micro-thumbs).
* **Inline Edits**: Title, notes, rating are editable in place on long-press.
* **Pinned Critical**: Health entries with `is_critical` show a red badge, pinned to top of day group.
* **Filters**:

  * Category chips (multi-select)
  * Date range
  * Has attachments
  * Cost range
  * Search (hits FTS + subcategory + tags)
* **Empty States**: Per category suggestions (“Log a weight”, “Add feeding”).

---

## 8) Drafts, Undo, and Error States

* **Auto-save Drafts**: Starting a Guided/Advanced session creates a draft (per pet) every 2s or on blur.
* **Undo**: Toast with “Undo” for 6s; also a dedicated **Activity History** tab (soft delete).
* **Offline**: All flows fully offline. OCR gracefully disabled with message (when available later).
* **Attachment Failures**: Show per-file status; allow retry; save activity without failed files.

---

## 9) App Structure & Responsibilities

**Pages**

* `PetProfilePage`

  * Header (photo + swipe switcher)
  * Tabs (Timeline default)
  * FAB lives here
* `ActivityEditorPage`

  * Hosts Guided/Advanced modes
* `PhotoLightboxPage`

**Key Components**

* `CategoryPickerSheet`
* `TemplateQuickRow` (recent templates by pet)
* `ActivityBlock/*` (one component per block)
* `ActivityCard`
* `FilterBar`

**State & Data**

* `useActivities(petId, filters, paging)`
* `useActivityDraft(activityId?)`
* `useRecentTemplates(petId)` (persist last 5 templates selected)
* `useQuickDefaults(category, petId)` (learns units, common subcats)

---

## 10) Acceptance Criteria (UX)

1. **≤3 interactions** to log a common template via Quick Log.
2. **No full form reloads** when changing subcategory: only **block stack** updates.
3. **Pet context** always visible and changeable in editor header; switching updates `pet_id` safely (confirm dialog).
4. **Undo available** after save; History allows restore.
5. **Filters persist** per pet until user clears.
6. **Timeline add feedback**: saved item animates into position with category color stripe.

---

## 11) Edge Cases & Rules

* **Switch category mid-flow**: keep shared blocks (Title/Time/Notes), reset category-specific blocks after confirmation.
* **Backdating**: editing `activity_date` repositions the card in Timeline immediately.
* **Recurring items** (diet/medication): creating/editing shows preview dates; can skip occurrences.
* **Multiple attachments**: first image becomes cover; reorder via drag.
* **Cost + Expense**: saving an Expense-bearing activity auto-creates/updates the expense record (same `activity_id`).

---

## 12) Analytics (for future tuning)

* `activity_quicklog_started`, `activity_quicklog_saved`
* `activity_template_used` (category, subcategory, petId)
* `block_added/removed` (which, from which template)
* `attachment_added_failed`
* `undo_clicked`, `draft_restored`

---

## 13) Accessibility & Internationalization

* All blocks have ARIA labels; emoji ratings have text equivalents.
* Bottom sheet is keyboard accessible; focus trapped.
* Units and currencies localized; date/time formats respect locale.
* Chinese/English copy parity; avoid truncated labels in chip sets.

---

## 14) Migration Plan (from “simplified activity”)

1. **Introduce Block Library** behind current forms (no visual change).
2. **Ship Category Picker + Quick Log** for Diet & Growth first.
3. Migrate Health → Vet Visit template (largest win).
4. Replace legacy forms with template-driven stacks.
5. Enable Advanced Edit tabs and Drafts.
6. Sunset old “one-page giant form”.

---

## 15) Visuals (wireframe notes)

* **Category Picker Sheet**
  Row 1: \[Health] \[Growth] \[Diet] \[Lifestyle] \[Expense]
  Row 2: “Recent templates” chips (per pet)
* **Quick Log**
  Title (auto: “Meal”, “Weight”, etc.)
  Core block(s) → “Save” (primary) | “More details”
* **Guided Flow**
  Step dots or progress bar; top shows Pet avatar + name.
* **Activity Card**
  Left color stripe (by category), Title, time, key facts line, mini thumbnails.

---

## 16) PM Checklist (Definition of Done)

* [ ] Quick Log yields valid DB records for all 5 categories.
* [ ] Switching subcategory mutates **only** the block list; no page remount.
* [ ] Draft autosave & restore verified across app restarts.
* [ ] Undo & History restore work on all activity types.
* [ ] Timeline virtualization maintains 60fps with 1,000+ activities.
* [ ] All flows keyboard & screen-reader accessible.
* [ ] Unit tests for each Block + integration tests for Quick Log & Guided Flow.

---

## 17) Next Steps for Engineering

* Define **Block schema** (TS interfaces) and renderer.
* Build **Category → Template** registry (JSON config).
* Implement **Quick Log sheet** + minimal block set (Diet/Weight first).
* Wire **Draft service** (persist to SQLite) + undo/soft-delete.
* Migrate existing forms to templates incrementally.

---

If you want, I can turn this into a dev-ready **Template Registry JSON** + **Block component checklist** in your code style (React + shadcn + Tailwind), and sketch the Quick Log bottom-sheet UI to slot into your current tabs.




# Pawdiary — Activity System Refactor (Dev Spec)

## 1. Core Concept: Block-Based Activity Editor

We replace the giant category form with a **Block Renderer** that dynamically renders inputs based on a **Template Registry**.

### TypeScript Interfaces

```ts
// Generic block definition
export interface ActivityBlockDef {
  id: string; // unique within activity
  type: ActivityBlockType;
  label?: string;
  required?: boolean;
  config?: Record<string, any>; // block-specific settings
}

export type ActivityBlockType =
  | "title"
  | "notes"
  | "subcategory"
  | "time"
  | "measurement"
  | "rating"
  | "portion"
  | "timer"
  | "location"
  | "weather"
  | "checklist"
  | "attachment"
  | "cost"
  | "reminder"
  | "people"
  | "recurrence";
```

```ts
// Template definition
export interface ActivityTemplate {
  id: string; // e.g. "diet.feeding"
  category: ActivityCategory;
  label: string;
  icon: string;
  blocks: ActivityBlockDef[];
}
```

---

## 2. Template Registry

Store in JSON/TS module (`src/lib/activityTemplates.ts`):

```ts
export const activityTemplates: ActivityTemplate[] = [
  {
    id: "diet.feeding",
    category: "diet",
    label: "Regular Feeding",
    icon: "🍖",
    blocks: [
      { id: "time", type: "time", required: true },
      { id: "portion", type: "portion", required: true },
      { id: "notes", type: "notes" },
      { id: "rating", type: "rating" },
    ],
  },
  {
    id: "growth.weight",
    category: "growth",
    label: "Weight Check",
    icon: "⚖️",
    blocks: [
      { id: "time", type: "time", required: true },
      { id: "weight", type: "measurement", config: { unit: ["kg", "lbs"] } },
    ],
  },
  // more templates...
];
```

This makes categories extensible without reworking forms.

---

## 3. Block Renderer (Frontend)

A single React component:

```tsx
function BlockRenderer({ block, control }: { block: ActivityBlockDef; control: Control<any>; }) {
  switch (block.type) {
    case "time": return <TimePicker control={control} />;
    case "portion": return <PortionInput control={control} />;
    case "measurement": return <MeasurementInput {...block.config} control={control} />;
    case "attachment": return <AttachmentManager control={control} />;
    // ...etc
  }
}
```

Each `ActivityEditor` maps over `template.blocks` → renders correct block.

---

## 4. ActivityEditor Modes

* **Quick Log**: show 1–2 required blocks only
* **Guided Flow**: render full `template.blocks`
* **Advanced Edit**: add optional tabs (Attachments, Costs, etc.)

This is just a **UI wrapper** over the same Block Renderer.

---

## 5. Backend (Rust)

### Tauri Command Skeleton

```rust
#[tauri::command]
pub async fn create_activity(activity: ActivityFormData) -> Result<i64, ActivityError> {
    let mut tx = DB.begin().await?;
    let id = insert_activity(&mut tx, &activity).await?;
    
    if let Some(files) = &activity.attachments {
        for f in files {
            insert_attachment(&mut tx, id, f).await?;
        }
    }
    tx.commit().await?;
    Ok(id)
}
```

### Validation

* Use `zod` in frontend, mirror with `validator` in Rust.
* `category` must match template.
* Block configs (e.g., measurement unit) validated via template config.

---

## 6. State & Hooks

### `useActivities`

```ts
export function useActivities(petId: number, filters: ActivityFilters) {
  return useQuery({
    queryKey: ["activities", petId, filters],
    queryFn: () => invoke<Activity[]>("list_activities", { petId, filters }),
  });
}
```

### `useRecentTemplates`

* Store last 5 templates per pet in SQLite or localStorage.
* Used to suggest Quick Log shortcuts.

---

## 7. Testing Strategy

### Unit

* Each block component validates + renders correctly.
* Template registry passes schema check.

### Integration

* `ActivityEditor` renders all blocks for each template.
* Switching category reloads new template safely.

### E2E

* Add → Quick Log → Timeline insertion.
* Edit → Advanced → Save → Timeline update.

---

## 8. Migration Plan

1. Introduce **BlockRenderer** with just “title”, “time”, “notes”.
2. Move existing Diet/Growth forms → templates.
3. Migrate Health → Guided Flow.
4. Add Expenses + OCR last.
5. Remove legacy monolithic forms.

---

✅ With this spec, you can now:

* Keep UX unified (Quick Log → Guided Flow → Advanced).
* Let engineering/AI agents scaffold actual code from `activityTemplates`.
* Avoid copy-paste per category.
