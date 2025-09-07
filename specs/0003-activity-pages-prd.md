# 🐾 《刨刨日记 Pawdiary》PRD — Activity as Independent Page

## 1. 背景与动机

当前活动（Activity）系统展示在宠物 Profile 页面中，虽然能查看和添加记录，但存在以下问题：

* **上下文混乱**：活动与宠物之间的绑定感不够强，用户容易误以为活动是全局共享的。
* **交互拥挤**：Profile 页承载了过多功能（宠物信息 + 活动时间线），页面显得冗杂。
* **编辑空间有限**：活动表单采用 Bottom Sheet 或嵌入式方式，复杂活动的录入不够沉浸。

为此，需要将 **活动（Activity）迁移到独立页面**，明确地与某只宠物绑定，并提供全屏化的编辑体验。

---

## 2. 产品目标

1. **强绑定上下文**：活动必须依托某个宠物，不能在“无宠物上下文”下创建或编辑。
2. **独立页面化**：活动浏览、增删改查都在独立页面完成，Profile 仅保留简要概览。
3. **更清晰的用户心智**：

   * Profile：看宠物基本信息 + 最近 1–3 条活动
   * ActivitiesPage：看完整时间线、筛选、管理
   * ActivityEditorPage：新建/编辑活动
4. **一致的导航逻辑**：返回路径与 iOS/Android/Web 的交互习惯一致，用户不迷路。

---

## 3. 功能范围

### 3.1 活动列表页（ActivitiesPage）

* 入口：从宠物 Profile → “查看全部活动” 或 FAB。
* 路径：`/pets/:petId/activities`
* 功能：

  * 展示当前宠物的完整 Timeline（倒序）
  * 筛选（分类、多选、日期、附件、花销范围）
  * FAB：新增活动 → 跳转到 `/pets/:petId/activities/new`
  * 活动卡片：点击进入编辑页，长按弹出快捷操作（编辑、删除、复制）

### 3.2 活动编辑页（ActivityEditorPage）

* 路径：

  * 新建：`/pets/:petId/activities/new?template=xxx&mode=quick|guided`
  * 编辑：`/pets/:petId/activities/:activityId/edit`
* 功能：

  * 三种模式（Quick / Guided / Advanced）
  * 支持模板选择、块式编辑
  * 全屏页面，顶部显示宠物头像与名字，强化上下文
  * 保存后 → 返回列表并定位到新/更新的卡片
  * 支持草稿、撤销、错误提示

### 3.3 宠物 Profile 页

* 仅保留：

  * 宠物基本信息（头像、昵称、生日、品种等）
  * 最近 1–3 条活动预览
  * “查看全部活动”按钮（跳转 ActivitiesPage）

---

## 4. 用户体验设计

### 4.1 导航关系

* **Home → Pet Profile → ActivitiesPage → ActivityEditorPage**
* 返回逻辑：

  * 编辑页 ← 返回列表页 ← 返回宠物页 ← 返回首页

### 4.2 移动端体验

* 活动编辑页全屏沉浸，支持附件、长文本输入。
* 保存/撤销提示采用 Toast 样式，轻量不打断。

### 4.3 桌面端体验

* ActivitiesPage：宽屏可并排显示 Timeline + 筛选栏。
* EditorPage：Tabs + 快捷键（A 新建、E 编辑、/ 搜索）。

## 5. 技术需求

* **前端**

  * 新增 `ActivitiesPage.tsx`：整合 Timeline、筛选、FAB
  * 新增 `ActivityEditorPage.tsx`：封装 Quick/Guided/Advanced
  * 路由更新：基于 `react-router` 添加宠物上下文路由
  * 状态管理：`useActivities(petId)`、`useActivityDraft(petId, templateId)` 强制依赖 petId
* **后端**

  * Tauri commands 修改：CRUD 必须传 `pet_id`
  * 后端校验：活动必须属于传入的 petId
* **数据库**

  * `activities` 表已有 `pet_id` 字段
  * 新增 `activity_drafts` 表支持草稿（已在设计文档中定义）

---

## 6. 非功能需求

* **一致性**：所有活动数据严格绑定宠物，避免串宠。
* **性能**：Timeline 渲染 1000+ 活动保持 60fps。
* **可用性**：3 步内完成常用记录。
* **可扩展性**：未来支持活动跨宠物对比、云端同步。

---

## 7. 里程碑规划

### M1: 页面分离

* 新建 ActivitiesPage、ActivityEditorPage
* Profile 仅保留最近活动预览 + 查看全部按钮
* 路由切换 & 宠物上下文绑定

### M2: 编辑体验

* Quick / Guided / Advanced 模式完善
* 草稿、撤销功能接入
* 新建/编辑后定位到 Timeline

### M3: 体验优化

* 动画（保存后高亮卡片）
* 桌面快捷键、移动端手势优化
* 筛选记忆 per petId

---

## 8. 验收标准

1. 只能在宠物上下文下创建活动。
2. Profile 页面不再承载完整 Timeline。
3. 活动的 CRUD 均在 ActivitiesPage / ActivityEditorPage 完成。
4. 保存/编辑后能正确回到列表并定位。
5. 切宠物不会串数据，草稿独立保存。
