<template>
  <div>
    <AppHeader />
    <main><slot /></main>
    <footer class="section" style="padding-top:30px;border-top:1px solid var(--line);margin-top:40px;">
      <div class="container" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;">
        <div><strong>Find a Part</strong><div class="muted">Every Part. Everywhere.</div></div>
        <div class="muted">Marketplace MVP</div>
      </div>
    </footer>
  </div>
</template>
