import 'dotenv/config';

export default {
  expo: {
    name: "cauta-app",
    slug: "cauta-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    
    ios: {
      bundleIdentifier: "com.thiagolins.cautaapp",
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: { 
          NSAllowsArbitraryLoads: true 
        },
        UIBackgroundModes: [
          "audio",
          "fetch",
          "processing"
        ],
        NSMicrophoneUsageDescription: "Precisa de acesso ao microfone para gravação de áudio",
        kTCCServiceMediaLibrary: "O aplicativo precisa de acesso à biblioteca de mídia para gravação de áudio",
        NSUserNotificationUsageDescription: "Precisamos enviar notificações para manter você informado sobre o status da gravação.",
      }
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.thiagolins.cautaapp",
      permissions: [
        "RECORD_AUDIO",
        "FOREGROUND_SERVICE",
        "WAKE_LOCK",
        "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.WAKE_LOCK",
        "NOTIFICATIONS",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ],
      usesCleartextTraffic: true,
      foregroundService: {
        name: "Gravação de Áudio",
        icon: "./assets/images/icon.png",
        notificationTitle: "Gravação em andamento",
        notificationColor: "#FF0000",
        notificationIconColor: "#FF0000"
      }
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",
      "@config-plugins/ffmpeg-kit-react-native",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            permissions: [
              "RECORD_AUDIO",
              "FOREGROUND_SERVICE",
              "WAKE_LOCK",
              "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
              "android.permission.RECORD_AUDIO",
              "android.permission.MODIFY_AUDIO_SETTINGS",
              "android.permission.FOREGROUND_SERVICE",
              "android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
              "android.permission.WAKE_LOCK",
              "NOTIFICATIONS",
              "android.permission.POST_NOTIFICATIONS",
              "android.permission.RECEIVE_BOOT_COMPLETED",
            ],
            foregroundService: {
              name: "Gravação de Áudio",
              icon: "./assets/images/icon.png",
              notificationTitle: "Gravação em andamento",
              notificationColor: "#FF0000",
              notificationIconColor: "#FF0000"
            },
            usesCleartextTraffic: true,
          },
          ios: {
            infoPlist: {
              UIBackgroundModes: [
                "audio",
                "fetch",
                "processing"
              ],
              NSMicrophoneUsageDescription: "Precisa de acesso ao microfone para gravação de áudio",
              kTCCServiceMediaLibrary: "O aplicativo precisa de acesso à biblioteca de mídia para gravação de áudio",
              NSUserNotificationUsageDescription: "Precisamos enviar notificações para manter você informado sobre o status da gravação.",
            }
          }
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#ffffff",
          androidMode: "default",
          androidCollapsedTitle: "Gravação em andamento",
          iosDisplayInForeground: true,
          androidBackgroundColor: "#ffffff",
          androidForegroundService: {
            name: "Gravação de Áudio",
            icon: "./assets/images/icon.png",
            notificationTitle: "Gravação em andamento",
            notificationColor: "#FF0000",
            importance: "high",
            visibilityOnLockScreen: "public",
            sticky: true
          }
        }
      ],
      [
        "expo-av",
        {
          microphonePermission: "Permitir $(PRODUCT_NAME) para acessar seu microfone."
        }
      ],
    ],

    experiments: {
      typedRoutes: true
    },

    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: process.env.PROJECT_ID
      },
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL
    }
  }
};