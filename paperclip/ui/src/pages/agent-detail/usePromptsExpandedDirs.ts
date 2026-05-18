import { useEffect, useState } from "react";

function setsEqual<T>(left: Set<T>, right: Set<T>) {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

function getParentDirs(filePaths: string[]) {
  const nextExpanded = new Set<string>();
  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    let currentPath = "";
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]!;
      nextExpanded.add(currentPath);
    }
  }
  return nextExpanded;
}

export function usePromptsExpandedDirs(filePaths: string[]) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const nextExpanded = getParentDirs(filePaths);
    setExpandedDirs((current) => (setsEqual(current, nextExpanded) ? current : nextExpanded));
  }, [filePaths]);

  return { expandedDirs, setExpandedDirs };
}
