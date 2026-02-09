export const getAllUsers = async () => {
  const res = await fetch("http://127.0.0.1:8000/admin/users", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.json();
};

export const getUserConversations = async (userId) => {
  const res = await fetch(`http://127.0.0.1:8000/admin/users/${userId}/conversations`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return res.json();
};
