import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { leadCreateSchema, type LeadCreateFormValues } from "@/lib/lead-validation";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, UNIT_TYPES, UNIT_TYPE_LABELS } from "@/lib/lead-sources";
import { useProjects } from "@/hooks/use-projects";
import { useProfiles } from "@/hooks/use-profiles";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export function AddLeadForm({
  isManager,
  onSubmit,
  onCancel,
}: {
  isManager: boolean;
  onSubmit: (values: LeadCreateFormValues) => void;
  onCancel: () => void;
}) {
  const { data: allProjects = [], isLoading: projectsLoading } = useProjects();
  const { data: allProfiles = [], isLoading: profilesLoading } = useProfiles();
  const projects = allProjects; // useProjects already filters is_active & orders by sort_order
  const consultants = allProfiles.filter(
    (p) => p.role === "property_consultant" || p.role === "manager",
  );

  const today = new Date().toISOString();

  const form = useForm<LeadCreateFormValues>({
    resolver: zodResolver(leadCreateSchema),
    defaultValues: {
      full_name: "",
      contact_number: "",
      source: "social_media",
      source_other_description: "",
      project_id: projects[0]?.id ?? "",
      unit_types: [],
      date_added: today,
      assigned_to: "",
    },
  });

  const source = form.watch("source");
  const unitTypes = form.watch("unit_types");
  const dateAdded = form.watch("date_added");

  function toggleUnit(u: (typeof UNIT_TYPES)[number]) {
    const cur = form.getValues("unit_types");
    if (cur.includes(u)) {
      form.setValue(
        "unit_types",
        cur.filter((x) => x !== u),
        { shouldValidate: true },
      );
    } else {
      form.setValue("unit_types", [...cur, u], { shouldValidate: true });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...form.register("full_name")} autoFocus />
        {form.formState.errors.full_name && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {form.formState.errors.full_name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="contact_number">Phone number (optional)</Label>
        <Input
          id="contact_number"
          placeholder="0917 000 0000"
          {...form.register("contact_number")}
        />
        {form.formState.errors.contact_number && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {form.formState.errors.contact_number.message}
          </p>
        )}
      </div>

      <div>
        <Label>Source</Label>
        <Controller
          control={form.control}
          name="source"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LEAD_SOURCE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {source === "other" && (
          <Input
            className="mt-2"
            placeholder="Describe source (optional)"
            {...form.register("source_other_description")}
          />
        )}
      </div>

      <div>
        <Label>Project</Label>
        <Controller
          control={form.control}
          name="project_id"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.project_id && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {form.formState.errors.project_id.message}
          </p>
        )}
      </div>

      <div>
        <Label>Unit type</Label>
        <div className="flex flex-wrap gap-2">
          {UNIT_TYPES.map((u) => {
            const active = unitTypes.includes(u);
            return (
              <button
                type="button"
                key={u}
                onClick={() => toggleUnit(u)}
                className={cn(
                  "min-h-[36px] rounded-[var(--radius-pill)] border px-3 text-sm transition-tenacious",
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary-hover)]"
                    : "border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]",
                )}
              >
                {UNIT_TYPE_LABELS[u]}
              </button>
            );
          })}
        </div>
        {form.formState.errors.unit_types && (
          <p className="mt-1 text-xs text-[var(--color-error)]">
            {form.formState.errors.unit_types.message as string}
          </p>
        )}
      </div>

      <div>
        <Label>Date</Label>
        <Controller
          control={form.control}
          name="date_added"
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className={cn("w-full justify-start text-left font-normal")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(d) => d && field.onChange(d.toISOString())}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
        />
      </div>

      {isManager && (
        <div>
          <Label>Assign to</Label>
          <Controller
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <Select
                value={field.value || "__unassigned"}
                onValueChange={(v) => field.onChange(v === "__unassigned" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned">Unassigned</SelectItem>
                  {consultants.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save lead</Button>
      </div>
      {dateAdded ? null : null}
    </form>
  );
}
