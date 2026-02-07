import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DateContextType {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    goToToday: () => void;
    nextDay: () => void;
    prevDay: () => void;
    formatDateForAPI: (date: Date) => string;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export const useDate = () => {
    const context = useContext(DateContext);
    if (!context) {
        throw new Error('useDate must be used within a DateProvider');
    }
    return context;
};

interface DateProviderProps {
    children: ReactNode;
}

export const DateProvider: React.FC<DateProviderProps> = ({ children }) => {
    // Initialize with current device date (stripped of time to avoid mismatches)
    const [selectedDate, setSelectedDateState] = useState<Date>(() => {
        const now = new Date();
        // Normalize to midnight to avoid time comparison issues
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    });

    const setSelectedDate = (date: Date) => {
        // Always normalize to midnight
        const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        setSelectedDateState(normalized);
    };

    const goToToday = () => {
        const now = new Date();
        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    };

    const nextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 1);
        setSelectedDate(next);
    };

    const prevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 1);
        setSelectedDate(prev);
    };

    // Helper to format date as YYYY-MM-DD for backend consistency
    const formatDateForAPI = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const value = {
        selectedDate,
        setSelectedDate,
        goToToday,
        nextDay,
        prevDay,
        formatDateForAPI
    };

    return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
};
