"use client"

import  React , {createContext, useContext, useState} from "react";

interface VisualPayloadContextType{
    selectedFiles : File[];
    setSelectedFiles: (files:File[])=>void;
}

const VisualPayloadContext = createContext<VisualPayloadContextType | undefined>(undefined);

export function VisualPayloadProvider({children}:{children:React.ReactNode}){
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    return (
        <VisualPayloadContext.Provider value={{selectedFiles,setSelectedFiles}} >
            {children}
        </VisualPayloadContext.Provider>
    );
}

export function useVisualPayload(){
    const context = useContext(VisualPayloadContext);
    if(!context){
        throw new Error("useVisualPayload must be used within a VisualPayloadProvider");
    }
    return context;
}
