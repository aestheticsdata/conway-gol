import { APP_TEXTS } from "@texts";
import { createButton } from "@ui/components/button/createButton";

export function createLoginView(): string {
  return `
    <section class="auth-screen">
      <div class="auth-screen__grid"></div>
      <div class="auth-card">
        <div class="auth-card__eyebrow">Conway's Game of Life</div>
        <h1 class="auth-card__title auth-card__title--studio">
          <div class="studio-brand" aria-hidden="true">
            <span class="workspace-brand__mark" aria-hidden="true"></span>
            <strong class="workspace-brand__title">${APP_TEXTS.workspace.studioTitle}</strong>
          </div>
        </h1>
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
          ${createButton({ type: "submit", className: "auth-login-submit", label: "Enter Simulation", size: "compact" })}
        </form>
      </div>
    </section>
  `;
}
