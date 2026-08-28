<script lang="ts">
  import type { PromiseStatus } from '../domain/types';

  let {
    status,
    compact = false
  }: { status: PromiseStatus; compact?: boolean } = $props();

  const marks = {
    'in-hand': '◎',
    expected: '◷',
    'at-risk': '⌁',
    check: '?'
  };
</script>

<section
  class:compact
  class={`status-plate status-${status.code}`}
  aria-live="polite"
>
  <span class="status-mark" aria-hidden="true">{marks[status.code]}</span>
  <span>
    <strong>{status.label}</strong>
    {#if !compact}<span class="status-reason">{status.reason}</span>{/if}
  </span>
</section>
