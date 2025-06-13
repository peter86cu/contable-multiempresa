# Solución de problemas con Auth0 Management API

Este documento proporciona una guía para solucionar problemas comunes con la integración de Auth0 Management API en ContaEmpresa.

## Problema: Error "Invalid JWT"

Este error ocurre cuando la aplicación no puede obtener un token válido para acceder a la API de gestión de Auth0.

### Causas comunes:

1. **Credenciales incorrectas**: Las credenciales en las variables de entorno no coinciden con las de Auth0
2. **Dominio incorrecto**: El dominio de Auth0 no está correctamente configurado
3. **Permisos insuficientes**: La aplicación M2M no tiene los permisos necesarios
4. **Problemas de CORS**: Restricciones de origen cruzado impiden la comunicación

### Solución paso a paso:

#### 1. Verificar las credenciales en Auth0

1. Ve a tu [Dashboard de Auth0](https://manage.auth0.com/)
2. Navega a **Applications** > **Applications**
3. Busca tu aplicación M2M (Machine to Machine)
4. En la pestaña **Settings**, verifica:
   - **Domain**: Debe ser exactamente igual al valor de `VITE_AUTH0_DOMAIN` en tu `.env`
   - **Client ID**: Debe ser exactamente igual al valor de `VITE_AUTH0_MANAGEMENT_CLIENT_ID` en tu `.env`
   - **Client Secret**: Debe ser exactamente igual al valor de `VITE_AUTH0_MANAGEMENT_CLIENT_SECRET` en tu `.env`

#### 2. Verificar permisos de la aplicación M2M

1. Ve a **Applications** > **APIs** > **Auth0 Management API**
2. En la pestaña **Machine to Machine Applications**, busca tu aplicación
3. Verifica que tenga los siguientes permisos:
   - `read:users`
   - `create:users`
   - `update:users`
   - `delete:users`
   - `read:user_idp_tokens`
   - `update:users_app_metadata`

#### 3. Verificar configuración de la Edge Function

1. Verifica que el archivo `.env` en `supabase/functions/auth0-users/` contenga las credenciales correctas
2. Asegúrate de que la función esté desplegada con las variables de entorno actualizadas:
   ```bash
   supabase functions deploy auth0-users
   ```

#### 4. Depurar con el panel de Auth Debug

1. Abre la aplicación y ve al Dashboard
2. Verás un panel de depuración de Auth0 en la parte superior
3. Haz clic en "Show Details" para ver información detallada
4. Verifica que los tokens y metadatos se estén cargando correctamente

#### 5. Verificar en el código

1. Abre las herramientas de desarrollo del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes de error relacionados con Auth0
4. Verifica que las variables de entorno se estén cargando correctamente:
   ```javascript
   console.log(import.meta.env.VITE_AUTH0_DOMAIN);
   console.log(import.meta.env.VITE_AUTH0_MANAGEMENT_CLIENT_ID);
   console.log(import.meta.env.VITE_AUTH0_MANAGEMENT_CLIENT_SECRET ? 'Configurado' : 'No configurado');
   ```

## Problema: Metadatos de usuario no disponibles

Este problema ocurre cuando los metadatos de la aplicación (app_metadata) no están disponibles en el token de ID.

### Solución:

1. Configura una regla o acción en Auth0 para incluir los metadatos en el token:
   - Ve a **Auth Pipeline** > **Rules** o **Actions** > **Flows** > **Login**
   - Crea una nueva regla o acción para incluir app_metadata en el token
   - Consulta los archivos `docs/auth0-rule-setup.md` o `docs/auth0-actions-setup.md` para más detalles

2. Verifica que el usuario tenga los metadatos correctos:
   - Ve a **User Management** > **Users**
   - Busca y selecciona el usuario
   - En la pestaña **Metadata**, verifica que app_metadata contenga:
     ```json
     {
       "rol": "admin_empresa",
       "empresas": ["id-empresa-1"],
       "permisos": ["admin:all"]
     }
     ```

## Problema: Modo de desarrollo no funciona

Si estás en modo de desarrollo y los datos mock no funcionan:

1. Verifica que `import.meta.env.DEV` sea `true`
2. Asegúrate de que la función `getMockUsers()` esté devolviendo datos válidos
3. Verifica que el código tenga las condiciones correctas para detectar el modo de desarrollo

## Problema: Errores en la Edge Function

Si la Edge Function de Supabase está fallando:

1. Verifica los logs de la función:
   ```bash
   supabase functions logs auth0-users
   ```

2. Asegúrate de que las variables de entorno estén configuradas:
   ```bash
   supabase secrets list
   ```

3. Si es necesario, actualiza las variables de entorno:
   ```bash
   supabase secrets set AUTH0_DOMAIN=tu-dominio.auth0.com AUTH0_MGMT_CLIENT_ID=tu-client-id AUTH0_MGMT_CLIENT_SECRET=tu-client-secret
   ```

4. Redespliega la función:
   ```bash
   supabase functions deploy auth0-users
   ```

## Solución alternativa: Modo de desarrollo

Si no puedes resolver los problemas con Auth0 Management API, puedes trabajar en modo de desarrollo:

1. Asegúrate de que `import.meta.env.DEV` sea `true`
2. La aplicación usará datos mock para usuarios, lo que te permitirá seguir desarrollando
3. Cuando estés listo para producción, configura correctamente Auth0 Management API

## Contacto para soporte

Si sigues teniendo problemas después de intentar estas soluciones, contacta al equipo de soporte:

- Email: soporte@contaempresa.com
- Discord: [Canal #auth0-support](https://discord.gg/contaempresa)