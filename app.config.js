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
    jsEngine: "hermes",

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
        "MODIFY_AUDIO_SETTINGS",
        "NOTIFICATIONS",
        "POST_NOTIFICATIONS"
      ],
      usesCleartextTraffic: true,
      foregroundService: {
        name: "Gravação de Áudio",
        icon: "./assets/images/icon.png",
        notificationTitle: "Gravação em andamento",
        notificationColor: "#FF0000"
      },
      enableProguardInReleaseBuilds: true,
      buildToolsVersion: "33.0.0",
      minSdkVersion: 26,
      compileSdkVersion: 34,
      targetSdkVersion: 34
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",
      [
        "@config-plugins/ffmpeg-kit-react-native",
        {
          variant: "audio"
        }
      ],
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
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 26,
            buildToolsVersion: "33.0.0",
            extraProguardRules: `-keep class com.facebook.hermes.unicode.** { *; }
                                 -keep class com.facebook.jni.** { *; }
                                 -keep class expo.modules.** { *; }
                                 -keepclassmembers class * {
                                    native <methods>;
                                 }`,
            enableProguardInReleaseBuilds: true,
            enableShrinkResources: true,
            useLegacyPackaging: false,
            permissions: [
              "RECORD_AUDIO",
              "FOREGROUND_SERVICE",
              "FOREGROUND_SERVICE_MICROPHONE",
              "WAKE_LOCK",
              "MODIFY_AUDIO_SETTINGS",
              "NOTIFICATIONS",
              "POST_NOTIFICATIONS"
            ]
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
          androidCollapsedTitle: "Gravação em andamento"
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

    assetBundlePatterns: [
      "assets/images/*.png",
      "assets/fonts/*.ttf"
    ],

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