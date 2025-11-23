import * as React from "react";
import { Button } from "@/components/ui/button";

const UserActions: React.FC = () => {
  return (
    <div className="flex justify-end gap-2">
      <form method="POST" action="/api/v1/auth/logout">
        <Button type="submit" variant="outline">
          Wyloguj
        </Button>
      </form>
      <Button variant="destructive">Usuń konto</Button>
    </div>
  );
};

export { UserActions };
