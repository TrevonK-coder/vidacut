import React, { createContext, useContext, useState, useEffect } from 'react';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
    const [plan, setPlan] = useState(() => localStorage.getItem('vc_plan') || 'free');

    useEffect(() => localStorage.setItem('vc_plan', plan), [plan]);

    return (
        <PlanContext.Provider value={{ plan, setPlan }}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlan() {
    return useContext(PlanContext);
}
