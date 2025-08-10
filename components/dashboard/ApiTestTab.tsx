import React from 'react';
import { ApiTestResult } from './types';

interface ApiTestTabProps {
  apiResults: ApiTestResult[];
  loading: boolean;
  testEndpoint: (endpoint: string, method?: string, body?: any) => void;
  testAllEndpoints: () => void;
}

export default function ApiTestTab({
  apiResults,
  loading,
  testEndpoint,
  testAllEndpoints
}: ApiTestTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Test API Endpoints</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Quick Tests</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => testAllEndpoints()}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test All GET'}
          </button>
          <button
            onClick={() => testEndpoint('/api/students')}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Students
          </button>
          <button
            onClick={() => testEndpoint('/api/facilities')}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Facilities
          </button>
          <button
            onClick={() => testEndpoint('/api/classes')}
            disabled={loading}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Classes
          </button>
          <button
            onClick={() => testEndpoint('/api/employees')}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Employees
          </button>
          <button
            onClick={() => testEndpoint('/api/teaching-sessions')}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Test Sessions
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-4">Test Results</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {apiResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a button above to test an endpoint.</p>
          ) : (
            apiResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status >= 200 && result.status < 300
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm">
                    {result.method} {result.endpoint}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      result.status >= 200 && result.status < 300
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status || 'ERROR'}
                  </span>
                </div>
                {result.error ? (
                  <p className="text-red-600 text-sm">{result.error}</p>
                ) : (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View Response ({result.data?.data?.length || 0} items)
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
