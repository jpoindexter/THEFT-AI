# COFOUNDER FRAME FLOW

> Started 2026-05-19 from direct frame review of `frames2/` and `frames/`.
> This document is intentionally written as the frames are inspected, so it preserves observed sequence instead of reverse-engineering a desired flow.

## MVP Flow To Build

1. Focused entry: login/local entry -> welcome -> founder profile -> company name.
2. Company seed: show a canvas with a central Operator/Cofounder node before exposing departments.
3. Guided idea interview: accept rough founder text, summarize it, then ask staged refinement questions.
4. Plan artifact: turn answers into a Business Plan card with `Accept & activate departments`.
5. Roadmap: after activation, show a company roadmap with founder-input, approval, and agent-doable nodes.
6. Artifact workflow: generate work in place, let the founder critique it, create versions, export it, and lock it into Library.
7. Department handoff: locked artifacts become file-backed context for department work, e.g. `DESIGN.md` feeds the Design department.
8. Stable home: show roadmap progress, active tasks, suggested next tasks, and a persistent Operator/Cofounder panel.

Avoid in MVP:

- Surprise platform-update modals during onboarding.
- Model/skill/integration configuration in the founder happy path.
- Dead task buttons that do not open the artifact or explain the next action.
- Sending the founder to a generic dashboard before they know what happened.

## Current THEFT Product Fixes To Track

- Add a small AI/help affordance beside confusing setup questions, starting with `Stage interview: How will you land the first 5 paying customers?`.
- The helper should translate business-stage prompts into plain language, then offer a draft answer the founder can edit.
- Task review must explain where completed work goes: department output -> Library artifact -> founder approval/revision.
- A task with no Library artifact should not look complete. It should ask Operator to publish output or explain the blocker.
- Keep the existing THEFT Mission Control visual shell for now, but make the first-run path guided before the founder lands in an empty dashboard.

## Review Log

### frames2/frame_0001.jpg - frames2/frame_0007.jpg

Observed state: login.

Screen contract:

- The product starts outside the app shell.
- Left side is a large brand/reference card with the headline `Cofounder`, a pixel-art landscape image, and the promise `Run an entire company with agents`.
- Right side is a quiet sign-in panel: `Cofounder`, `Let's build your company.`, a single `Sign in with GitHub` button, and small legal links.
- There is no dashboard, issue tracker, department grid, runtime log, adapter configuration, or admin navigation before auth.

THEFT implication:

- THEFT should start with a focused welcome/auth or local-trusted entry screen, not Mission Control.
- The first screen should sell one simple product promise: build/run the company with agents.
- Any local-first/no-cloud copy can be present, but it should not turn the first screen into settings.

### frames2/frame_0009.jpg - frames2/frame_0015.jpg

Observed state: post-auth onboarding welcome.

Screen contract:

- After sign-in, the URL changes to `/onboarding`.
- The app still does not reveal the app shell.
- Top-left includes only a small `Log out` affordance.
- Left side shows large ASCII/pixel-style brand text for `General Intelligence Company`.
- Right side shows `Cofounder`, the line `Automate your business with natural language.`, a single `Continue` button, and legal links.
- The user makes exactly one decision: continue into setup.
- After clicking `Continue`, the app briefly loads a blank page before the next onboarding step.

THEFT implication:

- After auth/local entry, THEFT should land on a focused setup welcome, not immediately on the dashboard.
- The welcome should explain the product in one line and offer one primary action.
- The app chrome/nav should remain hidden until setup has enough context to create the company workspace.

### frames2/frame_0016.jpg - frames2/frame_0021.jpg

Observed state: legal-link side branch.

Screen contract:

- The Privacy Policy and Terms links navigate away from `app.cofounder.co/onboarding` to the public marketing domain.
- Public legal pages use a marketing navbar with `How to`, `Start`, `Build`, `Sell`, `Scale`, `Resources`, `Pricing`, `Log in`, and `Run a company`.
- This is not part of the company-building flow.

THEFT implication:

- Legal links can leave the setup flow, but the setup flow itself should not depend on them.
- If THEFT keeps local-first authless mode, legal links should be visually secondary and should not be mistaken for setup actions.

### frames2/frame_0025.jpg - frames2/frame_0041.jpg

Observed state: founder profile and stage setup.

Screen contract:

- The left side keeps the large `General Intelligence Company` ASCII mark throughout.
- The right side changes one focused question at a time.
- Question 1: `What should we call you?`
  - Single text input labeled `Your name`.
  - Captured value: `jpoindexter`.
- Question 2: `What's your experience building products?`
  - Numbered selectable rows.
  - Options: `I write code myself`, `I manage engineers with a dev team`, `I'm not involved on the technical side`.
  - Captured selection: `I'm not involved on the technical side`.
- Question 3: `Which best describes you?`
  - Numbered selectable rows.
  - Options: `Product`, `Engineering`, `Design`, `Marketing`, `Sales`, `Operations`, `Founder / Executive`, `Other`.
  - Captured selection: `Founder / Executive`.
- Question 4: `What stage is your idea?`
  - Horizontal maturity scale, not a dropdown.
  - Labels: `Pre-idea`, `Idea`, `Pre-MVP`, `MVP`, `Customers`, `Revenue`, `Public`.
  - The captured interaction moves through multiple positions and clicks `Next` with `Pre-idea` selected.

Flow contract:

- Setup asks personal context before company context.
- Each step has one job and one primary action.
- Selections are visually confirmed with a check icon or active stage state.
- Onboarding is still not a dashboard. It is a controlled interview.

THEFT implication:

