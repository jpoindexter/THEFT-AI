# Tasks

The **Tasks** page is the list view for work across the current workspace.

Use it when you want to see what is running, what is waiting on you, and what has finished recently.

## Task Sections

Tasks are grouped by what is happening with the work now.

The Tasks page shows these sections:

- **Needs Action** for work waiting on you
- **Ongoing** for work that is waiting to start or currently running
- **Done** for work that finished and no longer needs action
- **Todo** for task rows that are not running yet

You can also open archived tasks when you need to look up older work.

## Needs Action

Use **Needs Action** when you want to clear everything waiting on you.

Tasks move here when:

- the agent asks a clarification question
- the agent needs approval to continue
- a tool or permission approval is required
- the agent produced something reviewable, such as an artifact, preview, pull request, export, or review URL
- the task failed, errored, or stopped and needs follow-up

Reviewable output appears as **Ready to review**. Open the task, inspect the result, then approve, respond, or mark the task complete.

Clarification questions and approval requests stay in **Needs Action** until you answer, approve, or close them.

## Ongoing

**Ongoing** contains tasks that are still in motion.

A task can show:

- **Waiting to start...** while it is queued or being prepared
- **Running...** while the agent is actively working

Running work stays in **Ongoing** until the agent stops, asks for input, needs approval, produces reviewable output, fails, or finishes.

## Done

**Done** contains tasks that no longer need action.

There are two common finished states:

- **Completed** means the task was marked complete
- **Finished turn** means the agent finished without a separate output that needs review

Finished-turn tasks stay available in task history, but they do not show up as review items.

## Todo

**Todo** is for task rows that exist but are not currently running.

Most agent tasks move through **Ongoing**, **Needs Action**, and **Done**. If a task is already queued for an agent run, it usually appears in **Ongoing** as **Waiting to start...** rather than Todo.

## Task Details

Open a task to see the task detail view.

Depending on the task, the detail view can show:

- the original request
- the assigned agent
- task state and elapsed time
- workflow items, approvals, and generated artifacts
- the conversation with the agent
- options such as reporting an issue or opening more task actions

If there is nothing pending, Cofounder shows that clearly instead of leaving an empty review panel.

## Editing A Previous Message

When **Edit message** is available on one of your messages, you can change that message and send it again.

The agent continues from the edited message. Later messages from the previous path are removed from the active conversation, so use this when you want to change direction rather than add another note.

You can edit your own messages when the agent is not currently running.

## Reviewing Work

Tasks that need action appear on the Tasks page and in review mode on Canvas.

From review mode, you can move between waiting items, snooze an item for later, dismiss items that no longer need action, or exit review mode and return to normal navigation.

Use this when several tasks have produced outputs, approvals, clarification questions, failures, or stopped runs and you want to process them without hunting through task lists.

If an agent simply finished without producing a review item, Cofounder keeps the task in history instead of asking you to review it.

## Closing Task Work

Tasks move into **Needs Action** automatically when an agent asks a question, requests approval, fails, stops, or produces something reviewable.

Once you are done with waiting, failed, stopped, or reviewable work, mark it complete to move it into **Done**. If you complete something by mistake, the task action menu can mark it active again.

## Creating Tasks

You can create a task from the **+** menu on Canvas.

The task form lets you:

- write the task description
- attach images or screenshots
- let Cofounder auto-assign the best agent
- choose a repository when the task needs code context
- choose **Execute** or **Plan**

The **Create Task** button becomes available once the task has enough information to run.

## Plan Mode

Choose **Plan** when you want an agent to propose the approach before it starts the work.

Plan mode is useful for:

- large product or engineering changes
- work that touches several files, systems, or teams
- tasks where you want to approve the approach first
- research or setup work where the next step is not obvious

When the plan is ready, the agent shows it as a review item. You can approve it and let the agent continue, or ask for changes.

Use **Execute** for straightforward tasks where the agent can start right away.

## Next Steps

- [Canvas](/workspace/canvas)
- [Previews And Feedback](/agents/engineer-agent#previews-and-feedback)
- [Library](/workspace/library)
- [Agents Overview](/agents/overview)
