---
name: Form reset guard pattern
description: Safe pattern for auto-populating forms from server data without clobbering in-progress edits.
---

## Rule
When using `useEffect` to reset a react-hook-form from server-fetched data, guard with `!form.formState.isDirty`:

```tsx
useEffect(() => {
  if (!isLoading && !form.formState.isDirty) {
    form.reset({ ...serverValues });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isLoading, settings]);
```

**Why:** Without the guard, any server re-fetch (e.g. after a successful save on another tab, or optimistic update) triggers a reset that discards any edits the user is currently making in the form.

**How to apply:** After a successful `onSubmit`, react-hook-form marks `isDirty = false` automatically, so the next server update will still sync the form correctly. The guard only blocks resets while the user has unsaved changes.
