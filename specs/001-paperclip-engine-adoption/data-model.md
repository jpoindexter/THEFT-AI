# Data Model: Paperclip Engine Adoption

## EngineTool

- `name`: stable action name exposed to agents
- `description`: when and how the agent should use it
- `input_schema`: JSON schema for model/tool-call validation
- `handler`: server-side implementation receiving run context and input

## EngineRunContext

- `org`: organization being operated on
- `agentId`: optional executing agent
- `taskId`: optional task being executed
- `departmentSlug`: optional department scope
- `source`: runtime path such as Anthropic SDK or local harness

## AgentCompanyPackage

- `company`: company markdown document metadata
- `teams`: department/team packages
- `agents`: agent packages with instruction body and skill references
- `tasks`: current task package entries
- `skills`: resolved skill references and missing-skill diagnostics

## SkillReference

- `id`: attached skill id from agent record
- `slug`: portable shortname
- `path`: repo-relative `skills/<slug>/SKILL.md` when present
- `exists`: whether the packet exists locally

## State Transitions

- Task run starts as `todo` or `blocked`
- Engine marks task `in_progress` at execution start
- Engine emits `pause` and marks task `blocked` when user input is needed
- Engine emits `done` and marks task `done` when complete
- Tool failures produce structured tool results and keep the run inspectable
