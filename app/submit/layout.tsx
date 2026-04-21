import { VisualPayloadProvider } from "@/hooks/useVisualPayload";

export default function SubmitLayout({
    children,
}:{children: React.ReactNode}) {
    return (
        <VisualPayloadProvider>
            {children}
        </VisualPayloadProvider>
    )
}