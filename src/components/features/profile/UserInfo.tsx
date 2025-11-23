import * as React from "react";

interface UserInfoProps {
  user: {
    email?: string;
  };
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 dark:text-gray-400">Email</span>
      <span>{user.email}</span>
    </div>
  );
};

export { UserInfo };
