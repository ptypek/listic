import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface UserProfileCardProps {
  user: {
    email: string;
  };
}

const handleDeleteAccount = async ({ user }) => {
  try {
    const response = await fetch(`/api/v1/user/${user.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        reason: "user_request",
      }),
    });

    if (response.ok) {
      window.location.href = "/login";
    }
  } catch (error) {
    console.error("Błąd usuwania:", error);
  }
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user }) => {
  return (
    <Card className="w-full max-w-sm mx-auto rounded-lg shadow-md overflow-hidden mt-10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Profil użytkownika</CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="py-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-500 dark:text-gray-400">Email</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{user.email}</span>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="bg-gray-50 dark:bg-gray-900/50 p-4 flex flex-col gap-3">
        <form className="w-full bg-white hover:bg-gray-100" method="POST" action="/api/v1/auth/logout">
          <Button type="submit" variant="outline" className="w-full">
            Wyloguj
          </Button>
        </form>

        <Button
          variant="destructive"
          className="w-full hover:bg-gray-100"
          onClick={() => handleDeleteAccount({ user })}
        >
          Usuń kontoo
        </Button>
      </CardFooter>
    </Card>
  );
};

export { UserProfileCard };
