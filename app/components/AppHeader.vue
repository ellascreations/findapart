<script setup lang="ts">
const route = useRoute()
const nav = [
  { to: '/search', label: 'Find Parts' },
  { to: '/repairer/dashboard', label: 'Repairer' },
  { to: '/supplier/dashboard', label: 'Supplier' },
  { to: '/admin', label: 'Admin' }
]
</script>

<template>
  <header style="position:sticky;top:0;z-index:20;background:rgba(7,17,31,.92);backdrop-filter:blur(14px);border-bottom:1px solid var(--line);">
    <div class="container" style="min-height:76px;display:flex;align-items:center;gap:22px;">
      <NuxtLink to="/" style="display:flex;align-items:center;gap:12px;font-weight:950;font-size:22px;margin-right:auto;">
        <span style="width:38px;height:38px;border-radius:12px;background:var(--accent);color:#111827;display:grid;place-items:center;font-weight:950;">F</span>
        FIND A PART
      </NuxtLink>
      <nav style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
        <NuxtLink v-for="item in nav" :key="item.to" :to="item.to" class="btn" :class="route.path.startsWith(item.to) ? 'btn-primary' : 'btn-secondary'" style="min-height:38px;padding:0 12px;">
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>