- THEFT should preserve a first-run interview before Mission Control.
- For the captured happy path, the founder profile is `non-technical founder/executive`.
- Stage selection should affect the next task/objective. A pre-idea founder should not land on a generic dashboard with empty departments; they should land in a guided idea-shaping/company-building flow.

### frames2/frame_0042.jpg - frames2/frame_0047.jpg

Observed state: company existence check and company creation.

Screen contract:

- After stage selection, the app shows a loading/checkpoint screen: `Checking for companies...`.
- The visual anchor changes from ASCII mark to a pixel-art sunflower.
- If no company exists, the app prompts `Create your company`.
- The company creation form asks for one field: `Company name`.
- Captured company name: `THEFT`.
- The primary button changes from `Continue` to `Creating...` while the company is being created.
- App chrome remains hidden except for the small `Log out` affordance.

Flow contract:

- Company creation is not a large setup wizard.
- The company name is captured only after founder profile/stage context.
- The product treats creation as a real transition, with an explicit creating state.

THEFT implication:

- THEFT should create the Paperclip company only after it has enough founder/stage context.
- The company creation step should stay minimal.
- After creating the company, the next screen must be part of the guided flow, not a dead/empty dashboard.

### frames2/frame_0048.jpg - frames2/frame_0058.jpg

Observed state: company canvas initialization and first company-context prompt.

Screen contract:

- After `Creating...`, the company form fades out.
- The URL changes into an org-scoped onboarding route: `/org/theft-881ecf/onb...`.
- A faint circular company canvas initializes in the main area.
- A small sunflower seed appears at the center, then becomes a centered node labeled `Cofounder`.
- A right-side panel slides in after the canvas appears.
- The right panel asks `Tell me more about your company`.
- It provides a text area with placeholder `Share what you're building...`, a plus affordance, and a submit button.

Flow contract:

- The company is represented visually before the app shows departments/tasks.
- The founder is asked for company context in a guided side panel while the company seed remains visible.
- The product is now in a cofounder conversation/canvas mode, not a dashboard mode.

THEFT implication:

- After Paperclip company creation, THEFT should show the company map/seed immediately.
- The next step should be a guided Operator/Cofounder prompt for company context.
- Mission Control should not appear until the product has converted this context into an initial company map/task plan.

### frames2/frame_0059.jpg - frames2/frame_0075.jpg

Observed state: founder describes the company in free text.

Screen contract:

- The right panel stays on `Tell me more about your company`.
- The founder types directly into the prompt composer.
- Captured description: `Design service as a subscription u pay flat fee get ux services`.
- After submit, the composer placeholder changes to `Ask for follow up changes...`.

Flow contract:

- The product accepts rough founder language and should normalize it later.
- The first company description is not a formal business-plan form.
- The composer becomes a conversational follow-up control after the first answer.

THEFT implication:

- THEFT should accept messy shorthand like the user's actual input and turn it into structured company memory.
- Do not force the founder to write polished copy at setup time.
- The Operator helper should be able to ask follow-up questions or help clarify this exact input.

### frames2/frame_0076.jpg - frames2/frame_0094.jpg

Observed state: onboarding becomes a persistent chat thread.

Screen contract:

- The right panel title changes to `Onboarding`.
- Subtitle: `THEFT · jpoindexter`.
- The founder's company description appears as a message bubble.
- Cofounder starts a response with a typing indicator, then shows an expandable `Thinking` row.
- First visible generated response: `Let me introduce the business onboarding and ask refinement questions.`
- The canvas remains visible while the response is generated.

Flow contract:

- The system acknowledges the founder's raw input before generating company structure.
- The AI explains the next step as refinement questions.
- The company canvas and chat are linked in one workspace: canvas left, guided conversation right.

THEFT implication:

- The Operator should not disappear after initial input; it should become the persistent guide.
- The app should show a plain-language "what I am doing next" response before creating tasks/departments.
- This is where an AI helper/star affordance fits naturally: help the founder clarify rough input before the company map is finalized.

### frames2/frame_0095.jpg - frames2/frame_0100.jpg

Observed state: Cofounder frames and begins refinement.

Screen contract:

- The initial AI response becomes readable:
  - Greets Jason.
  - Says it is excited to build the company.
  - Normalizes the idea as a flat-fee UX subscription service.
  - Says the next work is to sharpen who the company serves, pricing/delivery, differentiation, and where to start.
- A status row appears: `Asking a refinement question`.

Flow contract:

- The AI does not immediately create departments/tasks from a vague idea.
- It first summarizes what it understood and states the next refinement axis.
- The founder can see the AI's current action inline.

THEFT implication:

- After the founder enters rough business context, Operator should summarize it back in founder language.
- The next move should be a refinement question, not an immediate blank Mission Control or a random task list.
- Runtime/progress details can be visible as simple natural-language rows, not admin logs.

### frames2/frame_0101.jpg - frames2/frame_0105.jpg

Observed state: refinement action is running and user input is gated.

Screen contract:

- The active action row expands into a specific task: `Ask grouped refinement questions about the design subscription b...`.
- When the founder tries to interact while onboarding is running, a toast appears: `Cofounder cannot be interrupted during onboarding`.

Flow contract:

- Onboarding has agent-driven phases where interruption is blocked.
- The app tells the founder why the input did not work.
- The UI still keeps the composer visible, but it is effectively gated during the current agent action.

THEFT implication:

- If THEFT blocks input during a setup action, it must explain that clearly.
- Better THEFT behavior may be to allow the founder to queue clarifications, but the reference flow itself gates interruption during onboarding.
- Dead-looking buttons are unacceptable; disabled/gated actions need explicit feedback.

### frames2/frame_0120.jpg

Observed state: first refinement decision card.

Screen contract:

- The action row changes from active to completed: `Asked a refinement question`.
- Tool/status rows show:
  - `Running Tool: Ask User Question`
  - `Waited for the user's answer`
