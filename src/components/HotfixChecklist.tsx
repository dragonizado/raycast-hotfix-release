import { List, Icon, ActionPanel, Action, getPreferenceValues, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

interface InputParams {
  version: string;
  project: string;
}

interface Preferences {
  hartland_project: string;
  drive_project: string;
}

const PROJECTS_NAMES = {
  hartland_project: {
    name: "Hartland",
    release_log_url: "https://3.basecamp.com/3081685/buckets/17614948/documents/5373571534",
  },
  drive_project: {
    name: "Drive Portal",
    release_log_url: "https://3.basecamp.com/3081685/buckets/17658152/documents/2790215992",
  },
};

export function HotfixChecklist({ version, project }: InputParams) {
  const preferences = getPreferenceValues<Preferences>();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const markStep = (id: number) => {
    setCompletedSteps((prev) => [...new Set([...prev, id])]);
  };

  const runScript = async (cmd: string, { success, error }: { success: string; error: string }) => {
    try {
      const { stdout } = await execPromise(cmd);
      showToast({
        style: Toast.Style.Success,
        title: "Comando ejecutado",
        message: success || `Comando: ${cmd}`,
      });
      console.log(stdout);
    } catch (err) {
      showToast({
        style: Toast.Style.Failure,
        title: "Comando fallido",
        message: error || "No se pudo ejecutar el comando.",
      });
      console.error(err);
    }
  };

  const PROJECT_UPDATE_SCRIPTS = {
    hartland_project: [
      `git switch hotfix/${version} && git pull origin hotfix/${version}`,
      `sed -i '' -E "s/\\"version\\": \\"[^\\"]+\\"/\\"version\\": \\"${version}\\"/" ${preferences.hartland_project}/package.json`,
      `sed -i '' -E "s/Current version: [0-9]+\\.[0-9]+\\.[0-9]+/Current version: ${version}/" ${preferences.hartland_project}/README.md`,
      `sed -i '' -E "s/v[0-9]+\\.[0-9]+\\.[0-9]+/v${version}/" ${preferences.hartland_project}/app/frontend/Shared/Sidebar.vue`,
      `git add . && git commit -m "chore: bump versión"`,
    ].join(" && "),
    drive_project: [
      `sed -i '' -E "s/\\"version\\": \\"[^\\"]+\\"/\\"version\\": \\"${version}\\"/" ${preferences.drive_project}/package.json`,
      `echo "Current version: ${version}"`,
    ].join(" && "),
  };

  const projectTitle = PROJECTS_NAMES[project].name.toUpperCase() || "Proyecto Desconocido";

  const steps = [
    {
      id: 1,
      title: "Crear rama con hotfix y PR",
      description: `**${projectTitle}**  \f\fCrear una rama a partir de main, aplicar el hotfix, subir la rama y realizar el PR.`,
    },
    {
      id: 2,
      title: "Crear rama hotfix desde main",
      description: `**${projectTitle}**  \f\f Se ejecuta automáticamente el comando: git checkout -b hotfix/${version} y sube la rama a Github automáticamente.`,
      action: () =>
        runScript(
          `cd ${preferences[project]} && git switch main && git pull && git checkout -b hotfix/${version} && git push -u origin hotfix/${version}`,
          {
            success: `Rama hotfix/${version} creada y subida a Github.`,
            error: `No se pudo crear la rama hotfix/${version}. Asegúrate de que estás en la rama main y que tienes permisos para crear ramas.`,
          },
        ),
    },
    {
      id: 3,
      title: "Actualizar rama base del PR",
      description: `**${projectTitle}**  \f\f Asegúrate de que la rama base del PR sea hotfix/${version} en **Github**.`,
    },
    {
      id: 4,
      title: "PR revisado y aprobado",
      description: `**${projectTitle}**  \f\f Asegúrate de que el PR esté revisado y aprobado.`,
    },
    {
      id: 5,
      title: "PR en mergeado en",
      subtitle: `hotfix/${version}`,
      description: `**${projectTitle}**  \f\fEl PR ya se encuentra mergeado en la rama hotfix/${version}.`,
    },
    {
      id: 6,
      title: "Actualizar versión local",
      description: `**${projectTitle}**  \f\f Se actualiza el numero de la version y se hace bump commit.`,
      action: () =>
        runScript(`cd ${preferences[project]} && ${PROJECT_UPDATE_SCRIPTS[project]}`, {
          success: `Versión local actualizada a ${version}.`,
          error: `No se pudo actualizar la versión local.`,
        }),
    },
    {
      id: 7,
      title: "Subir version a Github",
      description: `**${projectTitle}**  \f\f Se actualiza el numero de la version y se hace bump commit.`,
      action: () =>
        runScript(`cd ${preferences[project]} && git push origin hotfix/${version}`, {
          success: `Versión ${version} subida a Github.`,
          error: `No se pudo subir la versión ${version} a Github.`,
        }),
    },
    {
      id: 8,
      title: "Merge en main",
      description: `**${projectTitle}**  \f\fSe realiza el merge de la rama hotfix/${version} en main.`,
      action: () =>
        runScript(`cd ${preferences[project]} && git switch main && git merge --no-ff hotfix/${version}`, {
          success: `Rama hotfix/${version} mergeada en main.`,
          error: `No se pudo mergear la rama hotfix/${version} en main.`,
        }),
    },
    {
      id: 9,
      title: "Realizar Push a Main",
      description: `**${projectTitle}**  \f\fSe hace push a la rama main con los cambios.`,
      action: () =>
        runScript(`cd ${preferences[project]} && git push origin main`, {
          success: `Cambios subidos a la rama main remota.`,
          error: `No se pudieron subir los cambios a la rama main.`,
        }),
    },
    {
      id: 10,
      title: "Crear git tag",
      description: `**${projectTitle}**  \f\fSe crea un git tag v${version} en la rama hotfix/${version}.`,
      action: () =>
        runScript(`cd ${preferences[project]} && git tag v${version}`, {
          success: `Git tag v${version} creado en la rama hotfix/${version}.`,
          error: `No se pudo crear el git tag v${version}.`,
        }),
    },
    {
      id: 11,
      title: "Subir git tag",
      description: `**${projectTitle}**  \f\f Se sube el git tag v${version} al repositorio remoto.`,
      action: () =>
        runScript(`cd ${preferences[project]} && git push origin v${version}`, {
          success: `Git tag v${version} subido al repositorio remoto.`,
          error: `No se pudo subir el git tag v${version} al repositorio remoto.`,
        }),
    },
    {
      id: 12,
      title: "Merge en develop",
      description: `**${projectTitle}**  \f\f Se realiza el merge de la rama hotfix/${version} en develop y se hace push.`,
      action: () =>
        runScript(
          `cd ${preferences[project]} && git switch develop && git pull && git merge --no-ff hotfix/${version}`,
          {
            success: `Rama hotfix/${version} mergeada en develop.`,
            error: `No se pudo mergear la rama hotfix/${version} en develop.`,
          },
        ),
    },
    {
      id: 13,
      title: "Realizar Push a develop",
      description: `**${projectTitle}**  \f\f Se hace push a la rama develop con los cambios.`,
      action: () =>
        runScript(`cd ${preferences[project]} && git push`, {
          success: `Cambios subidos a la rama develop remota.`,
          error: `No se pudieron subir los cambios a la rama develop.`,
        }),
    },
    {
      id: 14,
      title: "Crear release en GitHub",
      description: `**${projectTitle}**  \f\fCrear una release en GitHub con el tag v${version}.`,
    },
    {
      id: 15,
      title: "Actualizar release log",
      description: `**${projectTitle}**  \f\fActualizar el release log en Basecamp. [${PROJECTS_NAMES[project].name} release log](${PROJECTS_NAMES[project].release_log_url})`,
    },
  ];

  return (
    <List isShowingDetail navigationTitle={`Checklist Hotfix v${version} for ${PROJECTS_NAMES[project].name}`}>
      {steps.map((step) => (
        <List.Item
          key={step.id}
          title={step.action ? `(🤖) ${step.title}` : step.title}
          subtitle={step.subtitle || ""}
          icon={completedSteps.includes(step.id) ? Icon.CheckCircle : Icon.Circle}
          detail={<List.Item.Detail markdown={step.description || ""} />}
          actions={
            <ActionPanel>
              {step.action && (
                <Action
                  title="Ejecutar Paso"
                  onAction={async () => {
                    await step.action?.();
                    markStep(step.id);
                  }}
                />
              )}
              {!step.action && <Action title="Marcar Como Completado" onAction={() => markStep(step.id)} />}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
