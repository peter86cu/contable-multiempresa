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
   - **Domain** (ejemplo: tu-dominio.auth0.com)
   - **Client ID**
   - **Client Secret**

## 4. Configurar variables de entorno

1. Edita el archivo `.env` en la carpeta `supabase/functions/auth0-users`
2. Reemplaza los valores de ejemplo con tus credenciales reales:

```
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_MGMT_CLIENT_ID=tu-client-id-real
AUTH0_MGMT_CLIENT_SECRET=tu-client-secret-real
```

**IMPORTANTE**: 
- Asegúrate de que el dominio incluya `.auth0.com` al final (ejemplo: `miempresa.auth0.com`)
- El Client Secret debe ser exactamente como aparece en Auth0, sin sufijos adicionales
- Verifica que no haya espacios en blanco al inicio o final de las credenciales

## 5. Desplegar la función Edge

**IMPORTANTE**: Después de actualizar las credenciales, debes redesplegar la función para que los cambios surtan efecto.

1. Asegúrate de que Supabase CLI esté instalado
2. Ejecuta el siguiente comando para redesplegar la función:

```bash
supabase functions deploy auth0-users --project-ref tu-ref-de-proyecto
```

## Verificación de la configuración

Para verificar que la configuración es correcta:

1. Ve a tu Dashboard de Auth0
2. Navega a **Applications** > **APIs** > **Auth0 Management API**
3. En la pestaña **Machine to Machine Applications**, verifica que tu aplicación esté listada y autorizada
4. Confirma que los permisos necesarios estén marcados
5. **CRÍTICO**: Verifica que las credenciales en el archivo `.env` coincidan exactamente con las de Auth0

## Solución de problemas

### Error "Invalid JWT"

Este error indica que las credenciales de Auth0 no son válidas o el token no se puede generar correctamente. Verifica:

1. **Credenciales exactas**: Asegúrate de que `AUTH0_DOMAIN`, `AUTH0_MGMT_CLIENT_ID` y `AUTH0_MGMT_CLIENT_SECRET` sean exactamente los valores de tu aplicación M2M sin modificaciones
2. **Formato del dominio**: El dominio debe incluir `.auth0.com` (ejemplo: `miempresa.auth0.com`)
3. **Client Secret completo**: El Client Secret debe copiarse completo desde Auth0, sin agregar sufijos como `-auth0-management-client-secret`
4. **Permisos**: Verifica que la aplicación M2M tenga los permisos necesarios para el Management API
5. **Redespliegue obligatorio**: Después de cambiar las variables de entorno, SIEMPRE redespliega la función

### Pasos para verificar credenciales:

1. **En Auth0 Dashboard**:
   - Ve a Applications > Applications
   - Busca tu aplicación M2M "ContaEmpresa Management API"
   - En Settings, copia exactamente Domain, Client ID y Client Secret
   
2. **En el archivo .env**:
   - Pega las credenciales sin modificar
   - No agregues sufijos o prefijos
   - Verifica que no haya espacios en blanco

3. **Redesplegar**:
   ```bash
   supabase functions deploy auth0-users --project-ref tu-ref-de-proyecto
   ```

### Otros errores comunes

Si encuentras otros errores:

1. **Logs de la función**: Revisa los logs de la función Edge en la consola de Supabase
2. **Permisos**: Asegúrate de que la aplicación M2M tenga todos los permisos necesarios
3. **Formato de datos**: Asegúrate de que los datos enviados a la función tengan el formato correcto

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

## Modo de desarrollo (Mock)

Si no tienes configuradas las credenciales de Auth0, la función automáticamente usará datos mock para desarrollo. Esto te permite probar la aplicación sin configurar Auth0 inicialmente.

Para usar datos reales de Auth0, asegúrate de configurar correctamente las variables de entorno como se describe arriba.

## Checklist de verificación

Antes de reportar problemas, verifica:

- [ ] Las credenciales en `.env` coinciden exactamente con las de Auth0
- [ ] El dominio incluye `.auth0.com`
- [ ] El Client Secret está completo y sin modificaciones
- [ ] La aplicación M2M tiene los permisos necesarios
- [ ] Has redesplegado la función después de cambiar credenciales
- [ ] No hay espacios en blanco en las credenciales