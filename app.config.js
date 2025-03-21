import 'dotenv/config';

export default {
  expo: {
    name: "VocalizeAI",
    slug: "vocalizeai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      bundleIdentifier: "com.thiagolins.vocalizeai",
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        UIBackgroundModes: [
          "audio",
          "fetch",
          "processing",
          "remote-notification"
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
      package: "com.thiagolins.vocalizeai",
      permissions: [
        "RECORD_AUDIO",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_MICROPHONE",
        "WAKE_LOCK",
        "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        "RECORD_AUDIO",
        "MODIFY_AUDIO_SETTINGS",
        "NOTIFICATIONS",
        "POST_NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "VIBRATE"
      ],
      usesCleartextTraffic: true,
      foregroundService: {
        name: "Gravação de Áudio",
        icon: "./assets/images/icon.png",
        notificationTitle: "Gravação em andamento",
        notificationColor: "#FF0000",
        notificationIconColor: "#FF0000",
        startOnBoot: true
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
              "FOREGROUND_SERVICE_MICROPHONE",
              "MODIFY_AUDIO_SETTINGS",
              "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
              "NOTIFICATIONS",
              "POST_NOTIFICATIONS",
              "RECEIVE_BOOT_COMPLETED",
              "READ_EXTERNAL_STORAGE",
              "WRITE_EXTERNAL_STORAGE",
              "VIBRATE"
            ],
            foregroundService: {
              name: "Gravação de Áudio",
              icon: "./assets/images/icon.png",
              notificationTitle: "Gravação em andamento",
              notificationColor: "#FF0000",
              notificationIconColor: "#FF0000",
              startOnBoot: true
            },
            usesCleartextTraffic: true,
          },
          ios: {
            infoPlist: {
              UIBackgroundModes: [
                "audio",
                "fetch",
                "processing",
                "remote-notification"
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