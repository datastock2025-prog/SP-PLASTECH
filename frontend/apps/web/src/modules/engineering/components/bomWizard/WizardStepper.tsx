import React from 'react';
import { WizardStepId, WIZARD_STEPS } from './types';
import { Check, AlertCircle } from 'lucide-react';

interface WizardStepperProps {
  currentStep: WizardStepId;
  completedSteps: WizardStepId[];
  stepErrors: Record<number, number>;
  onStepClick: (step: WizardStepId) => void;
}

export const WizardStepper: React.FC<WizardStepperProps> = ({
  currentStep,
  completedSteps,
  stepErrors,
  onStepClick,
}) => {
  return (
    <div className="bg-white border-b border-[#E4E0D6] px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
        {WIZARD_STEPS.map((step, idx) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const hasErrors = (stepErrors[step.id] || 0) > 0;
          const isAccessible = isCompleted || step.id <= currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick(step.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-[#14213D] text-white shadow-sm ring-2 ring-[#E8622C]'
                    : isCompleted
                    ? 'hover:bg-[#F6F4EF] text-[#14213D] cursor-pointer'
                    : 'opacity-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {/* Step number / icon badge */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-[#E8622C] text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>

                {/* Step title & meta */}
                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-xs font-bold truncate">
                      {step.title}
                    </span>
                    {step.isOptional && (
                      <span
                        className={`text-[9px] uppercase px-1 py-0.2 rounded font-semibold ${
                          isCurrent ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        Opt
                      </span>
                    )}
                    {hasErrors && (
                      <span className="flex items-center text-rose-500 text-[10px] font-bold" title={`${stepErrors[step.id]} issue(s)`}>
                        <AlertCircle className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] truncate max-w-[120px] ${
                      isCurrent ? 'text-slate-300' : 'text-gray-400'
                    }`}
                  >
                    {step.subtitle}
                  </div>
                </div>
              </button>

              {/* Connecting line */}
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-3 lg:w-6 shrink-0 transition-colors ${
                    completedSteps.includes(step.id) ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
