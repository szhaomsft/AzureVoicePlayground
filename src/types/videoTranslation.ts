export type VoiceKind = 'PlatformVoice' | 'PersonalVoice'

export type OperationStatus = 'NotStarted' | 'Running' | 'Succeeded' | 'Failed' | 'Canceled'

export type WebvttFileKind = 'SourceLocaleSubtitle' | 'TargetLocaleSubtitle' | 'MetadataJson'

export interface TranslationInput {
  videoFileUrl?: string
  audioFileUrl?: string
  sourceLocale?: string
  targetLocale: string
  voiceKind: VoiceKind
  speakerCount?: number
  subtitleMaxCharCountPerSegment?: number
  exportSubtitleInVideo?: boolean
  enableLipSync?: boolean
}

export interface IterationResult {
  translatedVideoFileUrl?: string
  sourceLocaleSubtitleWebvttFileUrl?: string
  targetLocaleSubtitleWebvttFileUrl?: string
  metadataJsonWebvttFileUrl?: string
}

export interface IterationInput {
  speakerCount?: number
  exportSubtitleInVideo?: boolean
  subtitleMaxCharCountPerSegment?: number
  webvttFile?: {
    url: string
    kind: WebvttFileKind
  }
}

export interface Iteration {
  id: string
  description?: string
  createdDateTime: string
  status: OperationStatus
  lastActionDateTime?: string
  input?: IterationInput
  result?: IterationResult
  failureReason?: string
}

export interface Translation {
  id: string
  displayName?: string
  description?: string
  createdDateTime: string
  status: OperationStatus
  lastActionDateTime?: string
  input: TranslationInput
  latestIteration?: Iteration
  latestSucceededIteration?: Iteration
  failureReason?: string
}

export interface OperationResponse {
  id: string
  status: OperationStatus
}

export interface PagedTranslations {
  value: Translation[]
  nextLink?: string
}

export interface PagedIterations {
  value: Iteration[]
  nextLink?: string
}

export interface CreateTranslationParams {
  translationId: string
  displayName?: string
  description?: string
  input: TranslationInput
}

export interface CreateIterationParams {
  iterationId: string
  description?: string
  input?: IterationInput
}

export interface VideoTranslationConfig {
  sourceLocale: string
  targetLocale: string
  voiceKind: VoiceKind
  enableLipSync: boolean
  exportSubtitleInVideo: boolean
  speakerCount?: number
  subtitleMaxCharCountPerSegment?: number
}

export interface TranslationProgress {
  step: number
  totalSteps: number
  message: string
  translationId?: string
  iterationId?: string
}

export interface VideoTranslationHistoryEntry {
  id: string
  translationId: string
  displayName?: string
  sourceLocale: string
  targetLocale: string
  voiceKind: VoiceKind
  status: OperationStatus
  createdAt: string
  completedAt?: string
  videoUrl?: string
  resultVideoUrl?: string
  sourceSubtitleUrl?: string
  targetSubtitleUrl?: string
  metadataUrl?: string
  error?: string
}
