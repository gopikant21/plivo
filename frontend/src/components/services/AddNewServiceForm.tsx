import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/context/ServiceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ServiceStatus } from "@/types";

interface FormData {
  name: string;
  description: string;
  group: string;
  status: ServiceStatus;
  isPublic: boolean;
}

export function AddNewServiceForm() {
  const navigate = useNavigate();
  const { createService } = useServices();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    group: "",
    status: "operational",
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createService(formData);
      toast.success("Service created successfully");
      navigate("/services");
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Failed to create service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: ServiceStatus) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  const handlePublicChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isPublic: checked }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter service name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter service description"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="group">Group</Label>
        <Input
          id="group"
          name="group"
          value={formData.group}
          onChange={handleChange}
          placeholder="Enter service group (e.g., Core Services)"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operational">Operational</SelectItem>
            <SelectItem value="degraded_performance">
              Degraded Performance
            </SelectItem>
            <SelectItem value="partial_outage">Partial Outage</SelectItem>
            <SelectItem value="major_outage">Major Outage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublic"
          checked={formData.isPublic}
          onCheckedChange={handlePublicChange}
        />
        <Label htmlFor="isPublic">Public Service</Label>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/services")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
