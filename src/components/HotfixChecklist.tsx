import { List, Icon, ActionPanel, Action, getPreferenceValues, showToast, Toast, LocalStorage, confirmAlert, Alert } from "@raycast/api";
import { useState, useEffect } from "react";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

interface InputParams {
  version: string;
  project: string;
  descripcion: string;
  onFinalize?: () => void;
}

interface Preferences {
  hartland_project: string;
  drive_project: string;
}

interface ProjectNames {
  hartland_project: {
    name: string;
    release_log_url: string;
  };
  drive_project: {
    name: string;
    release_log_url: string;
  };
}

interface Step {
  id: number;
  title: string;
  subtitle?: string;
  description?: string;
  action?: () => Promise<void>;
}

interface ProjectUpdateScripts {
  hartland_project: string;
  drive_project: string;
}

const PROJECTS_NAMES: ProjectNames = {
  hartland_project: {
    name: "Hartland",
    release_log_url: "https://3.basecamp.com/3081685/buckets/17614948/documents/5373571534",
  },
  drive_project: {
    name: "Drive Portal",
    release_log_url: "https://3.basecamp.com/3081685/buckets/17658152/documents/2790215992",
  },
};

function parametrizarDescripcion(descripcion: string) {
  return descripcion?.replace(/ /g, "-").toLowerCase() || "No description";
}

const FINALIZE_STEP_ID = 18;

