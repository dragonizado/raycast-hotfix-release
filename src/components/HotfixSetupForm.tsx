import { Form, ActionPanel, Action } from "@raycast/api";
import { useState } from "react";

interface InputParams {
  version: string;
  project: string;
}

export function HotfixSetupForm({ project_default, version_default, onSubmit }: { project_default: string; version_default: string; onSubmit: (values: InputParams) => void }) {
  const [project, setProject] = useState(project_default);
  const [version, setVersion] = useState(version_default);

  return (
    <Form
      navigationTitle="Parámetros del Hotfix"
      actions={
        <ActionPanel>
          <Action
            title="Continuar"
            onAction={() => {
              if (version && project) {
                onSubmit({ version, project });
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="project" title="Proyecto" value={project} onChange={setProject}>
        <Form.Dropdown.Item value="" title="No seleccionado" />
        <Form.Dropdown.Item value="hartland_project" title="Hartland" />
        <Form.Dropdown.Item value="drive_project" title="Drive Portal" />
      </Form.Dropdown>

      <Form.TextField id="version" title="Nueva versión" value={version} placeholder="Ejemplo: 1.2.3" onChange={setVersion} />
    </Form>
  );
}
