import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { Service, ServiceStatus, ApiResponse } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ServiceContextType {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  createService: (service: Partial<Service>) => Promise<Service | null>;
  updateService: (
    id: string,
    service: Partial<Service>
  ) => Promise<Service | null>;
  deleteService: (id: string) => Promise<boolean>;
  updateServiceStatus: (id: string, status: ServiceStatus) => Promise<boolean>;
  getServiceById: (id: string) => Service | undefined;
  groupedServices: Record<string, Service[]>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchServices = async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/services`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data: ApiResponse<Service[]> = await response.json();
      if (data.success && data.data) {
        setServices(data.data);
      } else {
        setError(data.message || "Failed to fetch services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("Failed to fetch services. Please try again.");
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  const createService = async (
    service: Partial<Service>
  ): Promise<Service | null> => {
    if (!token || !user) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/services`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...service,
            organization: user.organization,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create service");
      }

      const data: ApiResponse<Service> = await response.json();
      if (data.success && data.data) {
        setServices((prev) => [...prev, data.data]);
        toast.success("Service created successfully");
        return data.data;
      } else {
        throw new Error(data.message || "Failed to create service");
      }
    } catch (error) {
      console.error("Error creating service:", error);
      setError("Failed to create service. Please try again.");
      toast.error("Failed to create service");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateService = async (
    id: string,
    serviceUpdate: Partial<Service>
  ): Promise<Service | null> => {
    if (!token) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/services/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(serviceUpdate),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update service");
      }

      const data: ApiResponse<Service> = await response.json();
      if (data.success && data.data) {
        setServices((prev) =>
          prev.map((service) => (service.id === id ? data.data : service))
        );
        toast.success("Service updated successfully");
        return data.data;
      } else {
        throw new Error(data.message || "Failed to update service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      setError("Failed to update service. Please try again.");
      toast.error("Failed to update service");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    if (!token) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/services/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete service");
      }

      const data: ApiResponse<null> = await response.json();
      if (data.success) {
        setServices((prev) => prev.filter((service) => service.id !== id));
        toast.success("Service deleted successfully");
        return true;
      } else {
        throw new Error(data.message || "Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      setError("Failed to delete service. Please try again.");
      toast.error("Failed to delete service");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateServiceStatus = async (
    id: string,
    status: ServiceStatus
  ): Promise<boolean> => {
    if (!token) return false;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/services/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update service status");
      }

      const data: ApiResponse<Service> = await response.json();
      if (data.success && data.data) {
        setServices((prev) =>
          prev.map((service) => (service.id === id ? data.data : service))
        );
        toast.success("Service status updated");
        return true;
      } else {
        throw new Error(data.message || "Failed to update service status");
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      toast.error("Failed to update service status");
      return false;
    }
  };

  const getServiceById = (id: string): Service | undefined => {
    return services.find((service) => service.id === id);
  };

  const groupedServices = services.reduce<Record<string, Service[]>>(
    (acc, service) => {
      const group = service.group || "Uncategorized";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(service);
      return acc;
    },
    {}
  );

  useEffect(() => {
    if (token) {
      fetchServices();
    }
  }, [token]);

  return (
    <ServiceContext.Provider
      value={{
        services,
        isLoading,
        error,
        fetchServices,
        createService,
        updateService,
        deleteService,
        updateServiceStatus,
        getServiceById,
        groupedServices,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
}
