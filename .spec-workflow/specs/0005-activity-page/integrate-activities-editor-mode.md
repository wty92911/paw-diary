很好的问题！把 **QuickLog / GuidedFlow / AdvancedEditTabs** 三种体验“放在什么页面、怎么切换、如何复用同一套数据与组件”设计清楚，能极大减少复杂度。下面给你一套落地的、和你现有目录完全契合的架构与页面放置方案。

# 放置位置（页面层级）

* **ActivitiesListPage**（列表页）

  * 作为活动的“导航与浏览中心”。
  * FAB 点击后进入 Editor 页面（默认走 QuickLog 流程）。
  * 活动卡片点击 → 进入 Editor（编辑模式，默认 Advanced）。
* **ActivityEditorPage**（编辑页，**唯一承载三种模式**）

  * 路由：

    * 新建：`/pets/:petId/activities/new?template=<id>&mode=quick|guided|advanced`
    * 编辑：`/pets/:petId/activities/:activityId/edit`（默认 `mode=advanced`）
  * 在这个页面里，通过 **URL query mode** 控制当前模式（Quick / Guided / Advanced）。
  * 模式切换只**扩展/收起**块，不重置表单，不丢失草稿。

> 关键点：**三种选择方式都“体现在同一个编辑页面里”，靠 URL 和顶部模式控制条切换**。这样用户心智稳定，工程复用最大化。

---

# 页面内部结构（ActivityEditorPage）

```
ActivityEditorPage
├─ PetContextHeader（显示宠物上下文 + 返回）
├─ TemplatePicker（仅“新建”时显示：分类 chips + 最近模板行）
├─ EditorModeSwitch（模式切换：Quick | Guided | Advanced）
└─ ActivityEditor（核心编辑器）
    ├─ BlockRenderer（根据模板 + 模式渲染块）
    ├─ EditorToolbar（保存、取消、更多详情/打开完整编辑）
    └─ DraftIndicator（• Draft）
```

* **TemplatePicker**
  新建时的第一步：选择类别/模板。选择后直接设置 `templateId` 并保持在当前页，不弹窗不跳转（只更新 URL 的 `template` query）。
* **EditorModeSwitch**
  顶部一个小的标签/分段控制：

  * 新建默认显示 **Quick**（如果模板定义为复杂，显示 **Guided**）。
  * **Advanced** 默认通过“打开完整编辑”按钮显式进入，避免新手一上来就被复杂 UI 吓到。
* **ActivityEditor**
  统一的数据上下文 + 验证 + 保存；根据 `mode` 显示不同块集合（见下文）。

---

# 模式与块集合（“一套表单，多种展示”）

三种模式共享同一个 `FormContext` / `useForm` / `draftId`，区别只在**渲染的块子集**：

* **QuickLog**：模板里标记为 `required: true` 的**核心 1–2 个块**（如：时间、分量/体重）+ 可选的 Notes（折叠）。
* **GuidedFlow**：模板定义的**全部主要块**，以**分步或一屏多块**呈现；包含校验提示、进度指示。
* **AdvancedEditTabs**：**完整编辑器**（Summary / Details / Attachments / Costs / Reminders / History），适合编辑已有活动或复杂场景。

> 规则：模式从 Quick → Guided → Advanced **只能“加块不减块”**（向前切换不丢数据，向后切换仅隐藏界面，不清空表单）。

---

# 路由与模式切换（统一用 URL）

* 入口：

  * 列表页 FAB → `/pets/:petId/activities/new?mode=quick`
  * 选择复杂模板（如 Vet Visit）时，可自动切换为 `mode=guided`
  * 编辑现有活动 → `/pets/:petId/activities/:activityId/edit`（默认 advanced）
* 切换：

  * `EditorModeSwitch` 直接修改 `mode` query，不卸载组件。
  * “更多详情”按钮：`mode=quick → guided`
  * “打开完整编辑”按钮：`mode=guided → advanced`
* 记忆：

  * `useQuickDefaults` / `useRecentTemplates` 可记录**每只宠物、每类模板**的默认 `mode`（例如重量记录长期停留在 Quick）。

