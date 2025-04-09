import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { MoreHorizontal, Plus, Edit, Trash, UserPlus } from "lucide-react";
import { Layout } from "@/components/Layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTeam } from "@/context/TeamContext";

// Define the team schema
const teamSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
});

// Define the team member schema
const teamMemberSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["admin", "member", "viewer"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

// Define the types
type TeamFormData = z.infer<typeof teamSchema>;
type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

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

export function TeamManagement() {
  const {
    teams,
    isLoading,
    error,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
  } = useTeam();

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteMemberConfirmOpen, setDeleteMemberConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // Team form
  const teamForm = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Team member form
  const memberForm = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Fetch teams when component mounts
  useEffect(() => {
    fetchTeams();
    fetchRoles();
  }, [fetchTeams]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/roles`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast({
        title: "Error",
        description: "Failed to fetch roles",
        variant: "destructive",
      });
    }
  };

  // Reset and open team dialog
  const openAddTeamDialog = () => {
    teamForm.reset({
      name: "",
      description: "",
    });
    setIsEditMode(false);
    setIsTeamDialogOpen(true);
  };

  // Open edit team dialog
  const openEditTeamDialog = (team: Team) => {
    teamForm.reset({
      name: team.name,
      description: team.description,
    });
    setSelectedTeam(team);
    setIsEditMode(true);
    setIsTeamDialogOpen(true);
  };

  // Open add member dialog
  const openAddMemberDialog = (team: Team) => {
    memberForm.reset({
      email: "",
      role: "member",
    });
    setSelectedTeam(team);
    setIsMemberDialogOpen(true);
  };

  // Handle team form submission
  const onTeamSubmit = async (data: TeamFormData) => {
    try {
      if (isEditMode && selectedTeam) {
        await updateTeam(selectedTeam._id, data.name, data.description);
        toast({
          title: "Team updated",
          description: "The team has been updated successfully.",
        });
      } else {
        await createTeam(data.name, data.description);
        toast({
          title: "Team created",
          description: "The team has been created successfully.",
        });
      }
      setIsTeamDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle member form submission
  const onMemberSubmit = async (data: TeamMemberFormData) => {
    if (!selectedTeam) return;

    try {
      await addTeamMember(selectedTeam._id, data.email, data.role);
      toast({
        title: "Member added",
        description: "The member has been added to the team successfully.",
      });
      setIsMemberDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle team deletion
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    try {
      await deleteTeam(selectedTeam._id);
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully.",
      });
      setDeleteConfirmOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle member deletion
  const handleDeleteMember = async () => {
    if (!selectedTeam || !memberToDelete) return;

    try {
      await removeTeamMember(selectedTeam._id, memberToDelete);
      toast({
        title: "Member removed",
        description: "The member has been removed from the team successfully.",
      });
      setDeleteMemberConfirmOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Team Management</h1>
          <Button onClick={openAddTeamDialog}>
            <Plus className="mr-2 h-4 w-4" /> Create Team
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-muted-foreground mb-4">
                No teams found. Create your first team to get started.
              </p>
              <Button onClick={openAddTeamDialog}>
                <Plus className="mr-2 h-4 w-4" /> Create Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {teams.map((team) => (
              <Card key={team._id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle>{team.name}</CardTitle>
                    {team.description && (
                      <CardDescription className="mt-1">
                        {team.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => openAddMemberDialog(team)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openEditTeamDialog(team)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Team
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setSelectedTeam(team);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete Team
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.members.map((member) => (
                        <TableRow key={member._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">
                            {member.role}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => {
                                setSelectedTeam(team);
                                setMemberToDelete(member._id);
                                setDeleteMemberConfirmOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Dialog */}
        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Team" : "Create Team"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update your team's information."
                  : "Create a new team to manage members and permissions."}
              </DialogDescription>
            </DialogHeader>
            <Form {...teamForm}>
              <form
                onSubmit={teamForm.handleSubmit(onTeamSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={teamForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter team name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={teamForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter team description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">
                    {isEditMode ? "Update Team" : "Create Team"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to the team.
              </DialogDescription>
            </DialogHeader>
            <Form {...memberForm}>
              <form
                onSubmit={memberForm.handleSubmit(onMemberSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={memberForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={memberForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Add Member</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Team Confirmation */}
        <AlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this team? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteTeam}
                className="bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Member Confirmation */}
        <AlertDialog
          open={deleteMemberConfirmOpen}
          onOpenChange={setDeleteMemberConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this member from the team?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteMember}
                className="bg-red-600"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
