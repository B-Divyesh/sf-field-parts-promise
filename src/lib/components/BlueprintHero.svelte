<script lang="ts">
  export let compact = false;
</script>

<figure class:compact class="blueprint-hero">
  <img
    src="/assets/blueprint-hero.svg"
    width="1200"
    height="900"
    alt="A service drawing connects a job plate to warehouse, van, and supplier evidence."
  />
  {#if !compact}
    <figcaption>
      Every leader ends at the source that holds the part for the job.
    </figcaption>
  {/if}
</figure>
