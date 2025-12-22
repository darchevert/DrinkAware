let Haptics: any = null;

try {
  Haptics = require('expo-haptics');
} catch (error) {
  // expo-haptics n'est pas disponible, on continue sans haptics
  console.warn('expo-haptics non disponible:', error);
}

export const triggerImpact = (
  style: any = 'Medium'
) => {
  if (!Haptics) return;
  try {
    const ImpactStyle = Haptics.ImpactFeedbackStyle || {};
    const impactStyle = ImpactStyle[style] || ImpactStyle.Medium || style;
    Haptics.impactAsync(impactStyle).catch(() => {});
  } catch (error) {
    // Ignorer les erreurs haptics
  }
};

export const triggerSelection = () => {
  if (!Haptics) return;
  try {
    Haptics.selectionAsync().catch(() => {});
  } catch (error) {
    // Ignorer les erreurs haptics
  }
};

export const triggerSuccessNotification = () => {
  if (!Haptics) return;
  try {
    const NotificationType = Haptics.NotificationFeedbackType || {};
    const notificationType = NotificationType.Success || 'Success';
    Haptics.notificationAsync(notificationType).catch(() => {});
  } catch (error) {
    // Ignorer les erreurs haptics
  }
};


