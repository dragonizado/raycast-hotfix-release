import { useState, useEffect } from "react";
import { List, LocalStorage } from "@raycast/api";
import { HotfixChecklist } from "./HotfixChecklist";
import { HotfixSetupForm } from "./HotfixSetupForm";

const allowedProjects = ["hartland_project", "drive_project", ""] as const;
type ProjectType = (typeof allowedProjects)[number];

const CONFIG_STORAGE_KEY = "hotfix-config";

export function HotfixEntry() {
  const [version, setVersion] = useState<string>("");
  const [descripcion, setDescripcion] = useState<string>("");
  const [project, setProject] = useState<ProjectType>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    LocalStorage.getItem<string>(CONFIG_STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const config = JSON.parse(data);
          setVersion(config.version || "");
          setProject(config.project || "");
          setDescripcion(config.descripcion || "");
        } catch {
          /* ignore corrupted data */
        }
      }
      setIsLoading(false);
    });
  }, []);

  async function handleSetupSubmit(values: { version: string; project: string; descripcion: string }) {
    if (!allowedProjects.includes(values.project as ProjectType)) {
      console.error("Invalid project selected:", values.project);
      return;
    }
    setVersion(values.version);
    setDescripcion(values.descripcion);
    setProject(values.project as ProjectType);
    await LocalStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(values));
  }

  if (isLoading) {
    return <List isLoading />;
  }

  if (!version || !project) {
    return (
      <HotfixSetupForm
        project_default={project}
        version_default={version}
        descripcion_default={descripcion}
        onSubmit={handleSetupSubmit}
      />
    );
  }

  async function resetHotfix() {
    await LocalStorage.removeItem(CONFIG_STORAGE_KEY);
    setVersion("");
    setProject("");
    setDescripcion("");
  }

  return <HotfixChecklist version={version} project={project} descripcion={descripcion} onFinalize={resetHotfix} />;
}
