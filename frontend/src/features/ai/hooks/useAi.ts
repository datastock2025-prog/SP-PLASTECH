import { useMutation } from '@tanstack/react-query';
import { aiApi, PromptAnalysisResponse } from '../api/aiApi';
import { PromptBuilderFormValues } from '../types/aiTypes';
import { useUiStore } from '../../../shared/stores/uiStore';

export function useAi() {
  const showToast = useUiStore((state) => state.showToast);

  const analyzeMutation = useMutation<PromptAnalysisResponse, Error, { config: PromptBuilderFormValues; promptText: string }>({
    mutationFn: (payload) => aiApi.analyzePrompt(payload),
    onSuccess: () => {
      showToast('AI analysis completed successfully');
    },
    onError: (error) => {
      showToast(error.message || 'AI request failed');
    },
  });

  return {
    analyzePrompt: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isPending,
    analysisResult: analyzeMutation.data,
    getStreamUrl: aiApi.getStreamUrl,
  };
}
