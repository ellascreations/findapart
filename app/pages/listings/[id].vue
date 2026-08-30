<script setup lang="ts">
const route = useRoute()
const listing = { id: route.params.id, title: 'Left Front Door Assembly', vehicle: '2021 Toyota Hilux SR5 Dual Cab 2.8L Diesel', condition: 'Used - Excellent', price: 850, oem: '67002-0K151', colour: 'Glacier White', seller: 'Demo Auto Recyclers', location: 'Melbourne, VIC, Australia', freight: 'Pickup, Australia-wide freight', description: 'Complete left front door shell with glass and regulator. Minor storage marks only.' }
</script>
<template>
  <section class="section"><div class="container grid grid-2">
    <div class="card" style="min-height:440px;display:grid;place-items:center;color:#617891;font-size:72px;">◫</div>
    <div><div class="badge">{{ listing.condition }}</div><h1 class="page-title" style="margin-top:14px;">{{ listing.title }}</h1><p class="muted" style="font-size:18px;">{{ listing.vehicle }}</p><div style="font-size:42px;font-weight:950;margin:20px 0;">${{ listing.price }} AUD</div>
      <div class="card" style="padding:20px;"><div class="grid grid-2"><div><span class="muted">OEM / Part No.</span><br><strong>{{ listing.oem }}</strong></div><div><span class="muted">Colour</span><br><strong>{{ listing.colour }}</strong></div><div><span class="muted">Seller</span><br><strong>{{ listing.seller }}</strong></div><div><span class="muted">Location</span><br><strong>{{ listing.location }}</strong></div></div><hr style="margin:18px 0;"><div class="muted">{{ listing.freight }}</div></div>
      <p style="line-height:1.7;">{{ listing.description }}</p><div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn btn-primary">Contact Supplier</button><button class="btn btn-secondary">Save Part</button></div>
    </div>
  </div></section>
</template>
