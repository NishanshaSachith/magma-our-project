import React from 'react';

const UserProfileIcon = ({ user, isDarkMode, size = 12 }) => {
  // size in tailwind units (w-12 h-12 by default)
  const sizeClass = `w-${size} h-${size}`;
  const bgClass = isDarkMode ? 'bg-blue-700' : 'bg-blue-400';

  return (
    <div
      className={`flex-shrink-0 ${sizeClass} rounded-full flex items-center justify-center ${bgClass} text-white text-xl font-bold`}
    >
      {user.fullname
        ? user.fullname.charAt(0).toUpperCase()
        : user.username
        ? user.username.charAt(0).toUpperCase()
        : '?'}
    </div>
  );
};

export default UserProfileIcon;
