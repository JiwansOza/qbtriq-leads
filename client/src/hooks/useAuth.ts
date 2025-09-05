import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "../../../shared/schema";

export function useAuth() {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  
  // Debug logging
  console.log("useAuth state:", { 
    clerkUser: !!clerkUser, 
    clerkLoaded, 
    isSignedIn,
    clerkUserId: clerkUser?.id 
  });
  
  const { data: user, isLoading: queryLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!clerkUser && clerkLoaded && isSignedIn,
    queryFn: async () => {
      console.log("useAuth queryFn called - getting token...");
      let token;
      try {
        token = await getToken();
        console.log("Token from Clerk:", token ? "present" : "missing");
        console.log("Token length:", token?.length || 0);
        console.log("Token preview:", token ? token.substring(0, 20) + "..." : "none");
      } catch (error) {
        console.error("Error getting token:", error);
        throw error;
      }
      
      const response = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error("Auth API error:", response.status, response.statusText);
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
  });

  // Get token for use in other components
  const getAuthToken = async () => {
    try {
      return await getToken();
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  console.log("useAuth returning:", { 
    user: !!user, 
    isLoading: !clerkLoaded || queryLoading, 
    isAuthenticated: isSignedIn && clerkLoaded 
  });

  return {
    user,
    isLoading: !clerkLoaded || queryLoading,
    isAuthenticated: isSignedIn && clerkLoaded,
    getAuthToken,
  };
}
