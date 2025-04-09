import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useServices } from "@/context/ServiceContext";
import { Service } from "@/types";

// Define the service schema
const serviceSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z
    .string()
    .min(5, { message: "Description must be at least 5 characters" }),
  group: z.string().min(1, { message: "Group is required" }),
  status: z.enum([
    "operational",
    "degraded_performance",
    "partial_outage",
    "major_outage",
  ]),
  isPublic: z.boolean().default(true),
});

// Define the service form data type based on the schema
type ServiceFormData = z.infer<typeof serviceSchema>;

interface AddServiceFormProps {
  onSuccess?: (data: Service) => void;
  onCancel?: () => void;
}

export const AddNewServiceForm: React.FC<AddServiceFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { createService } = useServices();
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      group: "",
      status: "operational",
      isPublic: true,
    },
  });

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const result = await createService(data);

      if (!result) {
        throw new Error("Failed to create service");
      }

      toast({
        title: "Service created",
        description: "The service has been created successfully.",
      });

      if (onSuccess) {
        onSuccess(result);
      }

      form.reset();
    } catch (error) {
      console.error("Error creating service:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create service",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add New Service</CardTitle>
        <CardDescription>
          Create a new service to monitor on your status page
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="API Service" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the service as it will appear on your status
                    page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Main API service for handling client requests"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly describe what this service does
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="group"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <FormControl>
                    <Input placeholder="Core Services" {...field} />
                  </FormControl>
                  <FormDescription>
                    Group similar services together (e.g., Core Services,
                    Infrastructure)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="degraded_performance">
                        Degraded Performance
                      </SelectItem>
                      <SelectItem value="partial_outage">
                        Partial Outage
                      </SelectItem>
                      <SelectItem value="major_outage">Major Outage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The current status of this service
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Public</FormLabel>
                    <FormDescription>
                      Make this service visible on the public status page
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit">Create Service</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
