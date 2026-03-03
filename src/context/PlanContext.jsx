import React, { createContext, useContext, useState, useEffect } from 'react';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
    const [plan, setPlan] = useState(() => localStorage.getItem('vc_plan') || 'free');
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('vc_gemini_key') || '');

    useEffect(() => localStorage.setItem('vc_plan', plan), [plan]);
    useEffect(() => localStorage.setItem('vc_gemini_key', apiKey), [apiKey]);

    return (
        <PlanContext.Provider value={{ plan, setPlan, apiKey, setApiKey }}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlan() {
    return useContext(PlanContext);
}
