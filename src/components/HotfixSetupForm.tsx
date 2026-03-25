import { Form, ActionPanel, Action } from "@raycast/api";
import { useState } from "react";

interface InputParams {
  version: string;
  project: string;
  descripcion: string;
}

export function HotfixSetupForm({
  project_default,
  version_default,
  descripcion_default,
  onSubmit,
}: {
  project_default: string;
  version_default: string;
  descripcion_default: string;
  onSubmit: (values: InputParams) => void;
}) {
  const [project, setProject] = useState(project_default);
  const [version, setVersion] = useState(version_default);
  const [descripcion, setDescripcion] = useState(descripcion_default);

  return (
    <Form
      navigationTitle="Parámetros del Hotfix"
      actions={
        <ActionPanel>
          <Action
            title="Continuar"
            onAction={() => {
              if (version && project && descripcion) {
                onSubmit({ version, project, descripcion });
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

      <Form.TextField
        id="version"
        title="Nueva versión"
        value={version}
        placeholder="Ejemplo: 1.2.3"
        onChange={setVersion}
      />

      <Form.TextField
        id="descripcion"
        title="Descripción rama del hotfix"
        value={descripcion}
        placeholder="Ejemplo: descripcion del bug"
        onChange={setDescripcion}
      />
    </Form>
  );
}
