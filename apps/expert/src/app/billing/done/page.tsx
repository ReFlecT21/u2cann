"use client";

import { useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@adh/ui/ui/button";
import { Camera, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Post-payment landing page. Payment is confirmed by Stripe before the member
 * lands here; the webhook creates their membership in the background. Since
 * the flow is account-first they're already signed in, so we take their face
 * photo right away and feed it into the enrollment pipeline
 * (FaceProfile PENDING → admin approves → bridge sync → door camera).
 */
export default function BillingDonePage() {
  const { isSignedIn, isLoaded } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type)) {
      setError("Only JPEG and PNG images are allowed");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("Image must be under 5MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("faceImage", file);
    // The webhook that creates our member record can lag the redirect by a
    // few seconds — retry briefly instead of failing the first attempt.
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await fetch("/api/face-enrollment/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          setUploaded(true);
          setUploading(false);
          return;
        }
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (res.status === 404 && attempt < 4) {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        throw new Error(body?.error ?? "Upload failed");
      } catch (err) {
        if (attempt === 4) {
          setError(
            err instanceof Error ? err.message : "Upload failed — please try again",
          );
          setUploading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <CheckCircle2 className="h-14 w-14 text-green-500" />
        <h1 className="text-2xl font-bold">Payment successful</h1>
        <p className="max-w-md text-muted-foreground">
          Your membership is active and will renew automatically on the 1st of
          every month.
        </p>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <Camera className="h-5 w-5" />
          One last step: add your face for door access
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Upload a clear, front-facing photo (good lighting, no cap or mask).
          Once the gym approves it, our door camera will recognise you and let
          you in.
        </p>

        {!isLoaded ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isSignedIn ? (
          <p className="text-sm text-muted-foreground">
            Sign in to add your photo:{" "}
            <a className="font-medium text-primary underline" href="/sign-in?redirect_url=/billing/done">
              sign in
            </a>{" "}
            — or add it later under Account → Settings.
          </p>
        ) : uploaded ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-medium">Photo submitted!</p>
            <p className="text-sm text-muted-foreground">
              The gym will review and approve it — after that, just walk up to
              the door and it&apos;ll recognise you. You&apos;re all set.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Your face photo"
                className="h-40 w-40 rounded-xl border border-border object-cover"
              />
            ) : null}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              capture="user"
              className="hidden"
              onChange={handleFileChange}
            />

            {error ? (
              <p className="w-full rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {!preview ? (
              <Button
                className="w-full"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Take / choose photo
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button className="flex-1" onClick={handleUpload} disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Use this photo"
                  )}
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Prefer later? You can also do this anytime under Account →
              Settings → Face Enrollment.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
