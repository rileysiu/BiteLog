<script setup>
defineProps({
  title: String,
  items: Array, // [{ name, sub, value }]
  emptyText: { type: String, default: '沒有資料' },
})
</script>

<template>
  <section class="card">
    <h2 class="card-title">
      <slot name="icon" />
      {{ title }}
    </h2>
    <p v-if="items.length === 0" class="empty">{{ emptyText }}</p>
    <div v-for="(item, i) in items" :key="i" class="row">
      <span class="num no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
      <div class="info">
        <div class="name">{{ item.name }}</div>
        <div class="sub">{{ item.sub }}</div>
      </div>
      <div class="num value">{{ item.value }}</div>
    </div>
  </section>
</template>

<style scoped>
.card { background: #FFFFFF; border-radius: 24px; padding: 18px 22px 8px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 900; margin: 0 0 6px; }
.empty { font-size: 13px; color: var(--muted); margin: 0 0 12px; }
.row { display: flex; align-items: center; gap: 12px; min-height: 56px; border-top: 1px solid var(--line); }
.no { width: 28px; height: 28px; border-radius: 14px; background: var(--track); color: var(--muted); font-size: 13px; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.no.top { background: var(--primary); color: var(--on-primary); }
.info { flex: 1; min-width: 0; }
.name { font-size: 14px; font-weight: 500; }
.sub { font-size: 12px; color: var(--muted); margin-top: 2px; }
.value { font-size: 15px; font-weight: 900; white-space: nowrap; }
</style>