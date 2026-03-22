import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

/**
 * Fetches tasks with optional filtering by status, businessId, or assignedTo.
 */
export function useTasks(filters?: {
  status?: string;
  businessId?: string;
  assignedTo?: string;
}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let q = supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (filters?.status) q = q.eq("status", filters.status as never);
      if (filters?.businessId) q = q.eq("client_id", filters.businessId);
      if (filters?.assignedTo) q = q.eq("freelancer_id", filters.assignedTo);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Mutation to create a new task and invalidate the tasks query on success.
 */
export function useCreateTask() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (task: {
      title: string;
      description: string;
      category: string;
      budget: number;
      deadline?: string;
      tools?: string;
      client_id: string;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Task posted successfully" });
    },
    onError: (e: unknown) => {
      toast({
        title: "Error posting task",
        description: e instanceof Error ? e.message : "Failure",
        variant: "destructive",
      });
    },
  });
}

/**
 * Mutation to update an existing task by ID fields.
 */
export function useUpdateTask() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      [key: string]: unknown;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Task updated" });
    },
    onError: (e: unknown) => {
      toast({
        title: "Error updating task",
        description: e instanceof Error ? e.message : "Failure",
        variant: "destructive",
      });
    },
  });
}



/**
 * Fetches messages where the given user ID is either the sender or receiver.
 */
export function useMessages(userId?: string) {
  return useQuery({
    queryKey: ["messages", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Fetches payments with optional filtering by payerId or payeeId.
 */
export function usePayments(filters?: { payerId?: string; payeeId?: string }) {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: async () => {
      let q = supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (filters?.payerId) q = q.eq("payer_id", filters.payerId);
      if (filters?.payeeId) q = q.eq("payee_id", filters.payeeId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}
