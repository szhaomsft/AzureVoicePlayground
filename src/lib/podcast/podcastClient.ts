/**
 * Azure Podcast API Client
 * Based on the Podcast API 2026-01-01-preview
 */

import {
  Generation,
  CreateGenerationParams,
  OperationResponse,
  OperationStatus,
  PodcastApiConfig,
  PodcastContentSource,
  PodcastContent,
  TempFile,
} from '../../types/podcast';

const API_VERSION = '2026-01-01-preview';

function getBaseUrl(region: string): string {
  return `https://${region}.api.cognitive.microsoft.com/podcast`;
}

function getHeaders(apiKey: string, operationId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': apiKey,
    'Content-Type': 'application/json',
  };
  if (operationId) {
    headers['Operation-Id'] = operationId;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      console.error('Podcast API Error Response:', errorBody);
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message;
      } else if (errorBody.message) {
        errorMessage = errorBody.message;
      } else if (errorBody.error?.code) {
        errorMessage = `${errorBody.error.code}: ${JSON.stringify(errorBody.error)}`;
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Convert a File object to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Prepare content payload based on source type
 */
export async function prepareContentPayload(
  source: PodcastContentSource
): Promise<PodcastContent> {
  if (source.type === 'text') {
    return {
      kind: 'PlainText',
      text: source.text,
      fileFormat: 'Txt',
    };
  }

  if (source.type === 'url') {
    // Detect file format from URL
    const urlLower = source.url!.toLowerCase();
    const isPdf = urlLower.endsWith('.pdf') || urlLower.includes('.pdf?');

    return {
      kind: 'AzureStorageBlobPublicUrl',
      url: source.url,
      fileFormat: isPdf ? 'Pdf' : 'Txt',
    };
  }

  if (source.type === 'file' && source.file) {
    // Convert file to base64
    const base64Text = await fileToBase64(source.file);
    const isPdf = source.file.type === 'application/pdf' || source.file.name.toLowerCase().endsWith('.pdf');

    return {
      kind: 'FileBase64',
      base64Text,
      fileFormat: isPdf ? 'Pdf' : 'Txt',
    };
  }

  throw new Error('Invalid content source');
}

/**
 * Upload a temporary file using multipart/form-data
 */
export async function uploadTempFile(
  config: PodcastApiConfig,
  file: File,
  tempFileId: string,
  expiresAfterInMins: number = 60
): Promise<TempFile> {
  const url = `${getBaseUrl(config.region)}/tempfiles/${tempFileId}?api-version=${API_VERSION}`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('expiresAfterInMins', expiresAfterInMins.toString());

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': config.apiKey,
    },
    body: formData,
  });

  return handleResponse<TempFile>(response);
}

/**
 * Get temp file info
 */
export async function getTempFile(
  config: PodcastApiConfig,
  tempFileId: string
): Promise<TempFile> {
  const url = `${getBaseUrl(config.region)}/tempfiles/${tempFileId}?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config.apiKey),
  });

  return handleResponse<TempFile>(response);
}

/**
 * Delete temp file
 */
export async function deleteTempFile(
  config: PodcastApiConfig,
  tempFileId: string
): Promise<void> {
  const url = `${getBaseUrl(config.region)}/tempfiles/${tempFileId}?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(config.apiKey),
  });

  await handleResponse<void>(response);
}

/**
 * Create a podcast generation
 */
export async function createGeneration(
  config: PodcastApiConfig,
  params: CreateGenerationParams
): Promise<{ generation: Generation; operationLocation: string }> {
  const url = `${getBaseUrl(config.region)}/generations/${params.generationId}?api-version=${API_VERSION}`;

  const operationId = crypto.randomUUID();

  // Build request body with only defined fields
  const body: Record<string, unknown> = {
    locale: params.locale,
    host: params.host,
    content: params.content,
  };

  if (params.displayName !== undefined) {
    body.displayName = params.displayName;
  }

  if (params.scriptGeneration !== undefined) {
    body.scriptGeneration = params.scriptGeneration;
  }

  if (params.tts !== undefined) {
    body.tts = params.tts;
  }

  console.log('Creating podcast generation:', params.generationId);
  console.log('Request body:', JSON.stringify(body, null, 2));

  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(config.apiKey, operationId),
    body: JSON.stringify(body),
  });

  const generation = await handleResponse<Generation>(response);

  // Get operation location from header
  const operationLocation = response.headers.get('Operation-Location') || '';

  return { generation, operationLocation };
}

/**
 * Get generation status
 */
export async function getGeneration(
  config: PodcastApiConfig,
  generationId: string
): Promise<Generation> {
  const url = `${getBaseUrl(config.region)}/generations/${generationId}?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config.apiKey),
  });

  return handleResponse<Generation>(response);
}

/**
 * Poll operation status
 */
export async function pollOperation(
  operationUrl: string,
  apiKey: string
): Promise<OperationResponse> {
  const response = await fetch(operationUrl, {
    method: 'GET',
    headers: getHeaders(apiKey),
  });

  return handleResponse<OperationResponse>(response);
}

/**
 * Delete generation
 */
export async function deleteGeneration(
  config: PodcastApiConfig,
  generationId: string
): Promise<void> {
  const url = `${getBaseUrl(config.region)}/generations/${generationId}?api-version=${API_VERSION}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(config.apiKey),
  });

  await handleResponse<void>(response);
}

/**
 * Wait for generation to complete with polling
 */
export async function waitForGenerationComplete(
  config: PodcastApiConfig,
  generationId: string,
  onProgress?: (generation: Generation) => void,
  maxWaitMs: number = 30 * 60 * 1000, // 30 minutes
  pollIntervalMs: number = 3000 // 3 seconds
): Promise<Generation> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    // Fetch current generation status
    const generation = await getGeneration(config, generationId);

    // Call progress callback if provided
    if (onProgress) {
      onProgress(generation);
    }

    // Check for terminal states
    if (generation.status === 'Succeeded') {
      console.log('Generation succeeded:', generationId);
      return generation;
    }

    if (generation.status === 'Failed') {
      const errorMsg = generation.failureReason || 'Generation failed';
      console.error('Generation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    // Log progress
    console.log(`Generation ${generationId} status: ${generation.status}`);

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Generation timed out after ${maxWaitMs / 1000} seconds`);
}

/**
 * Helper to create a generation ID
 */
export function createGenerationId(): string {
  return crypto.randomUUID();
}

/**
 * Helper to create a temp file ID
 */
export function createTempFileId(): string {
  return crypto.randomUUID();
}
