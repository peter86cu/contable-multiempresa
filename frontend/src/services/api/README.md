# API Service

This module provides a service for interacting with the ContaEmpresa API.

## Usage

```typescript
import { ApiService } from './services/api';

// Get all empresas
const empresas = await ApiService.getEmpresas();

// Get empresa by ID
const empresa = await ApiService.getEmpresaById('empresa-id');

// Get empresas by país
const empresas = await ApiService.getEmpresasByPais('peru');

// Get all paises
const paises = await ApiService.getPaises();

// Get país by ID
const pais = await ApiService.getPaisById('peru');

// Get plan de cuentas
const cuentas = await ApiService.getPlanCuentas('empresa-id');

// Get asientos contables
const asientos = await ApiService.getAsientos('empresa-id', '2024-01-01', '2024-12-31');

// Get cuentas bancarias
const cuentas = await ApiService.getCuentasBancarias('empresa-id');

// Get movimientos de tesorería
const movimientos = await ApiService.getMovimientosTesoreria('empresa-id');

// Get nomencladores
const nomencladores = await ApiService.getNomencladores('tiposDocumentoIdentidad', 'peru');
```

## Configuration

The API service uses the following environment variables:

- `VITE_API_BASE_URL`: The base URL of the API (default: https://api.contaempresa.online)

## Authentication

The API service automatically handles authentication with Firebase. It ensures that the user is authenticated before making any API requests.

## Error Handling

The API service throws errors when API requests fail. These errors can be caught and handled by the caller.

## Retry Logic

The API service includes retry logic for failed requests. By default, it will retry a request 3 times with a 1-second delay between retries.

## Hooks

For React components, you can use the `useApi` hook to make API requests:

```typescript
import { useApi } from '../hooks/useApi';

function MyComponent() {
  const { loading, error, getEmpresas } = useApi();
  
  const handleLoadEmpresas = async () => {
    const empresas = await getEmpresas();
    console.log(empresas);
  };
  
  return (
    <div>
      <button onClick={handleLoadEmpresas} disabled={loading}>
        {loading ? 'Loading...' : 'Load Empresas'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```