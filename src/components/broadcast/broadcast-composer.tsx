import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-profiles";
import { useAddBroadcast } from "@/hooks/use-broadcasts";
import { db } from "@/lib/supabase";
import { notifyMany } from "@/lib/notify";
import { uploadAndGetSignedUrl } from "@/lib/storage-helper";

const MAX_FILE = 10 * 1024 * 1024; // 10 MB

/**
 * Manager-only broadcast composer. On submit, uploads attachments to Supabase Storage,
 * creates the broadcast row and dispatches a `broadcast` notification to every consultant.
 * `prefill` seeds the message when the dialog opens (e.g. agenda reminders) —
 * the manager can still edit before sending.
 */
export function BroadcastComposer({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefill?: string;
}) {
  const userId = useAuth((s) => s.userId);
  const { data: profiles = [] } = useProfiles();
  const addBroadcastMutation = useAddBroadcast();

  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imgInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Seed the message on open; never overwrite while the manager is typing.
  useEffect(() => {
    if (open && prefill) setMessage(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reset = () => {
    setMessage("");
    setLinkUrl("");
    setImage(null);
    setFile(null);
  };

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE) {
      toast.error("Image over 10MB.");
      return;
    }
    setImage(f);
  }
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE) {
      toast.error("File over 10MB.");
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!userId) return;
    if (message.trim().length < 3) {
      toast.error("Message required.");
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      let fileUrl: string | null = null;

      if (image) {
        imageUrl = await uploadAndGetSignedUrl("broadcast-media", "broadcasts", image);
      }
      if (file) {
        fileUrl = await uploadAndGetSignedUrl("broadcast-media", "broadcasts", file);
      }

      // Direct Supabase insert with notifications fan-out
      const { data: bc, error: bcErr } = await db
        .from("broadcasts")
        .insert({
          sender_id: userId,
          message: message.trim(),
          image_url: imageUrl,
          link_url: linkUrl.trim() || null,
          file_name: file?.name ?? null,
          file_url: fileUrl,
          file_size: file?.size ?? null,
        })
        .select()
        .maybeSingle();

      if (bcErr || !bc) throw new Error(bcErr?.message || "Failed to create broadcast");

      const consultants = profiles.filter((p) => p.role === "property_consultant");
      const sender = profiles.find((p) => p.id === userId);
      await notifyMany(
        consultants.map((c) => c.id),
        "broadcast",
        {
          title: "New broadcast",
          body: `${sender?.display_name ?? "Manager"}: ${message.trim().slice(0, 80)}`,
          deep_link_path: "/",
          meta: { broadcast_id: bc.id },
        },
      );

      toast.success(`Broadcast sent to ${consultants.length} consultant(s).`);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>📢 Broadcast Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Company-wide announcement…"
              rows={4}
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label>Optional link</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <input ref={imgInput} type="file" accept="image/*" hidden onChange={handleImage} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => imgInput.current?.click()}
            >
              {image ? `Image: ${image.name}` : "Attach image"}
            </Button>
            <input ref={fileInput} type="file" hidden onChange={handleFile} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInput.current?.click()}
            >
              {file ? `File: ${file.name}` : "Attach file"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Max 10MB per attachment.</p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Sending…" : "Send broadcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
