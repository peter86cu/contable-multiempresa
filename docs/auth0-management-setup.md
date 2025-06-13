# Configuración de Auth0 Management API

Para que la función de creación de usuarios en Auth0 funcione correctamente, necesitas configurar el Auth0 Management API. Sigue estos pasos:

## 1. Crear una aplicación Machine to Machine

1. Inicia sesión en tu [Dashboard de Auth0](https://manage.auth0.com/)
2. Ve a **Applications** > **Applications** en el menú lateral
3. Haz clic en **Create Application**
4. Nombre: "ContaEmpresa Management API"
5. Tipo: "Machine to Machine Applications"
6. Haz clic en **Create**

## 2. Autorizar la aplicación para el Management API

1. En la pantalla de configuración de la aplicación recién creada, selecciona la pestaña **APIs**
2. Busca y selecciona "Auth0 Management API"
3. Selecciona los siguientes permisos:
   - `read:users`
   - `create:users`
   - `update:users`
   - `delete:users`
   - `read:user_idp_tokens`
   - `update:users_app_metadata`
4. Haz clic en **Authorize**

## 3. Obtener credenciales

1. Ve a la pestaña **Settings** de tu aplicación
2. Anota los siguientes valores:
   - **Domain**
   - **Client ID**
   - **Client Secret**

## 4. Configurar variables de entorno

1. Crea un archivo `.env` en la carpeta `supabase/functions/auth0-users` basado en el archivo `.env.example`
2. Completa las variables con los valores obtenidos:

```
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_MGMT_CLIENT_ID=tu-client-id
AUTH0_MGMT_CLIENT_SECRET=tu-client-secret
```

## 5. Desplegar la función Edge

1. Asegúrate de que Supabase CLI esté instalado
2. Ejecuta el siguiente comando para desplegar la función:

```bash
supabase functions deploy auth0-users --project-ref tu-ref-de-proyecto
```

## Solución de problemas

Si encuentras errores al crear usuarios, verifica:

1. **Logs de la función**: Revisa los logs de la función Edge en la consola de Supabase
2. **Permisos**: Asegúrate de que la aplicación M2M tenga todos los permisos necesarios
3. **Credenciales**: Verifica que las credenciales en el archivo `.env` sean correctas
4. **Formato de datos**: Asegúrate de que los datos enviados a la función tengan el formato correcto

### Formato de datos para crear usuarios

```json
{
  "email": "usuario@ejemplo.com",
  "password": "Contraseña123!",
  "name": "Nombre Completo",
  "connection": "Username-Password-Authentication",
  "app_metadata": {
    "rol": "admin_empresa",
    "empresas": ["id-empresa-1"],
    "permisos": ["admin:all"],
    "subdominio": "ejemplo.com"
  }
}
```

### Formato de datos para actualizar usuarios

```json
{
  "app_metadata": {
    "rol": "admin_empresa",
    "empresas": ["id-empresa-1"],
    "permisos": ["admin:all"]
  }
}
```