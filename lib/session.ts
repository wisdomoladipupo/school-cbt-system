export const getCurrentUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const logout = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("currentUser");
    window.location.href = "/auth/login"; // redirect to login
  }
};