- A structured question card appears in the right panel.
- The card indicates `1/5`.
- Question: `Who is your primary customer?`
- Options shown:
  - `Startups (seed to Series A)` with a `Recommended` badge and description `Early-stage teams that need design but can't justify a full-time hire.`
  - `SMBs & agencies` with description about outsourcing design work.
  - `Mid-market SaaS companies` with description about extra design capacity.
  - `Solopreneurs & indie makers` with description about affordable, on-demand design support.
  - `Something else`.
- Bottom actions: `Decide all` and `Decide this one`.

Flow contract:

- Refinement questions are not plain chat questions; they become structured decision cards.
- The app can recommend one answer while still letting the founder choose.
- The founder can answer one card or delegate all decisions.

THEFT implication:

- THEFT onboarding should include structured founder decision cards, not just a textarea.
- AI help should offer suggested choices with reasoning, then let the founder accept one or ask for alternatives.
- This directly answers the user's earlier confusion: `How will you land the first 5 paying customers?` should be a helper/decision card with channel, offer, timeline, and proof-point options, not an empty text box.

### frames2/frame_0160.jpg - frames2/frame_0180.jpg

Observed state: refinement decision sequence advances.

Screen contract:

- `frame_0160.jpg` is still question 1/5.
- By `frame_0170.jpg`, the card has advanced to question 3/5.
- Question 3/5: `How do you structure the flat fee?`
- Recommended option: `Single tier (~$3–5k/mo)`.
- Other options:
  - `Two tiers (e.g., $2k and $5k/mo)`
  - `Three tiers (e.g., $1.5k, $3.5k, $7k/mo)`
  - `Not sure yet`
  - `Something else`
- The same bottom actions remain: `Decide all` and `Decide this one`.

Flow contract:

- Refinement is a short sequence of decision cards, not an open-ended chat.
- The system is opinionated: it gives recommended defaults for ambiguous founder choices.
- The founder can accelerate through decisions instead of manually answering every question.

THEFT implication:

- THEFT's onboarding should use a staged decision-card model for ambiguous startup questions.
- For the design subscription happy path, pricing/packaging should be resolved before generating tasks like “make a sales page.”
- The app should avoid asking the founder to write a fully formed business strategy from scratch.

### frames2/frame_0220.jpg - frames2/frame_0260.jpg

Observed state: refinement decisions become workspace context.

Screen contract:

- All five questions are shown as answered.
- Listed questions:
  - `Who is your primary customer?`
  - `What does the subscription cover?`
  - `How do you structure the flat fee?`
  - `How is work delivered?`
  - `What makes this service hard to replicate?`
- Expanded selected answers include:
  - Primary customer: `Startups (seed to Series A)`.
  - Pricing: `Single tier (~$3–5k/mo)`.
  - Delivery: `Async-first (task queue, Figma, Loom)`.
  - Differentiation: `Vertical specialization (e.g., fintech, healthtech)`.
- Agent status changes to execution:
  - `Running terminal command`
  - `Wrote to workspace`
  - `Thought through the next step`
- The AI says: `Let me now create the business context file based on what Jason has told me.`

Flow contract:

- The founder's decisions become a durable workspace artifact/context file.
- The app surfaces actions in friendly terms while still showing that real work is happening.
- The product does not jump from Q&A straight to dashboard; it first writes the company context.

THEFT implication:

- After onboarding decisions, THEFT should create/update a visible company memory artifact.
- That artifact should feed future tasks and should be inspectable in Library/company memory.
- The product should show what it saved, not just say setup is complete.

### frames2/frame_0300.jpg - frames2/frame_0340.jpg

Observed state: generated Business Plan artifact review.

Screen contract:

- The generated company memory becomes a visible artifact card titled `Business Plan`.
- Subtitle: `THEFT · jpoindexter`.
- The card has `Edit` and expand/open controls.
- Visible sections include:
  - `Product or Service`
  - `ICP`
  - `Mission`
  - `Business Classification`
  - `Company Values`
  - `Go-to-Market Strategy`
- The artifact summarizes the chosen positioning:
  - Flat-fee UX design subscription.
  - Early-stage startup ICP.
  - Single monthly fee.
  - Async delivery.
  - Vertical/domain specialization.
- Primary action: `Accept & activate departments`.

Flow contract:

- The founder reviews a generated artifact before departments/tasks are activated.
- The business plan is not hidden in logs or comments; it is the main object in the panel.
- Activation happens after the founder can inspect/edit the generated context.

THEFT implication:

- THEFT needs this exact pre-activation artifact review moment.
- The current app's first-run flow should not jump directly to department cards without showing the synthesized company context.
- `Accept & activate departments` is the right handoff into Mission Control.

### frames2/frame_0360.jpg - frames2/frame_0400.jpg

Observed state: department activation and brand design flow.

Screen contract:

- After accepting the Business Plan, the company canvas expands from one Cofounder node into a department map.
- Departments visible around the center:
  - Marketing
  - Finance
  - Operations
  - Sales
  - Engineering
  - Legal
  - Design
  - Support
- Status on the Business Plan action changes to `Activating departments...`.
- The next recommended setup block appears: `NEXT: BRAND DESIGN`, with context saved.
- The main canvas changes into a full brand-design flow.
- Brand step example: `Pick a vibe to start with.`
- Vibe cards include `Editorial calm`, `Saturated tech`, `Soft pop`, `Brutalist grid`, `Pastel utility`, and `None of these`.
- Another brand step asks `Want to narrow it down?` with upload references, optional brand description, and `Generate brand kit`.
- The right panel remains open with the Business Plan and chat controls.

Flow contract:

