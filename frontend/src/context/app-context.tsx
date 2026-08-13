"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface User {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
}

interface AppContextType {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

    return (
        <AppContext.Provider
            value={{
                currentUser,
                setCurrentUser,
                isSidebarOpen,
                setIsSidebarOpen,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
}
