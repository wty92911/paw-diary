# 0005 - Weight Trend Chart Specification

## 1. Overview

### Purpose
Implement a weight trend visualization feature that displays pet weight changes over time as an interactive line chart. This feature will be displayed on the Pet Profile page below the Activities section, providing pet owners with visual insights into their pet's growth and weight management.

### Background
Weight tracking is one of the core features of Pawdiary (M1 milestone). While users can record weight measurements through activities, there's currently no visual representation of weight trends. This visualization will help users:
- Monitor healthy growth patterns for young pets
- Detect weight gain/loss trends that may indicate health issues
- Track the effectiveness of diet or exercise programs
- Celebrate growth milestones

### Future Extensibility
This weight chart is the first in a planned series of data visualizations:
- **M2 Phase**: Diet analysis, health records timeline, expense tracking
- **M3 Phase**: Multi-metric comparisons, predictive trend analysis
- **M4 Phase**: AI-powered insights and anomaly detection

---

## 2. User Stories

### Primary User Story
**As a pet owner**, I want to see my pet's weight changes over time in a visual chart, so that I can monitor their growth and health trends at a glance.

### Supporting User Stories
1. **As a pet owner**, I want to see weight data points with dates, so I can track when measurements were taken.
2. **As a pet owner**, I want to interact with the chart (zoom, pan, hover), so I can examine specific periods in detail.
3. **As a pet owner**, I want the chart to handle missing data gracefully, so gaps in measurements don't break the visualization.
4. **As a pet owner**, I want to see the chart in my preferred weight unit (kg/lbs), so the data is meaningful to me.

---

## 3. Functional Requirements

### 3.1 Data Source
- **Source**: Weight activities from the `activities` table where `category = 'Growth'` and `activity_data.type = 'Weight'`
- **Pet Scoping**: Only show weight data for the currently active pet (`pet_id` match)
- **Date Range**: Display all available weight measurements, with default view of last 6 months
- **Data Points**: Each weight activity contributes one data point (date, value)
- **Unit Handling**: Parse weight from `activity_data.data.value` and `activity_data.data.unit`

### 3.2 Chart Specifications

#### Chart Type
- **Primary**: Line chart with data points
- **Fallback**: Scatter plot if < 3 data points

#### Chart Features
- **X-Axis**: Time (date of measurement)
  - Auto-scaled based on data range
  - Formatted labels (e.g., "Jan 2024", "15 Mar", "Week 12")
  - Responsive tick density (fewer on mobile)

- **Y-Axis**: Weight value
  - Unit label (kg or lbs) based on user preference or most common unit in data
  - Auto-scaled with 10% padding above/below min/max
  - Starting at reasonable baseline (not zero, to show variance clearly)

- **Data Line**:
  - Smooth curve interpolation (natural cubic spline)
  - Color: Primary theme color (orange-600 from Tailwind config)
  - Stroke width: 2-3px
  - Semi-transparent gradient fill below curve (optional)

- **Data Points**:
  - Circles at each measurement
  - Radius: 4-6px
  - Fill: White, Stroke: Primary color
  - Hover: Scale up 1.3x

#### Interactive Features
1. **Hover/Tap Tooltips**:
   - Date (formatted, e.g., "15 March 2024")
   - Weight value with unit (e.g., "5.2 kg")
   - Age at measurement (e.g., "6 months old")
   - Delta from previous measurement (e.g., "+0.3 kg ↑")

2. **Zoom & Pan** (desktop):
   - Pinch-zoom on chart area
   - Horizontal panning with mouse drag
   - Reset button to restore default view

3. **Time Range Selector**:
   - Buttons: 1M, 3M, 6M, 1Y, All
   - Highlights current selection
   - Updates chart data dynamically

4. **Unit Toggle**:
   - Switch between kg and lbs
   - Converts all data points on-the-fly
   - Persists preference (localStorage or user settings)

### 3.3 Empty States & Edge Cases

#### No Data
- **Condition**: No weight activities recorded
- **Display**: Empty state card with illustration
- **Message**: "No weight measurements yet"
- **CTA**: "Add Weight" button → opens Activity Editor with Weight template

#### Single Data Point
- **Display**: Single point on chart with reference line
- **Message**: "Add more measurements to see trend"

#### Sparse Data
- **Condition**: Large gaps between measurements (> 30 days)
- **Behavior**: Dotted line segments in gaps
- **Tooltip**: "Measurement gap: X days"

