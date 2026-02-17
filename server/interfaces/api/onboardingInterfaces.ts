import type {
  TutorialMode,
  TooltipPosition,
} from '@server/entity/TutorialStep';
import type { WelcomeContentType } from '@server/entity/WelcomeContent';
import type { OnboardingSettings } from '@server/lib/settings';

export interface WelcomeContentResponse {
  id: number;
  type: WelcomeContentType;
  order: number;
  enabled: boolean;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoAutoplay: boolean;
  customHtml?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WelcomeContentCreateRequest {
  type?: WelcomeContentType;
  order?: number;
  enabled?: boolean;
  title: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoAutoplay?: boolean;
  customHtml?: string;
}

export interface WelcomeContentUpdateRequest extends Partial<WelcomeContentCreateRequest> {
  id: number;
}

export interface WelcomeContentReorderRequest {
  items: { id: number; order: number }[];
}

export interface TutorialStepResponse {
  id: number;
  order: number;
  enabled: boolean;
  mode: TutorialMode;
  targetSelector: string;
  title: string;
  description: string;
  tooltipPosition: TooltipPosition;
  route?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoAutoplay?: boolean;
  customHtml?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorialStepCreateRequest {
  order?: number;
  enabled?: boolean;
  mode?: TutorialMode;
  targetSelector: string;
  title: string;
  description: string;
  tooltipPosition?: TooltipPosition;
  route?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoAutoplay?: boolean;
  customHtml?: string;
}

export interface TutorialStepUpdateRequest extends Partial<TutorialStepCreateRequest> {
  id: number;
}

export interface TutorialStepReorderRequest {
  items: { id: number; order: number }[];
}

export interface UserOnboardingStatusResponse {
  id: number;
  userId: number;
  welcomeCompleted: boolean;
  welcomeCompletedAt?: string;
  welcomeDismissed: boolean;
  tutorialCompleted: boolean;
  tutorialCompletedAt?: string;
  tutorialProgress: number[];
  createdAt: string;
  updatedAt: string;
}

export interface TutorialProgressRequest {
  stepId: number;
}

export interface OnboardingSettingsResponse extends OnboardingSettings {
  // Extends the settings interface directly
}

export interface UserOnboardingDataResponse {
  status: UserOnboardingStatusResponse | null;
  settings: OnboardingSettingsResponse;
  welcomeContent: WelcomeContentResponse[];
  tutorialSteps: TutorialStepResponse[];
}
