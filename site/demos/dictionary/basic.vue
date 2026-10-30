<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Button,
  VTable,
  createTableDictionary,
  useTableDictionary,
  type TableColumnsType,
} from '@vtable-guild/vtable-guild'
const calls = ref(0)
const keyword = ref('')
const dictionary = createTableDictionary({
  key: 'member-status',
  async request(_params, { keyword }) {
    calls.value++
    await new Promise<void>((resolve) => setTimeout(resolve, 200))
    const options = [
      { value: 1, label: '启用', status: 'success' as const },
      { value: 0, label: '停用', status: 'default' as const },
    ]
    return { options: options.filter((item) => item.label.includes(keyword)), complete: !keyword }
  },
})
// Two consumers share one pending load and completed cache entry.
const display = useTableDictionary({ dictionary })
const choices = useTableDictionary({ dictionary, debounceTime: 200 })
const { options, loading } = choices
const columns = computed<TableColumnsType<{ key: number; status: number }>>(() => [
  { dataIndex: 'key', title: '编号' },
  {
    dataIndex: 'status',
    title: '状态',
    valueEnum: display.valueEnum.value,
    filters: display.filters.value,
  },
])
</script>
<template>
  <div class="dictionary-demo">
    <form @submit.prevent="choices.search(keyword)">
      <label>搜索选项 <input v-model="keyword" placeholder="输入启用或停用" /></label>
      <Button type="primary" :loading="loading" @click="choices.search(keyword)">搜索</Button>
      <span>共请求 {{ calls }} 次</span>
    </form>
    <p>候选项：{{ options.map((option) => option.label).join('、') || '无匹配项' }}</p>
    <VTable
      :columns="columns"
      :data-source="[
        { key: 1, status: 1 },
        { key: 2, status: 0 },
      ]"
    />
  </div>
</template>
<style scoped>
.dictionary-demo form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dictionary-demo input {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}
</style>
