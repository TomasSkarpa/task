<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		open = $bindable(false),
		openTaskCount,
		loading = false,
		onConfirm,
	}: {
		open?: boolean;
		openTaskCount: number;
		loading?: boolean;
		onConfirm: () => void | Promise<void>;
	} = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		}
		if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleClose() {
		open = false;
	}
</script>

<dialog
	bind:this={dialogEl}
	class="w-[min(100%,24rem)] rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-foreground/20"
	aria-labelledby="close-day-title"
	onclose={handleClose}
	oncancel={(event) => {
		event.preventDefault();
		handleClose();
	}}
>
	<form method="dialog" class="space-y-5 p-6">
		<div class="space-y-2">
			<h2 id="close-day-title" class="text-lg font-semibold tracking-tight">Close this day?</h2>
			<p class="text-sm text-muted-foreground">
				{#if openTaskCount === 0}
					No open tasks. Tomorrow starts empty.
				{:else if openTaskCount === 1}
					1 open task will move to tomorrow.
				{:else}
					{openTaskCount} open tasks will move to tomorrow.
				{/if}
			</p>
		</div>
		<div class="flex flex-wrap justify-end gap-2">
			<Button type="submit" variant="outline" disabled={loading}>Keep working</Button>
			<Button
				type="button"
				variant="destructive"
				disabled={loading}
				onclick={async () => {
					await onConfirm();
					handleClose();
				}}
			>
				{loading ? 'Closing…' : 'Close day'}
			</Button>
		</div>
	</form>
</dialog>
