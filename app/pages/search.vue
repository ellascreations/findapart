<script setup lang="ts">
const route = useRoute()
const filters = reactive({
  keyword: String(route.query.part || ''), year: String(route.query.year || ''), make: String(route.query.make || ''), model: String(route.query.model || ''), condition: '', country: ''
})
const listings = [
  { id: 1, title: 'Left Front Door Assembly', vehicle: '2021 Toyota Hilux SR5', condition: 'Used - Excellent', price: 850, seller: 'Demo Auto Recyclers', location: 'Melbourne, Australia', stock: 1 },
  { id: 2, title: 'Front Bumper Bar', vehicle: '2020 Ford Ranger PX3', condition: 'Used - Good', price: 620, seller: 'Global Parts Demo', location: 'Sydney, Australia', stock: 2 },
  { id: 3, title: 'LED Headlamp - LH', vehicle: '2022 Mazda CX-5', condition: 'Refurbished', price: 540, seller: 'Metro Auto Parts', location: 'Brisbane, Australia', stock: 1 }
]
</script>

<template>
  <section class="section">
    <div class="container">
      <div class="kicker">Marketplace search</div><h1 class="page-title" style="margin-top:8px;">Find a Part</h1>
      <div class="card" style="padding:20px;margin-top:22px;">
        <div class="grid grid-3">
          <div><label class="label">Keyword / Part Number</label><input v-model="filters.keyword" class="input" placeholder="Door, bumper, 67002-0K151"></div>
          <div><label class="label">Year</label><input v-model="filters.year" class="input" placeholder="2021"></div>
          <div><label class="label">Make</label><input v-model="filters.make" class="input" placeholder="Toyota"></div>
          <div><label class="label">Model</label><input v-model="filters.model" class="input" placeholder="Hilux"></div>
          <div><label class="label">Condition</label><select v-model="filters.condition" class="select"><option value="">Any</option><option>New</option><option>Used</option><option>Refurbished</option><option>Aftermarket</option></select></div>
          <div><label class="label">Country</label><input v-model="filters.country" class="input" placeholder="Australia"></div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:28px 0 16px;gap:15px;flex-wrap:wrap;"><strong>{{ listings.length }} demo matches</strong><NuxtLink to="/repairer/wanted/new" class="btn btn-secondary">Can't find it? Create Wanted Request</NuxtLink></div>
      <div class="grid grid-3">
        <NuxtLink v-for="item in listings" :key="item.id" :to="`/listings/${item.id}`" class="card" style="overflow:hidden;">
          <div style="height:180px;background:linear-gradient(135deg,#132a45,#091728);display:grid;place-items:center;color:#68809b;font-size:50px;">◫</div>
          <div style="padding:18px;"><div class="badge">{{ item.condition }}</div><h3>{{ item.title }}</h3><div class="muted">{{ item.vehicle }}</div><div style="font-size:28px;font-weight:900;margin:18px 0 8px;">${{ item.price }} AUD</div><div class="muted">{{ item.seller }} · {{ item.location }}</div></div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
