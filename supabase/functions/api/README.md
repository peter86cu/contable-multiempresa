# ContaEmpresa API

This is the API for ContaEmpresa, a comprehensive accounting management system. The API is implemented as a Supabase Edge Function that connects to Firebase for data storage.

## Setup

1. Create a `.env` file based on `.env.example` with your Firebase credentials
2. Deploy the function to Supabase

## Environment Variables

The following environment variables are required:

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_AUTH_EMAIL=admin@contaempresa.com
FIREBASE_AUTH_PASSWORD=your-secure-password
```

## API Endpoints

### Empresas

- `GET /api/empresas` - Get all empresas
- `GET /api/empresas/:id` - Get empresa by ID
- `GET /api/empresas/pais/:paisId` - Get empresas by país

### Paises

- `GET /api/paises` - Get all paises
- `GET /api/paises/:id` - Get país by ID

### Contabilidad

- `GET /api/contabilidad/cuentas?empresa_id=:empresaId` - Get plan de cuentas
- `GET /api/contabilidad/asientos?empresa_id=:empresaId&fecha_desde=:fechaDesde&fecha_hasta=:fechaHasta` - Get asientos contables

### Tesorería

- `GET /api/tesoreria/cuentas?empresa_id=:empresaId` - Get cuentas bancarias
- `GET /api/tesoreria/movimientos?empresa_id=:empresaId` - Get movimientos de tesorería

### Nomencladores

- `GET /api/nomencladores/:tipo?pais_id=:paisId` - Get nomencladores by tipo

## Authentication

All API endpoints require authentication with Firebase. The API uses the Firebase Admin SDK to authenticate requests.

## CORS

The API supports CORS for cross-origin requests.

## Error Handling

The API returns appropriate HTTP status codes and error messages in JSON format.

## Deployment

To deploy the API to Supabase:

```bash
supabase functions deploy api --project-ref your-project-ref
```

## Custom Domain

To use a custom domain (api.contaempresa.online), you need to:

1. Add the domain to your Supabase project
2. Configure DNS records to point to Supabase
3. Update the `VITE_API_BASE_URL` environment variable in your frontend project