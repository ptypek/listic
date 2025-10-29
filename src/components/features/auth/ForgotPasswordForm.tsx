import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Odzyskiwanie hasła</CardTitle>
        <CardDescription>
          Wprowadź swój email, aby otrzymać link do zresetowania hasła.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button className="w-full">Wyślij link</Button>
        <div className="mt-4 text-center text-sm">
          Pamiętasz hasło?{' '}
          <a href="/login" className="underline">
            Zaloguj się
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