- Departments activate only after company context is accepted.
- The next step is not a generic dashboard; it is a guided department-specific setup flow.
- Brand/design setup is treated as a creative guided task with visual choices, uploads, and generated output.

THEFT implication:

- After company context acceptance, THEFT should activate the 8 departments visually.
- The next recommended work should be a guided flow tied to a department, not an empty department grid.
- For the user's design-service business, a brand/design flow before sales-page execution makes sense if it produces reusable brand context.

### frames2/frame_0401.jpg - frames2/frame_0410.jpg

Observed state: brand narrowing step interaction.

Screen contract:

- The user remains on the brand-design flow, step `3/5`.
- The selected vibe is visible as a compact pill: `Saturated tech`, `your pick`, and `CHANGE`.
- The main prompt is `Want to narrow it down?`
- Supporting copy explains that references and a few words can push the agent in a specific direction.
- The upload dropzone accepts screenshots, moodboards, or photos.
- File guidance says PNG, JPG, or WebP are accepted and that the agent reads what is in the image, not just colors.
- A second field asks `Describe your brand (optional)`.
- The user can click into the brand text area without leaving the flow.
- Two forward paths are visible:
  - `Skip · just use the vibe`
  - `Generate brand kit`
- The right panel still shows the Business Plan artifact and a composer with `I want to change the business plan`.

Flow contract:

- Brand setup is allowed to proceed with no extra input after the vibe is selected.
- Reference upload and brand description are optional enhancement inputs, not blockers.
- The right-side Cofounder panel stays available for changing the business plan while the guided design flow continues.

THEFT implication:

- THEFT should not ask the founder for perfect brand language before moving forward.
- The guided flow should have a low-friction default path and an optional richer path.
- If we add an AI helper/star affordance, this is a strong place for it: help the founder write the optional brand description from rough language.

### frames2/frame_0411.jpg - frames2/frame_0430.jpg

Observed state: founder types an optional brand direction.

Screen contract:

- The founder starts typing in `Describe your brand (optional)`.
- Captured text builds from `ed` to `edgy modern ai based ux compan...`.
- The final visible text in this range is `edgy modern ai based ux compan.`
- The product does not validate, interrupt, or ask for polished brand language while the founder types.
- `Generate brand kit` remains available while text is being entered.
- The upload area remains optional and empty.

Flow contract:

- The founder can use shorthand and incomplete wording.
- Brand direction is collected as raw founder intent.
- The AI is expected to normalize this into a usable brand kit after submission.

THEFT implication:

- THEFT should treat rough founder text as useful signal.
- Do not block the user on grammar, exact terminology, or formal design language.
- The AI helper should be able to turn rough phrases like `edgy modern ai based ux company` into a clearer prompt before or during generation.

### frames2/frame_0431.jpg - frames2/frame_0440.jpg

Observed state: brand kit generation begins.

Screen contract:

- The user clicks `Generate brand kit`.
- The main guided canvas changes to a generation state.
- Headline: `Painting your brand kit...`
- Supporting copy: the agent is mixing colors, choosing type, and laying out a single board the founder can react to.
- Time estimate: `About 2 minutes.`
- The progress indicator advances to step `4/5`.
- Animated/status chips include:
  - `COMPOSING BOARD`
  - `BALANCING PALETTE`
  - `SETTING TYPE`
- The visual center shows a generated UI/brand-card illustration with colors, type, and small layout blocks.
- The right onboarding panel remains visible with the Business Plan artifact.

Flow contract:

- Generation is a first-class step, not a hidden background wait.
- The founder sees what kind of work is happening in plain language.
- The flow keeps context visible while the agent works.

THEFT implication:

- When THEFT starts a guided AI task, show an explicit work state with human-readable substeps.
- Do not dump the founder into runtime diagnostics while a creative/product task runs.
- The Operator bar can stay secondary, but the primary canvas should explain the current AI job.

### frames2/frame_0441.jpg - frames2/frame_0460.jpg

Observed state: brand kit generation continues.

Screen contract:

- The screen remains on `Painting your brand kit...`.
- The step indicator remains `4/5`.
- The animated illustration continues changing subtly while the progress bar advances.
- The active status emphasis stays on `COMPOSING BOARD`.
- `BALANCING PALETTE` and `SETTING TYPE` remain visible as upcoming/parallel work states.
- The founder is not shown a dashboard or department grid during this wait.

Flow contract:

- Long AI work keeps the founder in the same guided context.
- The product fills wait time with meaningful progress language instead of logs.

THEFT implication:

- THEFT guided tasks need stable progress screens for multi-minute work.
- Runtime details should be available elsewhere, but the main happy path should stay founder-readable.

### frames2/frame_0461.jpg - frames2/frame_0470.jpg

Observed state: brand kit generation still running.

Screen contract:

- The generation screen stays stable.
- The progress bar advances gradually.
- The founder is not asked to make another decision yet.
- The right panel stays anchored to onboarding and the Business Plan.

Flow contract:

- The app tolerates a long-running AI generation step without changing modes.

THEFT implication:

- Do not route a founder back to Mission Control just because an agent task is running.
- Keep the guided flow in place until the output is ready for review.

### frames2/frame_0471.jpg - frames2/frame_0480.jpg

Observed state: sustained brand kit wait.

Screen contract:

- The frame sequence remains on `Painting your brand kit...`.
- The same three work chips remain visible.
- The progress bar continues advancing, but no output is ready yet.

Flow contract:

- Repeated wait frames preserve the user's place in the guided flow.

THEFT implication:

- For MVP, a stable progress screen is enough as long as it keeps the founder oriented and eventually lands on a reviewable artifact.

### frames2/frame_0481.jpg - frames2/frame_0490.jpg

