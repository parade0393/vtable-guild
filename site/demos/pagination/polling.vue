<script setup lang="ts">
import { ref } from 'vue'
import { Button, VTable, useTableRequest, type TableColumnsType } from '@vtable-guild/vtable-guild'
const calls = ref(0)
const table = useTableRequest<{ key: number; name: string; progress: number }>({
  polling: (rows) => (rows[0]?.progress === 100 ? false : 3000),
  revalidateOnFocus: true,
  async request() {
    calls.value++
    await new Promise<void>((resolve) => setTimeout(resolve, 300))
    return {
      data: [{ key: 1, name: '生成月度报表', progress: Math.min(100, calls.value * 20) }],
      total: 1,
    }
  },
})
const { dataSource, loading, refreshing, paused } = table
const columns: TableColumnsType<{ key: number; name: string; progress: number }> = [
  { dataIndex: 'name', title: '任务' },
  { dataIndex: 'progress', title: '进度', valueType: 'progress', width: 240 },
]
</script>
<template>
  <div>
    <p>
      <Button @click="paused ? table.resume(true) : table.pause()">{{
        paused ? '恢复' : '暂停'
      }}</Button>
      <span role="status">
        {{ refreshing ? '正在更新' : `已请求 ${calls} 次，完成后停止轮询` }}</span
      >
    </p>
    <VTable :columns="columns" :data-source="dataSource" :loading="loading" />
  </div>
</template>
