<template>
  <div>
    <AppHeader />
    <PortalNav />
    <main><slot /></main>
    <footer class="section site-footer">
      <div class="container footer-inner">
        <div><strong>Find a Part</strong><div class="muted">Every Part. Everywhere.</div></div>
        <div class="muted">Global automotive parts marketplace</div>
      </div>
    </footer>
  </div>
</template>
