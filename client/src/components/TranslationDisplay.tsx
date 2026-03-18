import { MessageSquare } from "lucide-react";

interface TranslationDisplayProps {
  direction: string;
  currentTranslation?: {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
  };
  isActive: boolean;
}

export default function TranslationDisplay({
  direction,
  currentTranslation,
  isActive,
}: TranslationDisplayProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 min-h-[120px] shadow-sm" data-testid="translation-display">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <MessageSquare className="text-primary text-sm" />
          <span className="text-sm font-medium text-foreground" data-testid="text-translation-direction">{direction}</span>
        </div>
        {isActive && (
          <div className="flex items-center space-x-1">
            <div className="w-1 h-1 bg-success rounded-full"></div>
            <div className="w-1 h-1 bg-success rounded-full animation-delay-200"></div>
            <div className="w-1 h-1 bg-success rounded-full animation-delay-400"></div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        {currentTranslation ? (
          <div className="text-foreground text-lg" data-testid="text-translated">
            {currentTranslation.translatedText}
          </div>
        ) : (
          <div className="text-muted-foreground text-lg italic" data-testid="text-no-translation">
            {isActive ? "Listening..." : "Waiting for speech..."}
          </div>
        )}
      </div>
    </div>
  );
}
