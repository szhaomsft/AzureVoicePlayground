import { useState, useCallback, useRef } from 'react'
import {
  Translation,
  Iteration,
  VideoTranslationConfig,
  TranslationProgress,
  VideoTranslationHistoryEntry,
  OperationStatus,
} from '../types/videoTranslation'
import {
  createTranslation,
  createIteration,
  getTranslation,
  listTranslations,
  deleteTranslation as apiDeleteTranslation,
  waitForTranslationReady,
  waitForIterationReady,
  VideoTranslationApiConfig,
} from '../lib/videoTranslation/videoTranslationClient'

export type TranslationStatus = 'idle' | 'uploading' | 'creating' | 'processing' | 'iterating' | 'completed' | 'error' | 'cancelled'

export interface UseVideoTranslationOptions {
  apiKey: string
  region: string
}

const HISTORY_STORAGE_KEY = 'video-translation-history'

function loadHistory(): VideoTranslationHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHistory(history: VideoTranslationHistoryEntry[]): void {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
}

export function useVideoTranslation({ apiKey, region }: UseVideoTranslationOptions) {
  const [status, setStatus] = useState<TranslationStatus>('idle')
  const [progress, setProgress] = useState<TranslationProgress>({
    step: 0,
    totalSteps: 4,
    message: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null)
  const [currentIteration, setCurrentIteration] = useState<Iteration | null>(null)
  const [translations, setTranslations] = useState<Translation[]>([])
  const [history, setHistory] = useState<VideoTranslationHistoryEntry[]>(loadHistory)

  const cancelRef = useRef(false)

  const getApiConfig = useCallback((): VideoTranslationApiConfig => ({
    region,
    apiKey,
  }), [region, apiKey])

  const addToHistory = useCallback((entry: Omit<VideoTranslationHistoryEntry, 'id'>) => {
    const newEntry: VideoTranslationHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
    }
    setHistory(prev => {
      const updated = [newEntry, ...prev].slice(0, 50) // Keep last 50 entries
      saveHistory(updated)
      return updated
    })
    return newEntry.id
  }, [])

  const updateHistoryEntry = useCallback((id: string, updates: Partial<VideoTranslationHistoryEntry>) => {
    setHistory(prev => {
      const updated = prev.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
      saveHistory(updated)
      return updated
    })
  }, [])

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(entry => entry.id !== id)
      saveHistory(updated)
      return updated
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    saveHistory([])
  }, [])

  const startTranslation = useCallback(async (
    videoUrl: string,
    config: VideoTranslationConfig,
    displayName?: string
  ) => {
    cancelRef.current = false
    setError(null)
    setStatus('creating')
    setProgress({ step: 1, totalSteps: 4, message: 'Creating translation...' })

    const translationId = crypto.randomUUID()
    const iterationId = crypto.randomUUID()

    // Add to history
    const historyId = addToHistory({
      translationId,
      displayName: displayName || `Translation ${new Date().toLocaleString()}`,
      sourceLocale: config.sourceLocale || 'auto',
      targetLocale: config.targetLocale,
      voiceKind: config.voiceKind,
      status: 'Running',
      createdAt: new Date().toISOString(),
      videoUrl,
    })

    try {
      const apiConfig = getApiConfig()

      // Step 1: Create translation
      const { translation } = await createTranslation(apiConfig, {
        translationId,
        displayName: displayName || `Translation ${new Date().toLocaleString()}`,
        input: {
          videoFileUrl: videoUrl,
          sourceLocale: config.sourceLocale || undefined,
          targetLocale: config.targetLocale,
          voiceKind: config.voiceKind,
          speakerCount: config.speakerCount,
          subtitleMaxCharCountPerSegment: config.subtitleMaxCharCountPerSegment,
          exportSubtitleInVideo: config.exportSubtitleInVideo,
          enableLipSync: config.enableLipSync,
        },
      })

      setCurrentTranslation(translation)
      setProgress({ step: 1, totalSteps: 4, message: 'Translation created, waiting for processing...', translationId })

      if (cancelRef.current) {
        setStatus('cancelled')
        updateHistoryEntry(historyId, { status: 'Canceled' })
        return
      }

      // Step 2: Wait for translation to be ready
      setStatus('processing')
      setProgress({ step: 2, totalSteps: 4, message: 'Processing video...', translationId })

      const readyTranslation = await waitForTranslationReady(
        apiConfig,
        translationId,
        (t) => {
          setCurrentTranslation(t)
          setProgress({ step: 2, totalSteps: 4, message: `Processing video... (${t.status})`, translationId })
          console.log('Translation status:', t.status, t)
          if (cancelRef.current) {
            throw new Error('Cancelled')
          }
        }
      )

      if (readyTranslation.status === 'Failed') {
        throw new Error(readyTranslation.failureReason || 'Translation failed')
      }

      if (cancelRef.current) {
        setStatus('cancelled')
        updateHistoryEntry(historyId, { status: 'Canceled' })
        return
      }

      // Step 3: Create iteration
      setStatus('iterating')
      setProgress({ step: 3, totalSteps: 4, message: 'Creating iteration...', translationId })

      const { iteration } = await createIteration(apiConfig, translationId, {
        iterationId,
      })

      setCurrentIteration(iteration)
      setProgress({ step: 3, totalSteps: 4, message: 'Generating translated video...', translationId, iterationId })

      // Step 4: Wait for iteration to complete
      const readyIteration = await waitForIterationReady(
        apiConfig,
        translationId,
        iterationId,
        (i) => {
          setCurrentIteration(i)
          setProgress({ step: 3, totalSteps: 4, message: `Generating translated video... (${i.status})`, translationId, iterationId })
          console.log('Iteration status:', i.status, i)
          if (cancelRef.current) {
            throw new Error('Cancelled')
          }
        }
      )

      if (readyIteration.status === 'Failed') {
        throw new Error(readyIteration.failureReason || 'Iteration failed')
      }

      // Success
      setStatus('completed')
      setProgress({ step: 4, totalSteps: 4, message: 'Translation completed!', translationId, iterationId })
      setCurrentIteration(readyIteration)

      updateHistoryEntry(historyId, {
        status: 'Succeeded',
        completedAt: new Date().toISOString(),
        resultVideoUrl: readyIteration.result?.translatedVideoFileUrl,
        sourceSubtitleUrl: readyIteration.result?.sourceLocaleSubtitleWebvttFileUrl,
        targetSubtitleUrl: readyIteration.result?.targetLocaleSubtitleWebvttFileUrl,
        metadataUrl: readyIteration.result?.metadataJsonWebvttFileUrl,
      })

      return readyIteration

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      if (errorMessage === 'Cancelled') {
        setStatus('cancelled')
        updateHistoryEntry(historyId, { status: 'Canceled' })
      } else {
        setError(errorMessage)
        setStatus('error')
        updateHistoryEntry(historyId, { status: 'Failed', error: errorMessage })
      }
    }
  }, [getApiConfig, addToHistory, updateHistoryEntry])

  const cancelTranslation = useCallback(() => {
    cancelRef.current = true
  }, [])

  const loadTranslations = useCallback(async () => {
    try {
      const apiConfig = getApiConfig()
      const result = await listTranslations(apiConfig)
      setTranslations(result.value)
      return result.value
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load translations'
      setError(errorMessage)
      return []
    }
  }, [getApiConfig])

  const refreshTranslation = useCallback(async (translationId: string) => {
    try {
      const apiConfig = getApiConfig()
      const translation = await getTranslation(apiConfig, translationId)
      setCurrentTranslation(translation)
      return translation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh translation'
      setError(errorMessage)
      return null
    }
  }, [getApiConfig])

  const deleteTranslation = useCallback(async (translationId: string) => {
    try {
      const apiConfig = getApiConfig()
      await apiDeleteTranslation(apiConfig, translationId)
      setTranslations(prev => prev.filter(t => t.id !== translationId))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete translation'
      setError(errorMessage)
      return false
    }
  }, [getApiConfig])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress({ step: 0, totalSteps: 4, message: '' })
    setError(null)
    setCurrentTranslation(null)
    setCurrentIteration(null)
    cancelRef.current = false
  }, [])

  return {
    // State
    status,
    progress,
    error,
    currentTranslation,
    currentIteration,
    translations,
    history,

    // Actions
    startTranslation,
    cancelTranslation,
    loadTranslations,
    refreshTranslation,
    deleteTranslation,
    reset,

    // History actions
    removeFromHistory,
    clearHistory,
  }
}
