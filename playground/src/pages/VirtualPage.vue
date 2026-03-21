<script setup lang="ts">
import { computed, ref } from 'vue'
import { VTable } from '@vtable-guild/table'
import type { ColumnsType } from '@vtable-guild/table'

interface VirtualRow {
  key: number
  name: string
  age: number
  score: number
  city: string
  region: string
  team: string
  manager: string
  office: string
  notes: string
  address: string
}

// Generate 10000 rows
const cities = ['New York', 'Chicago', 'London', 'Paris', 'Sydney', 'Tokyo', 'Berlin', 'Toronto']
const regions = ['North America', 'Europe', 'APAC']
const teams = ['Platform', 'Commerce', 'Design Systems', 'Operations']
const managers = ['Ava Quinn', 'Noah Reed', 'Mila Hart', 'Ethan Cole', 'Ivy Stone']
const offices = ['Guild Tower', 'Harbour Lab', 'Pattern Block', 'Signal Hub']
const bigData = computed<VirtualRow[]>(() => {
  const rows: VirtualRow[] = []
  for (let i = 0; i < 10000; i++) {
    rows.push({
      key: i,
      name: `User ${i + 1}`,
      age: 20 + (i % 40),
      score: 50 + (i % 50),
      city: cities[i % cities.length],
      region: regions[i % regions.length],
      team: teams[i % teams.length],
      manager: managers[i % managers.length],
      office: `${offices[i % offices.length]} ${(i % 12) + 1}`,
      notes: `Large viewport regression row ${i + 1}, validate horizontal + vertical sync with fixed columns.`,
      address: `Address Line ${i + 1}, Building ${(i % 99) + 1}`,
    })
  }
  return rows
})

// Basic columns
const basicColumns: ColumnsType<VirtualRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80, align: 'right' },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
  { title: 'City', dataIndex: 'city', key: 'city', width: 120 },
  { title: 'Address', dataIndex: 'address', key: 'address' },
]

// Fixed columns for case 02
const fixedColumns: ColumnsType<VirtualRow> = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 160, fixed: 'left' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 90, align: 'right' },
  { title: 'Score', dataIndex: 'score', key: 'score', width: 100, align: 'right' },
  { title: 'City', dataIndex: 'city', key: 'city', width: 140 },
  { title: 'Region', dataIndex: 'region', key: 'region', width: 180 },
  { title: 'Team', dataIndex: 'team', key: 'team', width: 180 },
  { title: 'Manager', dataIndex: 'manager', key: 'manager', width: 220 },
  { title: 'Office', dataIndex: 'office', key: 'office', width: 220 },
  { title: 'Notes', dataIndex: 'notes', key: 'notes', width: 420 },
  { title: 'Address', dataIndex: 'address', key: 'address', width: 320, fixed: 'right' },
]

const rowCount = ref(10000)
const displayData = computed(() => bigData.value.slice(0, rowCount.value))
</script>

<template>
  <main class="play-page">
    <section class="play-hero">
      <div class="play-hero__copy">
        <p class="play-kicker">Phase 6 Virtual Scrolling</p>
        <h1>虚拟滚动验证</h1>
        <p class="play-summary">验证万级数据量下的虚拟滚动性能，确保滚动流畅且不影响现有功能。</p>
      </div>
    </section>

    <!-- Case 01: Basic virtual scroll -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 01</p>
          <h2>基础虚拟滚动 ({{ rowCount.toLocaleString() }} 行)</h2>
        </div>
        <p class="play-case__desc">virtual + scroll.y，仅渲染可见行</p>
      </header>
      <div class="play-toolbar">
        <button type="button" class="play-ghost-button" @click="rowCount = 1000">1,000 行</button>
        <button type="button" class="play-ghost-button" @click="rowCount = 10000">10,000 行</button>
      </div>
      <VTable
        :data-source="displayData"
        :columns="basicColumns"
        :scroll="{ y: 400 }"
        :virtual="true"
        size="md"
        row-key="key"
      />
    </section>

    <!-- Case 02: Virtual + fixed columns -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 02</p>
          <h2>虚拟滚动 + 固定列</h2>
        </div>
        <p class="play-case__desc">
          10,000 行 + 固定左右列，默认应出现横向滚动，验证横向/纵向联动与固定列稳定性
        </p>
      </header>
      <VTable
        :data-source="bigData"
        :columns="fixedColumns"
        :scroll="{ y: 400 }"
        :virtual="true"
        size="md"
        row-key="key"
      />
    </section>

    <!-- Case 03: Non-virtual baseline -->
    <section class="play-case">
      <header class="play-case__header">
        <div>
          <p class="play-case__index">Case 03</p>
          <h2>非虚拟基线对照 (50 行)</h2>
        </div>
        <p class="play-case__desc">不开启 virtual 的正常 scroll.y 表格，回归验证现有功能</p>
      </header>
      <VTable
        :data-source="bigData.slice(0, 50)"
        :columns="basicColumns"
        :scroll="{ y: 300 }"
        size="md"
        row-key="key"
      />
    </section>
  </main>
</template>