#### Data Errors
- **Invalid Values**: Skip and log error
- **Unit Conversion Failures**: Default to original unit, show warning
- **Date Parsing Errors**: Skip data point, show warning

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Initial Load**: < 500ms for 1 year of daily data (~365 points)
- **Interaction Response**: < 100ms for hover/tap feedback
- **Data Refresh**: Real-time update when new weight activity is added
- **Memory**: Efficient virtualization for > 1000 data points

### 4.2 Responsiveness
- **Mobile** (< 640px):
  - Single-column layout
  - Touch-optimized tooltips (tap to show/hide)
  - Simplified time range selector (icons only)
  - Reduced data point density (sampling if > 100 points)

- **Tablet** (640px - 1024px):
  - Optimized chart height (250-300px)
  - Full feature set

- **Desktop** (> 1024px):
  - Maximum chart width: 800px (centered)
  - Full interactivity including zoom/pan

### 4.3 Accessibility
- **Keyboard Navigation**:
  - Tab through time range buttons
  - Arrow keys to navigate data points
  - Enter/Space to toggle unit

- **Screen Reader**:
  - Chart summary: "Weight trend: X measurements from [start] to [end]"
  - Data point announcements: "15 March 2024, 5.2 kilograms"
  - Trend summary: "Overall trend: increasing/decreasing/stable by X%"

- **ARIA Labels**:
  - Chart container: `role="img"`, `aria-label="Pet weight trend chart"`
  - Interactive elements: `aria-pressed`, `aria-expanded`

- **Color Contrast**:
  - WCAG AA compliance (4.5:1 minimum)
  - Alternative to color for trend direction (icons: ↑↓→)

### 4.4 Browser Compatibility
- **Supported**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Fallback**: Static image with data table for older browsers

---

## 5. Technical Design

### 5.1 Component Architecture

```
WeightTrendChart/
├── WeightTrendChart.tsx          # Main container component
├── WeightChartCanvas.tsx          # Chart rendering (recharts/visx)
├── TimeRangeSelector.tsx          # Time range filter buttons
├── UnitToggle.tsx                 # kg/lbs switcher
├── ChartTooltip.tsx               # Custom tooltip component
├── EmptyStateCard.tsx             # No data state
└── hooks/
    ├── useWeightData.ts           # Fetch & transform weight activities
    └── useChartInteractions.ts    # Zoom, pan, hover state
```

### 5.2 Data Flow

```typescript
// 1. Fetch raw weight activities
const { activities } = useActivitiesList(petId, { category: 'Growth' });

// 2. Filter & transform to chart data
const weightData = activities
  .filter(a => a.activity_data.type === 'Weight')
  .map(a => ({
    date: new Date(a.activity_date),
    value: a.activity_data.data.value,
    unit: a.activity_data.data.unit,
    activityId: a.id,
  }))
  .sort((a, b) => a.date - b.date);

// 3. Apply time range filter
const filteredData = weightData.filter(d => d.date >= rangeStart && d.date <= rangeEnd);

// 4. Convert units if needed
const displayData = convertUnits(filteredData, targetUnit);

// 5. Render chart
<LineChart data={displayData} />
```

### 5.3 Chart Library Selection

