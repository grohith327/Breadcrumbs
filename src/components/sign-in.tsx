"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

// Create a module-level storage to persist state across re-renders
const persistentState = {
  emailSent: false,
  sentEmail: "",
};

export default function SignIn() {
  const [email, setEmail] = useState(persistentState.sentEmail || "");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(persistentState.emailSent);

  // Sync with persistent state on mount
  useEffect(() => {
    if (persistentState.emailSent && persistentState.sentEmail) {
      setEmailSent(true);
      setEmail(persistentState.sentEmail);
    }
  }, []);

  return (
    <Card
      className={`max-w-md ${emailSent ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50" : ""}`}
    >
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          {emailSent ? "Check Your Email" : "Sign In"}
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {emailSent
            ? `We've sent a magic link to ${email}. Click the link in your email to sign in.`
            : "Enter your email below to login to your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {emailSent && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
                <CheckCircle size={48} />
                <div>
                  <p className="font-medium">Magic link sent!</p>
                  <p className="text-sm text-muted-foreground">
                    Check your email
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              disabled={emailSent}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
            />
            <Button
              disabled={loading || emailSent}
              className="gap-2"
              onClick={async () => {
                if (!email.trim()) return;

                setLoading(true);

                try {
                  await authClient.signInWithMagicLink(email.trim());

                  // Update persistent state first
                  persistentState.emailSent = true;
                  persistentState.sentEmail = email.trim();

                  setLoading(false);
                  setEmailSent(true);
                } catch (error) {
                  console.error("Failed to send magic link:", error);
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : emailSent ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  Magic Link Sent!
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Sign-in with Magic Link
                </>
              )}
            </Button>

            {emailSent && (
              <div className="flex flex-col gap-2 mt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Did not receive the email? Check your spam folder or try
                  again.
                </p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    // Reset persistent state
                    persistentState.emailSent = false;
                    persistentState.sentEmail = "";

                    setEmailSent(false);
                    setEmail("");
                    setLoading(false);
                  }}
                >
                  Try Different Email
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-center w-full border-t py-4">
          <p className="text-center text-xs text-neutral-500">
            built with{" "}
            <Link
              href="https://better-auth.com"
              className="underline"
              target="_blank"
            >
              <span className="dark:text-white/70 cursor-pointer">
                better-auth.
              </span>
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
