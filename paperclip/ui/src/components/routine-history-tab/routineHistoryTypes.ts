export type RoutineHistoryAgentLookup = Map<string, { id: string; name: string }>;
export type RoutineHistoryProjectLookup = Map<string, { id: string; name: string }>;

export type RoutineHistoryDirtyFieldDescriptor = {
  key: string;
  label: string;
};
