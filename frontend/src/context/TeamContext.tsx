import React, { createContext, useContext, useState, useCallback } from "react";

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
}

interface TeamMember {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "member" | "viewer";
}

interface TeamContextType {
  teams: Team[];
  isLoading: boolean;
  error: string | null;
  fetchTeams: () => Promise<void>;
  createTeam: (name: string, description?: string) => Promise<void>;
  updateTeam: (
    teamId: string,
    name: string,
    description?: string
  ) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, email: string, role: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/teams`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }

      const data = await response.json();
      if (data.success) {
        setTeams(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch teams");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (name: string, description?: string) => {
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/teams`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          body: JSON.stringify({ name, description }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      const data = await response.json();
      if (data.success) {
        setTeams((prevTeams) => [...prevTeams, data.data]);
      } else {
        throw new Error(data.message || "Failed to create team");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  }, []);

  const updateTeam = useCallback(
    async (teamId: string, name: string, description?: string) => {
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/teams/${teamId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify({ name, description }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update team");
        }

        const data = await response.json();
        if (data.success) {
          setTeams((prevTeams) =>
            prevTeams.map((team) =>
              team._id === teamId ? { ...team, ...data.data } : team
            )
          );
        } else {
          throw new Error(data.message || "Failed to update team");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      }
    },
    []
  );

  const deleteTeam = useCallback(async (teamId: string) => {
    setError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/teams/${teamId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete team");
      }

      const data = await response.json();
      if (data.success) {
        setTeams((prevTeams) =>
          prevTeams.filter((team) => team._id !== teamId)
        );
      } else {
        throw new Error(data.message || "Failed to delete team");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  }, []);

  const addTeamMember = useCallback(
    async (teamId: string, email: string, role: string) => {
      setError(null);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APP_BACKEND_URL}/api/teams/${teamId}/members`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify({ email, role }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add team member");
        }

        const data = await response.json();
        if (data.success) {
          setTeams((prevTeams) =>
            prevTeams.map((team) =>
              team._id === teamId
                ? { ...team, members: [...team.members, data.data] }
                : team
            )
          );
        } else {
          throw new Error(data.message || "Failed to add team member");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      }
    },
    []
  );

  const removeTeamMember = useCallback(
    async (teamId: string, userId: string) => {
      setError(null);
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_APP_BACKEND_URL
          }/api/teams/${teamId}/members/${userId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to remove team member");
        }

        const data = await response.json();
        if (data.success) {
          setTeams((prevTeams) =>
            prevTeams.map((team) =>
              team._id === teamId
                ? {
                    ...team,
                    members: team.members.filter(
                      (member) => member._id !== userId
                    ),
                  }
                : team
            )
          );
        } else {
          throw new Error(data.message || "Failed to remove team member");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        throw err;
      }
    },
    []
  );

  const value = {
    teams,
    isLoading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
