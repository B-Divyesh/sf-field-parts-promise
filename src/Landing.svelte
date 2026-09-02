<script lang="ts">
  import { onMount } from 'svelte';

  import BlueprintHero from './lib/components/BlueprintHero.svelte';
  import './landing.css';

  export let openWorkspace: (path: string) => void;

  let theme: 'light' | 'dark' = 'light';

  onMount(() => {
    theme =
      localStorage.getItem('parts-promise-theme') === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  });

  function changeTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('parts-promise-theme', theme);
    document.documentElement.dataset.theme = theme;
  }

  function follow(event: MouseEvent, path: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    openWorkspace(path);
  }
</script>

<a class="skip-link" href="#main">Skip to main content</a>

<header class="site-header">
  <a class="wordmark" href="/">Parts Promise</a>
  <nav aria-label="Main navigation">
    <a href="/?demo=1" on:click={(event) => follow(event, '/?demo=1')}>Demo</a>
    <a href="/jobs" on:click={(event) => follow(event, '/jobs')}>Jobs</a>
    <a href="/privacy" on:click={(event) => follow(event, '/privacy')}
      >Privacy</a
    >
  </nav>
  <a
    class="account-button"
    href="/?signin=1"
    on:click={(event) => follow(event, '/?signin=1')}>Sign in</a
  >
  <button
    class="theme-toggle"
    type="button"
    aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}
    on:click={changeTheme}
    >Use {theme === 'light' ? 'dark' : 'light'} theme</button
  >
</header>

<main id="main" tabindex="-1">
  <section class="landing-hero" aria-labelledby="landing-title">
    <div class="hero-copy">
      <p class="drawing-label">Allocate parts to a job</p>
      <h1 id="landing-title" tabindex="-1">
        Promise dates from parts held for the job
      </h1>
      <p class="hero-summary">
        For small trade firms that need a parts check before agreeing a visit
        date.
      </p>
      <div class="hero-actions">
        <a
          class="button"
          href="/?demo=1"
          on:click={(event) => follow(event, '/?demo=1')}
          >Try it with sample data</a
        ><span>Opens Riverside Dental with one missing pump.</span>
      </div>
      <ul class="plain-facts">
        <li>
          The sample job and allocation work offline after your first visit.
        </li>
        <li>Sample changes stay in this browser.</li>
        <li>The firm plan is $39/month plus $8 per active technician.</li>
      </ul>
    </div>
    <BlueprintHero />
  </section>

  <section class="preview-section" aria-labelledby="preview-title">
    <div>
      <p class="drawing-label">Sample job status</p>
      <h2 id="preview-title">See why a visit date is at risk</h2>
      <p>
        RD-1042 needs one condensate pump. The job stays at risk until a source
        holds it.
      </p>
      <a href="/?demo=1" on:click={(event) => follow(event, '/?demo=1')}
        >Open the sample job</a
      >
    </div>
    <article class="job-preview">
      <p>RD-1042 · Riverside Dental</p>
      <strong>Date at risk</strong><span>Condensate pump needs 1 each.</span>
    </article>
  </section>

  <section class="how-section" aria-labelledby="how-title">
    <p class="drawing-label">How it works</p>
    <h2 id="how-title">Check parts before agreeing a visit date</h2>
    <ol>
      <li>
        <strong>List required parts</strong><span
          >Add each required part to the job.</span
        >
      </li>
      <li>
        <strong>Allocate each part</strong><span
          >Allocate it from a van or warehouse source.</span
        >
      </li>
      <li>
        <strong>Review the visit date</strong><span
          >Read the reason before you agree the visit date.</span
        >
      </li>
    </ol>
  </section>

  <section class="plain-language-section" aria-labelledby="privacy-title">
    <h2 id="privacy-title">What this release does not do</h2>
    <p>
      It does not place supplier orders. The sample stays separate from
      signed-in firm workspaces.
    </p>
    <a href="/privacy" on:click={(event) => follow(event, '/privacy')}
      >Read how local data works</a
    >
  </section>
  <section class="pricing-section" aria-labelledby="pricing-title">
    <p class="drawing-label">Firm plan</p>
    <h2 id="pricing-title">Firm plan pricing</h2>
    <p>
      The firm plan costs $39 each month. Each active technician costs $8 each
      month. The owner is included in the $39 base price and does not use a
      technician seat.
    </p>
    <p>Checkout is not available yet. No charge will start.</p>
    <a href="/onboarding" on:click={(event) => follow(event, '/onboarding')}
      >Set up your firm</a
    >
  </section>
</main>

<footer class="site-footer">
  <p>Promise job dates from parts held for the job.</p>
  <div>
    <a href="/privacy" on:click={(event) => follow(event, '/privacy')}
      >Privacy</a
    >
    <a href="/terms" on:click={(event) => follow(event, '/terms')}>Terms</a>
    <a href="https://sociobot.in" rel="external"
      >Built by Param Factory (external site)</a
    >
  </div>
  <small title={__BUILD_SHA__}
    >Build {(__BUILD_SHA__ || 'dev').slice(0, 8)}</small
  >
</footer>
