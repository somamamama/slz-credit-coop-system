import { useState, useEffect } from 'react';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch("http://localhost:5000/auth/profile", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "token": localStorage.token 
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.token) {
      fetchUserRole();
    } else {
      setLoading(false);
    }
  }, []);

  return { userRole, loading };
};
