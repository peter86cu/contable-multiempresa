# Configuración de Regla en Auth0 para Incluir Metadatos

Para solucionar el problema de acceso a los metadatos de usuario en Auth0, necesitas crear una regla que incluya los metadatos de la aplicación en el token de ID.

## Pasos para crear la regla en Auth0

1. Inicia sesión en tu [Dashboard de Auth0](https://manage.auth0.com/)
2. Ve a **Auth Pipeline** > **Rules** en el menú lateral
3. Haz clic en **+ Create Rule**
4. Selecciona **Empty Rule** (Regla vacía)
5. Dale un nombre descriptivo como "Include App Metadata in ID Token"
6. Copia y pega el siguiente código:

```javascript
function includeAppMetadata(user, context, callback) {
  // Incluir app_metadata en el token de ID
  const namespace = 'https://contaempresa.com/';
  
  // Copiar app_metadata al token
  if (user.app_metadata) {
    context.idToken[namespace + 'app_metadata'] = user.app_metadata;
    
    // También copiar campos individuales para mayor compatibilidad
    if (user.app_metadata.rol) {
      context.idToken[namespace + 'rol'] = user.app_metadata.rol;
    }
    
    if (user.app_metadata.permisos) {
      context.idToken[namespace + 'permisos'] = user.app_metadata.permisos;
    }
    
    if (user.app_metadata.empresas) {
      context.idToken[namespace + 'empresas'] = user.app_metadata.empresas;
    }
    
    if (user.app_metadata.subdominio) {
      context.idToken[namespace + 'subdominio'] = user.app_metadata.subdominio;
    }
  }
  
  // También incluir app_metadata directamente en el token
  // Esto es menos estándar pero puede ser útil para algunos SDKs
  context.idToken.app_metadata = user.app_metadata;
  
  return callback(null, user, context);
}
```

7. Haz clic en **Save Changes**

## Verificación

1. Cierra sesión de la aplicación
2. Inicia sesión nuevamente
3. Ahora deberías ver los metadatos de la aplicación en el token de ID
4. El componente de depuración en el Dashboard mostrará la información correcta

## Solución de problemas

Si después de crear la regla sigues sin ver los metadatos:

1. Verifica que la regla esté habilitada (debe tener un interruptor verde)
2. Asegúrate de que el usuario tenga los metadatos correctos en Auth0:
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
3. Fuerza una actualización del token cerrando sesión y volviendo a iniciar sesión

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