<script lang="ts">
  import { onMount, tick } from 'svelte';

  import BlueprintHero from './lib/components/BlueprintHero.svelte';
  import StatusPlate from './lib/components/StatusPlate.svelte';
  import { DEMO_JOB_ID } from './lib/domain/fixture';
  import {
    allocationsForRequirement,
    availableQuantity,
    coveredQuantity,
    formatQuantity,
    promiseStatus,
    reorderSuggestions,
    sourcesForRequirement
  } from './lib/domain/rules';
  import {
    addAllocation,
    addRequirement,
    addSource,
    removeAllocation
  } from './lib/domain/workspace';
  import type {
    Allocation,
    Job,
    PartRequirement,
    SourceType,
    SupplierConfidence,
    Workspace
  } from './lib/domain/types';
  import {
    deleteWorkspace,
    loadWorkspace,
    resetDemo,
    saveWorkspace,
    type WorkspaceMode
  } from './lib/storage/workspace-db';

  type Page = 'home' | 'jobs' | 'job' | 'privacy' | 'terms' | 'not-found';

  let currentPath = '/';
  let demo = false;
  let workspace: Workspace | null = null;
  let loading = true;
  let storageError = '';
  let toast = '';
  let online = true;
  let theme: 'light' | 'dark' = 'light';
  let resetPending = false;
  let exitPending = false;
  let showAddJob = false;
  let showEditJob = false;
  let showPartForm = false;
  let showSourceForm = false;
  let showSupplierForm = false;
  let allocationRequirementId = '';
  let allocationSourceId = '';
  let allocationQuantity = 1;
  let formError = '';

  let jobNumber = '';
  let jobSite = '';
  let jobDate = '';
  let jobPart = '';
  let jobQuantity = 1;
  let jobUnit = 'each';
  let partDescription = '';
  let partQuantity = 1;
  let partUnit = 'each';
  let sourceName = '';
  let sourceType: SourceType = 'van';
  let sourcePart = '';
  let sourceQuantity = 1;
  let sourceMinimum = 0;
  let supplierReference = '';
  let supplierDate = '';
  let supplierConfidence: SupplierConfidence = 'Confirmed by supplier';

  $: page = getPage(currentPath, demo);
  $: activeJobId = page === 'job' ? jobIdFromPath(currentPath, demo) : '';
  $: activeJob = workspace?.jobs.find((job) => job.id === activeJobId);
  $: metadata = pageMetadata(page, activeJob);
  $: activeStatus =
    activeJob && workspace ? promiseStatus(workspace, activeJob) : undefined;
  $: suggestions = workspace ? reorderSuggestions(workspace) : [];
  $: document.documentElement.dataset.theme = theme;

  onMount(() => {
    const updateRoute = () => {
      currentPath = window.location.pathname;
      demo =
        new URLSearchParams(window.location.search).get('demo') === '1' ||
        currentPath === '/demo';
      void loadCurrentWorkspace();
      void focusPageHeading();
    };
    const updateOnline = () => (online = navigator.onLine);
    currentPath = window.location.pathname;
    demo =
      new URLSearchParams(window.location.search).get('demo') === '1' ||
      currentPath === '/demo';
    online = navigator.onLine;
    const storedTheme = localStorage.getItem('parts-promise-theme');
    theme = storedTheme === 'dark' ? 'dark' : 'light';
    void loadCurrentWorkspace();
    window.addEventListener('popstate', updateRoute);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('popstate', updateRoute);
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  });

  function getPage(path: string, inDemo: boolean): Page {
    if ((path === '/' && inDemo) || path === '/demo') return 'job';
    if (path === '/') return 'home';
    if (path === '/jobs') return 'jobs';
    if (path.startsWith('/jobs/')) return 'job';
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    return 'not-found';
  }

  function jobIdFromPath(path: string, inDemo: boolean): string {
    if ((path === '/' && inDemo) || path === '/demo') return DEMO_JOB_ID;
    return path.split('/')[2] ?? '';
  }

  function pageMetadata(currentPage: Page, job?: Job) {
    if (currentPage === 'jobs')
      return {
        title: 'Jobs — Parts Promise',
        description: 'Jobs and their parts status.'
      };
    if (currentPage === 'job' && demo && currentPath === '/')
      return {
        title: 'Demo — Parts Promise',
        description: 'Sample job card for Parts Promise.'
      };
    if (currentPage === 'job')
      return {
        title: `${job?.number ?? 'Job'} parts — Parts Promise`,
        description: 'Parts held for this job.'
      };
    if (currentPage === 'privacy')
      return {
        title: 'Privacy — Parts Promise',
        description: 'How Parts Promise handles local data.'
      };
    if (currentPage === 'terms')
      return {
        title: 'Terms — Parts Promise',
        description: 'Terms for using Parts Promise.'
      };
    if (currentPage === 'not-found')
      return {
        title: 'Page not found — Parts Promise',
        description: 'The requested Parts Promise page is not available.'
      };
    return {
      title: 'Parts Promise — Hold parts for each job',
      description: 'Promise job dates from parts held for the job.'
    };
  }

  function mode(): WorkspaceMode {
    return demo ? 'demo' : 'live';
  }

  async function loadCurrentWorkspace() {
    loading = true;
    storageError = '';
    try {
      workspace = await loadWorkspace(mode());
    } catch (error) {
      workspace = null;
      storageError =
        error instanceof Error
          ? error.message
          : 'Local storage could not be opened.';
    } finally {
      loading = false;
    }
  }

  async function commit(next: Workspace, message: string) {
    workspace = next;
    try {
      await saveWorkspace(mode(), next);
      toast = message;
    } catch (error) {
      storageError =
        error instanceof Error
          ? error.message
          : 'Local changes could not be saved.';
    }
  }

  function href(path: string): string {
    if (!demo || path.includes('demo=1')) return path;
    return `${path}${path.includes('?') ? '&' : '?'}demo=1`;
  }

  function navigate(path: string) {
    history.pushState({}, '', path);
    currentPath = window.location.pathname;
    demo =
      new URLSearchParams(window.location.search).get('demo') === '1' ||
      currentPath === '/demo';
    void loadCurrentWorkspace();
    void focusPageHeading();
  }

  function follow(event: MouseEvent, path: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
      return;
    event.preventDefault();
    navigate(path);
  }

  async function focusPageHeading() {
    await tick();
    window.setTimeout(
      () => document.querySelector<HTMLElement>('main h1')?.focus(),
      0
    );
  }

  function changeTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('parts-promise-theme', theme);
  }

  async function confirmReset() {
    workspace = await resetDemo();
    resetPending = false;
    allocationRequirementId = '';
    toast = 'The sample job is back to its starting state.';
  }

  async function confirmExitDemo() {
    await deleteWorkspace('demo');
    exitPending = false;
    navigate('/jobs');
    toast =
      'You are in an empty local workspace. Sample changes were discarded.';
  }

  function requirementsFor(job: Job): PartRequirement[] {
    return (
      workspace?.requirements.filter(
        (requirement) => requirement.jobId === job.id
      ) ?? []
    );
  }

  function openAllocation(requirement: PartRequirement) {
    if (!workspace) return;
    allocationRequirementId = requirement.id;
    const source = sourcesForRequirement(workspace, requirement).find(
      (item) =>
        item.type === 'supplier_order' ||
        availableQuantity(workspace!, item.id) > 0
    );
    allocationSourceId = source?.id ?? '';
    allocationQuantity = Math.max(
      1,
      requirement.quantity - coveredQuantity(workspace, requirement.id)
    );
    formError = '';
  }

  async function saveAllocation() {
    if (!workspace || !activeJob) return;
    const requirement = workspace.requirements.find(
      (item) => item.id === allocationRequirementId
    );
    const source = workspace.sources.find(
      (item) => item.id === allocationSourceId
    );
    if (!requirement || !source) {
      formError = 'Choose a source before allocating this part.';
      return;
    }
    const now = new Date().toISOString();
    const allocation: Allocation = {
      id: crypto.randomUUID(),
      jobId: activeJob.id,
      requirementId: requirement.id,
      sourceId: source.id,
      sourceName: source.name,
      kind: source.type === 'supplier_order' ? 'supplier_order' : 'on_hand',
      quantity: Number(allocationQuantity),
      unit: requirement.unit,
      updater: demo ? 'Field demo' : 'You',
      checkedAt: source.lastCheckedAt,
      createdAt: now
    };
    const result = addAllocation(workspace, allocation);
    if (result.error) {
      formError = result.error;
      return;
    }
    await commit(
      result.workspace,
      `${formatQuantity(allocation.quantity, allocation.unit)} from ${source.name} is held for ${activeJob.number}.`
    );
    allocationRequirementId = '';
    formError = '';
  }

  async function deallocate(allocationId: string) {
    if (!workspace) return;
    await commit(
      removeAllocation(workspace, allocationId),
      'The allocation was removed from this job.'
    );
  }

  async function undoLastAllocation() {
    if (!workspace?.lastActionAllocationId) return;
    await deallocate(workspace.lastActionAllocationId);
  }

  async function createJob() {
    if (
      !workspace ||
      !jobNumber.trim() ||
      !jobSite.trim() ||
      !jobDate ||
      !jobPart.trim() ||
      jobQuantity <= 0
    ) {
      formError =
        'Add a job number, site, visit date, required part, and quantity.';
      return;
    }
    const now = new Date().toISOString();
    const job: Job = {
      id: crypto.randomUUID(),
      number: jobNumber.trim(),
      site: jobSite.trim(),
      visitDate: jobDate,
      notes: '',
      createdAt: now,
      updatedAt: now
    };
    const requirement: PartRequirement = {
      id: crypto.randomUUID(),
      jobId: job.id,
      description: jobPart.trim(),
      unit: jobUnit.trim() || 'each',
      quantity: Number(jobQuantity)
    };
    const next: Workspace = structuredClone(workspace);
    next.jobs.push(job);
    next.requirements.push(requirement);
    await commit(next, `${job.number} was added to this device.`);
    showAddJob = false;
    formError = '';
    navigate(href(`/jobs/${job.id}`));
  }

  async function updateJob() {
    if (
      !workspace ||
      !activeJob ||
      !jobNumber.trim() ||
      !jobSite.trim() ||
      !jobDate
    ) {
      formError = 'Keep a job number, site, and visit date on the job card.';
      return;
    }
    const next = structuredClone(workspace);
    const job = next.jobs.find((item) => item.id === activeJob.id);
    if (!job) return;
    job.number = jobNumber.trim();
    job.site = jobSite.trim();
    job.visitDate = jobDate;
    job.updatedAt = new Date().toISOString();
    await commit(next, 'The job details were updated on this device.');
    showEditJob = false;
    formError = '';
  }

  function beginEditJob() {
    if (!activeJob) return;
    jobNumber = activeJob.number;
    jobSite = activeJob.site;
    jobDate = activeJob.visitDate;
    showEditJob = true;
    formError = '';
  }

  async function createPart() {
    if (
      !workspace ||
      !activeJob ||
      !partDescription.trim() ||
      partQuantity <= 0
    ) {
      formError = 'Add the required part, quantity, and unit.';
      return;
    }
    await commit(
      addRequirement(workspace, {
        id: crypto.randomUUID(),
        jobId: activeJob.id,
        description: partDescription.trim(),
        unit: partUnit.trim() || 'each',
        quantity: Number(partQuantity)
      }),
      'The required part was added.'
    );
    partDescription = '';
    partQuantity = 1;
    showPartForm = false;
    formError = '';
  }

  async function createSource() {
    if (
      !workspace ||
      !sourceName.trim() ||
      !sourcePart.trim() ||
      sourceQuantity < 0 ||
      sourceMinimum < 0
    ) {
      formError = 'Add a source name, part, available quantity, and minimum.';
      return;
    }
    await commit(
      addSource(workspace, {
        id: crypto.randomUUID(),
        name: sourceName.trim(),
        type: sourceType,
        partDescription: sourcePart.trim(),
        unit: partUnit.trim() || 'each',
        onHand: Number(sourceQuantity),
        minimum: Number(sourceMinimum),
        lastCheckedAt: new Date().toISOString(),
        lastCheckedBy: demo ? 'Field demo' : 'You'
      }),
      'The source is available for allocation.'
    );
    sourceName = '';
    sourcePart = '';
    sourceQuantity = 1;
    sourceMinimum = 0;
    showSourceForm = false;
    formError = '';
  }

  async function createSupplierEvidence() {
    if (
      !workspace ||
      !activeJob ||
      !supplierReference.trim() ||
      !supplierDate ||
      !allocationRequirementId
    ) {
      formError =
        'Choose a required part, add the supplier reference, and add its expected date.';
      return;
    }
    const requirement = workspace.requirements.find(
      (item) => item.id === allocationRequirementId
    );
    if (!requirement) return;
    const now = new Date().toISOString();
    const sourceId = crypto.randomUUID();
    const source = {
      id: sourceId,
      name: `Supplier order ${supplierReference.trim()}`,
      type: 'supplier_order' as const,
      partDescription: requirement.description,
      unit: requirement.unit,
      onHand: Number(allocationQuantity),
      minimum: 0,
      lastCheckedAt: now,
      lastCheckedBy: demo ? 'Field demo' : 'You',
      supplierOrder: {
        reference: supplierReference.trim(),
        expectedDate: supplierDate,
        confidence: supplierConfidence
      }
    };
    const next = addSource(workspace, source);
    const allocationResult = addAllocation(next, {
      id: crypto.randomUUID(),
      jobId: activeJob.id,
      requirementId: requirement.id,
      sourceId,
      sourceName: source.name,
      kind: 'supplier_order',
      quantity: Number(allocationQuantity),
      unit: requirement.unit,
      updater: demo ? 'Field demo' : 'You',
      checkedAt: now,
      createdAt: now
    });
    if (allocationResult.error) {
      formError = allocationResult.error;
      return;
    }
    await commit(
      allocationResult.workspace,
      `Supplier evidence ${supplierReference.trim()} was attached to ${requirement.description}.`
    );
    showSupplierForm = false;
    supplierReference = '';
    supplierDate = '';
    formError = '';
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeZone: 'UTC'
    }).format(new Date(`${date}T12:00:00Z`));
  }

  function formatTime(value: string) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>{metadata.title}</title>
  <meta name="description" content={metadata.description} />
  <link
    rel="canonical"
    href={`https://field-parts-promise.sociobot.in${currentPath}`}
  />
