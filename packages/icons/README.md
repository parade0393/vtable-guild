# @vtable-guild/icons

SVG icon Vue components for vtable-guild. Provides icons used internally by `@vtable-guild/table`.

> 此包是私有工作区依赖，不单独发布到 npm。配套图标随唯一发布包 `@vtable-guild/vtable-guild` 内联构建，业务代码从聚合包根入口导入。

```ts
import {
  SettingOutlinedIcon,
  ColumnHeightOutlinedIcon,
  ReloadOutlinedIcon,
  FullscreenOutlinedIcon,
  FullscreenExitOutlinedIcon,
  CheckCircleFilledIcon,
  CloseCircleFilledIcon,
} from '@vtable-guild/vtable-guild'
```

这些根入口导出在本次源码修复中补齐，已发布的 `2.9.0-alpha.2` 尚不包含；使用包含修复的聚合包版本后，无需额外安装图标包。

## License

MIT
