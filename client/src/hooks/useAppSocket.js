import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "../redux/slices/notificationSlice";
import toast from "react-hot-toast";

// Every page (DebateRoom, PrepWindow, Matchmaking) was opening its own
// throwaway socket connection with no shared lifecycle, and nothing
// anywhere listened for "new_notification" — meaning the live push built
// in utils/notify.js on the backend had no consumer at all. This hook is
// the one persistent connection for the whole authenticated session; it
// belongs at the app-shell level (used from Layout.jsx), not per-page.
const useAppSocket = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("new_notification", (notification) => {
      dispatch(addNotification(notification));
      toast(notification.message, { icon: "🔔", duration: 4000 });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, dispatch]);

  return socketRef;
};

export default useAppSocket;