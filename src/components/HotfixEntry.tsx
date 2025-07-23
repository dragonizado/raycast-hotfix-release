import { useState } from "react";
import { HotfixChecklist } from "./HotfixChecklist";
import { HotfixSetupForm } from "./HotfixSetupForm";

const allowedProjects = ["hartland_project", "drive_project", ""] as const;
type ProjectType = (typeof allowedProjects)[number];

export function HotfixEntry() {
  const [version, setVersion] = useState<string>("");
  const [project, setProject] = useState<ProjectType>("");

  function handleSetupSubmit(values: { version: string; project: string }) {
    setVersion(values.version);
    if (allowedProjects.includes(values.project as ProjectType)) {
      setProject(values.project as ProjectType);
    } else {
      console.error("Invalid project selected:", values.project);
    }
  }

  if (!version || !project) {
    return <HotfixSetupForm project_default={project} version_default={version} onSubmit={handleSetupSubmit} />;
  }

  return <HotfixChecklist version={version} project={project} />;
}
