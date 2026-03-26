export function createLoginView(): string {
  return `
    <section class="auth-screen">
      <div class="auth-screen__grid"></div>
      <div class="auth-card">
        <div class="auth-card__eyebrow">Conway's Game of Life</div>
        <h1 class="auth-card__title">Login</h1>
        <p class="auth-card__copy">
          Conway's Game of Life is a cellular automaton where simple rules govern the birth and death of cells on a grid, creating complex, evolving patterns from chaos.
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
