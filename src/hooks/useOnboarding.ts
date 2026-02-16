'use client';
import type { UserOnboardingDataResponse } from '@server/interfaces/api/onboardingInterfaces';
import useSWR from 'swr';

interface UseOnboardingResponse {
  data?: UserOnboardingDataResponse;
  loading: boolean;
  error: unknown;
  mutate: () => Promise<UserOnboardingDataResponse | undefined>;
}

export const useOnboarding = (userId?: number): UseOnboardingResponse => {
  const { data, error, mutate } = useSWR<UserOnboardingDataResponse>(
    userId ? `/api/v1/user/${userId}/onboarding` : null,
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    data,
    loading: !data && !error && !!userId,
    error,
    mutate,
  };
};

export default useOnboarding;