**Recommended**: [Recharts](https://recharts.org/)
- **Pros**:
  - React-native, composable API
  - Built-in responsive support
  - Good TypeScript support
  - Accessible by default
  - MIT license
- **Cons**:
  - Larger bundle size (~70KB gzipped)
  - Less customization than D3

**Alternative**: [Victory](https://formidable.com/open-source/victory/)
- **Pros**: Excellent mobile support, smaller bundle
- **Cons**: Less popular, smaller community

**Fallback**: [Chart.js](https://www.chartjs.org/) via react-chartjs-2
- **Pros**: Very popular, stable, performant
- **Cons**: Imperative API, less React-idiomatic

### 5.4 Data Hooks

```typescript
// src/hooks/useWeightData.ts
export function useWeightData(petId: number, options?: WeightDataOptions) {
  const { activities, isLoading, error } = useActivitiesList(petId, {
    category: 'Growth'
  });

  return useMemo(() => {
    const weightActivities = activities?.filter(
      a => isWeightActivity(a.activity_data)
    ) || [];

    const dataPoints = weightActivities.map(a => ({
      date: parseISO(a.activity_date),
      value: a.activity_data.data.value,
      unit: a.activity_data.data.unit,
      activityId: a.id,
      notes: a.activity_data.data.notes,
    }));

    // Apply time range filter
    const filtered = filterByDateRange(dataPoints, options?.range);

    // Convert units
    const converted = convertWeightUnits(filtered, options?.displayUnit);

    // Calculate statistics
    const stats = calculateWeightStats(converted);

    return { dataPoints: converted, stats, isLoading, error };
  }, [activities, isLoading, error, options]);
}

interface WeightDataOptions {
  range?: { start: Date; end: Date };
  displayUnit?: 'kg' | 'lbs';
}
```

### 5.5 Unit Conversion

```typescript
// src/lib/utils/weightUtils.ts
export function convertWeight(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;

  const KG_TO_LBS = 2.20462;

  if (fromUnit === 'kg' && toUnit === 'lbs') {
    return value * KG_TO_LBS;
  }
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    return value / KG_TO_LBS;
  }

  throw new Error(`Unsupported conversion: ${fromUnit} -> ${toUnit}`);
}
```

### 5.6 State Management

```typescript
// Local component state (no global state needed)
const [timeRange, setTimeRange] = useState<TimeRange>('6M');
const [displayUnit, setDisplayUnit] = useState<'kg' | 'lbs'>('kg');
const [hoveredPoint, setHoveredPoint] = useState<WeightDataPoint | null>(null);

// Persist user preference
useEffect(() => {
  localStorage.setItem('preferredWeightUnit', displayUnit);
}, [displayUnit]);
```

---

## 6. UI/UX Design

### 6.1 Placement
**Location**: Pet Profile Page (PetProfile.tsx)
- **Position**: After "Recent Activities Preview" section (line 138-145)
- **Before**: Bottom spacing div (line 147)
- **Container**: Same max-width as other cards (max-w-md)

### 6.2 Visual Design

```tsx
<Card className="bg-white/60 backdrop-blur-sm border-orange-200">
  <CardContent className="p-4">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Weight Trend
      </h3>
      <UnitToggle value={unit} onChange={setUnit} />
    </div>

    {/* Time Range Selector */}
    <TimeRangeSelector value={range} onChange={setRange} />

    {/* Chart */}
    <div className="h-64 mt-4">
      <WeightChartCanvas data={chartData} {...chartConfig} />
    </div>

    {/* Statistics Summary */}
    <div className="grid grid-cols-3 gap-4 mt-4 text-center">
      <div>
        <p className="text-xs text-orange-600">Current</p>
        <p className="text-lg font-bold text-orange-900">5.2 kg</p>
      </div>
      <div>
        <p className="text-xs text-orange-600">Change</p>
        <p className="text-lg font-bold text-green-600">+0.8 kg ↑</p>
      </div>
      <div>
        <p className="text-xs text-orange-600">Measurements</p>
        <p className="text-lg font-bold text-orange-900">12</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 6.3 Color Palette
- **Primary Line**: `text-orange-600` (#EA580C)
- **Data Points**: White fill, orange stroke
- **Grid Lines**: `text-orange-100` (subtle)
- **Trend Up**: `text-green-600` (#16A34A)
- **Trend Down**: `text-red-600` (#DC2626)
- **Stable**: `text-gray-600` (#4B5563)

### 6.4 Typography
- **Title**: text-lg font-semibold (18px, 600 weight)
- **Axis Labels**: text-xs (12px)
- **Tooltip**: text-sm (14px)
- **Statistics**: text-lg font-bold (18px, 700 weight)

---

## 7. Testing Strategy

### 7.1 Unit Tests
- **Data Transformation**:
  - Filter weight activities correctly
  - Unit conversion accuracy (kg ↔ lbs)
  - Handle missing/invalid data
  - Date parsing and sorting

- **Statistics Calculation**:
  - Min, max, average, latest
  - Trend direction (up/down/stable)
  - Percentage change calculation

### 7.2 Integration Tests
- **Component Rendering**:
  - Renders chart with valid data
  - Shows empty state when no data
  - Time range selector updates chart
  - Unit toggle converts data

- **User Interactions**:
  - Hover shows tooltip
  - Click data point (future: open activity detail)
  - Time range buttons change data range

### 7.3 E2E Tests (Playwright)
```typescript
test('Weight trend chart displays and updates', async ({ page }) => {
  // Navigate to pet profile
  await page.goto('/pets/1');

  // Verify chart is visible
  await expect(page.locator('[aria-label="Pet weight trend chart"]')).toBeVisible();

  // Change time range
  await page.click('text=1M');
  await expect(page.locator('.recharts-line')).toBeVisible();

  // Toggle unit
  await page.click('button:has-text("lbs")');
  await expect(page.locator('text=/\\d+\\.\\d+ lbs/')).toBeVisible();

  // Add new weight activity
  await page.click('text=Add Activity');
  // ... add weight activity steps

  // Verify chart updates
  await expect(page.locator('.recharts-dot')).toHaveCount(13);
});
```

### 7.4 Visual Regression Tests
- Snapshot test for chart rendering
- Different data scenarios (empty, sparse, dense)
- Different screen sizes (mobile, tablet, desktop)

---

## 8. Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Install and configure chart library (Recharts)
- [ ] Create `useWeightData` hook
- [ ] Implement unit conversion utilities
- [ ] Build `EmptyStateCard` component

### Phase 2: Core Chart (Week 2)
- [ ] Build `WeightChartCanvas` with basic line chart
- [ ] Implement `TimeRangeSelector` component
- [ ] Add `UnitToggle` component
- [ ] Style chart with theme colors

### Phase 3: Interactivity (Week 3)
- [ ] Add custom tooltip with delta calculation
- [ ] Implement hover/tap interactions
- [ ] Add keyboard navigation
- [ ] Implement zoom/pan (desktop)

### Phase 4: Integration & Polish (Week 4)
- [ ] Integrate into `PetProfile.tsx`
- [ ] Add statistics summary section
- [ ] Implement data refresh on activity add
- [ ] Accessibility audit and fixes

### Phase 5: Testing & Documentation (Week 5)
- [ ] Write unit tests (>80% coverage)
- [ ] Write integration tests
- [ ] E2E test scenarios
- [ ] Update component documentation

---

## 9. Future Enhancements (Out of Scope)

### M2 Milestone
1. **Multi-Metric View**: Toggle between weight, height, BMI
2. **Diet Correlation**: Overlay diet changes on weight chart
3. **Export**: Download chart as PNG/PDF
4. **Annotations**: Add notes/events to timeline (e.g., "Started diet")

### M3 Milestone
1. **Comparison Mode**: Compare multiple pets side-by-side
2. **Goal Setting**: Set target weight with progress tracking
3. **Alerts**: Notify on unusual weight changes
4. **Growth Curves**: Compare to breed-standard growth curves

### M4 Milestone (AI Integration)
1. **Predictive Trends**: ML-based weight projection
2. **Anomaly Detection**: Automatic health alert on abnormal patterns
3. **Natural Language Query**: "When did Fluffy reach 5kg?"
4. **Insights**: AI-generated summary ("Fluffy gained 20% in last 3 months")

---

## 10. Dependencies

### New Dependencies
```json
{
  "recharts": "^2.10.0",
  "date-fns": "^3.0.0" // Already installed
}
```

### Existing Dependencies (No Changes)
- React Query (data fetching)
- Tailwind CSS (styling)
- Lucide React (icons)
- Shadcn UI (Card, Button components)

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Chart library bundle size too large | Medium | Medium | Use code splitting, tree shaking |
| Performance with large datasets | Low | High | Virtualize data points, add pagination |
| Unit conversion edge cases | Medium | Low | Comprehensive unit tests, validation |
| Mobile touch interactions unreliable | Low | Medium | Thorough testing on real devices |
| Chart not accessible | Medium | High | Follow WCAG guidelines, use semantic HTML |

---

## 12. Success Metrics

### Launch Criteria
- [ ] Chart renders for all pets with weight data
- [ ] Zero console errors or warnings
- [ ] Passes accessibility audit (WCAG AA)
- [ ] < 500ms initial load time
- [ ] Works on iOS Safari, Chrome Mobile, Desktop browsers
- [ ] Test coverage >80%

### Post-Launch Metrics (Analytics)
- **Engagement**: % of users who view weight chart (target: >60%)
- **Interaction**: Avg. interactions per session (target: >2)
- **Unit Preference**: % using kg vs lbs
- **Time Range**: Most popular time range selection
- **Activity Correlation**: % who add weight after viewing chart

---

## 13. Appendix

### 13.1 Related PRD Sections
- PRD Section 4.3: Data Visualization (Weight Trends)
- PRD Section 4.2: Activity Recording (Growth category)
- PRD Milestone M2: Data Visualization

### 13.2 Related Specifications
- `0002-activity-prd.md`: Activity system and templates
- `0003-activity-pages-prd.md`: Activity pages navigation

### 13.3 Design References
- Pet Profile mockups (TBD)
- Chart style guide (TBD)
- Accessibility checklist (WCAG 2.1 AA)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-XX | Terry Wang | Initial specification |

---

**Status**: Draft
**Owner**: Frontend Team
**Reviewers**: UX Designer, Backend Lead
**Target Release**: M2 (Data Visualization Milestone)
