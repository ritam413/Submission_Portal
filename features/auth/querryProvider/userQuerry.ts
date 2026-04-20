import { useQuery } from "@tanstack/react-query";

export const useAuthUser = () => {
    return useQuery({
        queryKey: ["authUser"],

        queryFn: async () => {
            const token = localStorage.getItem("event_auth_jwt:token");

            return {
                id: localStorage.getItem("event_auth_jwt:userId"),
                email: localStorage.getItem("event_auth_jwt:email"),
                name: localStorage.getItem("event_auth_jwt:name"),
                role: localStorage.getItem("event_auth_jwt:role"),
                teamId: localStorage.getItem("event_auth_jwt:teamId"),
                teamName: localStorage.getItem("event_auth_jwt:teamName"),
                isRegistered: localStorage.getItem("event_auth_jwt:isRegistered") === "true",
            }
        },
        staleTime: Infinity,
    })
}