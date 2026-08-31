<template>
  <div class="app-shell">
    <AppSidebar />

    <div class="app-content">
      <main class="app-main"><slot /></main>

      <footer class="section site-footer">
        <div class="container footer-inner">
          <div class="footer-brand">
            <img src="/brand/find-a-part-mark.webp" alt="" class="footer-logo-mark">
            <div>
              <strong>FIND <span>A</span> PART</strong>
              <div class="muted">Parts. People. Solutions.</div>
            </div>
          </div>
          <div class="muted">Global automotive parts marketplace</div>
        </div>
      </footer>
    </div>
  </div>
</template>
