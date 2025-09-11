# 活动块组件修复计划

## 背景

当前系统中的活动块组件存在两种不同的 props 接口模式：
1. **标准的 BlockProps 接口** - 用于 TitleBlock、TimeBlock 等组件
2. **自定义 props 接口** - 包含 `block` 属性的接口，用于其他组件

为了保持代码一致性和类型安全，我们需要将所有组件统一为使用标准的 `BlockProps<T>` 接口。

## 已完成的组件

以下组件已经使用标准的 BlockProps 接口：

- [x] TitleBlock
- [x] TimeBlock
- [x] NotesBlock
- [x] MeasurementBlock
- [x] SubcategoryBlock
- [x] RatingBlock (已修复)
- [x] PortionBlock (已修复)
- [x] TimerBlock (已修复)

## 待修复的组件

以下组件需要修改为使用标准的 BlockProps 接口：

- [ ] LocationBlock
- [ ] WeatherBlock
- [ ] ChecklistBlock
- [ ] AttachmentBlock
- [ ] CostBlock
- [ ] ReminderBlock
- [ ] PeopleBlock
- [ ] RecurrenceBlock

## 修复方法

每个组件的修复过程基本相同：

1. **修改导入**：
   ```typescript
   // 修改前
   import { ActivityFormData, ActivityBlockDef } from '../../../lib/types/activities';
   // 修改后
   import { BlockProps } from '../../../lib/types/activities';
   ```

2. **更新组件配置接口**：
   ```typescript
   // 修改前
   interface XxxBlockProps {
     block: ActivityBlockDef & { type: 'xxx' };
     control?: Control<ActivityFormData>;
     error?: FieldError;
   }
   
   // 修改后
   interface XxxBlockConfig {
     // 所有需要的配置属性
     hint?: string;
     // 其他配置...
   }
   ```

3. **修改组件签名**：
   ```typescript
   // 修改前
   const XxxBlock: React.FC<XxxBlockProps> = ({
     block,
     error,
   }) => {
     const { watch, setValue } = useFormContext();
     const fieldName = `blocks.${block.id}` as const;
     
   // 修改后
   const XxxBlock: React.FC<BlockProps<XxxBlockConfig>> = ({
     control,
     name,
     label = 'Xxx',
     required = false,
     config = {},
   }) => {
     const fieldName = name;
   ```

4. **使用 Controller 包装组件内容**：
   ```typescript
   return (
     <Controller
       control={control}
       name={fieldName}
       rules={{ required: required ? `${label} is required` : false }}
       render={({ field, fieldState: { error } }) => {
         const currentValue = field.value;
         
         // 组件内容...
         
         return (
           <Field
             label={label}
             required={required}
             error={error?.message}
             hint={config?.hint || '默认提示'}
             blockType="xxx"
             id={`xxx-${fieldName}`}
           >
             {/* JSX内容 */}
           </Field>
         );
       }}
     />
   );
   ```

5. **修复所有对旧变量的引用**：
   - 将 `block.label` 替换为 `label`
   - 将 `block.required` 替换为 `required`
   - 将 `block.config` 替换为 `config`
   - 将 `block.id` 替换为 `fieldName`
   - 将 `setValue(fieldName, value)` 替换为 `field.onChange(value)`

## 注意事项

1. 确保每个组件的 `XxxBlockConfig` 接口包含所有需要的配置属性
2. 修复完成后，将组件添加回 BlockRenderer 的注册表中
3. 修复后运行 linter 检查，确保没有类型错误
4. 保持组件的功能不变，只修改接口和内部实现

## 优先级

1. 简单的组件优先修复
2. 常用的组件优先修复
3. 复杂的组件最后修复

