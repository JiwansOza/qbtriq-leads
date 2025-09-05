import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Custom hook for authenticated queries
export function useAuthenticatedQuery<T>(
  queryKey: (string | number)[],
  url: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { getAuthToken } = useAuth();

  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      const token = await getAuthToken();
      const response = await apiRequest("GET", url, undefined, token);
      return response.json();
    },
    ...options,
  });
}

// Custom hook for authenticated mutations
export function useAuthenticatedMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables, token: string) => Promise<TData>,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  const { getAuthToken } = useAuth();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const token = await getAuthToken();
      return mutationFn(variables, token);
    },
    ...options,
  });
}

// Helper function for common API operations
export function createAuthenticatedApiCall<TData = unknown, TVariables = unknown>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  urlBuilder: (variables: TVariables) => string
) {
  return (variables: TVariables, token: string) => {
    const url = typeof urlBuilder === 'function' ? urlBuilder(variables) : urlBuilder;
    return apiRequest(method, url, method !== "GET" ? variables : undefined, token);
  };
}
