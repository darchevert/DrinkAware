// Configuration Expo avec plugin pour le widget
// Note: Ce fichier est optionnel, mais peut aider à automatiser certaines configurations

module.exports = {
  expo: {
    name: "DrinkAware",
    slug: "SobrietyTracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.suslec.sobrietytracker",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // Permissions pour le widget
      permissions: [
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    notification: {
      icon: "./assets/icon.png"
    },
    assetBundlePatterns: [
      "**/*",
      "assets/lottie/*.json"
    ],
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "d8b1905b-545c-4cff-8ff9-35617824b932"
      }
    },
    owner: "darchevert",
    plugins: [
      // Si vous créez un plugin Expo personnalisé pour automatiser l'intégration
      // vous pouvez l'ajouter ici
    ]
  }
};