export function HotfixChecklist({ version, project, descripcion, onFinalize }: InputParams) {
  const preferences = getPreferenceValues<Preferences>();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `hotfix-${project}-${version}`;

  useEffect(() => {
    LocalStorage.getItem<string>(storageKey).then((data) => {
      if (data) {
        try {
          setCompletedSteps(JSON.parse(data));
        } catch {
          /* ignore corrupted data */
        }
      }
      setIsLoading(false);
    });
  }, []);

  const markStep = async (id: number) => {
    const updated = [...new Set([...completedSteps, id])];
    setCompletedSteps(updated);
    await LocalStorage.setItem(storageKey, JSON.stringify(updated));
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

  const PROJECT_UPDATE_SCRIPTS: ProjectUpdateScripts = {
    hartland_project: [
      `git switch hotfix/${version} && git pull origin hotfix/${version}`,
      `sed -i '' -E "s/\\"version\\": \\"[^\\"]+\\"/\\"version\\": \\"${version}\\"/" ${preferences.hartland_project}/package.json`,
      `sed -i '' -E "s/Current version: [0-9]+\\.[0-9]+\\.[0-9]+/Current version: ${version}/" ${preferences.hartland_project}/README.md`,
      `sed -i '' -E "s/v[0-9]+\\.[0-9]+\\.[0-9]+/v${version}/" ${preferences.hartland_project}/app/frontend/Shared/Sidebar.vue`,
      `git add . && git commit -m "chore: bump versión"`,
    ].join(" && "),
    drive_project: [
      `git switch hotfix/${version} && git pull origin hotfix/${version}`,
      `sed -i '' -E "s/\\"version\\": \\"[^\\"]+\\"/\\"version\\": \\"${version}\\"/" ${preferences.drive_project}/package.json`,
      `git add . && git commit -m "chore: bump versión to ${version}"`,
    ].join(" && "),
  };

  const projectTitle: string =
    PROJECTS_NAMES[project as keyof ProjectNames].name.toUpperCase() || "Proyecto Desconocido";

  const descripcionParametrizada: string = parametrizarDescripcion(descripcion);

  console.log("descripcionParametrizada", descripcionParametrizada);

  const steps: Step[] = [
    {
      id: 1,
      title: `Crear rama (fix/${descripcionParametrizada}) para hotfix desde main`,
      description: `**${projectTitle}**  \f\fCrear una rama a partir de main, para aplicar el hotfix (fix/${descripcionParametrizada})`,
      action: () =>
        runScript(
          `cd ${preferences[project as keyof Preferences]} && git switch main && git pull origin main && git checkout -b fix/${descripcionParametrizada}`,
          {
            success: `Rama fix/${descripcionParametrizada} creada.`,
            error: `No se pudo crear la rama fix/${descripcionParametrizada}. Asegúrate de que tienes permisos para crear ramas.`,
          },
        ),
    },
    {
      id: 2,
      title: "Aplicar corrección",
      description: `**${projectTitle}**  \f\fImplementar los cambios necesarios para corregir el bug. Mantener los commits enfocados y con mensajes claros.`
    },
    {
      id: 3,
      title: "Subir rama a Github",
      description: `**${projectTitle}**  \f\fSubir la rama fix/${descripcionParametrizada} a Github.`,
      action: () =>
        runScript(
          `cd ${preferences[project as keyof Preferences]} && git push origin fix/${descripcionParametrizada}`,
          {
            success: `Rama fix/${descripcionParametrizada} subida a Github.`,
            error: `No se pudo subir la rama fix/${descripcionParametrizada} a Github. Asegúrate de que tienes permisos para subir ramas.`,
          },
        ),
    },
    {
      id: 4,
      title: "Crear rama hotfix desde main",
      description: `**${projectTitle}**  \f\f Se ejecuta automáticamente el comando: git checkout -b hotfix/${version} y sube la rama a Github automáticamente.`,
      action: () =>
        runScript(
          `cd ${preferences[project as keyof Preferences]} && git switch main && git pull && git checkout -b hotfix/${version} && git push -u origin hotfix/${version}`,
          {
            success: `Rama hotfix/${version} creada y subida a Github.`,
            error: `No se pudo crear la rama hotfix/${version}. Asegúrate de que estás en la rama main y que tienes permisos para crear ramas.`,
          },
        ),
    },
    {
      id: 5,
      title: "Actualizar rama base del PR",
      description: `**${projectTitle}**  \f\f Asegúrate de que la rama base del PR (fix/${descripcionParametrizada}) sea hotfix/${version} en **Github**.`,
    },
    {
      id: 6,
      title: "PR revisado y aprobado",
      description: `**${projectTitle}**  \f\f Asegúrate de que el PR (fix/${descripcionParametrizada}) esté revisado y aprobado.`,
    },
    {
      id: 7,
      title: "PR en mergeado en",
      subtitle: `hotfix/${version}`,
      description: `**${projectTitle}**  \f\fEl PR (fix/${descripcionParametrizada}) ya se encuentra mergeado en la rama hotfix/${version}.`,
    },
    {
      id: 8,
      title: "Actualizar versión local",
      description: `**${projectTitle}**  \f\f Se actualiza el numero de la version y se hace bump commit.`,
      action: () =>
        runScript(
          `cd ${preferences[project as keyof Preferences]} && ${PROJECT_UPDATE_SCRIPTS[project as keyof typeof PROJECT_UPDATE_SCRIPTS]}`,
          {
            success: `Versión local actualizada a ${version}.`,
            error: `No se pudo actualizar la versión local.`,
          },
        ),
    },
    {
      id: 9,
      title: "Subir version a Github",
      description: `**${projectTitle}**  \f\f Se actualiza el numero de la version y se hace bump commit.`,
      action: () =>
        runScript(`cd ${preferences[project as keyof Preferences]} && git push origin hotfix/${version}`, {
          success: `Versión ${version} subida a Github.`,
          error: `No se pudo subir la versión ${version} a Github.`,
        }),
    },
    {
      id: 10,
      title: "Merge en main",
      description: `**${projectTitle}**  \f\fSe realiza el merge de la rama hotfix/${version} en main.`,
      action: () =>
        runScript(
          `cd ${preferences[project as keyof Preferences]} && git switch main && git pull origin main && git merge --no-ff hotfix/${version}`,
          {
            success: `Rama hotfix/${version} mergeada en main.`,
            error: `No se pudo mergear la rama hotfix/${version} en main.`,
          },
        ),
    },
    {
      id: 11,
      title: "Realizar Push a Main",
      description: `**${projectTitle}**  \f\fSe hace push a la rama main con los cambios.`,
      action: () =>
        runScript(`cd ${preferences[project as keyof Preferences]} && git push origin main`, {
          success: `Cambios subidos a la rama main remota.`,
          error: `No se pudieron subir los cambios a la rama main.`,
        }),
    },
    {
      id: 12,
      title: "Crear git tag",
      description: `**${projectTitle}**  \f\fSe crea un git tag v${version} en la rama hotfix/${version}.`,
      action: () =>
        runScript(`cd ${preferences[project as keyof Preferences]} && git tag -a v${version} -m "v${version}"`, {
          success: `Git tag v${version} creado en la rama hotfix/${version}.`,
          error: `No se pudo crear el git tag v${version}.`,
        }),
    },
    {
      id: 13,
      title: "Subir git tag",
      description: `**${projectTitle}**  \f\f Se sube el git tag v${version} al repositorio remoto.`,
      action: () =>
        runScript(`cd ${preferences[project as keyof Preferences]} && git push origin v${version}`, {
          success: `Git tag v${version} subido al repositorio remoto.`,
          error: `No se pudo subir el git tag v${version} al repositorio remoto.`,
        }),
    },
    {
      id: 14,
      title: "Merge en develop",
      description: `**${projectTitle}**  \f\f Se realiza el merge de la rama hotfix/${version} en develop y se hace push.`,
      action: () =>
        runScript(
          `cd ${preferences[project as keyof Preferences]} && git switch develop && git pull origin develop && git merge --no-ff hotfix/${version}`,
          {
            success: `Rama hotfix/${version} mergeada en develop.`,
            error: `No se pudo mergear la rama hotfix/${version} en develop.`,
          },
        ),
    },
    {
      id: 15,
      title: "Realizar Push a develop",
      description: `**${projectTitle}**  \f\f Se hace push a la rama develop con los cambios.`,
      action: () =>
        runScript(`cd ${preferences[project as keyof Preferences]} && git push origin develop`, {
          success: `Cambios subidos a la rama develop remota.`,
          error: `No se pudieron subir los cambios a la rama develop.`,
        }),
    },
    {
      id: 16,
      title: "Crear release en GitHub",
      description: `**${projectTitle}**  \f\fCrear una release en GitHub con el tag v${version}.`,
    },
    {
      id: 17,
      title: "Actualizar release log",
      description: `**${projectTitle}**  \f\fActualizar el release log en Basecamp. [${PROJECTS_NAMES[project as keyof typeof PROJECTS_NAMES].name} release log](${PROJECTS_NAMES[project as keyof typeof PROJECTS_NAMES].release_log_url})`,
    },
    {
      id: FINALIZE_STEP_ID,
      title: "Finalizar tareas",
      description: `**${projectTitle}**  \f\fAl marcar este paso se dará por concluido el hotfix v${version} y se eliminará el progreso guardado.`,
    },
  ];

  return (
    <List
      isShowingDetail
      isLoading={isLoading}
      navigationTitle={`Checklist Hotfix v${version} for ${PROJECTS_NAMES[project as keyof typeof PROJECTS_NAMES].name}`}
    >
      {steps.map((step) => (
        <List.Item
          key={step.id}
          title={step.action ? `(🤖) ${step.title}` : step.title}
          subtitle={step.subtitle || ""}
          icon={completedSteps.includes(step.id) ? Icon.CheckCircle : Icon.Circle}
          detail={<List.Item.Detail markdown={step.description || ""} />}
          actions={
            <ActionPanel>
              {step.id === FINALIZE_STEP_ID && (
                <Action
                  title="Finalizar Hotfix"
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    if (
                      await confirmAlert({
                        title: "¿Finalizar tareas?",
                        message: "Se eliminará el progreso guardado de este hotfix. Esta acción no se puede deshacer.",
                        primaryAction: {
                          title: "Finalizar",
                          style: Alert.ActionStyle.Destructive,
                        },
                      })
                    ) {
                      await LocalStorage.removeItem(storageKey);
                      setCompletedSteps([]);
                      showToast({
                        style: Toast.Style.Success,
                        title: "Hotfix finalizado",
                        message: "El progreso ha sido eliminado.",
                      });
                      onFinalize?.();
                    }
                  }}
                />
              )}
              {step.id !== FINALIZE_STEP_ID && step.action && (
                <Action
                  title="Ejecutar Paso"
                  onAction={async () => {
                    await step.action?.();
                    markStep(step.id);
                  }}
                />
              )}
              {step.id !== FINALIZE_STEP_ID && !step.action && (
                <Action title="Marcar Como Completado" onAction={() => markStep(step.id)} />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
