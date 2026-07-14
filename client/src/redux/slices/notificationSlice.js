import { createSlice } from "@reduxjs/toolkit";
 
const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    list: [],
    unreadCount: 0,
  },
  reducers: {
    setNotifications: (state, action) => {
      state.list = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    addNotification: (state, action) => {
      state.list.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      const notif = state.list.find((n) => n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearUnread: (state) => {
      state.unreadCount = 0;
    },
  },
});
 
export const { setNotifications, addNotification, markRead, clearUnread } =
  notificationSlice.actions;
export default notificationSlice.reducer;