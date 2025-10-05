# 002 Activity Data Refactoring Brief

## 📋 Executive Summary

**Current Problem**: Activity data is stored as untyped JSON (`serde_json::Value`), sacrificing type safety, query performance, and analytical capabilities for initial flexibility.

**Proposed Solution**: Migrate to a **hybrid typed system** with Rust enums for core activity types while maintaining backward compatibility and enabling advanced analytics.

**Impact**: Enable weight trend analysis, feeding preference insights, and automatic pet profile updates with zero data loss.

---

## 🔍 Current Architecture Analysis

### Frontend Design (TypeScript)

#### Template System (`src/lib/templates/`)
- **5 template categories**: Diet, Growth, Health, Lifestyle, Expense
- **16 block types**: title, notes, time, measurement, rating, portion, timer, etc.
- **Configuration-driven**: Each template defines blocks with typed configs

**Key Templates**:
```typescript
// dietTemplates.ts
{
  id: 'diet.feeding',
  blocks: [
    { id: 'portion', type: 'portion', config: PortionConfig },
    { id: 'time', type: 'time', config: TimeConfig }
  ]
}

// growthTemplates.ts
{
  id: 'growth.weight',
  blocks: [
    { id: 'weight', type: 'measurement', config: MeasurementConfig },
    { id: 'time', type: 'time', config: TimeConfig }
  ]
}
```

#### Block Components (`src/components/activities/blocks/`)
- **13 specialized blocks**: MeasurementBlock, PortionBlock, RatingBlock, etc.
- **Typed data structures**: Each block has corresponding `*Data` interface
- **Validation**: Zod schemas for runtime validation

**Data Flow**:
```
User Input → Block Component → ActivityFormData.blocks[blockId] → JSON → Backend
```

### Backend Storage (Rust)

#### Current Models (`src-tauri/src/database/models.rs`)
```rust
pub struct Activity {
    pub id: i64,
    pub pet_id: i64,
    pub category: ActivityCategory,  // Enum: Health, Growth, Diet, etc.
    pub subcategory: String,         // Dynamic: "Weight", "Feeding", etc.
    pub activity_data: Option<serde_json::Value>, // ❌ Untyped black box
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

#### Current Limitations
❌ **No type safety**: `activity_data` is opaque JSON
❌ **Query difficulties**: Cannot directly query weight values in SQL
❌ **No validation**: Backend blindly stores any JSON structure
❌ **Analytics impossible**: Cannot compute trends without JSON parsing
❌ **No side effects**: Creating weight activity doesn't update `Pet.weight_kg`

---

## 🎯 Refactoring Goals

### Phase 1: Core Type Safety (Week 1-2)
✅ Define typed `ActivityData` enum for high-value activities
✅ Implement safe JSON serialization/deserialization
✅ Add database triggers for automatic pet profile updates
✅ Zero data loss during migration

### Phase 2: Advanced Queries (Week 3-4)
✅ SQLite JSON1 virtual columns for performance
✅ Efficient trend analysis queries
✅ Full-text search optimization

### Phase 3: Analytics Engine (Week 5-6)
✅ Rust-based analytics service
✅ Weight trend calculations
✅ Feeding preference analysis
✅ Export capabilities

---

## 📐 Proposed Architecture

### 1. Typed ActivityData Enum

```rust
// src-tauri/src/database/models.rs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ActivityData {
    // Growth Category - HIGH PRIORITY
    Weight {
        value: f32,
        unit: String,
        measurement_type: String,
        notes: Option<String>,
    },

    Height {
        value: f32,
        unit: String,
        measurement_type: String,
        notes: Option<String>,
    },

    // Diet Category - HIGH PRIORITY
    Feeding {
        portion_type: String,
        amount: f32,
        unit: String,
        brand: Option<String>,
        notes: Option<String>,
    },

    WaterIntake {
        amount: f32,
        unit: String,
        source: Option<String>,
        notes: Option<String>,
    },

    // Health Category - MEDIUM PRIORITY
    Vaccination {
        vaccine_name: String,
        vet_name: Option<String>,
        next_due_date: Option<DateTime<Utc>>,
        batch_number: Option<String>,
        notes: Option<String>,
    },

    CheckUp {
        diagnosis: Option<String>,
        temperature: Option<f32>,
        heart_rate: Option<i32>,
        notes: Option<String>,
    },

    // Fallback for unknown or custom templates
    Custom(serde_json::Value),
}

