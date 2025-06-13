import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Copy, Check, RefreshCw } from 'lucide-react';

export const AuthDebugToken: React.FC = () => {
  const { getAccessTokenSilently, getIdTokenClaims } = useAuth0();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTokens, setShowTokens] = useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      // Get access token
      const token = await getAccessTokenSilently();
      setAccessToken(token);
      
      // Get ID token claims
      const claims = await getIdTokenClaims();
      setIdToken(claims);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [getAccessTokenSilently, getIdTokenClaims]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!accessToken && !idToken) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No tokens available. {loading ? 'Loading...' : ''}</p>
        <button 
          onClick={fetchTokens}
          disabled={loading}
          className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm flex items-center gap-1"
        >
          {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-blue-800">Auth0 Tokens</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowTokens(!showTokens)}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
          >
            {showTokens ? 'Hide Tokens' : 'Show Tokens'}
          </button>
          <button 
            onClick={fetchTokens}
            disabled={loading}
            className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1"
          >
            {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh
          </button>
        </div>
      </div>
      
      {showTokens && (
        <div className="space-y-4">
          {accessToken && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-xs font-medium text-blue-700">Access Token:</h4>
                <button 
                  onClick={() => copyToClipboard(accessToken)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200 flex items-center gap-1"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-white p-2 rounded border border-blue-200 text-xs overflow-auto max-h-20">
                {accessToken}
              </pre>
            </div>
          )}
          
          {idToken && (
            <div>
              <h4 className="text-xs font-medium text-blue-700 mb-1">ID Token Claims:</h4>
              <pre className="bg-white p-2 rounded border border-blue-200 text-xs overflow-auto max-h-40">
                {JSON.stringify(idToken, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-2">
        <h4 className="text-xs font-medium text-blue-700 mb-1">App Metadata:</h4>
        <pre className="bg-white p-2 rounded border border-blue-200 text-xs overflow-auto max-h-40">
          {JSON.stringify({
            'app_metadata (direct)': idToken?.app_metadata || 'Not found',
            'app_metadata (namespace)': idToken?.['https://contaempresa.com/app_metadata'] || 'Not found',
            'rol (namespace)': idToken?.['https://contaempresa.com/rol'] || 'Not found',
            'permisos (namespace)': idToken?.['https://contaempresa.com/permisos'] || 'Not found',
            'empresas (namespace)': idToken?.['https://contaempresa.com/empresas'] || 'Not found'
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};