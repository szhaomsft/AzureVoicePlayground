import {
  Translation,
  Iteration,
  PagedTranslations,
  PagedIterations,
  CreateTranslationParams,
  CreateIterationParams,
  OperationResponse,
  OperationStatus,
} from '../../types/videoTranslation'

const API_VERSION = '2024-05-20-preview'

export interface VideoTranslationApiConfig {
  region: string
  apiKey: string
}

function getBaseUrl(region: string): string {
  return `https://${region}.api.cognitive.microsoft.com/videotranslation`
}

function getHeaders(apiKey: string, operationId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Ocp-Apim-Subscription-Key': apiKey,
    'Content-Type': 'application/json',
  }
  if (operationId) {
    headers['Operation-Id'] = operationId
  }
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      console.error('API Error Response:', errorBody)
      if (errorBody.error?.message) {
        errorMessage = errorBody.error.message
      } else if (errorBody.message) {
        errorMessage = errorBody.message
      } else if (errorBody.error?.code) {
        errorMessage = `${errorBody.error.code}: ${JSON.stringify(errorBody.error)}`
      }
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export async function createTranslation(
  config: VideoTranslationApiConfig,
  params: CreateTranslationParams
): Promise<{ translation: Translation; operationLocation: string }> {
  const url = `${getBaseUrl(config.region)}/translations/${params.translationId}?api-version=${API_VERSION}`

  // Build input with only defined fields
  const input: Record<string, unknown> = {
    targetLocale: params.input.targetLocale,
    voiceKind: params.input.voiceKind,
  }
  if (params.input.videoFileUrl !== undefined) {
    input.videoFileUrl = params.input.videoFileUrl
  }
  if (params.input.audioFileUrl !== undefined) {
    input.audioFileUrl = params.input.audioFileUrl
  }
  if (params.input.sourceLocale !== undefined && params.input.sourceLocale !== '') {
    input.sourceLocale = params.input.sourceLocale
  }
  if (params.input.speakerCount !== undefined) {
    input.speakerCount = params.input.speakerCount
  }
  if (params.input.subtitleMaxCharCountPerSegment !== undefined) {
    input.subtitleMaxCharCountPerSegment = params.input.subtitleMaxCharCountPerSegment
  }
  if (params.input.exportSubtitleInVideo !== undefined) {
    input.exportSubtitleInVideo = params.input.exportSubtitleInVideo
  }
  if (params.input.enableLipSync !== undefined) {
    input.enableLipSync = params.input.enableLipSync
  }

  // Build body with only defined fields
  const body: Record<string, unknown> = { input }
  if (params.displayName !== undefined) {
    body.displayName = params.displayName
  }
  if (params.description !== undefined) {
    body.description = params.description
  }

  const operationId = crypto.randomUUID()
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(config.apiKey, operationId),
    body: JSON.stringify(body),
  })

  const operationLocation = response.headers.get('Operation-Location') || ''
  const translation = await handleResponse<Translation>(response)

  return { translation, operationLocation }
}

export async function getTranslation(
  config: VideoTranslationApiConfig,
  translationId: string
): Promise<Translation> {
  const url = `${getBaseUrl(config.region)}/translations/${translationId}?api-version=${API_VERSION}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config.apiKey),
  })

  return handleResponse<Translation>(response)
}

export async function listTranslations(
  config: VideoTranslationApiConfig,
  nextLink?: string
): Promise<PagedTranslations> {
  const url = nextLink || `${getBaseUrl(config.region)}/translations?api-version=${API_VERSION}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config.apiKey),
  })

  return handleResponse<PagedTranslations>(response)
}

