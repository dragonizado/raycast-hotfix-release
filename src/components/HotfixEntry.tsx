import { useState } from "react";
import { HotfixChecklist } from "./HotfixChecklist";
import { HotfixSetupForm } from "./HotfixSetupForm";

export function HotfixEntry() {
  const [version, setVersion] = useState<string>("");
  const [project, setProject] = useState<"hartland_project" | "drive_project">("");

  function handleSetupSubmit(values: { version: string; project: string }) {
    setVersion(values.version);
    setProject(values.project);
  }

  if (!version || !project) {
    return (
      <HotfixSetupForm
        project_default={project}
        version_default={version}
        onSubmit={handleSetupSubmit}
      />
    );
  }

  return (<HotfixChecklist version={version} project={project} />);
}