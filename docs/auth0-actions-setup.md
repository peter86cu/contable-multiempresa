# Configuración de Auth0 Action para Incluir Metadatos

Para solucionar el problema de acceso a los metadatos de usuario en Auth0, necesitas crear una Action que incluya los metadatos de la aplicación en el token de ID.

## Pasos para crear la Action en Auth0

1. Inicia sesión en tu [Dashboard de Auth0](https://manage.auth0.com/)
2. Ve a **Actions** > **Flows** en el menú lateral
3. Selecciona el flujo **Login**
4. Haz clic en el botón **+ Add Action** y luego en **Build Custom**
5. Dale un nombre descriptivo como "Include App Metadata in ID Token"
6. Copia y pega el siguiente código:

```javascript
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  console.log("Executing Include App Metadata Action");
  console.log("User app_metadata:", JSON.stringify(event.user.app_metadata));
  
  // Namespace para evitar colisiones
  const namespace = 'https://contaempresa.com/';
  
  // Copiar app_metadata al token si existe
  if (event.user.app_metadata) {
    // Incluir todo el objeto app_metadata
    api.idToken.setCustomClaim(namespace + 'app_metadata', event.user.app_metadata);
    
    // También incluir campos individuales para mayor compatibilidad
    if (event.user.app_metadata.rol) {
      api.idToken.setCustomClaim(namespace + 'rol', event.user.app_metadata.rol);
    }
    
    if (event.user.app_metadata.permisos) {
      api.idToken.setCustomClaim(namespace + 'permisos', event.user.app_metadata.permisos);
    }
    
    if (event.user.app_metadata.empresas) {
      api.idToken.setCustomClaim(namespace + 'empresas', event.user.app_metadata.empresas);
    }
    
    if (event.user.app_metadata.subdominio) {
      api.idToken.setCustomClaim(namespace + 'subdominio', event.user.app_metadata.subdominio);
    }
    
    // También incluir app_metadata directamente en el token
    // Esto es menos estándar pero puede ser útil para algunos SDKs
    api.idToken.setCustomClaim('app_metadata', event.user.app_metadata);
    
    console.log("Added app_metadata to ID token");
  } else {
    console.log("No app_metadata found for user");
  }
};

/**
 * Handler that will be invoked when this action is resuming after an external redirect.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onContinuePostLogin = async (event, api) => {
  // Not needed for this action
};
```

7. Haz clic en **Deploy**
8. Vuelve a la pantalla del flujo **Login**
9. Arrastra la nueva Action a la posición deseada en el flujo (generalmente después de "Complete Profile" y antes de "Success")
10. Haz clic en **Apply**

## Verificación

1. Cierra sesión de la aplicación
2. Inicia sesión nuevamente
3. Ahora deberías ver los metadatos de la aplicación en el token de ID
4. El componente de depuración en el Dashboard mostrará la información correcta

## Solución de problemas

Si después de crear la Action sigues sin ver los metadatos:

1. Verifica que la Action esté correctamente añadida al flujo Login
2. Revisa los logs de la Action en Auth0:
   - Ve a **Actions** > **Flows** > **Login**
   - Haz clic en tu Action
   - Ve a la pestaña **Logs**
   - Busca entradas recientes que coincidan con tu intento de inicio de sesión
3. Asegúrate de que el usuario tenga los metadatos correctos en Auth0:
   - Ve a **User Management** > **Users**
   - Busca y selecciona el usuario
   - Verifica la sección **App Metadata**
   - Debe contener algo como:
     ```json
     {
       "rol": "admin_empresa",
       "empresas": ["105Vjexz2rGt5qdqOLIS"],
       "permisos": ["admin:all"],
       "subdominio": "ayalait.uy"
     }
     ```
4. Fuerza una actualización del token cerrando sesión y volviendo a iniciar sesión

## Configuración de Metadatos de Usuario

Si necesitas actualizar los metadatos de un usuario:

1. Ve a **User Management** > **Users**
2. Busca y selecciona el usuario
3. Ve a la pestaña **Metadata**
4. En la sección **App Metadata**, haz clic en **Edit**
5. Actualiza los metadatos con la estructura correcta:
   ```json
   {
     "rol": "admin_empresa",
     "empresas": ["105Vjexz2rGt5qdqOLIS"],
     "permisos": ["admin:all"],
     "subdominio": "ayalait.uy"
   }
   ```
6. Haz clic en **Save**

## Depuración de Tokens

Para verificar que los metadatos se están incluyendo correctamente en el token:

1. Usa una herramienta como [jwt.io](https://jwt.io/) para decodificar el token
2. Busca las propiedades con el namespace `https://contaempresa.com/`
3. También busca la propiedad `app_metadata` directamente en el token