pub struct Activity {
    pub id: i64,
    pub pet_id: i64,
    pub category: ActivityCategory,
    pub subcategory: String,
    pub activity_data: Option<ActivityData>, // ✅ Now typed!
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
```

### 2. Automatic Side Effects

```rust
// src-tauri/src/commands/activities.rs

#[tauri::command]
pub async fn create_activity(
    state: State<'_, AppState>,
    activity_data: ActivityCreateRequest,
) -> Result<Activity, ActivityError> {
    // Start transaction
    let mut tx = state.database.begin().await?;

    // Create activity
    let activity = tx.insert_activity(activity_data).await?;

    // Side effects based on activity type
    if let Some(ActivityData::Weight { value, unit, .. }) = &activity.activity_data {
        let weight_kg = convert_to_kg(*value, unit);
        tx.update_pet(
            activity.pet_id,
            UpdatePetRequest {
                weight_kg: Some(weight_kg),
                ..Default::default()
            }
        ).await?;

        log::info!("Auto-updated pet {} weight to {} kg", activity.pet_id, weight_kg);
    }

    // Commit transaction
    tx.commit().await?;
    Ok(activity)
}
```

### 3. Analytics-Optimized Queries

```sql
-- Virtual columns for performance (SQLite JSON1 extension)
ALTER TABLE activities ADD COLUMN weight_value REAL
  GENERATED ALWAYS AS (
    CASE
      WHEN json_extract(activity_data, '$.type') = 'Weight'
      THEN CAST(json_extract(activity_data, '$.data.value') AS REAL)
      ELSE NULL
    END
  ) VIRTUAL;

CREATE INDEX idx_weight_trend ON activities(pet_id, created_at, weight_value)
  WHERE weight_value IS NOT NULL;

-- Fast trend query
SELECT
    created_at,
    weight_value,
    AVG(weight_value) OVER (
        ORDER BY created_at
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_avg_7day
FROM activities
WHERE pet_id = ? AND weight_value IS NOT NULL
ORDER BY created_at DESC
LIMIT 30;
```

### 4. Frontend Compatibility Layer

```typescript
// src/lib/services/activityAdapter.ts

export class ActivityDataAdapter {
  // Convert frontend blocks to backend typed data
  static toBackendFormat(blocks: Record<string, ActivityBlockData>): ActivityData {
    // Weight template
    if (blocks.weight && blocks.weight.measurementType === 'weight') {
      return {
        type: 'Weight',
        data: {
          value: blocks.weight.value,
          unit: blocks.weight.unit,
          measurement_type: blocks.weight.measurementType,
          notes: blocks.notes
        }
      };
    }

    // Feeding template
    if (blocks.portion && blocks.portion.portionType) {
      return {
        type: 'Feeding',
        data: {
          portion_type: blocks.portion.portionType,
          amount: blocks.portion.amount,
          unit: blocks.portion.unit,
          brand: blocks.portion.brand,
          notes: blocks.notes
        }
      };
    }

    // Fallback to custom
    return {
      type: 'Custom',
      data: blocks
    };
  }

  // Convert backend typed data to frontend blocks
  static toFrontendFormat(activityData: ActivityData): Record<string, ActivityBlockData> {
    switch (activityData.type) {
      case 'Weight':
        return {
          weight: {
            value: activityData.data.value,
            unit: activityData.data.unit,
            measurementType: activityData.data.measurement_type,
            notes: activityData.data.notes
          }
        };

      case 'Feeding':
        return {
          portion: {
            amount: activityData.data.amount,
            unit: activityData.data.unit,
            portionType: activityData.data.portion_type,
            brand: activityData.data.brand
          },
          notes: activityData.data.notes
        };

      case 'Custom':
        return activityData.data;

      default:
        return {};
    }
  }
}
```

---

## 🚀 Step-by-Step Migration Plan

### Phase 1: Foundation (Week 1)

#### Step 1.1: Define Core Enums (Day 1-2)
- [ ] Create `ActivityData` enum with 6 core variants (Weight, Height, Feeding, WaterIntake, Vaccination, CheckUp)
- [ ] Add `Custom(Value)` fallback variant
- [ ] Implement Serialize/Deserialize with `#[serde(tag = "type", content = "data")]`
- [ ] Write unit tests for serialization

#### Step 1.2: Update Database Models (Day 3)
- [ ] Change `Activity.activity_data` type from `Option<Value>` to `Option<ActivityData>`
- [ ] Update `ActivityCreateRequest` and `ActivityUpdateRequest`
- [ ] Ensure backward compatibility with existing JSON data

#### Step 1.3: Backend Migration Logic (Day 4-5)
- [ ] Implement `migrate_legacy_json_to_typed()` function
- [ ] Add migration on database initialization
- [ ] Test with existing activity data
- [ ] Rollback mechanism if migration fails

### Phase 2: Side Effects & Validation (Week 2)

#### Step 2.1: Automatic Pet Updates (Day 1-3)
- [ ] Add transaction support to `create_activity`
- [ ] Implement weight update logic
- [ ] Add height update logic (if `Pet` has height field)
- [ ] Comprehensive error handling and rollback

#### Step 2.2: Validation Layer (Day 4-5)
- [ ] Create `ActivityDataValidator` trait
- [ ] Implement validators for each typed variant
- [ ] Add validation before database insertion
- [ ] Unit tests for all validation rules

### Phase 3: Analytics Infrastructure (Week 3-4)

#### Step 3.1: Virtual Columns (Day 1-2)
- [ ] Add virtual columns for weight, height, feeding amount
- [ ] Create performance indexes
- [ ] Benchmark query performance (before/after)

#### Step 3.2: Analytics Queries (Day 3-5)
- [ ] `get_weight_trend(pet_id, days)` with moving average
- [ ] `get_feeding_preferences(pet_id, days)` brand analysis
- [ ] `get_health_summary(pet_id)` vaccination schedule
- [ ] Export functions (JSON, CSV)

#### Step 3.3: Frontend Integration (Day 6-10)
- [ ] Create `ActivityDataAdapter` service
- [ ] Update `create_activity` command caller
- [ ] Add data transformation tests
- [ ] Update ActivityEditor to use adapter

### Phase 4: Advanced Analytics (Week 5-6)

#### Step 4.1: Trend Analysis (Day 1-3)
- [ ] Weight change rate calculation
- [ ] Growth prediction (for puppies/kittens)
- [ ] Anomaly detection (sudden weight loss/gain)

#### Step 4.2: Preference Insights (Day 4-6)
- [ ] Brand preference ranking
- [ ] Meal timing patterns
- [ ] Portion size trends

#### Step 4.3: Health Monitoring (Day 7-10)
- [ ] Vaccination due date alerts
- [ ] Health check frequency analysis
- [ ] Medical history timeline

---

## 🔄 Backward Compatibility Strategy

### Data Migration
```rust
impl ActivityData {
    pub fn from_legacy_json(value: serde_json::Value) -> Self {
        // Try to parse as typed data first
        if let Ok(typed) = serde_json::from_value::<ActivityData>(value.clone()) {
            return typed;
        }

        // Fallback: migrate known patterns
        if let Some(obj) = value.as_object() {
            // Detect weight pattern
            if obj.contains_key("weight") && obj["weight"].is_object() {
                if let Ok(weight_data) = serde_json::from_value::<MeasurementData>(obj["weight"].clone()) {
                    return ActivityData::Weight {
                        value: weight_data.value,
                        unit: weight_data.unit,
                        measurement_type: weight_data.measurement_type,
                        notes: obj.get("notes").and_then(|v| v.as_str()).map(String::from),
                    };
                }
            }

            // Detect feeding pattern
            if obj.contains_key("portion") && obj["portion"].is_object() {
                if let Ok(portion_data) = serde_json::from_value::<PortionData>(obj["portion"].clone()) {
                    return ActivityData::Feeding {
                        portion_type: portion_data.portion_type,
                        amount: portion_data.amount,
                        unit: portion_data.unit,
                        brand: portion_data.brand,
                        notes: obj.get("notes").and_then(|v| v.as_str()).map(String::from),
                    };
                }
            }
        }

        // Ultimate fallback: store as custom
        ActivityData::Custom(value)
    }
}
```

### Frontend Compatibility
- **Phase 1-2**: Frontend continues sending block-based JSON
- **Phase 3**: Backend converts to typed data via adapter
- **Phase 4**: Frontend directly sends typed data (optional optimization)

---

## 📊 Success Metrics

### Performance Targets
- [ ] Weight trend query: <50ms for 1-year data
- [ ] Feeding analysis: <100ms for 3-month data
- [ ] Migration: <1s for 10,000 activities

### Quality Targets
- [ ] Zero data loss during migration
- [ ] 100% backward compatibility with existing templates
- [ ] Type coverage: ≥80% of activity records as typed data (not Custom)

### Feature Targets
- [ ] Auto pet weight update: 100% success rate
- [ ] Trend visualization: 7-day/30-day/90-day moving averages
- [ ] Export: JSON, CSV, PDF support

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Loss During Migration
**Mitigation**:
- Implement comprehensive backup before migration
- Dry-run migration with validation
- Rollback mechanism if migration fails

### Risk 2: Performance Regression
**Mitigation**:
- Benchmark before/after migration
- Virtual columns with proper indexing
- Lazy migration (convert on read if needed)

### Risk 3: Frontend Breaking Changes
**Mitigation**:
- Adapter layer maintains block-based interface
- Gradual rollout with feature flags
- Comprehensive integration tests

---

## 🔗 Related Documents

- **PRD**: `specs/0001-prd.md` - Original product requirements
- **Activity PRD**: `specs/0002-activity-prd.md` - Activity feature details
- **Database Schema**: `src-tauri/migrations/` - Current schema
- **Type Definitions**: `src/lib/types/activities.ts` - Frontend types

---

## 📝 Next Steps

1. **Review & Approval**: Team review of this refactoring plan
2. **Spike**: 2-day proof-of-concept for ActivityData enum
3. **Timeline**: Confirm 6-week timeline with stakeholders
4. **Resources**: Assign developers to each phase
5. **Kickoff**: Start Phase 1 after approval

---

**Status**: 📋 Draft
**Owner**: TBD
**Target Start**: TBD
**Estimated Duration**: 6 weeks
**Last Updated**: 2024-10-05
