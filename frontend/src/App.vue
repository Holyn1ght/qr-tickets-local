<template>
  <div class="layout">
    <header class="header">
      <h1>QR Tickets</h1>
      <nav class="nav">
        <RouterLink to="/admin/tickets">Tickets</RouterLink>
        <RouterLink to="/scan">Scan</RouterLink>
      </nav>
    </header>
    <main class="page">
      <RouterView />
    </main>
  </div>
</template>
