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
    CSV_TEMPLATE,
    backupFilename,
    createWorkspaceBackup,
    parseWorkspaceBackup,
    parseWorkspaceCsv,
    type ImportPreview
  } from './lib/domain/workspace-transfer';
  import {
    deleteWorkspace,
    loadWorkspace,
    resetDemo,
    saveWorkspace,
    type WorkspaceMode
  } from './lib/storage/workspace-db';

  type Page =
    | 'home'
    | 'jobs'
    | 'job'
    | 'auth-callback'
    | 'onboarding'
    | 'team'
    | 'billing'
    | 'privacy'
    | 'terms'
    | 'not-found';

  type TeamMember = {
    id: string;
    name: string;
    email?: string;
    role: string;
    status: string;
    consumes_seat: boolean;
  };

  type BillingState = {
    state: string;
    plan: string;
    seat_quantity: number;
    period_end?: string;
    cloud_writes_allowed: boolean;
  };

  type CloudBootstrap = {
    onboarding_required: boolean;
    user_name: string;
    organization_id?: string;
    organization_name?: string;
    role?: string;
    locale?: string;
    time_zone?: string;
    workspace?: Workspace;
    version?: number;
    billing?: BillingState;
    members: TeamMember[];
  };

  let currentPath = '/';
  let demo = false;
  let workspace: Workspace | null = null;
  let loading = true;
  let storageError = '';
  let toast = '';
  let online = true;
  let theme: 'light' | 'dark' = 'light';
  let resetDialog: HTMLDialogElement | undefined;
  let exitDialog: HTMLDialogElement | undefined;
  let showAddJob = false;
  let showEditJob = false;
  let showPartForm = false;
  let showSourceForm = false;
  let showSupplierForm = false;
  let showImportForm = false;
  let allocationRequirementId = '';
  let allocationSourceId = '';
  let allocationQuantity = 1;
  let formError = '';
  let importPreview: ImportPreview | null = null;
  let importFileName = '';
  let routeAnnouncement = '';
  let accountLoading = false;
  let accountName = '';
  let idToken = '';
  let accountError = '';
  let cloud: CloudBootstrap | null = null;
  let cloudVersion: number | null = null;
  let syncNotice = '';
  let organizationName = '';
  let migrateLocalWorkspace = false;
  let onboardingConfirmed = false;
  let inviteEmail = '';
  let inviteRole = 'technician';
  let teamMessage = '';
  let billingMessage = '';

  type HistoryPosition = { scrollX: number; scrollY: number };

  type SheetName =
    | 'add-job'
    | 'edit-job'
    | 'add-part'
    | 'allocation'
    | 'source'
    | 'supplier'
    | 'import';
  const sheetTriggers: Partial<Record<SheetName, HTMLElement>> = {};

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

  $: routePage = getPage(currentPath, demo);
  $: activeJobId = routePage === 'job' ? jobIdFromPath(currentPath, demo) : '';
  $: activeJob = workspace?.jobs.find((job) => job.id === activeJobId);
  $: page =
    routePage === 'job' && !loading && workspace && !activeJob
      ? 'not-found'
      : routePage;
  $: metadata = pageMetadata(page, activeJob);
  $: updateDocumentMetadata(metadata);
  $: activeStatus =
    activeJob && workspace ? promiseStatus(workspace, activeJob) : undefined;
  $: suggestions = workspace ? reorderSuggestions(workspace) : [];
  $: sharedReadOnly = !demo && Boolean(idToken) && cloud?.role === 'viewer';
  $: document.documentElement.dataset.theme = theme;

  onMount(() => {
    const updateRoute = (event: PopStateEvent) =>
      void syncRoute(true, historyPosition(event.state));
    const updateOnline = () => (online = navigator.onLine);
    let scrollFrame: number | undefined;
    const recordScroll = () => {
      if (scrollFrame !== undefined) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = undefined;
        saveScrollPosition();
      });
    };
    const previousScrollRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    currentPath = window.location.pathname;
    demo =
      new URLSearchParams(window.location.search).get('demo') === '1' ||
      currentPath === '/demo';
    online = navigator.onLine;
    const storedTheme = localStorage.getItem('parts-promise-theme');
    theme = storedTheme === 'dark' ? 'dark' : 'light';
    saveScrollPosition();
    void initialize();
    window.addEventListener('popstate', updateRoute);
    window.addEventListener('scroll', recordScroll, { passive: true });
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('popstate', updateRoute);
      window.removeEventListener('scroll', recordScroll);
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      if (scrollFrame !== undefined) cancelAnimationFrame(scrollFrame);
      history.scrollRestoration = previousScrollRestoration;
    };
  });

  function getPage(path: string, inDemo: boolean): Page {
    if ((path === '/' && inDemo) || path === '/demo') return 'job';
    if (path === '/') return 'home';
    if (path === '/jobs') return 'jobs';
    if (path.startsWith('/jobs/')) return 'job';
    if (path === '/auth/callback') return 'auth-callback';
    if (path === '/onboarding') return 'onboarding';
    if (path === '/settings/team') return 'team';
    if (path === '/settings/billing') return 'billing';
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    return 'not-found';
  }

  function jobIdFromPath(path: string, inDemo: boolean): string {
    if ((path === '/' && inDemo) || path === '/demo') return DEMO_JOB_ID;
    return path.split('/')[2] ?? '';
  }

  function pageMetadata(currentPage: Page, job?: Job) {
    const canonical =
      demo && (currentPath === '/' || currentPath === '/demo')
        ? '/demo'
        : currentPath;
    if (currentPage === 'jobs')
      return {
        title: 'Jobs — Parts Promise',
        description: 'Jobs and their parts status.',
        canonical
      };
    if (
      currentPage === 'job' &&
      demo &&
      (currentPath === '/' || currentPath === '/demo')
    )
      return {
        title: 'Demo — Parts Promise',
        description: 'Sample job card for Parts Promise.',
        canonical: '/demo'
      };
    if (currentPage === 'job')
      return {
        title: `${job?.number ?? 'Job'} parts — Parts Promise`,
        description: 'Parts held for this job.',
        canonical
      };
    if (currentPage === 'auth-callback')
      return {
        title: 'Sign-in return — Parts Promise',
        description: 'Complete secure sign-in to Parts Promise.',
        canonical
      };
    if (currentPage === 'onboarding')
      return {
        title: 'Set up your firm — Parts Promise',
        description:
          'Set up a firm workspace and choose whether to copy local jobs.',
        canonical
      };
    if (currentPage === 'team')
      return {
        title: 'Team — Parts Promise',
        description: 'People who can update this firm’s jobs.',
        canonical
      };
    if (currentPage === 'billing')
      return {
        title: 'Billing — Parts Promise',
        description: 'Workshop plan and technician seat details.',
        canonical
      };
    if (currentPage === 'privacy')
      return {
        title: 'Privacy — Parts Promise',
        description: 'How Parts Promise handles local data.',
        canonical
      };
    if (currentPage === 'terms')
      return {
        title: 'Terms — Parts Promise',
        description: 'Terms for using Parts Promise.',
        canonical
      };
    if (currentPage === 'not-found')
      return {
        title: 'Page not found — Parts Promise',
        description: 'The requested Parts Promise page is not available.',
        canonical: '/'
      };
    return {
      title: 'Parts Promise — Hold parts for each job',
      description: 'Promise job dates from parts held for the job.',
      canonical
    };
  }

  function updateDocumentMetadata(next: ReturnType<typeof pageMetadata>) {
    if (typeof document === 'undefined') return;
    const origin = 'https://field-parts-promise.sociobot.in';
    const absoluteCanonical = `${origin}${next.canonical}`;
    document.title = next.title;
    const attributes: Array<[string, string]> = [
      ['description', next.description],
      ['canonical', absoluteCanonical],
      ['og:title', next.title],
      ['og:description', next.description],
      ['og:url', absoluteCanonical],
      ['twitter:title', next.title],
      ['twitter:description', next.description]
    ];
    for (const [name, value] of attributes) {
      const element = document.getElementById(`route-${name}`);
      if (element) {
        if (element instanceof HTMLLinkElement) element.href = value;
        else element.setAttribute('content', value);
      }
    }
    document
      .getElementById('route-robots')
      ?.setAttribute(
        'content',
        page === 'not-found' || page === 'auth-callback'
          ? 'noindex'
          : 'index,follow'
      );
  }

  function mode(): WorkspaceMode {
    return demo ? 'demo' : 'live';
  }

  async function initialize() {
    await loadCurrentWorkspace();
    if (!demo) await restoreAccount();
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
      if (!demo && idToken && cloud && !cloud.onboarding_required)
        await pushCloudWorkspace(next);
    } catch (error) {
      storageError =
        error instanceof Error
          ? error.message
          : 'Local changes could not be saved.';
    }
  }

  function localItemCount() {
    if (!workspace) return 0;
    return (
      workspace.jobs.length +
      workspace.requirements.length +
      workspace.sources.length +
      workspace.allocations.length
    );
  }

  async function restoreAccount() {
    if (demo) return;
    accountLoading = true;
    accountError = '';
    try {
      const { restoreCiamSession } = await import('./lib/auth/ciam');
      const session = await restoreCiamSession();
      accountName = session.account?.name ?? session.account?.username ?? '';
      idToken = session.token;
      if (idToken) await loadCloudBootstrap();
      if (currentPath === '/auth/callback') {
        if (idToken)
          await navigate(cloud?.onboarding_required ? '/onboarding' : '/jobs');
        else
          accountError =
            'No sign-in response was received. Start sign-in again.';
      }
    } catch (error) {
      accountError =
        error instanceof Error
          ? error.message
          : 'Sign-in could not be completed. Try again.';
    } finally {
      accountLoading = false;
    }
  }

  async function signIn() {
    accountLoading = true;
    accountError = '';
    try {
      const { signInWithCiam } = await import('./lib/auth/ciam');
      await signInWithCiam();
    } catch (error) {
      accountLoading = false;
      accountError =
        error instanceof Error ? error.message : 'Sign-in could not start.';
    }
  }

  async function signOut() {
    const { signOutFromCiam } = await import('./lib/auth/ciam');
    await signOutFromCiam();
  }

  async function apiRequest(path: string, init?: RequestInit) {
    const { currentCiamToken } = await import('./lib/auth/ciam');
    idToken = (await currentCiamToken()) || idToken;
    const response = await fetch(path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${idToken}`,
        ...(init?.headers ?? {})
      }
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        [body.message, body.action].filter(Boolean).join(' ') ||
          'The shared workspace request failed. Try again.'
      );
    return body;
  }

  async function loadCloudBootstrap() {
    const next = (await apiRequest('/api/v1/bootstrap')) as CloudBootstrap;
    cloud = next;
    cloudVersion = next.version ?? null;
    if (!next.onboarding_required && next.workspace) {
      workspace = next.workspace;
      await saveWorkspace('live', next.workspace);
    }
  }

  async function pushCloudWorkspace(next: Workspace) {
    if (cloudVersion === null) return;
    syncNotice = 'Sending changes…';
    try {
      const result = await apiRequest('/api/v1/sync', {
        method: 'POST',
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          expected_version: cloudVersion,
          workspace: next
        })
      });
      cloudVersion = result.version;
      syncNotice = 'Shared workspace up to date.';
    } catch (error) {
      syncNotice = `${error instanceof Error ? error.message : 'Sync failed.'} Your change stays on this device.`;
    }
  }

  async function submitOnboarding() {
    formError = '';
    const count = localItemCount();
    if (!organizationName.trim() || !onboardingConfirmed) {
      formError =
        'Name the firm and confirm whether the local records should be copied.';
      return;
    }
    try {
      cloud = (await apiRequest('/api/v1/onboarding', {
        method: 'POST',
        body: JSON.stringify({
          organization_name: organizationName.trim(),
          locale: navigator.language || 'en-US',
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          migrate_local_workspace: migrateLocalWorkspace,
          local_item_count: migrateLocalWorkspace ? count : 0,
          workspace: migrateLocalWorkspace ? workspace : null
        })
      })) as CloudBootstrap;
      cloudVersion = cloud.version ?? 0;
      if (cloud.workspace) {
        workspace = cloud.workspace;
        await saveWorkspace('live', cloud.workspace);
      }
      await navigate('/settings/billing');
    } catch (error) {
      formError = error instanceof Error ? error.message : 'Firm setup failed.';
    }
  }

  async function inviteMember() {
    teamMessage = '';
    try {
      const result = await apiRequest('/api/v1/members', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      if (cloud) cloud = { ...cloud, members: result.members };
      inviteEmail = '';
      teamMessage =
        'Invitation recorded. It becomes active when that person signs in.';
    } catch (error) {
      teamMessage = error instanceof Error ? error.message : 'Invite failed.';
    }
  }

  async function startCheckout() {
    billingMessage = '';
    try {
      const result = await apiRequest('/api/v1/billing/checkout', {
        method: 'POST',
        body: '{}'
      });
      if (result.checkout_url) window.location.assign(result.checkout_url);
    } catch (error) {
      billingMessage =
        error instanceof Error ? error.message : 'Checkout could not start.';
    }
  }

  function href(path: string): string {
    if (!demo || path.includes('demo=1')) return path;
    return `${path}${path.includes('?') ? '&' : '?'}demo=1`;
  }

  function historyPosition(value: unknown): HistoryPosition | undefined {
    if (!value || typeof value !== 'object') return undefined;
    const position = value as Partial<HistoryPosition>;
    if (
      typeof position.scrollX !== 'number' ||
      typeof position.scrollY !== 'number' ||
      position.scrollX < 0 ||
      position.scrollY < 0
    )
      return undefined;
    return { scrollX: position.scrollX, scrollY: position.scrollY };
  }

  function saveScrollPosition() {
    const previous =
      history.state && typeof history.state === 'object'
        ? (history.state as Record<string, unknown>)
        : {};
    history.replaceState(
      {
        ...previous,
        scrollX: Math.round(window.scrollX),
        scrollY: Math.round(window.scrollY)
      },
      '',
      window.location.href
    );
  }

  async function syncRoute(
    shouldFocus: boolean,
    restorePosition?: HistoryPosition
  ) {
    const nextPath = window.location.pathname;
    const nextDemo =
      new URLSearchParams(window.location.search).get('demo') === '1' ||
      nextPath === '/demo';
    if (demo && !nextDemo) await deleteWorkspace('demo');
    currentPath = nextPath;
    demo = nextDemo;
    await loadCurrentWorkspace();
    if (shouldFocus) await focusPageHeading(Boolean(restorePosition));
    if (restorePosition)
      window.scrollTo(restorePosition.scrollX, restorePosition.scrollY);
  }

  async function navigate(path: string) {
    saveScrollPosition();
    history.pushState({ scrollX: 0, scrollY: 0 }, '', path);
    await syncRoute(true);
    window.scrollTo(0, 0);
    saveScrollPosition();
  }

  async function follow(event: MouseEvent, path: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
      return;
    event.preventDefault();
    await navigate(path);
  }

  async function focusPageHeading(preventScroll = false) {
    await tick();
    document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll });
    routeAnnouncement = metadata.title;
  }

  async function revealSheet(name: SheetName, trigger: HTMLElement) {
    sheetTriggers[name] = trigger;
    await tick();
    const sheet = document.getElementById(`${name}-sheet`);
    sheet?.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth'
    });
    sheet?.querySelector<HTMLElement>('h2, input, select')?.focus();
  }

  async function closeSheet(name: SheetName, close: () => void) {
    close();
    formError = '';
    await tick();
    sheetTriggers[name]?.focus();
  }

  async function openAddJob(event: MouseEvent) {
    showAddJob = true;
    formError = '';
    await revealSheet('add-job', event.currentTarget as HTMLElement);
  }

  async function openPartForm(event: MouseEvent) {
    showPartForm = true;
    formError = '';
    await revealSheet('add-part', event.currentTarget as HTMLElement);
  }

  async function openSourceForm(event: MouseEvent) {
    showSourceForm = true;
    formError = '';
    await revealSheet('source', event.currentTarget as HTMLElement);
  }

  function changeTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('parts-promise-theme', theme);
  }

  async function openDialog(dialog: HTMLDialogElement | undefined) {
    if (!dialog || dialog.open) return;
    dialog.showModal();
    await tick();
    dialog.querySelector<HTMLElement>('[data-dialog-cancel]')?.focus();
  }

  function containDialogFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLDialogElement;
    const controls = Array.from(
      dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href]')
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function confirmReset() {
    workspace = await resetDemo();
    allocationRequirementId = '';
    resetDialog?.close();
    toast = 'The sample job is back to its starting state.';
  }

  async function confirmExitDemo() {
    exitDialog?.close();
    await navigate('/jobs');
    toast = 'Your local workspace is open. Sample changes were discarded.';
  }

  function requirementsFor(job: Job): PartRequirement[] {
    return (
      workspace?.requirements.filter(
        (requirement) => requirement.jobId === job.id
      ) ?? []
    );
  }

  async function openAllocation(
    requirement: PartRequirement,
    trigger: HTMLElement
  ) {
    if (!workspace) return;
    allocationRequirementId = requirement.id;
    const source = sourcesForRequirement(workspace, requirement).find(
      (item) => availableQuantity(workspace!, item.id) > 0
    );
    allocationSourceId = source?.id ?? '';
    allocationQuantity = Math.max(
      1,
      requirement.quantity - coveredQuantity(workspace, requirement.id)
    );
    formError = '';
    await revealSheet('allocation', trigger);
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
    await closeSheet('allocation', () => (allocationRequirementId = ''));
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
    await closeSheet('edit-job', () => (showEditJob = false));
  }

  async function beginEditJob(event: MouseEvent) {
    if (!activeJob) return;
    jobNumber = activeJob.number;
    jobSite = activeJob.site;
    jobDate = activeJob.visitDate;
    showEditJob = true;
    formError = '';
    await revealSheet('edit-job', event.currentTarget as HTMLElement);
  }

  async function openSupplierForm(
    requirement: PartRequirement,
    quantity: number,
    trigger: HTMLElement
  ) {
    allocationRequirementId = requirement.id;
    allocationQuantity = quantity;
    formError = '';
    showSupplierForm = true;
    await revealSheet('supplier', trigger);
  }

  async function openImportForm(event: MouseEvent) {
    showImportForm = true;
    importPreview = null;
    importFileName = '';
    await revealSheet('import', event.currentTarget as HTMLElement);
  }

  function downloadText(filename: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportWorkspace() {
    if (!workspace) return;
    downloadText(
      backupFilename(),
      `${JSON.stringify(createWorkspaceBackup(workspace), null, 2)}\n`,
      'application/json'
    );
    toast = `${demo ? 'Sample' : 'Local'} workspace backup downloaded.`;
  }

  function downloadCsvTemplate() {
    downloadText('parts-promise-import-template.csv', CSV_TEMPLATE, 'text/csv');
  }

  async function previewImport(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    importFileName = file.name;
    if (file.size > 2_000_000) {
      importPreview = {
        format: file.name.toLowerCase().endsWith('.json') ? 'json' : 'csv',
        workspace: null,
        counts: { jobs: 0, requirements: 0, sources: 0, allocations: 0 },
        errors: [
          'The import is larger than 2 MB. Split the CSV or choose a smaller backup.'
        ]
      };
      return;
    }
    const text = await file.text();
    importPreview = file.name.toLowerCase().endsWith('.json')
      ? parseWorkspaceBackup(text)
      : parseWorkspaceCsv(text);
  }

  async function applyImport() {
    if (!workspace || !importPreview?.workspace || importPreview.errors.length)
      return;
    let next = importPreview.workspace;
    if (importPreview.format === 'csv') {
      const existingNumbers = new Set(
        workspace.jobs.map((job) => job.number.toLowerCase())
      );
      const repeated = next.jobs.find((job) =>
        existingNumbers.has(job.number.toLowerCase())
      );
      if (repeated) {
        importPreview = {
          ...importPreview,
          errors: [
            `Job number ${repeated.number} already exists in this workspace.`
          ]
        };
        return;
      }
      next = {
        ...workspace,
        jobs: [...workspace.jobs, ...next.jobs],
        requirements: [...workspace.requirements, ...next.requirements],
        sources: [...workspace.sources, ...next.sources]
      };
    }
    await commit(
      next,
      `${importFileName} was imported into the ${demo ? 'sample' : 'local'} workspace.`
    );
    await closeSheet('import', () => {
      showImportForm = false;
      importPreview = null;
    });
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
    await closeSheet('add-part', () => (showPartForm = false));
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
    await closeSheet('source', () => (showSourceForm = false));
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
    await closeSheet('supplier', () => {
      showSupplierForm = false;
      allocationRequirementId = '';
    });
    supplierReference = '';
    supplierDate = '';
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
    {#if idToken && !demo}<a
        href="/settings/team"
        aria-current={page === 'team' ? 'page' : undefined}
        on:click={(event) => follow(event, '/settings/team')}>Team</a
      >{/if}
    <a
      href={href('/privacy')}
      aria-current={page === 'privacy' ? 'page' : undefined}
      on:click={(event) => follow(event, href('/privacy'))}>Privacy</a
    >
  </nav>
  {#if !demo}
    {#if idToken}<button class="account-button" type="button" on:click={signOut}
        >Sign out {accountName}</button
      >{:else}<button
        class="account-button"
        type="button"
        disabled={accountLoading}
        on:click={signIn}
        >{accountLoading ? 'Checking sign-in…' : 'Sign in'}</button
      >{/if}
  {/if}
  <button
    class="theme-toggle"
    type="button"
    aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}
    on:click={changeTheme}
    >Use {theme === 'light' ? 'dark' : 'light'} theme</button
  >
</header>

{#if demo}
  <aside class="demo-banner" aria-label="Demo workspace">
    <strong
      >Demo — sample data; nothing is saved to your local workspace.</strong
    >
    <span>Changes stay in this browser until you reset or leave.</span>
    <button type="button" on:click={() => openDialog(resetDialog)}
      >Reset demo</button
    >
    <button
      class="quiet-button"
      type="button"
      on:click={() => openDialog(exitDialog)}>Start for real</button
    >
  </aside>
  <dialog
    bind:this={resetDialog}
    aria-labelledby="reset-title"
    on:keydown={containDialogFocus}
  >
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
        data-dialog-cancel
        type="button"
        on:click={() => resetDialog?.close()}>Keep changes</button
      >
    </div>
  </dialog>
  <dialog
    bind:this={exitDialog}
    aria-labelledby="exit-title"
    on:keydown={containDialogFocus}
  >
    <h2 id="exit-title">Leave the sample workspace?</h2>
    <p>
      Sample changes are discarded. Your local workspace will reopen unchanged.
    </p>
    <div class="dialog-actions">
      <button class="button danger" type="button" on:click={confirmExitDemo}
        >Leave demo</button
      ><button
        class="button secondary"
        data-dialog-cancel
        type="button"
        on:click={() => exitDialog?.close()}>Stay in demo</button
      >
    </div>
  </dialog>
{/if}

{#if !online}
  <aside class="offline-plate" role="status">
    Offline — changes are kept on this device.
  </aside>
{/if}

<main id="main" tabindex="-1">
  <p class="sr-only" aria-live="polite" aria-atomic="true">
    {routeAnnouncement || metadata.title}
  </p>

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
          <li>Workshop is $39/month plus $8 per active technician.</li>
        </ul>
      </div>
      <BlueprintHero />
    </section>

    <section class="preview-section" aria-labelledby="preview-title">
      <div>
        <p class="drawing-label">Sample job status</p>
        <h2 id="preview-title">See why a visit date is at risk</h2>
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
        It does not scan barcodes or place supplier orders. The sample stays
        separate from signed-in firm workspaces.
      </p>
      <a href="/privacy" on:click={(event) => follow(event, '/privacy')}
        >Read how local data works</a
      >
    </section>
    <section class="pricing-section" aria-labelledby="pricing-title">
      <p class="drawing-label">Firm plan</p>
      <h2 id="pricing-title">Pay for the workshop and active technicians</h2>
      <p>
        Workshop costs $39 each month. Each active technician costs $8 each
        month. The owner does not use a technician seat.
      </p>
      <p>
        Sociobot and Dodo handle payment. Checkout is waiting for this product’s
        recurring plan registration.
      </p>
      <a href="/onboarding" on:click={(event) => follow(event, '/onboarding')}
        >Set up your firm</a
      >
    </section>
  {:else if page === 'auth-callback'}
    <section class="account-sheet" aria-live="polite">
      <p class="drawing-label">Secure sign-in</p>
      <h1 tabindex="-1">Finish signing in</h1>
      {#if accountError}<p class="form-error" role="alert">{accountError}</p>
        <button class="button" type="button" on:click={signIn}
          >Try sign-in again</button
        >{:else}<p>Checking your Sociobot account…</p>{/if}
    </section>
  {:else if page === 'onboarding'}
    <section class="account-sheet">
      <p class="drawing-label">Firm setup</p>
      <h1 tabindex="-1">Set up your firm workspace</h1>
      {#if !idToken}
        <p>Sign in with Sociobot before you create a shared workspace.</p>
        {#if accountError}<p class="form-error" role="alert">
            {accountError}
          </p>{/if}
        <button class="button" type="button" on:click={signIn}
          >Sign in with Sociobot</button
        >
      {:else if cloud && !cloud.onboarding_required}
        <p>{cloud.organization_name} is ready.</p>
        <a
          class="button"
          href="/jobs"
          on:click={(event) => follow(event, '/jobs')}>Open shared jobs</a
        >
      {:else}
        <p>
          Your local workspace has {localItemCount()} record{localItemCount() ===
          1
            ? ''
            : 's'}. Nothing is copied until you choose it below.
        </p>
        <form on:submit|preventDefault={submitOnboarding}>
          <label
            >Firm name<input bind:value={organizationName} required /></label
          >
          {#if localItemCount() > 0}<label class="check-control"
              ><input type="checkbox" bind:checked={migrateLocalWorkspace} />
              Copy these {localItemCount()} local records into the firm workspace</label
            >{/if}
          <label class="check-control"
            ><input
              type="checkbox"
              bind:checked={onboardingConfirmed}
              required
            />
            I checked the record count and chose whether to copy it</label
          >
          {#if formError}<p class="form-error" role="alert">{formError}</p>{/if}
          <button class="button" type="submit">Create firm workspace</button>
        </form>
      {/if}
    </section>
  {:else if page === 'team'}
    <section class="account-sheet">
      <p class="drawing-label">Team and seats</p>
      <h1 tabindex="-1">People who can update jobs</h1>
      {#if !idToken}
        <p>Sign in to view your firm’s team.</p>
        <button class="button" type="button" on:click={signIn}
          >Sign in with Sociobot</button
        >
      {:else if !cloud || cloud.onboarding_required}
        <p>Create a firm workspace before inviting technicians.</p>
        <a
          class="button"
          href="/onboarding"
          on:click={(event) => follow(event, '/onboarding')}>Set up your firm</a
        >
      {:else}
        <p>
          Active technicians use $8 monthly seats. Owners, coordinators, and
          viewers do not use technician seats.
        </p>
        <ul class="member-list">
          {#each cloud.members as member}<li>
              <span
                ><strong>{member.name}</strong>{#if member.email}<small
                    >{member.email}</small
                  >{/if}</span
              ><span
                >{member.role} · {member.status}{member.consumes_seat
                  ? ' · paid seat'
                  : ''}</span
              >
            </li>{/each}
        </ul>
        {#if cloud.role === 'owner'}
          <form on:submit|preventDefault={inviteMember}>
            <h2>Invite a team member</h2>
            <p>
              Record their work email, then send them this site link. Their
              place becomes active when that email signs in.
            </p>
            <div class="form-grid">
              <label
                >Email<input
                  type="email"
                  bind:value={inviteEmail}
                  required
                /></label
              ><label
                >Role<select bind:value={inviteRole}
                  ><option value="technician">Technician — $8/month</option
                  ><option value="coordinator">Coordinator</option><option
                    value="viewer">Viewer</option
                  ></select
                ></label
              >
            </div>
            <button class="button" type="submit">Record invitation</button>
          </form>
        {/if}
        {#if teamMessage}<p role="status">{teamMessage}</p>{/if}
        <a
          href="/settings/billing"
          on:click={(event) => follow(event, '/settings/billing')}
          >Review plan and seats</a
        >
      {/if}
    </section>
  {:else if page === 'billing'}
    <section class="account-sheet">
      <p class="drawing-label">Billing</p>
      <h1 tabindex="-1">Plan and technician seats</h1>
      {#if !idToken}
        <p>Sign in to view billing for your firm.</p>
        <button class="button" type="button" on:click={signIn}
          >Sign in with Sociobot</button
        >
      {:else if !cloud || cloud.onboarding_required}
        <p>Create a firm workspace before choosing a plan.</p>
        <a
          class="button"
          href="/onboarding"
          on:click={(event) => follow(event, '/onboarding')}>Set up your firm</a
        >
      {:else}
        <dl class="billing-summary">
          <div>
            <dt>Workshop base</dt>
            <dd>$39/month</dd>
          </div>
          <div>
            <dt>Active technician seats</dt>
            <dd>{cloud.billing?.seat_quantity ?? 0} × $8/month</dd>
          </div>
          <div>
            <dt>Owner seat</dt>
            <dd>Included</dd>
          </div>
          <div>
            <dt>Plan state</dt>
            <dd>{cloud.billing?.state ?? 'pending'}</dd>
          </div>
        </dl>
        <p>Existing records and export remain available if payment stops.</p>
        {#if cloud.role === 'owner'}<button
            class="button"
            type="button"
            on:click={startCheckout}>Check checkout availability</button
          >{:else}<p>The firm owner manages checkout.</p>{/if}
        {#if billingMessage}<p class="form-error" role="alert">
            {billingMessage}
          </p>{/if}
        <p>
          Sociobot/Dodo is the merchant of record. Read the
          <a href="/terms" on:click={(event) => follow(event, '/terms')}
            >terms</a
          >
          and
          <a href="/privacy" on:click={(event) => follow(event, '/privacy')}
            >privacy notice</a
          >.
        </p>
      {/if}
    </section>
  {:else if page === 'jobs'}
    <section class="page-heading">
      <p class="drawing-label">
        {cloud && !demo ? 'Shared firm jobs' : 'Jobs in this browser'}
      </p>
      <h1 tabindex="-1">Jobs and their parts status</h1>
      <p>Each job shows the one fact that still needs attention.</p>
      {#if !demo && !idToken}<p class="account-callout">
          This workspace stays on this device. <button
            class="text-button"
            type="button"
            on:click={signIn}>Sign in to set up team sync</button
          >
        </p>{:else if sharedReadOnly}<p class="account-callout" role="status">
          Viewer access can review and export this workspace but cannot change
          it.
        </p>{:else if syncNotice}<p class="account-callout" role="status">
          {syncNotice}
        </p>{/if}
    </section>
    <div class="jobs-toolbar">
      <div class="toolbar-actions">
        <button
          class="button"
          type="button"
          disabled={sharedReadOnly}
          aria-expanded={showAddJob}
          aria-controls="add-job-sheet"
          on:click={openAddJob}>Add a job</button
        ><button
          class="button secondary"
          type="button"
          disabled={sharedReadOnly}
          aria-expanded={showImportForm}
          aria-controls="import-sheet"
          on:click={openImportForm}>Import workspace</button
        ><button
          class="button secondary"
          type="button"
          on:click={exportWorkspace}>Export workspace</button
        >
      </div>
      <span
        >{workspace?.jobs.length ?? 0} local job{workspace?.jobs.length === 1
          ? ''
          : 's'}</span
      >
    </div>
    {#if workspace && workspace.jobs.length === 0}
      <section class="empty-state">
        <span aria-hidden="true">⌁</span>
        <h2>Jobs with required parts will appear here</h2>
        <p>
          Start with the job you need to check before you agree its visit date.
        </p>
      </section>
    {:else}
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
        <p class="drawing-label">{demo ? 'Sample job' : 'Job parts record'}</p>
        <h1 tabindex="-1">{activeJob.site} parts</h1>
        <p>
          <strong>{activeJob.number}</strong> · Visit
          <time datetime={activeJob.visitDate}
            >{formatDate(activeJob.visitDate)}</time
          >
        </p>
      </div>
      <button
        class="button secondary"
        type="button"
        disabled={sharedReadOnly}
        aria-expanded={showEditJob}
        aria-controls="edit-job-sheet"
        on:click={beginEditJob}>Edit job</button
      >
    </section>
    <StatusPlate status={activeStatus} />
    <section class="required-parts" aria-labelledby="parts-heading">
      <div class="section-heading">
        <div>
          <p class="drawing-label">Required parts and their sources</p>
          <h2 id="parts-heading">Parts held for this job</h2>
        </div>
        <button
          class="button secondary"
          type="button"
          disabled={sharedReadOnly}
          aria-expanded={showPartForm}
          aria-controls="add-part-sheet"
          on:click={openPartForm}>Add required part</button
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
                    disabled={sharedReadOnly}
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
              disabled={sharedReadOnly}
              aria-expanded={allocationRequirementId === requirement.id &&
                !showSupplierForm}
              aria-controls="allocation-sheet"
              on:click={(event) =>
                openAllocation(requirement, event.currentTarget as HTMLElement)}
              >Allocate part</button
            ><button
              class="button secondary"
              type="button"
              disabled={sharedReadOnly || covered >= requirement.quantity}
              aria-expanded={showSupplierForm &&
                allocationRequirementId === requirement.id}
              aria-controls="supplier-sheet"
              on:click={(event) =>
                openSupplierForm(
                  requirement,
                  requirement.quantity - covered,
                  event.currentTarget as HTMLElement
                )}>Check supplier date</button
            >
          </div>
        </article>
      {/each}
    </section>
    {#if workspace.lastActionAllocationId}<div class="undo-row">
        <span>The last allocation can be reversed.</span><button
          class="text-button"
          data-testid="undo-allocation"
          type="button"
          disabled={sharedReadOnly}
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
        disabled={sharedReadOnly}
        aria-expanded={showSourceForm}
        aria-controls="source-sheet"
        on:click={openSourceForm}>Add a source</button
      >
    </section>
  {:else if page === 'privacy'}
    <section class="legal-copy">
      <p class="drawing-label">Privacy</p>
      <h1 tabindex="-1">How Parts Promise handles data</h1>
      <h2>Local data in this browser</h2>
      <p>
        Jobs, required parts, sources, and allocations are stored in IndexedDB
        on this browser. The live workspace uses
        <code>parts-promise-live-v1</code>. The sample uses
        <code>parts-promise-demo-v1</code>.
      </p>
      <h2>Signed-in firm data</h2>
      <p>
        A signed-in firm can copy chosen local records to its shared workspace.
        The server keeps firm records separate by organization and records sync
        changes in an audit log.
      </p>
      <p>
        Microsoft Entra handles sign-in. Sociobot and Dodo handle checkout.
        Parts Promise stores no password or payment-card number.
      </p>
      <h2>The demo is separate</h2>
      <p>
        Demo records never enter the live local workspace. Reset restores the
        bundled sample. Leaving demo deletes its browser database.
      </p>
      <h2>Demo requests</h2>
      <p>
        The demo makes only same-origin GET requests and never asks for camera
        access.
      </p>
      <h2>Your control</h2>
      <p>
        Export a versioned backup before moving devices or clearing browser
        data. Browser site-data controls remove local records.
      </p>
    </section>
  {:else if page === 'terms'}
    <section class="legal-copy">
      <p class="drawing-label">Terms</p>
      <h1 tabindex="-1">Terms for using Parts Promise</h1>
      <h2>Use the evidence, not a guarantee</h2>
      <p>
        Parts Promise helps you record what is held for a job. Supplier dates
        and stock checks can change. You decide whether to promise a visit date.
      </p>
      <h2>This release</h2>
      <p>
        Sign-in and firm workspaces are available. Barcode scanning and
        supplier-order actions are not included yet.
      </p>
      <h2>Plans and payment</h2>
      <p>
        Workshop is $39 each month plus $8 for each active technician. The owner
        is included. Sociobot/Dodo is the merchant of record and handles
        refunds.
      </p>
      <p>
        Checkout begins only after you press its button. The current test
        product still needs operator registration, so no charge can be started
        yet.
      </p>
    </section>
  {:else}
    <section class="not-found">
      <p class="drawing-label">404</p>
      <h1 tabindex="-1">Page not found</h1>
      <p>
        This address does not match a Parts Promise page. Return to your jobs or
        the home page.
      </p>
      <div class="hero-actions">
        <a
          class="button"
          href="/jobs"
          on:click={(event) => follow(event, '/jobs')}>Open jobs</a
        ><a href="/" on:click={(event) => follow(event, '/')}>Go to home</a>
      </div>
    </section>
  {/if}

  {#if showAddJob}
    <section
      id="add-job-sheet"
      class="work-sheet"
      aria-labelledby="add-job-title"
    >
      <div class="sheet-heading">
        <h2 id="add-job-title" tabindex="-1">
          Add a job and its first required part
        </h2>
        <button
          class="text-button"
          type="button"
          on:click={() => closeSheet('add-job', () => (showAddJob = false))}
          >Close</button
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
    <section
      id="edit-job-sheet"
      class="work-sheet"
      aria-labelledby="edit-job-title"
    >
      <div class="sheet-heading">
        <h2 id="edit-job-title" tabindex="-1">Edit this job</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => closeSheet('edit-job', () => (showEditJob = false))}
          >Close</button
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
    <section
      id="add-part-sheet"
      class="work-sheet"
      aria-labelledby="add-part-title"
    >
      <div class="sheet-heading">
        <h2 id="add-part-title" tabindex="-1">Add a required part</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => closeSheet('add-part', () => (showPartForm = false))}
          >Close</button
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
      id="allocation-sheet"
      class="work-sheet allocation-sheet"
      aria-labelledby="allocation-title"
    >
      <div class="sheet-heading">
        <h2 id="allocation-title" tabindex="-1">
          Allocate {requirement?.description}
        </h2>
        <button
          class="text-button"
          type="button"
          on:click={() =>
            closeSheet('allocation', () => (allocationRequirementId = ''))}
          >Close</button
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
                disabled={availableQuantity(workspace!, source.id) <= 0}
              /><span
                ><strong>{source.name}</strong> · {formatQuantity(
                  availableQuantity(workspace!, source.id),
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
    <section
      id="source-sheet"
      class="work-sheet"
      aria-labelledby="source-title"
    >
      <div class="sheet-heading">
        <h2 id="source-title" tabindex="-1">Add a source</h2>
        <button
          class="text-button"
          type="button"
          on:click={() => closeSheet('source', () => (showSourceForm = false))}
          >Close</button
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
    <section
      id="supplier-sheet"
      class="work-sheet"
      aria-labelledby="supplier-title"
    >
      <div class="sheet-heading">
        <h2 id="supplier-title" tabindex="-1">
          Attach supplier order evidence
        </h2>
        <button
          class="text-button"
          type="button"
          on:click={() =>
            closeSheet('supplier', () => {
              showSupplierForm = false;
              allocationRequirementId = '';
            })}>Close</button
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

  {#if showImportForm}
    <section
      id="import-sheet"
      class="work-sheet"
      aria-labelledby="import-title"
    >
      <div class="sheet-heading">
        <h2 id="import-title" tabindex="-1">Import this workspace</h2>
        <button
          class="text-button"
          type="button"
          on:click={() =>
            closeSheet('import', () => {
              showImportForm = false;
              importPreview = null;
            })}>Close</button
        >
      </div>
      <p>
        CSV adds jobs, required parts, and van or warehouse sources. A JSON
        backup replaces this {demo ? 'sample' : 'local'} workspace after preview.
      </p>
      <button class="text-button" type="button" on:click={downloadCsvTemplate}
        >Download CSV template</button
      >
      <label
        >Choose a CSV or Parts Promise JSON backup<input
          type="file"
          accept=".csv,text/csv,.json,application/json"
          on:change={previewImport}
        /></label
      >
      {#if importPreview}
        <section
          class="import-preview"
          aria-live="polite"
          aria-labelledby="preview-import-title"
        >
          <h3 id="preview-import-title">Import preview</h3>
          <p>
            {importPreview.counts.jobs} jobs · {importPreview.counts
              .requirements}
            required parts · {importPreview.counts.sources} sources · {importPreview
              .counts.allocations}
            allocations
          </p>
          {#if importPreview.errors.length}
            <div class="form-error" role="alert">
              <strong>Fix these rows before importing:</strong>
              <ul>
                {#each importPreview.errors as error}<li>{error}</li>{/each}
              </ul>
            </div>
          {:else}
            <p>
              No row errors found. Only the {demo ? 'sample' : 'local'} workspace
              will change.
            </p>
            <button class="button" type="button" on:click={applyImport}
              >Import {importFileName}</button
            >
          {/if}
        </section>
      {/if}
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
  <small>Account workspace release</small>
</footer>
