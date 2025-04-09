import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import {
  Incident,
  IncidentStatus,
  IncidentImpact,
  ApiResponse,
  IncidentUpdate,
} from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface IncidentContextType {
  incidents: Incident[];
  activeIncidents: Incident[];
  isLoading: boolean;
  error: string | null;
  fetchIncidents: () => Promise<void>;
  createIncident: (incident: Partial<Incident>) => Promise<Incident | null>;
  updateIncident: (
    id: string,
    incident: Partial<Incident>
  ) => Promise<Incident | null>;
  deleteIncident: (id: string) => Promise<boolean>;
  addIncidentUpdate: (
    id: string,
    update: { status: IncidentStatus; message: string; notify?: boolean }
  ) => Promise<Incident | null>;
  getIncidentById: (id: string) => Incident | undefined;
}

const IncidentContext = createContext<IncidentContextType | undefined>(
  undefined
);

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchIncidents = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/incidents`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch incidents");
      }

      const data: ApiResponse<Incident[]> = await response.json();
      if (data.success && data.data) {
        setIncidents(data.data);
      } else {
        setError(data.message || "Failed to fetch incidents");
      }
    } catch (error) {
      console.error("Error fetching incidents:", error);
      setError("Failed to fetch incidents. Please try again.");
      toast.error("Failed to fetch incidents");
    } finally {
      setIsLoading(false);
    }
  };

  const createIncident = async (
    incident: Partial<Incident>
  ): Promise<Incident | null> => {
    if (!token || !user) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/incidents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...incident,
            organization: user.organization,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create incident");
      }

      const data: ApiResponse<Incident> = await response.json();
      if (data.success && data.data) {
        setIncidents((prev) => [data.data, ...prev]);
        toast.success("Incident created successfully");
        return data.data;
      } else {
        throw new Error(data.message || "Failed to create incident");
      }
    } catch (error) {
      console.error("Error creating incident:", error);
      setError("Failed to create incident. Please try again.");
      toast.error("Failed to create incident");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateIncident = async (
    id: string,
    incidentUpdate: Partial<Incident>
  ): Promise<Incident | null> => {
    if (!token) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/incidents/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(incidentUpdate),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update incident");
      }

      const data: ApiResponse<Incident> = await response.json();
      if (data.success && data.data) {
        setIncidents((prev) =>
          prev.map((incident) => (incident.id === id ? data.data : incident))
        );
        toast.success("Incident updated successfully");
        return data.data;
      } else {
        throw new Error(data.message || "Failed to update incident");
      }
    } catch (error) {
      console.error("Error updating incident:", error);
      setError("Failed to update incident. Please try again.");
      toast.error("Failed to update incident");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIncident = async (id: string): Promise<boolean> => {
    if (!token) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/incidents/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete incident");
      }

      const data: ApiResponse<null> = await response.json();
      if (data.success) {
        setIncidents((prev) => prev.filter((incident) => incident.id !== id));
        toast.success("Incident deleted successfully");
        return true;
      } else {
        throw new Error(data.message || "Failed to delete incident");
      }
    } catch (error) {
      console.error("Error deleting incident:", error);
      setError("Failed to delete incident. Please try again.");
      toast.error("Failed to delete incident");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addIncidentUpdate = async (
    id: string,
    update: { status: IncidentStatus; message: string; notify?: boolean }
  ): Promise<Incident | null> => {
    if (!token || !user) return null;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/incidents/${id}/updates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...update,
            createdBy: user.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add incident update");
      }

      const data: ApiResponse<Incident> = await response.json();
      if (data.success && data.data) {
        setIncidents((prev) =>
          prev.map((incident) => (incident.id === id ? data.data : incident))
        );
        toast.success("Incident update added");

        if (update.notify) {
          toast.info("Notifications sent to subscribers");
        }

        return data.data;
      } else {
        throw new Error(data.message || "Failed to add incident update");
      }
    } catch (error) {
      console.error("Error adding incident update:", error);
      toast.error("Failed to add incident update");
      return null;
    }
  };

  const getIncidentById = (id: string): Incident | undefined => {
    return incidents.find((incident) => incident.id === id);
  };

  useEffect(() => {
    if (token) {
      fetchIncidents();
    }
  }, [token]);

  const activeIncidents = incidents.filter(
    (incident) => incident.status !== "resolved"
  );

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        activeIncidents,
        isLoading,
        error,
        fetchIncidents,
        createIncident,
        updateIncident,
        deleteIncident,
        addIncidentUpdate,
        getIncidentById,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error("useIncidents must be used within an IncidentProvider");
  }
  return context;
}