**示例代码片段**

```tsx
// src/utils/activityEditorParams.ts
export function useEditorParams() {
  const [sp, setSp] = useSearchParams();
  const mode = (sp.get("mode") ?? "quick") as "quick"|"guided"|"advanced";
  const templateId = sp.get("template") ?? undefined;
  const setMode = (m: typeof mode) => { sp.set("mode", m); setSp(sp, { replace: true }); };
  const setTemplate = (id: string) => { sp.set("template", id); setSp(sp, { replace: true }); };
  return { mode, templateId, setMode, setTemplate };
}
```

---

# 组件职责与复用

* **ActivityEditorPage.tsx**

  * 解析 `petId / activityId / mode / template`。
  * 新建：展示 `TemplatePicker`；编辑：隐藏 `TemplatePicker`。
  * 渲染 `PetContextHeader` + `EditorModeSwitch` + `ActivityEditor`。
* **ActivityEditor.tsx（现有）**

  * 移除 Dialog 包裹，适配全屏。
  * 接收 `mode` 与 `template`，调用 `BlockRenderer` 渲染。
  * 统一的保存/撤销/草稿逻辑。
* **BlockRenderer.tsx（现有）**

  * 按模板 `blocks` 渲染；**新增**根据 `mode` 过滤策略：

    * `quick`: 仅 required + minimal set
    * `guided`: full template blocks
    * `advanced`: full blocks + tabs（布局层增强）
* **QuickLogSheet / GuidedFlowWizard / AdvancedEditTabs（现有）**

  * 作为 **布局壳** 继续复用：

    * Quick：用 QuickLog 的紧凑布局包裹 BlockRenderer 的子集
    * Guided：用 Wizard 步进包裹 BlockRenderer 的全量
    * Advanced：用 Tabs 包裹 BlockRenderer 的全量 + 高级子面板
  * 这些布局组件由 `ActivityEditor` 根据 `mode` 选择性包裹，不直接拥有数据源。

---

# 模式选择的策略（默认/自动/偏好）

1. **默认模式**

   * 新建：`quick`
   * 编辑：`advanced`
2. **模板驱动**

   * 模板可带 `suggestedMode: "quick" | "guided"`（例如 `health.vetVisit` 建议 guided）
3. **用户偏好**

   * `useQuickDefaults(category, petId)` 学习用户偏好：某宠物+某模板更常用 quick/guided
4. **URL 优先**

   * 如果 URL 明确指定了 `mode`，以 URL 为准

> 再强调：**切换模式不丢字段**；只是改变“显示哪些块、怎么排版”。

---

# 保存反馈与返回路径

* **保存后**：

  * 执行 `invalidateQueries(['activities', petId])`
  * 回到 `/pets/:petId/activities`
  * 自动滚动 & 高亮新卡片（你的 Task #18）
* **取消/返回**：

  * 有未保存更改时弹框确认（你的 Task #9）
  * 返回栈：Editor → List → Profile → Home

---

# 新增/调整的最小代码面清单

**新增**

* `src/components/activities/EditorModeSwitch.tsx`
* `src/components/activities/TemplatePicker.tsx`（或复用已有 CategoryPicker + Recent Templates）
* `src/components/activities/EditorSessionProvider.tsx`（可选：集中管理 petId / templateId / draftId）

**增强**

* `ActivityEditor.tsx`：接管三模式布局选择，移除 Dialog 包裹
* `BlockRenderer.tsx`：支持 `mode` 过滤块
* `activityTemplates.ts`：可选加 `suggestedMode`

**工具**

* `src/utils/activityEditorParams.ts`：统一读写 `mode`、`template`

---

# 小结（一句话抓重点）

> **一个页面（ActivityEditorPage）装下三种体验**：通过 URL 的 `mode` 与一个小的 `EditorModeSwitch` 来切换；**同一套表单状态**在不同模式下只做“增/减可视块”的呈现，不做卸载重建，不丢草稿。列表页只负责把用户送到合适的入口（新建默认 Quick，编辑默认 Advanced），一切复杂度都集中在 Editor 控制层，工程和用户心智都最简。
