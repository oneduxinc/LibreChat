# onedux patch set

Branch `onedux/v0.8.9` = upstream tag `v0.8.9` + the patch below. Upstream workflows are removed on
this branch; the only workflow is `onedux-image.yml` (manual dispatch).

Patch (client only):
- `Chat/Menus/Endpoints/ComposerModelRow.tsx` (new): model picker under the composer + Auto/Manual switch.
- `Chat/Menus/Endpoints/ModelSelector.tsx`: export `ModelSelectorContent` with a compact `composer` variant.
- `Chat/Input/ChatForm.tsx`: mount the row in the composer's `hints` slot (primary composer only).
- `Chat/Header.tsx`: drop the header model selector.

Upgrading LibreChat: branch `onedux/<new tag>` from the new upstream tag, re-apply these four changes,
bump `BASE` in `onedux/Dockerfile` to the new upstream digest, dispatch the workflow.