Observed state: brand kit output starts materializing.

Screen contract:

- The progress screen remains `Painting your brand kit...`.
- The active work state moves from `COMPOSING BOARD` toward `BALANCING PALETTE`.
- By `frame_0490`, the abstract illustration is replaced by a concrete generated board preview.
- The generated preview uses the company name `THEFT` as a large first-viewport brand signal.
- The board appears dark, high-contrast, and tech-oriented, matching the selected `Saturated tech` vibe and rough `edgy modern ai based ux` direction.
- Visible board elements include:
  - Large `THEFT` wordmark.
  - Color palette swatches.
  - Typography/specimen area.
  - UI/card preview tiles.
  - Small image/reference tiles.
- A small status overlay on the generated preview reads `ITERATING`.

Flow contract:

- The founder sees the artifact being created before final review.
- The generated work is specific to the company name and prior answers, not generic filler.

THEFT implication:

- Guided AI outputs need to become real artifacts on screen, not just tasks marked complete.
- The first generated asset should visibly use the company name/context so the founder trusts that the system understood them.

### frames2/frame_0491.jpg - frames2/frame_0500.jpg

Observed state: generated brand board iterates in place.

Screen contract:

- The generated `THEFT` board remains visible on the main canvas.
- The status overlay continues to read `ITERATING`.
- The primary page headline still says `Painting your brand kit...`
- The work chips remain visible, with `BALANCING PALETTE` now emphasized.
- The founder still has no final accept/revise controls in this range.

Flow contract:

- The generated output can be shown while the agent continues refining it.
- Review controls wait until the output is ready enough to judge.

THEFT implication:

- Showing partial output is useful, but the app should clearly distinguish `still iterating` from `ready for founder decision`.

### frames2/frame_0501.jpg - frames2/frame_0510.jpg

Observed state: brand board remains visible while iteration continues.

Screen contract:

- The generated board remains centered.
- The `ITERATING` overlay remains on the board.
- `Painting your brand kit...` remains the page headline.
- The progress bar continues slowly.
- No accept, revise, or edit decision controls are visible yet.

Flow contract:

- The founder is watching the artifact mature, not reviewing it yet.

THEFT implication:

- A generated artifact should not be marked complete until the UI gives the founder a clear review action.

### frames2/frame_0511.jpg - frames2/frame_0520.jpg

Observed state: brand-board iteration continues with output visible.

Screen contract:

- The visible artifact remains the dark `THEFT` board.
- The board stays labeled `ITERATING`.
- The active work chip remains `BALANCING PALETTE`.
- Progress continues, but the decision step has not appeared.

Flow contract:

- The product keeps the founder in a single coherent generation mode until review is possible.

THEFT implication:

- Do not make a completed task card the first place a founder sees generated creative output.
- The artifact should be visible inside the guided flow before it is stored elsewhere.

### frames2/frame_0521.jpg - frames2/frame_0540.jpg

Observed state: brand generation completes into review controls.

Screen contract:

- The active work chip changes to `SETTING TYPE`.
- The generated brand board expands into a clear, reviewable artifact.
- The step indicator advances to `5/5`.
- The completed board contains:
  - Large `THEFT` wordmark.
  - Tagline text: `EDGY MODERN AI BASED UX COMPAN...`
  - Palette swatches labeled roughly `VOID`, `SLATE`, `ASH`, `NEON PURPLE`, `ELECTRIC LIME`, and `CYAN SHIFT`.
  - Typography examples including `AXIOM`, `INTELLIGENCE THAT INTERFACES`, `Sohne`, and `Jet Mono`.
  - Shape language, component, metrics, and art-direction panels.
- The bottom input asks: `What should change in the next version?`
- Two review actions appear:
  - `Refine`
  - `Lock`
- The board also exposes small top-right actions, including an expand/open-style control and a download/export-style control.

Flow contract:

- Generated work becomes reviewable before it becomes final.
- The founder can either request another version or lock the result.
- The critique field is tied directly to the artifact, not buried in a chat thread.

THEFT implication:

- Generated outputs should land in an artifact review screen with explicit `refine` and `accept/lock` actions.
- The current task review page should answer "where did it put that stuff?" by opening the artifact itself, not just showing a completed task.
- Founder critique belongs next to the artifact being critiqued.

### frames2/frame_0541.jpg - frames2/frame_0580.jpg

Observed state: founder inspects and exports the generated brand kit.

Screen contract:

- The full generated board remains visible with `Refine` and `Lock` controls.
- The critique input remains empty at first.
- The founder can use the board-level download/export control.
- The browser opens a native save dialog.
- Suggested filename: `brand-kit-v1.png`.
- A toast/status message appears behind the dialog: `Brand kit image download started.`

Flow contract:

- Artifacts are not only visual previews; they can be exported.
- Export is available before locking, so the founder can inspect/share the current version.

THEFT implication:

- Library outputs should have obvious open/export controls.
- "Where did it put that stuff?" should have a concrete answer: open artifact, export artifact, and later see it in Library/company memory.

### frames2/frame_0581.jpg - frames2/frame_0583.jpg

Observed state: export completes and the founder returns to review.

Screen contract:

- The native save dialog is confirmed with `Save`.
- The browser download menu shows `brand-kit-v1.png` as `Done`.
- The app still shows the brand kit review canvas behind the browser download menu.
- The bottom-left toast remains: `Brand kit image download started.`

Flow contract:

- Export does not break the guided flow.
- After export, the founder remains positioned to refine or lock the artifact.

THEFT implication:

- Export/download should be a side action, not a route transition.
- After exporting a Library artifact, keep the user on the artifact review surface.

### frames2/frame_0584.jpg - frames2/frame_0600.jpg

