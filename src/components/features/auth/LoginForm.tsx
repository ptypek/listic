import * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        const data = await response.json();
        setError(data.error || "Wystąpił błąd podczas logowania.");
      }
    } catch {
      setError("Nie można połączyć się z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm border-muted/40 shadow-xl">
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Command className="h-6 w-6" />
              </div>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight">Cześć!</CardTitle>
            <CardDescription className="text-muted-foreground">Wpisz swoje dane, aby przejść do panelu</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 focus-visible:ring-offset-0"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-muted-foreground">
                  Hasło
                </Label>
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                  Zapomniałeś hasła?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/50 focus-visible:ring-offset-0"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive text-center">{error}</div>
            )}
            <Button type="submit" className="w-full h-10 shadow-md font-semibold" disabled={loading}>
              {loading ? "Weryfikacja..." : "Zaloguj się"}
            </Button>
          </CardContent>

          <CardFooter>
            <div className="w-full text-center text-sm text-muted-foreground">
              Nie masz jeszcze konta?{" "}
              <a
                href="/register"
                className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
              >
                Załóż je teraz
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
