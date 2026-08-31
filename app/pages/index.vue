<script setup lang="ts">
const quick = reactive({ vehicle_id: null as string|null, part: '' })
const submit = () => {
  const query: Record<string, string> = {}
  if (isValidUuid(quick.vehicle_id)) query.vehicle = quick.vehicle_id
  if (quick.part.trim()) query.part = quick.part.trim()
  return navigateTo({ path: '/search', query })
}
</script>

<template>
  <section class="section home-hero">
    <div class="container grid grid-2 home-hero-grid">
      <div class="home-hero-copy">
        <img src="/brand/find-a-part-logo.webp" alt="Find a Part - Parts. People. Solutions." class="home-logo">
        <div class="kicker">Global automotive parts network</div>
        <h1 class="title">Find the part.<br><span>Fix the car.</span></h1>
        <p class="muted home-intro">Search new, used, refurbished and aftermarket parts from suppliers and recyclers around the world.</p>
        <div class="hero-actions">
          <NuxtLink to="/search" class="btn btn-primary">Search for a Part</NuxtLink>
          <NuxtLink to="/supplier/parts/new" class="btn btn-secondary">List a Part</NuxtLink>
        </div>
      </div>

      <form class="card hero-search-card" @submit.prevent="submit">
        <div class="kicker">Quick vehicle search</div>
        <h2>What are you repairing?</h2>
        <VehicleSelector v-model="quick.vehicle_id" required />
        <div style="margin-top:16px;">
          <label class="label">Part</label>
          <input v-model="quick.part" class="input" placeholder="Left front door">
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:18px;">Find Matching Parts</button>
      </form>
    </div>
  </section>

  <section class="section home-workflows">
    <div class="container">
      <div class="kicker">Built for the trade</div>
      <h2 class="page-title" style="margin-top:8px;">One platform, three powerful workflows</h2>
      <div class="grid grid-3" style="margin-top:24px;">
        <div class="card workflow-card"><div class="workflow-icon">R</div><h3>Repairers</h3><p class="muted">Search inventory, compare suppliers and create wanted-part requests.</p></div>
        <div class="card workflow-card"><div class="workflow-icon">S</div><h3>Suppliers</h3><p class="muted">List inventory, manage enquiries and respond to wanted requests.</p></div>
        <div class="card workflow-card"><div class="workflow-icon">A</div><h3>Find a Part Admin</h3><p class="muted">Approve companies, moderate listings and maintain the vehicle catalogue.</p></div>
      </div>
    </div>
  </section>
</template>