</svelte:head>

<a class="skip-link" href="#main">Skip to main content</a>

<header class="site-header">
  <a class="wordmark" href="/" on:click={(event) => follow(event, '/')}
    >Parts Promise</a
  >
  <nav aria-label="Main navigation">
    <a
      href={href('/?demo=1')}
      on:click={(event) => follow(event, href('/?demo=1'))}>Demo</a
    >
    <a
      href={href('/jobs')}
      aria-current={page === 'jobs' || page === 'job' ? 'page' : undefined}
      on:click={(event) => follow(event, href('/jobs'))}>Jobs</a
    >
    <a
      href={href('/privacy')}
      aria-current={page === 'privacy' ? 'page' : undefined}
      on:click={(event) => follow(event, href('/privacy'))}>Privacy</a
    >
  </nav>
  <button
    class="theme-toggle"
    type="button"
    aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}
    on:click={changeTheme}
    >{theme === 'light' ? 'Night sheet' : 'Day sheet'}</button
  >
</header>

{#if demo}
  <aside class="demo-banner" aria-label="Demo workspace">
    <strong>Demo — sample data, nothing is saved to a firm.</strong>
    <span>Changes stay in this browser until you reset or leave.</span>
    <button type="button" on:click={() => (resetPending = true)}
      >Reset demo</button
    >
    <button
      class="quiet-button"
      type="button"
      on:click={() => (exitPending = true)}>Start for real</button
    >
  </aside>
{/if}

{#if !online}
  <aside class="offline-plate" role="status">
    Offline — changes are kept on this device.
  </aside>
{/if}

{#if resetPending}
  <dialog open aria-labelledby="reset-title">
    <h2 id="reset-title">Reset the sample job?</h2>
    <p>
      This removes sample changes and restores Riverside Dental exactly as
      shipped.
    </p>
    <div class="dialog-actions">
      <button class="button danger" type="button" on:click={confirmReset}
        >Reset demo</button
      ><button
        class="button secondary"
        type="button"
        on:click={() => (resetPending = false)}>Keep changes</button
      >
    </div>
  </dialog>
{/if}

{#if exitPending}
  <dialog open aria-labelledby="exit-title">
    <h2 id="exit-title">Leave the sample workspace?</h2>
    <p>
      Sample changes are discarded. Your new local workspace starts empty and
      never includes the demo records.
    </p>
    <div class="dialog-actions">
      <button class="button danger" type="button" on:click={confirmExitDemo}
        >Leave demo</button
      ><button
        class="button secondary"
        type="button"
        on:click={() => (exitPending = false)}>Stay in demo</button
      >
    </div>
  </dialog>
{/if}

<main id="main" tabindex="-1">
  <p class="sr-only" aria-live="polite">{metadata.title}</p>

  {#if storageError}
    <section class="error-sheet" role="alert">
      <h1 tabindex="-1">Local storage needs a check</h1>
      <p>{storageError}</p>
      <button class="button" type="button" on:click={loadCurrentWorkspace}
        >Try local storage again</button
      >
    </section>
  {:else if loading && page !== 'home'}
    <section class="loading-sheet" aria-live="polite">
      <p class="drawing-label">Loading jobs…</p>
      <div class="hatch" aria-hidden="true"></div>
    </section>
  {:else if page === 'home'}
    <section class="landing-hero" aria-labelledby="landing-title">
      <div class="hero-copy">
        <p class="drawing-label">Parts allocation / revision 01</p>
        <h1 id="landing-title" tabindex="-1">
          Promise dates from parts held for the job
        </h1>
        <p class="hero-summary">
          For trade firms that need a clear parts check before agreeing a visit
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
          <li>Works offline after your first visit.</li>
          <li>Sample changes stay in this browser.</li>
          <li>Accounts and payment are not available in M1.</li>
        </ul>
      </div>
      <BlueprintHero />
    </section>

    <section class="preview-section" aria-labelledby="preview-title">
      <div>
        <p class="drawing-label">Live sample / job datum</p>
        <h2 id="preview-title">See what blocks a date</h2>
        <p>
          RD-1042 needs one condensate pump. The job stays at risk until a
          source holds it.
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
      <p class="drawing-label">Three drawing marks</p>
      <h2 id="how-title">Check the parts before the promise</h2>
      <ol>
        <li>
          <strong>List</strong><span>Add each required part to the job.</span>
        </li>
        <li>
          <strong>Hold</strong><span
            >Allocate it from a van or warehouse source.</span
          >
        </li>
        <li>
          <strong>Review</strong><span
            >Read the reason before you agree the visit date.</span
          >
        </li>
      </ol>
    </section>

    <section class="plain-language-section" aria-labelledby="privacy-title">
      <h2 id="privacy-title">What this first release does not do</h2>
      <p>
        It does not sync between people, scan barcodes, place supplier orders,
        or take payment. It keeps a single local workspace and an isolated demo.
      </p>
      <a href="/privacy" on:click={(event) => follow(event, '/privacy')}
        >Read how local data works</a
      >
    </section>

    <section class="pricing-section" aria-labelledby="pricing-title">
      <p class="drawing-label">Next milestone / not for sale yet</p>
      <h2 id="pricing-title">Workshop base: $39 per month</h2>
      <p>
        Future firm accounts include one owner. Active technician seats are
        planned at $8 per month. There is no checkout in this release.
      </p>
    </section>
  {:else if page === 'jobs'}
    <section class="page-heading">
      <p class="drawing-label">Job board / local workspace</p>
      <h1 tabindex="-1">Jobs and their parts status</h1>
      <p>Each job shows the one fact that still needs attention.</p>
    </section>
    {#if workspace && workspace.jobs.length === 0}
      <section class="empty-state">
        <span aria-hidden="true">⌁</span>
        <h2>Jobs with required parts will appear here</h2>
        <p>
          Start with the job you need to check before you agree its visit date.
        </p>
        <button
          class="button"
          type="button"
          on:click={() => (showAddJob = true)}>Add a job</button
        >
      </section>
    {:else}
      <div class="jobs-toolbar">
        <button
          class="button"
          type="button"
          on:click={() => (showAddJob = true)}>Add a job</button
        ><span
          >{workspace?.jobs.length ?? 0} local job{workspace?.jobs.length === 1
            ? ''
            : 's'}</span
        >
      </div>
      <div class="job-list">
        {#each workspace?.jobs ?? [] as job}
          {@const status = promiseStatus(workspace!, job)}
          <article class="job-row">
            <div>
              <p class="job-number">{job.number}</p>
              <h2>{job.site}</h2>
              <p>Visit {formatDate(job.visitDate)}</p>
            </div>
            <StatusPlate {status} compact /><a
              class="button secondary"
              href={href(`/jobs/${job.id}`)}
              on:click={(event) => follow(event, href(`/jobs/${job.id}`))}
              >Review parts</a
            >
          </article>
        {/each}
      </div>
    {/if}
  {:else if page === 'job' && activeJob && workspace && activeStatus}
    <section class="job-datum">
      <div>
        <p class="drawing-label">Job datum / local record</p>
        <h1 tabindex="-1">{activeJob.site} parts</h1>
        <p>
          <strong>{activeJob.number}</strong> · Visit
          <time datetime={activeJob.visitDate}
            >{formatDate(activeJob.visitDate)}</time
          >
        </p>
      </div>
      <button class="button secondary" type="button" on:click={beginEditJob}
        >Edit job</button
      >
    </section>
    <StatusPlate status={activeStatus} />
    <section class="required-parts" aria-labelledby="parts-heading">
      <div class="section-heading">
        <div>
          <p class="drawing-label">Required parts / source leaders</p>
          <h2 id="parts-heading">Parts held for this job</h2>
        </div>
        <button
          class="button secondary"
          type="button"
          on:click={() => (showPartForm = true)}>Add required part</button
        >
      </div>
      {#each requirementsFor(activeJob) as requirement}
        {@const allocations = allocationsForRequirement(
          workspace,
          requirement.id
        )}
        {@const covered = coveredQuantity(workspace, requirement.id)}
        <article class="required-part" data-testid={`part-${requirement.id}`}>
          <div class="part-summary">
            <div>
              <h3>{requirement.description}</h3>
              {#if requirement.sku}<p class="technical">
                  {requirement.sku}
                </p>{/if}
            </div>
            <p>
              <strong>{formatQuantity(covered, requirement.unit)}</strong> held
              of {formatQuantity(requirement.quantity, requirement.unit)}
            </p>
          </div>
          {#if allocations.length > 0}<ul class="allocation-list">
              {#each allocations as allocation}<li>
                  <span
                    >Held for {activeJob.number} from
                    <strong>{allocation.sourceName}</strong>
                    · {formatQuantity(allocation.quantity, allocation.unit)} · {allocation.updater}
                    · checked
                    <time datetime={allocation.checkedAt}
                      >{formatTime(allocation.checkedAt)}</time
                    ></span
                  ><button
                    type="button"
                    class="text-button"
                    on:click={() => deallocate(allocation.id)}
                    >Remove allocation</button
                  >
                </li>{/each}
            </ul>{/if}
          {#if covered < requirement.quantity}<p class="shortage">
              ⌁ {formatQuantity(
                requirement.quantity - covered,
                requirement.unit
              )} still needs a source.
            </p>{/if}
          <div class="part-actions">
            <button
              class="button"
              data-testid={requirement.id === 'req-pump'
                ? 'allocate-pump'
                : undefined}
              type="button"
              on:click={() => openAllocation(requirement)}>Allocate part</button
            >{#if requirement.id === 'req-pump'}<button
                class="button secondary"
                type="button"
                on:click={() => {
                  allocationRequirementId = requirement.id;
                  allocationQuantity = requirement.quantity - covered;
                  showSupplierForm = true;
                }}>Check supplier date</button
              >{/if}
          </div>
        </article>
      {/each}
    </section>
    {#if workspace.lastActionAllocationId}<div class="undo-row">
        <span>The last allocation can be reversed.</span><button
          class="text-button"
          data-testid="undo-allocation"
          type="button"
          on:click={undoLastAllocation}>Undo allocation</button
        >
      </div>{/if}
    {#if suggestions.length > 0}<section
        class="reorder-list"
        aria-labelledby="reorder-heading"
      >
        <p class="drawing-label">Review, do not order</p>
        <h2 id="reorder-heading">Reorder suggestions</h2>
        {#each suggestions as suggestion}<article
            class="reorder-suggestion"
            data-testid="reorder-suggestion"
          >
            <strong
              >{suggestion.sourceName} has {formatQuantity(
                suggestion.remaining,
                suggestion.unit
              )} of {suggestion.partDescription}.</strong
            >
            <p>
              Minimum: {formatQuantity(suggestion.minimum, suggestion.unit)}. No
              supplier order has been placed.
            </p>
          </article>{/each}
      </section>{/if}
    <section class="source-tools" aria-labelledby="source-tools-title">
      <h2 id="source-tools-title">Record a source or supplier date</h2>
      <p>
        Add manual van or warehouse evidence here. A supplier date is evidence,
        not a guarantee.
      </p>
      <button
        class="button secondary"
        type="button"
        on:click={() => (showSourceForm = true)}>Add a source</button
      >
    </section>
  {:else if page === 'privacy'}
    <section class="legal-copy">
      <p class="drawing-label">Privacy / revision 01</p>
      <h1 tabindex="-1">How Parts Promise handles data</h1>
      <h2>Local data in M1</h2>
      <p>
        Jobs, required parts, sources, and allocations stay in this browser's
        IndexedDB. The live workspace uses <code>parts-promise-live-v1</code>.
        The sample uses <code>parts-promise-demo-v1</code>.
      </p>
      <h2>The demo is separate</h2>
      <p>
        Demo records never enter the live local workspace. Reset restores the
        bundled sample. Leaving demo deletes its browser database.
      </p>
      <h2>Demo requests</h2>
      <p>
        The demo makes only same-origin requests while you use and reset it.
      </p>
      <h2>Your control</h2>
      <p>
        Clear browser site data to remove local records. Export and deletion
        controls arrive with shared firm accounts in M4.
      </p>
    </section>
  {:else if page === 'terms'}
    <section class="legal-copy">
      <p class="drawing-label">Terms / M1 local release</p>
      <h1 tabindex="-1">Terms for using Parts Promise</h1>
      <h2>Use the evidence, not a guarantee</h2>
      <p>
        Parts Promise helps you record what is held for a job. Supplier dates
        and stock checks can change. You decide whether to promise a visit date.
      </p>
      <h2>This release</h2>
      <p>
        M1 runs in one browser. It does not provide cloud backup, team access,
        checkout, or supplier ordering.
      </p>
      <h2>Changes</h2>
      <p>
        Future paid firm accounts will have updated terms before checkout is
        available.
      </p>
    </section>
  {:else}
    <section class="not-found">
      <p class="drawing-label">Drawing 404 / detached leader</p>
      <h1 tabindex="-1">This page is not on the drawing</h1>
      <p>
        The leader for this page ends outside this revision. Return to the job
        board and keep the parts record together.
      </p>
      <a class="button" href="/" on:click={(event) => follow(event, '/')}
        >Return to Parts Promise</a
      >
    </section>
  {/if}

  {#if showAddJob}
    <section class="work-sheet" aria-labelledby="add-job-title">
      <div class="sheet-heading">
        <h2 id="add-job-title">Add a job and its first required part</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => (showAddJob = false)}>Close</button
        >
      </div>
      <form on:submit|preventDefault={createJob}>
        <div class="form-grid">
          <label>Job number<input bind:value={jobNumber} required /></label
          ><label
            >Site or customer name<input bind:value={jobSite} required /></label
          ><label
            >Visit date<input
              type="date"
              bind:value={jobDate}
              required
            /></label
          ><label>Required part<input bind:value={jobPart} required /></label
          ><label
            >Quantity<input
              type="number"
              min="0.01"
              step="0.01"
              bind:value={jobQuantity}
              required
            /></label
          ><label>Unit<input bind:value={jobUnit} required /></label>
        </div>
        {#if formError}<p class="form-error" role="alert">
            {formError}
          </p>{/if}<button class="button" type="submit"
          >Save job and part</button
        >
      </form>
    </section>
  {/if}

  {#if showEditJob}
    <section class="work-sheet" aria-labelledby="edit-job-title">
      <div class="sheet-heading">
        <h2 id="edit-job-title">Edit this job</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => (showEditJob = false)}>Close</button
        >
      </div>
      <form on:submit|preventDefault={updateJob}>
        <div class="form-grid">
          <label>Job number<input bind:value={jobNumber} required /></label
          ><label
            >Site or customer name<input bind:value={jobSite} required /></label
          ><label
            >Visit date<input
              type="date"
              bind:value={jobDate}
              required
            /></label
          >
        </div>
        {#if formError}<p class="form-error" role="alert">
            {formError}
          </p>{/if}<button class="button" type="submit">Save job details</button
        >
      </form>
    </section>
  {/if}

  {#if showPartForm}
    <section class="work-sheet" aria-labelledby="add-part-title">
      <div class="sheet-heading">
        <h2 id="add-part-title">Add a required part</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => (showPartForm = false)}>Close</button
        >
      </div>
      <form on:submit|preventDefault={createPart}>
        <div class="form-grid">
          <label
            >Part description<input
              bind:value={partDescription}
              required
            /></label
          ><label
            >Quantity<input
              type="number"
              min="0.01"
              step="0.01"
              bind:value={partQuantity}
              required
            /></label
          ><label>Unit<input bind:value={partUnit} required /></label>
        </div>
        {#if formError}<p class="form-error" role="alert">
            {formError}
          </p>{/if}<button class="button" type="submit"
          >Add required part</button
        >
      </form>
    </section>
  {/if}

  {#if allocationRequirementId && !showSupplierForm}
    {@const requirement = workspace?.requirements.find(
      (item) => item.id === allocationRequirementId
    )}
    <section
      class="work-sheet allocation-sheet"
      aria-labelledby="allocation-title"
    >
      <div class="sheet-heading">
        <h2 id="allocation-title">Allocate {requirement?.description}</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => (allocationRequirementId = '')}>Close</button
        >
      </div>
      <p>Choose the source and quantity held for {activeJob?.number}.</p>
      <form on:submit|preventDefault={saveAllocation}>
        <fieldset>
          <legend>Available source</legend
          >{#each requirement && workspace ? sourcesForRequirement(workspace, requirement) : [] as source}<label
              class="source-option"
              ><input
                type="radio"
                bind:group={allocationSourceId}
                value={source.id}
                disabled={source.type !== 'supplier_order' &&
                  availableQuantity(workspace!, source.id) <= 0}
              /><span
                ><strong>{source.name}</strong> · {formatQuantity(
                  source.type === 'supplier_order'
                    ? source.onHand
                    : availableQuantity(workspace!, source.id),
                  source.unit
                )} available · checked {formatTime(source.lastCheckedAt)}</span
              ></label
            >{/each}
        </fieldset>
        <label
          >Quantity held<input
            type="number"
            min="0.01"
            step="0.01"
            bind:value={allocationQuantity}
            required
          /></label
        >{#if formError}<p class="form-error" role="alert">
            {formError}
          </p>{/if}<button class="button" type="submit"
          >Hold this quantity</button
        >
      </form>
    </section>
  {/if}

  {#if showSourceForm}
    <section class="work-sheet" aria-labelledby="source-title">
      <div class="sheet-heading">
        <h2 id="source-title">Add a source</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => (showSourceForm = false)}>Close</button
        >
      </div>
      <form on:submit|preventDefault={createSource}>
        <div class="form-grid">
          <label>Source name<input bind:value={sourceName} required /></label
          ><label
            >Source type<select bind:value={sourceType}
              ><option value="van">Van</option><option value="warehouse"
                >Warehouse</option
              ></select
            ></label
          ><label
            >Part description<input bind:value={sourcePart} required /></label
          ><label
            >Available quantity<input
              type="number"
              min="0"
              step="0.01"
              bind:value={sourceQuantity}
              required
            /></label
          ><label
            >Minimum quantity<input
              type="number"
              min="0"
              step="0.01"
              bind:value={sourceMinimum}
              required
            /></label
          ><label>Unit<input bind:value={partUnit} required /></label>
        </div>
        {#if formError}<p class="form-error" role="alert">
            {formError}
          </p>{/if}<button class="button" type="submit">Save source</button>
      </form>
    </section>
  {/if}

  {#if showSupplierForm}
    <section class="work-sheet" aria-labelledby="supplier-title">
      <div class="sheet-heading">
        <h2 id="supplier-title">Attach supplier order evidence</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => (showSupplierForm = false)}>Close</button
        >
      </div>
      <p>This marks an expected date. It does not guarantee arrival.</p>
      <form on:submit|preventDefault={createSupplierEvidence}>
        <div class="form-grid">
          <label
            >Supplier order reference<input
              bind:value={supplierReference}
              required
            /></label
          ><label
            >Expected date<input
              type="date"
              bind:value={supplierDate}
              required
            /></label
          ><label
            >Confidence<select bind:value={supplierConfidence}
              ><option>Confirmed by supplier</option><option>Estimated</option
              ><option>Needs a check</option></select
            ></label
          ><label
            >Quantity held<input
              type="number"
              min="0.01"
              step="0.01"
              bind:value={allocationQuantity}
              required
            /></label
          >
        </div>
        {#if formError}<p class="form-error" role="alert">
            {formError}
          </p>{/if}<button class="button" type="submit"
          >Attach supplier evidence</button
        >
      </form>
    </section>
  {/if}

  {#if toast}<aside class="toast" role="status">
      {toast}<button
        type="button"
        aria-label="Dismiss message"
        on:click={() => (toast = '')}>×</button
      >
    </aside>{/if}
</main>

<footer class="site-footer">
  <p>Promise job dates from parts held for the job.</p>
  <div>
    <a
      href={href('/privacy')}
      on:click={(event) => follow(event, href('/privacy'))}>Privacy</a
    ><a
      href={href('/terms')}
      on:click={(event) => follow(event, href('/terms'))}>Terms</a
    ><a href="https://sociobot.in" rel="external">Built by Param Factory</a>
  </div>
  <small>Revision M1 · local-first</small>
  <p class="generated-note">
    The service drawing is original hand-authored vector artwork.
  </p>
</footer>
