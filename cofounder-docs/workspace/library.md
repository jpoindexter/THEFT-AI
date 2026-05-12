# Library

## What The Library Is

The Library is the shared file system for your workspace.

Every agent can access every file in the Library. That makes it the default place for documents, uploads, generated files, and other reference material that should stay available across tasks.

## How Departments Work In The Library

Every file in the Library must be associated with a department.

That department does not limit access. All agents can still read the file.

Instead, the department acts as a hint about which lane of work the file is most closely related to. For example, a pricing model might live under Finance, while a launch brief might live under Marketing.

## What Users Can Do In The Library Tab

In the Library tab, users can:

- upload files into the shared library
- search across library files
- browse files by department folder
- open directories and files
- pin important files so they stay surfaced at the top of the file list for that file's department
- chat with a specific file when you want an agent to use it as focused context
- use department association to understand which files are most relevant to which kind of work

## Browsing Files

The Library starts at the folder level.

Open a department folder to see that department's files and directories. From there, you can move back to all folders, move up to a parent directory, search within the library, open a file, or pin a file.

When a file is open, Cofounder shows the file contents in the Library view so you can inspect the artifact without leaving the workspace.

## Editing Markdown And Text Files

You can edit supported Markdown and plain-text files directly from Library preview.

Open an editable file, choose **Edit**, make your changes, then save. Cofounder updates the shared Library file and refreshes the preview after the save completes.

Editing is available for small Markdown and plain-text files when Cofounder can load the complete file and confirm which version you opened. It is not available for folders, archived files, locked files, read-only files, truncated large files, or preview-only formats such as CSV, HTML, JSON, code, images, PDFs, binary files, and specialized artifact data.

If someone or an agent changes the file after you opened it, Cofounder treats the save as a conflict. Reload the latest preview, review your draft, and save again only if your changes still apply.

For formats that are not editable in preview, use file chat or ask an agent to update the file.

## Pinned Files

Pinning a file in the Library tab keeps that file at the top of the list for its department.

This is a visibility feature, not an access-control feature.

Pinned files are still regular Library files. All agents can still access them, and the file still belongs to the same department as before. Pinning simply makes the file easier to find when someone is browsing that department's files.

This is useful for files that people need to come back to often, such as:

- core strategy docs
- recurring templates
- team reference material
- important spreadsheets
- current working briefs

If a department has multiple pinned files, they appear before the department's unpinned files.

## What Agents Do With Library Files

Agents can use Library files as shared context across the workspace.

Any file an agent creates should be automatically saved to the Library, so it stays available for future work and for other agents that may need it later.

That means the Library becomes the durable record for generated outputs like reports, docs, exports, plans, and other working files.

For example, marketing work often lands here automatically as:

- campaign briefs, launch plans, and messaging docs
- decks, presentations, one-pagers, and branded docs
- image directions, page concepts, and design variants
- audio, short video, and social draft assets
- measurement notes, SEO briefs, and follow-up plans

That makes the Library the default place to review, reuse, and share generated marketing assets across the workspace.

## Reusable Scripts

Agents can also save reusable scripts to the Library.

Scripts live under `scripts/` and can be written in Python, Bash, TypeScript, or JavaScript. They are useful when a workflow needs to be run again later with new inputs, such as enriching a CSV, transforming exported data, checking records against an API, or producing a recurring report.

Agents can list saved scripts, read an existing script before changing it, write a new script, and run a saved script inside the session sandbox. If an agent writes a script with the same filename as an existing Library script, the saved script is updated.

From the Library, users can open a saved script and choose **Run script**. The run dialog can pass an optional input file from the Library, or an exact `/workspace/` path, to the script. Scripts that accept files should expose an `--input <path>` argument so the Library run flow can pass the selected file directly.

A common pattern is:

- add a custom integration for a private enrichment API
- ask an agent to write `enrich_leads.py` and save it to the Library
- upload a new leads CSV
- run the script from the Library with that CSV selected

The script can read the custom integration's environment variables at runtime, call the API, and write the enriched results back to the workspace.

## Next Steps

- [Departments](/workspace/departments)
- [Canvas](/workspace/canvas)
- [Agents Overview](/agents/overview)
- [Custom Integrations](/integrations/custom-integrations)