export async function deleteTranslation(
  config: VideoTranslationApiConfig,
  translationId: string
): Promise<void> {
  const url = `${getBaseUrl(config.region)}/translations/${translationId}?api-version=${API_VERSION}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getHeaders(config.apiKey),
  })

  await handleResponse<void>(response)
}

export async function createIteration(
  config: VideoTranslationApiConfig,
  translationId: string,
  params: CreateIterationParams
): Promise<{ iteration: Iteration; operationLocation: string }> {
  const url = `${getBaseUrl(config.region)}/translations/${translationId}/iterations/${params.iterationId}?api-version=${API_VERSION}`

  // Build input object - input is required, but all fields within are optional
  const input: Record<string, unknown> = {}
  if (params.input?.speakerCount !== undefined) {
    input.speakerCount = params.input.speakerCount
  }
  if (params.input?.exportSubtitleInVideo !== undefined) {
    input.exportSubtitleInVideo = params.input.exportSubtitleInVideo
  }
  if (params.input?.subtitleMaxCharCountPerSegment !== undefined) {
    input.subtitleMaxCharCountPerSegment = params.input.subtitleMaxCharCountPerSegment
  }
  if (params.input?.webvttFile !== undefined) {
    input.webvttFile = params.input.webvttFile
  }

  // Build body - input is required per API spec
  const body: Record<string, unknown> = {
    input: input,  // Always include input, even if empty
  }
  if (params.description !== undefined) {
    body.description = params.description
  }

  console.log('Creating iteration with body:', JSON.stringify(body))

  const operationId = crypto.randomUUID()
  const response = await fetch(url, {
    method: 'PUT',
    headers: getHeaders(config.apiKey, operationId),
    body: JSON.stringify(body),
  })

  const operationLocation = response.headers.get('Operation-Location') || ''
  const iteration = await handleResponse<Iteration>(response)

  return { iteration, operationLocation }
}

export async function getIteration(
  config: VideoTranslationApiConfig,
  translationId: string,
  iterationId: string
): Promise<Iteration> {
  const url = `${getBaseUrl(config.region)}/translations/${translationId}/iterations/${iterationId}?api-version=${API_VERSION}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config.apiKey),
  })

  return handleResponse<Iteration>(response)
}

export async function listIterations(
  config: VideoTranslationApiConfig,
  translationId: string,
  nextLink?: string
): Promise<PagedIterations> {
  const url = nextLink || `${getBaseUrl(config.region)}/translations/${translationId}/iterations?api-version=${API_VERSION}`

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config.apiKey),
  })

  return handleResponse<PagedIterations>(response)
}

export async function pollOperation(
  operationUrl: string,
  apiKey: string
): Promise<OperationResponse> {
  const response = await fetch(operationUrl, {
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
  })

  return handleResponse<OperationResponse>(response)
}

export async function waitForOperationComplete(
  operationUrl: string,
  apiKey: string,
  onProgress?: (status: OperationStatus) => void,
  maxWaitMs: number = 3600000, // 1 hour max
  pollIntervalMs: number = 5000
): Promise<OperationResponse> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const operation = await pollOperation(operationUrl, apiKey)

    if (onProgress) {
      onProgress(operation.status)
    }

    if (operation.status === 'Succeeded' || operation.status === 'Failed' || operation.status === 'Canceled') {
      return operation
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error('Operation timed out')
}

export async function waitForTranslationReady(
  config: VideoTranslationApiConfig,
  translationId: string,
  onProgress?: (translation: Translation) => void,
  maxWaitMs: number = 3600000,
  pollIntervalMs: number = 5000
): Promise<Translation> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const translation = await getTranslation(config, translationId)

    if (onProgress) {
      onProgress(translation)
    }

    if (translation.status === 'Succeeded' || translation.status === 'Failed' || translation.status === 'Canceled') {
      return translation
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error('Translation timed out')
}

export async function waitForIterationReady(
  config: VideoTranslationApiConfig,
  translationId: string,
  iterationId: string,
  onProgress?: (iteration: Iteration) => void,
  maxWaitMs: number = 3600000,
  pollIntervalMs: number = 5000
): Promise<Iteration> {
  const startTime = Date.now()

  while (Date.now() - startTime < maxWaitMs) {
    const iteration = await getIteration(config, translationId, iterationId)

    if (onProgress) {
      onProgress(iteration)
    }

    if (iteration.status === 'Succeeded' || iteration.status === 'Failed' || iteration.status === 'Canceled') {
      return iteration
    }

    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error('Iteration timed out')
}