Observed state: founder critiques the generated brand kit.

Screen contract:

- The export menu closes and focus returns to the brand kit review canvas.
- The critique input under the board receives focus.
- The review controls remain visible while typing:
  - `Refine`
  - `Lock`
- Captured critique: `feels too video game like needs to be more professional`.
- The founder uses plain subjective language, not design-system terminology.
- The Business Plan panel remains visible on the right, but the active work is clearly the brand kit review.

Flow contract:

- The review loop is artifact-local: inspect, optionally export, critique, then refine or lock.
- The product invites subjective founder taste before finalizing creative output.
- The founder does not have to create a new task or hunt for a comment thread to request changes.

THEFT implication:

- THEFT should let founders critique outputs beside the output itself.
- `Ask for revision` should open an artifact-aware prompt with the current artifact in context.
- Plain-English feedback like "too video game, make it more professional" should trigger a revised version.

### frames2/frame_0601.jpg - frames2/frame_0605.jpg

Observed state: founder submits the brand critique and the app starts a new version.

Screen contract:

- The founder clicks `Refine` while the critique is still visible.
- The brand board is replaced by the generation state again.
- The headline returns to `Painting your brand kit...`.
- Supporting copy says the agent is mixing colors, choosing type, and laying out a board the founder can react to.
- Step indicator moves back to `4/5`.
- Work chips reset to:
  - `COMPOSING BOARD`
  - `BALANCING PALETTE`
  - `SETTING TYPE`
- The right panel still keeps the Business Plan visible.

Flow contract:

- `Refine` does not complete the flow; it loops the founder back into generation with their critique applied.
- The product treats creative output as versioned, iterative work.
- The founder stays in the same canvas rather than navigating to a task detail page.

THEFT implication:

- Revision actions need to be real actions, not static buttons.
- A task review `Ask for revision` control should create a new artifact version and show generation progress in place.
- The previous critique should remain part of the artifact/version history.

### frames2/frame_0606.jpg - frames2/frame_0620.jpg

Observed state: revised brand kit generation continues.

Screen contract:

- The canvas stays on the same `Painting your brand kit...` generation screen.
- The progress bar slowly advances.
- `COMPOSING BOARD` remains the active work chip.
- The right panel keeps the prior Business Plan artifact visible and unchanged.
- The founder is not moved into the dashboard, task detail, or department view during the wait.

Flow contract:

- The revision wait uses the same visual language as first generation.
- The product keeps context stable while the agent works.

THEFT implication:

- Long-running output revisions should show a stable progress surface in the same place where the output will return.
- Runtime details should remain secondary to the founder-facing work state.

### frames2/frame_0621.jpg - frames2/frame_0630.jpg

Observed state: revised brand kit generation continues without a route change.

Screen contract:

- The same loading illustration, headline, work chips, and Business Plan side panel remain visible.
- The progress bar advances from the early section toward the first third of the run.
- No dashboard chrome or task-review surface interrupts the revision.

Flow contract:

- A refinement can take time, but the user remains anchored to the artifact workflow.

THEFT implication:

- For Paperclip-backed work, the app should translate agent/runtime work into founder-facing progress rather than exposing a raw runtime panel first.

### frames2/frame_0631.jpg - frames2/frame_0640.jpg

Observed state: revised brand generation remains in progress.

Screen contract:

- The loading screen is unchanged except for progress advancement.
- `COMPOSING BOARD` is still active.
- The founder can still see the Business Plan context, but cannot yet review the revised brand artifact.

Flow contract:

- The product uses repetition intentionally here: the founder waits in a stable review workflow until the revised version is ready.

THEFT implication:

- If THEFT keeps long-running generation, the wait surface needs to feel deliberate and tied to a visible output, not like a frozen dashboard.

### frames2/frame_0641.jpg - frames2/frame_0645.jpg

Observed state: revised generation continues in the same place.

Screen contract:

- The screen remains on the brand kit generation canvas.
- The `COMPOSING BOARD` chip is still active.
- The Business Plan artifact remains pinned on the right.

Flow contract:

- The app does not abandon the guided onboarding context during a long-running revision.

THEFT implication:

- Preserve the user's current intent during agent work: "I am refining this brand artifact," not "I am somewhere in the app waiting for a backend job."

### frames2/frame_0651.jpg - frames2/frame_0655.jpg

Observed state: revised generation advances from composition into palette balancing.

Screen contract:

- The progress bar reaches the next phase.
- `BALANCING PALETTE` becomes the active work chip.
- The app remains on step `4/5` and keeps the Business Plan panel visible.

Flow contract:

- Progress is named by creative work phase, not by internal job IDs.

THEFT implication:

- Founder-facing progress labels should describe the work being done: drafting, researching, designing, revising, publishing.

### frames2/frame_0690.jpg - frames2/frame_0710.jpg

Observed state: revised generation advances into type setting.

Screen contract:

- `SETTING TYPE` becomes the active work chip.
- The progress bar moves near the end of step `4/5`.
- The right panel and route context remain unchanged.

Flow contract:

- The generation progress communicates meaningful creative phases through the whole revision.

THEFT implication:

- For design/site work, progress should name the creative operation, not just say `running`.

### frames2/frame_0730.jpg - frames2/frame_0760.jpg

Observed state: revised brand board starts materializing while generation is still in progress.

Screen contract:

- The brand board preview appears again above the `Painting your brand kit...` headline.
- The active work chip remains `SETTING TYPE`.
- The review controls are not back yet.
- The board still uses the dark THEFT layout with the same general visual system, palette, and panels.

Flow contract:

- Output appears before the final review state, so the founder can see work resolving before completion.
- The app does not invite critique until generation finishes.

THEFT implication:

