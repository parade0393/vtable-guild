<script setup lang="ts">
import { provide, reactive, ref } from 'vue'
import { VTable, VTABLE_GUILD_INJECTION_KEY } from '@vtable-guild/vtable-guild'
import type {
  LocaleName,
  TableColumnsType,
  ThemePresetName,
  VTableGuildContext,
} from '@vtable-guild/vtable-guild'

interface Row {
  key: string
  name: string
  team: string
  score: number
  status: string
}

const columns: TableColumnsType<Row> = [
  { title: '成员', dataIndex: 'name', key: 'name', sorter: true },
  {
    title: '团队',
    dataIndex: 'team',
    key: 'team',
    filters: [
      { text: '平台', value: '平台' },
      { text: '交易', value: '交易' },
    ],
    onFilter: (value, record) => record.team === value,
  },
  { title: '评分', dataIndex: 'score', key: 'score', align: 'right', sorter: true },
  { title: '状态', dataIndex: 'status', key: 'status' },
]

const dataSource: Row[] = [
  { key: '1', name: '陈嘉', team: '平台', score: 92, status: '在岗' },
  { key: '2', name: '林悦', team: '交易', score: 88, status: '在岗' },
  { key: '3', name: '周野', team: '平台', score: 95, status: '休假' },
  { key: '4', name: '苏晚', team: '交易', score: 79, status: '在岗' },
]

const preset = ref<ThemePresetName>('antdv')
const locale = ref<LocaleName>('zh-CN')

// 应用级一般是 createVTableGuild({ themePreset }) 一次配好。
// 这里为了在同一页里对比两套皮肤，就地 provide 一个作用域 context：
// JS 侧的 tv slot class 走这个 context，CSS 侧的 token 走外层的 data-vtg-preset。
provide(
  VTABLE_GUILD_INJECTION_KEY,
  reactive({
    get themePreset() {
      return preset.value
    },
    get locale() {
      return locale.value
    },
    cssMode: 'prebuilt',
    classPrefix: 'vtg',
    theme: {},
    locales: {},
    localeOverrides: {},
  }) as VTableGuildContext,
)

const PRESETS: { value: ThemePresetName; label: string }[] = [
  { value: 'antdv', label: 'ant-design-vue' },
  { value: 'element-plus', label: 'element-plus' },
]
</script>

<template>
  <div :data-vtg-preset="preset">
    <div
      style="display: flex; gap: 16px; align-items: center; margin-bottom: 14px; flex-wrap: wrap"
    >
      <label
        v-for="item in PRESETS"
        :key="item.value"
        style="display: inline-flex; gap: 6px; align-items: center; font-size: 13px"
      >
        <input v-model="preset" type="radio" :value="item.value" />
        {{ item.label }}
      </label>

      <label style="display: inline-flex; gap: 6px; align-items: center; font-size: 13px">
        语言
        <select v-model="locale" style="font-size: 13px">
          <option value="zh-CN">zh-CN</option>
          <option value="en-US">en-US</option>
        </select>
      </label>
    </div>

    <VTable row-key="key" bordered :columns="columns" :data-source="dataSource" />

    <p style="margin-top: 12px; font-size: 13px; opacity: 0.7">
      同一套列定义与数据，切换预设后表头、边框、行高、排序图标全部跟着换；语言切换会影响筛选面板的
      「确定 / 重置」等内置文案。
    </p>
  </div>
</template>
