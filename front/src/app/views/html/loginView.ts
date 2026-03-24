export function createLoginView(): string {
  return `
    <section class="auth-screen">
      <div class="auth-screen__grid"></div>
      <div class="auth-card">
        <div class="auth-card__eyebrow">Portfolio Demo</div>
        <h1 class="auth-card__title">Login to Conway</h1>
        <p class="auth-card__copy">
          Fake auth for now. This route validates the client-side router,
          the future connected mode, and the app shell separation.
        </p>
        <form class="auth-form">
          <label class="auth-field">
            <span>Email</span>
            <input type="email" name="email" placeholder="you@example.com" value="demo@conway.local">
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input type="password" name="password" placeholder="••••••••" value="demo-password">
          </label>
          <button type="submit" class="auth-submit">Enter Simulation</button>
        </form>
      </div>
    </section>
  `;
}