- It is acceptable to stream/show partial artifact output, but final review controls should only return when the artifact is ready.

### frames2/frame_0790.jpg - frames2/frame_0810.jpg

Observed state: revised brand kit returns to review as a versioned artifact.

Screen contract:

- The generation state transitions back to review.
- The step indicator moves to `5/5`.
- A `Previous iterations` strip appears below the board.
- The strip shows thumbnails for `V1` and `V2`.
- A small label indicates `2 VERSIONS`.
- `V2` is selected.
- The critique input returns with placeholder `What should change in the next version?`.
- `Refine` and `Lock` controls return.
- The board-level open/download controls remain available.

Flow contract:

- Refinement creates a new version rather than overwriting the prior artifact.
- Previous versions stay visible and selectable.
- The founder can compare, refine again, export, or lock.

THEFT implication:

- Library artifacts need version history.
- A task output should not be a single dead blob; revisions should be visible as versions.
- This directly answers the user's question: generated work should live in Library/artifact review, with version thumbnails and clear controls.

### frames2/frame_0820.jpg - frames2/frame_0830.jpg

Observed state: founder locks the brand identity artifact.

Screen contract:

- The review surface still shows `V1` and `V2`.
- A toast appears: `Brand kit image download started.`
- The next screen is a dark completion transition.
- Completion card:
  - `Brand identity`
  - `Design Agent`
  - green completion check.
- Supporting status: `Brand kit locked. DESIGN.md is finalizing in the background.`
- Primary action: `GO TO CANVAS`.

Flow contract:

- Locking turns the reviewed artifact into durable company output.
- The product names the resulting durable file/document (`DESIGN.md`).
- The founder gets a clear transition back to the broader company canvas.

THEFT implication:

- `Lock` should persist the artifact to Library/company memory and name the output.
- If THEFT creates a sales page, brand kit, plan, or research report, the UI must show exactly where it went.
- Completion should be explicit: artifact locked, file finalizing, next action available.

### frames2/frame_0840.jpg - frames2/frame_0850.jpg

Observed state: the app opens the company-building roadmap after the brand artifact is locked.

Screen contract:

- Modal title: `How to Build a Company`.
- Company label: `THEFT`.
- The flow is shown as connected columns/stages:
  - `IDEA STAGE`
  - `INITIAL STAGE`
  - `IDENTITY STAGE`
  - `BUILD STAGE`
- Visible nodes include:
  - `Initial idea` (`Needs your input`) complete.
  - `Pick a company name` complete.
  - `Prepare repository` complete.
  - `Incorporate LLC` (`Needs your input` / `Available`).
  - `Brand identity` (`Agent can do this` / `Available`).
  - `Define positioning` (`Needs approval` / `Available`).
  - `Build app` (`Agent can do this`).
  - `Build marketing website` (`Agent can do this`).
- The roadmap draws a highlighted path between completed/available next steps.

Flow contract:

- After finishing a guided artifact, the product shows the broader company roadmap.
- The roadmap separates founder-input work, approval work, and agent-doable work.
- It creates a clear next-step menu without dumping the user into raw tasks.

THEFT implication:

- Mission Control should expose a roadmap/happy path, not only department cards.
- The cofounder flow needs an obvious "what happens next" screen after onboarding artifacts.
- Current THEFT tasks like "make sales landing page" need to appear as roadmap nodes with a destination and output.

### frames2/frame_0860.jpg

Observed state: unrelated platform update modal interrupts the flow.

Screen contract:

- Modal title: `Platform updates: faster infrastructure and stronger coding agents`.
- Actions: `Dismiss` and `Read the details`.
- The underlying app appears to be the main company canvas, partially obscured.

Flow contract:

- This is not part of the company-building happy path.
- It interrupts the founder immediately after the roadmap transition.

THEFT implication:

- Avoid surprise product-update modals during onboarding or first-run company setup.
- If THEFT needs announcements, put them somewhere non-blocking after the founder reaches stable workspace context.

### frames2/frame_0870.jpg - frames2/frame_0910.jpg

Observed state: post-onboarding company canvas with Cofounder task panel.

Screen contract:

- The app shell is now visible.
- Top navigation includes `Home`, `Cofounder`, `Company`, `Tasks`, and `Library`.
- The main surface is a company map:
  - Center node: `Cofounder`.
  - Ring labels include departments such as Sales, Marketing, Design, Engineering, Legal, Finance, Operations, and Support.
  - Small artifact thumbnails appear near relevant departments.
- Right panel shows an active/selected task: `Ask Cofounder about incorporation`.
- The task prompt asks the Ops Agent to educate the founder about forming an LLC.
- The response is long-form guidance with:
  - checklist-style bullets,
  - questions to take to counsel or formation provider,
  - a task-scoped composer.
- A bottom-left toast indicates `1 agent update`.

Flow contract:

- After onboarding, the founder lands in a company canvas, not a blank dashboard.
- Departments are spatially represented around the company instead of shown only as cards.
- Cofounder remains available as a right-side guided work panel.
- Tasks can run as explanations/guidance, not only as production jobs.

THEFT implication:

- THEFT's current Mission Control should bias toward this company-map plus Operator panel model.
- The Operator bar should not disappear into nowhere; it should become a persistent task-aware panel or dock.
- Department work should attach to visible company context and artifacts.

### frames2/frame_0920.jpg - frames2/frame_1000.jpg

Observed state: founder navigates from canvas/roadmap into Design department work.

Screen contract:

- The right Cofounder task panel remains scrollable and task-scoped.
- The company canvas can be panned/zoomed.
- The `How to Build a Company` roadmap can re-open.
- Selecting roadmap items reveals a detail panel explaining:
  - what becomes true,
  - how to move it forward,
  - required checks,
  - a `Launch Agent` action.
