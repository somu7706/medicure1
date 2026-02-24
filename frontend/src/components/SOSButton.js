import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { AlertCircle } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './ui/tooltip';

const SOSButton = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            size="icon"
                            variant="destructive"
                            className="h-16 w-16 rounded-full shadow-2xl pulse-animation bg-red-600 hover:bg-red-700 border-4 border-white/20"
                            onClick={() => navigate('/emergency')}
                        >
                            <AlertCircle className="h-8 w-8 animate-bounce" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="bg-destructive text-destructive-foreground font-bold">
                        <p>{t('emergency.sosTooltip')}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};

export default SOSButton;
