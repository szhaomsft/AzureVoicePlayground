import { BlobStorageConfig } from '../types/voiceConversion';

/**
 * Uploads a file to Azure Blob Storage using the REST API with SAS token.
 * Returns the public URL of the uploaded blob.
 */
export async function uploadToBlob(
  file: File,
  config: BlobStorageConfig
): Promise<string> {
  // Trim whitespace from all config values
  const accountName = config.accountName.trim();
  const containerName = config.containerName.trim();
  const sasToken = config.sasToken.trim();

  // Generate a unique blob name with timestamp
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const blobName = `voice-conversion/${timestamp}-${sanitizedFileName}`;

  // Construct the blob URL
  // SAS token should start with '?' or we add it
  const sasTokenFormatted = sasToken.startsWith('?') ? sasToken : `?${sasToken}`;
  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}${sasTokenFormatted}`;

  console.log('Uploading to blob URL:', blobUrl.split('?')[0]);

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Upload using PUT request
  let response: Response;
  try {
    response = await fetch(blobUrl, {
      method: 'PUT',
      headers: {
        'x-ms-blob-type': 'BlockBlob',
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: arrayBuffer,
    });
  } catch (err) {
    console.error('Blob upload fetch error:', err);
    throw new Error(
      `Failed to upload to blob storage. This is likely a CORS issue. ` +
      `Please enable CORS on your Azure Storage Account "${accountName}": ` +
      `Go to Azure Portal → Storage Account → Settings → Resource sharing (CORS) → ` +
      `Add rule with Allowed origins: *, Methods: GET,PUT,OPTIONS, Headers: *`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload to blob storage: ${response.status} ${response.statusText}. ${errorText}`);
  }

  // Return the URL with SAS token which the Speech API should be able to use
  const publicUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}${sasTokenFormatted}`;

  console.log('Blob uploaded successfully:', publicUrl.split('?')[0]);
  return publicUrl;
}

/**
 * Validates blob storage configuration.
 */
export function validateBlobConfig(config: BlobStorageConfig): string | null {
  if (!config.accountName.trim()) {
    return 'Storage Account Name is required';
  }
  if (!config.containerName.trim()) {
    return 'Container Name is required';
  }
  if (!config.sasToken.trim()) {
    return 'SAS Token is required';
  }
  return null;
}

/**
 * Loads blob storage config from localStorage.
 */
export function loadBlobConfig(): BlobStorageConfig {
  try {
    const saved = localStorage.getItem('azure-voice-blob-config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load blob config:', e);
  }
  return {
    accountName: '',
    containerName: '',
    sasToken: '',
  };
}

/**
 * Saves blob storage config to localStorage.
 */
export function saveBlobConfig(config: BlobStorageConfig): void {
  try {
    localStorage.setItem('azure-voice-blob-config', JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save blob config:', e);
  }
}