- The user enters the `Design` department.
- Design department page includes:
  - large department workspace/canvas,
  - right sidebar with department image and description,
  - `Agents`, `Tasks`, `Files`, and `Context` sections,
  - bottom roadmap: `Brand identity`, `Build marketing website`, `Launch website`.
- The active task becomes `Brand Identity`.
- The right task panel shows the Design Agent reading `/workspace/library/design/DESIGN.md`.

Flow contract:

- Roadmap nodes connect to department-level workspaces.
- Departments are not just static cards; each department has agents, files, context, and a local roadmap.
- Generated artifacts become file-backed context for the next task.

THEFT implication:

- THEFT needs a clear handoff from global company plan to department workspace.
- If Design creates a brand kit, the next Design task should read that artifact and propose the next asset, e.g. website/landing page.
- The user should be able to see the chain: idea -> plan -> brand identity -> design department -> marketing website.

### frames2/frame_1040.jpg - frames2/frame_1176.jpg

Observed state: Design Agent evaluates the revised brand and the app settles into Home/roadmap state.

Screen contract:

- The Design Agent writes an assessment of `v2`.
- It says v2 is improved but still may feel too dark/saturated/terminal for a B2B UX subscription.
- It offers two paths:
  - lock v2 and proceed to the next asset,
  - do one more iteration to make the system more professional and editorial.
- The department canvas includes an agent workspace/scratchpad area.
- The roadmap can be reopened and still shows company-building nodes.
- Home panel shows:
  - greeting `Good morning, jpoindexter`,
  - `THEFT Roadmap` progress,
  - active tasks including `Brand Identity` and `Ask Cofounder about incorporation`,
  - suggested next items such as `App is built`, `Build marketing website`, `Sales positioning is ready`, `Setup social presence`, and `Open bank account`.

Flow contract:

- The agent can critique its own output and recommend next steps.
- The app keeps both active tasks and suggested next work visible after onboarding.
- The founder has a durable home state after the guided flow.

THEFT implication:

- The happy path is not "create issue, mark done, disappear."
- It is: generate artifact, review/version it, lock it into Library, use it as context for the next department task, and keep the next roadmap actions visible.
- THEFT should use this as the MVP target before adding more backend complexity.

## Alternate Capture: `frames/`

### frames/frame_0001.jpg - frames/frame_0080.jpg

Observed state: second capture starts the same onboarding pattern with a different company run.

Screen contract:

- `frame_0001.jpg` is the same login screen: `Cofounder`, GitHub sign-in, and the left brand card.
- By `frame_0020.jpg`, the flow is at `Create your company`.
- By `frame_0040.jpg`, the org-scoped onboarding canvas is initializing.
- By `frame_0060.jpg`, the Cofounder seed and right-side company prompt are visible.
- By `frame_0080.jpg`, the founder is typing a more explicit company description:
  - `Building a company that will be design as a service. You subscribe and get access to UX, UX research and ...`

Flow contract:

- This confirms the same first-run structure appears in a separate capture:
  - auth,
  - company creation,
  - company seed/canvas,
  - right-side company-context prompt.

THEFT implication:

- The setup flow should be deterministic and repeatable across companies.
- THEFT should not treat onboarding as throwaway UI; it is the real front door of the product.

### frames/frame_0100.jpg - frames/frame_0260.jpg

Observed state: alternate capture runs the refinement interview with a fuller company description.

Screen contract:

- The founder description expands into a clearer design-as-a-service pitch:
  - subscription access to UX,
  - UX research,
  - design-pickle-like model,
  - shift away from traditional agency work.
- Cofounder summarizes the idea as a design-as-a-subscription model.
- The refinement question cards include:
  - `What makes this meaningfully different from Design Pickle or other flat-rate design services?`
  - `How do you plan to structure the subscription tiers?`
  - `What is your primary acquisition channel to get the first 10 customers?`
- The acquisition card options include:
  - founder network and direct outreach,
  - content marketing and SEO,
  - Product Hunt/community launches,
  - partnerships with agencies/startup studios.

Flow contract:

- The customer/acquisition question appears after product and business-model refinement.
- It is not framed as "go get customers now"; it is part of shaping the initial business plan.
- The founder can type a custom combined answer below the multiple-choice options.

THEFT implication:

- The "How will you land the first 5 paying customers?" prompt should be explained as a plan input, not an immediate command to sell.
- An AI helper/star would be useful here: it should ask clarifying questions and help draft a reasonable go-to-market answer from rough founder intent.

### frames/frame_0300.jpg - frames/frame_0700.jpg

Observed state: alternate capture reaches business plan, then diverges into interruptions/admin surfaces.

Screen contract:

- The final refinement card asks `Where are you right now?`
- Captured stage choice: `Idea - no customers or product yet`.
- Business Plan card appears with `Accept & activate departments`.
- After activation, the same platform-update modal appears.
- The user opens/reads release notes that describe:
  - roadmap for the whole company,
  - departments that actually run,
  - "starting a company should be easier/fun/make your life better."
- Later, an agent configuration modal appears with:
  - model selection,
  - skills,
  - integrations,
  - available agents/coding,
  - run settings.

Flow contract:

- The useful happy path is business plan -> accept departments -> company roadmap/workspace.
- Release notes and agent configuration are not part of the founder's first-run happy path.
- Deep agent settings are powerful but should not be required for the founder to understand what just happened.

THEFT implication:

- THEFT should hide model/skill/integration configuration from the first-run founder flow.
- The MVP should focus on the guided workbench and artifact lifecycle before exposing runtime/admin controls.
- The founder needs answers to "what is next?" and "where did the output go?", not model configuration.
