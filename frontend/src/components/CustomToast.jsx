import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react-native";
import { COLORS } from "../constants/colors";

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    backgroundColor: "#118A4D",
    Icon: CheckCircle2,
  },
  error: {
    backgroundColor: COLORS.danger,
    Icon: AlertCircle,
  },
  info: {
    backgroundColor: "#246BFE",
    Icon: Info,
  },
  warning: {
    backgroundColor: "#C98300",
    Icon: AlertCircle,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 3200) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const normalizedType = toastStyles[type] ? type : "info";

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type: normalizedType,
        },
      ]);

      setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.toastHost}>
        {toasts.map((toast) => {
          const { Icon, backgroundColor } = toastStyles[toast.type];

          return (
            <View key={toast.id} style={[styles.toast, { backgroundColor }]}>
              <Icon size={20} color="#fff" strokeWidth={2.6} />
              <Text style={styles.toastText} numberOfLines={3}>
                {toast.message}
              </Text>
              <TouchableOpacity
                onPress={() => dismissToast(toast.id)}
                style={styles.dismissButton}
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
              >
                <X size={18} color="#fff" strokeWidth={2.8} />
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  toastHost: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 104,
    zIndex: 999,
    gap: 10,
  },
  toast: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 8,
  },
  toastText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 19,
  },
  dismissButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
});
