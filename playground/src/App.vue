<!-- src/App.vue -->
<script setup lang="ts">
import { useTheme } from '@vtable-guild/core'
import { tableTheme } from '@vtable-guild/theme'

// 模拟组件 props
const props = {
  size: 'md' as const,
  bordered: false,
  striped: true,
  hoverable: true,
  // Layer 3: 实例级 ui 覆盖
  ui: {
    th: 'text-primary', // 覆盖 th 的文本颜色
  },
  class: 'my-8 rounded-lg overflow-hidden', // class prop 作用于 root
}

const { slots } = useTheme('table', tableTheme, props)

const columns = ['Name', 'Email', 'Role']
const data = [
  { name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'User' },
  { name: 'Carol', email: 'carol@example.com', role: 'User' },
]
</script>

<template>
  <div class="p-8 bg-surface min-h-screen">
    <h1 class="text-2xl font-bold text-on-surface mb-4">Theme System Verification</h1>

    <div :class="slots.root()">
      <div :class="slots.wrapper()">
        <table :class="slots.table()">
          <thead :class="slots.thead()">
            <tr :class="slots.tr()">
              <th v-for="col in columns" :key="col" :class="slots.th()">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody :class="slots.tbody()">
            <tr v-for="row in data" :key="row.email" :class="slots.tr()">
              <td :class="slots.td()">{{ row.name }}</td>
              <td :class="slots.td()">{{ row.email }}</td>
              <td :class="slots.td()">{{ row.role }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 调试：展示各 slot 的最终 class -->
    <details class="mt-8">
      <summary class="cursor-pointer text-muted">Show slot classes</summary>
      <pre class="mt-2 p-4 bg-elevated rounded text-xs overflow-auto">{{
        JSON.stringify(
          Object.fromEntries(Object.entries(slots).map(([k, fn]) => [k, fn()])),
          null,
          2,
        )
      }}</pre>
    </details>
  </div>
</template>
