# Hotfix Release

Extensión de [Raycast](https://raycast.com) que proporciona un checklist interactivo para gestionar el proceso completo de un hotfix release siguiendo el flujo de [Gitflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow).

## Descripción

Realizar un hotfix implica múltiples pasos de Git coordinados: crear ramas, mergear en main y develop, actualizar versiones, crear tags y documentar la release. Esta extensión automatiza y guía cada paso para evitar errores y garantizar consistencia.

### Proyectos soportados

| Proyecto     | Clave de preferencia |
| ------------ | -------------------- |
| Hartland     | `hartland_project`   |
| Drive Portal | `drive_project`      |

## Flujo de trabajo

La extensión guía al usuario a través de **18 pasos** organizados en orden:

1. Crear rama `fix/<descripción>` desde `main`
2. Aplicar la corrección _(manual)_
3. Subir rama fix a GitHub
4. Crear rama `hotfix/<versión>` desde `main`
5. Actualizar la rama base del PR en GitHub _(manual)_
6. PR revisado y aprobado _(manual)_
7. Merge del PR en `hotfix/<versión>` _(manual)_
8. Bump de versión en archivos del proyecto
9. Push del bump de versión
10. Merge `hotfix/<versión>` en `main`
11. Push a `main`
12. Crear git tag `v<versión>`
13. Push del git tag
14. Merge `hotfix/<versión>` en `develop`
15. Push a `develop`
16. Crear release en GitHub _(manual)_
17. Actualizar release log en Basecamp _(manual)_
18. Finalizar y limpiar progreso

Los pasos marcados con el icono de robot (🤖) ejecutan comandos Git automáticamente. Los demás requieren acción manual y se marcan como completados por el usuario.

## Instalación

```bash
git clone <repo-url>
cd raycast-hotfix-release
npm install
npm run dev
```

## Configuración

Al instalar la extensión, se deben configurar las siguientes **preferencias** en Raycast:

| Preferencia        | Tipo      | Requerida | Descripción                                       |
| ------------------ | --------- | --------- | ------------------------------------------------- |
| **Hartland Path**  | Directorio | Sí        | Ruta al directorio local del proyecto Hartland     |
| **Drive Portal Path** | Directorio | Sí     | Ruta al directorio local del proyecto Drive Portal |

## Uso

1. Ejecutar el comando **Hotfix Release** desde Raycast.
2. Completar el formulario de setup indicando:
   - **Proyecto**: Hartland o Drive Portal.
   - **Nueva versión**: número de versión del hotfix (ej: `1.2.3`).
   - **Descripción**: breve descripción del bug que se normaliza como nombre de rama (ej: `login error` → `fix/login-error`).
3. Seguir el checklist paso a paso. Los pasos automatizados se ejecutan con la acción "Ejecutar Paso" y los manuales con "Marcar Como Completado".
4. Al finalizar, seleccionar "Finalizar Hotfix" para limpiar el progreso guardado.

### Persistencia

El progreso del checklist se guarda automáticamente en `LocalStorage` de Raycast. Si se cierra y reabre la extensión, el avance se conserva hasta que se finalice el hotfix.
