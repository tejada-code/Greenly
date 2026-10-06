const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build');
const warnFile = path.join(baseDir, 'warnOfExpoGoPushUsage.js');
const autoRegFile = path.join(baseDir, 'DevicePushTokenAutoRegistration.fx.js');
const topicFile = path.join(baseDir, 'TopicSubscriptionModule.android.js');
const pushTokenFile = path.join(baseDir, 'PushTokenManager.native.js');
const serverRegFile = path.join(baseDir, 'ServerRegistrationModule.native.js');

try {
  // 1. Parchear warnOfExpoGoPushUsage para que no lance error en Expo Go en Android
  if (fs.existsSync(warnFile)) {
    let content = fs.readFileSync(warnFile, 'utf8');
    if (content.includes('throw new Error(message)')) {
      content = content.replace(
        "if (Platform.OS === 'android') {\n            throw new Error(message);\n        }\n        else if (__DEV__) {",
        "if (__DEV__) {"
      );
      content = content.replace(
        "if (Platform.OS === 'android') {\r\n            throw new Error(message);\r\n        }\r\n        else if (__DEV__) {",
        "if (__DEV__) {"
      );
      content = content.replace(/if\s*\(Platform\.OS\s*===\s*'android'\)\s*\{\s*throw new Error\(message\);\s*\}\s*else if\s*\(__DEV__\)\s*\{/, "if (__DEV__) {");
      fs.writeFileSync(warnFile, content, 'utf8');
      console.log('✅ [PATCH] warnOfExpoGoPushUsage.js parcheado correctamente.');
    }
  }

  // 2. Asegurar que DevicePushTokenAutoRegistration tenga sintaxis JS impecable
  if (fs.existsSync(autoRegFile)) {
    let autoContent = fs.readFileSync(autoRegFile, 'utf8');
    if (autoContent.includes('try { addPushTokenListener') || autoContent.includes('try {\n        addPushTokenListener')) {
      const cleanBlock = `if (ServerRegistrationModule.getRegistrationInfoAsync) {
    // A global scope (to get all the updates) device push token
    // subscription, never cleared.
    try {
        addPushTokenListener(async (token) => {
            try {
                const registrationInfo = await ServerRegistrationModule.getRegistrationInfoAsync();
                if (!registrationInfo) {
                    return;
                }
                const registration = JSON.parse(registrationInfo);
                if (registration?.isEnabled) {
                    await updatePushTokenAsync(token);
                }
            }
            catch (e) {
                console.warn('[expo-notifications] Error encountered while updating server registration with latest device push token.', e);
            }
        });
    } catch (e) {
        // Ignorado en Expo Go
    }`;
      autoContent = autoContent.replace(/if\s*\(ServerRegistrationModule\.getRegistrationInfoAsync\)\s*\{[\s\S]*?ServerRegistrationModule\.getRegistrationInfoAsync\(\)\.then/, `${cleanBlock}\n    ServerRegistrationModule.getRegistrationInfoAsync().then`);
      fs.writeFileSync(autoRegFile, autoContent, 'utf8');
      console.log('✅ [PATCH] DevicePushTokenAutoRegistration.fx.js bloque try/catch validado.');
    }
  }

  // 3. Proteger TopicSubscriptionModule.android.js si ExpoTopicSubscriptionModule no existe en Expo Go
  if (fs.existsSync(topicFile)) {
    const topicContent = `let nativeModule = null;
try {
  const { requireNativeModule } = require('expo-modules-core');
  nativeModule = requireNativeModule('ExpoTopicSubscriptionModule');
} catch (e) {
  nativeModule = {
    addListener: () => {},
    removeListeners: () => {},
    subscribeToTopicAsync: () => Promise.resolve(null),
    unsubscribeFromTopicAsync: () => Promise.resolve(null),
  };
}
export default nativeModule;
`;
    fs.writeFileSync(topicFile, topicContent, 'utf8');
    console.log('✅ [PATCH] TopicSubscriptionModule.android.js protegido para Expo Go.');
  }

  // 4. Proteger PushTokenManager.native.js si ExpoPushTokenManager no existe en Expo Go
  if (fs.existsSync(pushTokenFile)) {
    const pushContent = `let nativeModule = null;
try {
  const { requireNativeModule } = require('expo-modules-core');
  nativeModule = requireNativeModule('ExpoPushTokenManager');
} catch (e) {
  nativeModule = {
    addListener: () => ({ remove: () => {} }),
    removeListener: () => {},
    removeAllListeners: () => {},
    emit: () => {},
    listenerCount: () => 0,
  };
}
export default nativeModule;
`;
    fs.writeFileSync(pushTokenFile, pushContent, 'utf8');
    console.log('✅ [PATCH] PushTokenManager.native.js protegido para Expo Go.');
  }

  // 5. Proteger ServerRegistrationModule.native.js si NotificationsServerRegistrationModule no existe en Expo Go
  if (fs.existsSync(serverRegFile)) {
    const serverContent = `let nativeModule = null;
try {
  const { requireNativeModule } = require('expo-modules-core');
  nativeModule = requireNativeModule('NotificationsServerRegistrationModule');
} catch (e) {
  nativeModule = {
    addListener: () => {},
    removeListeners: () => {},
  };
}
export default nativeModule;
`;
    fs.writeFileSync(serverRegFile, serverContent, 'utf8');
    console.log('✅ [PATCH] ServerRegistrationModule.native.js protegido para Expo Go.');
  }
} catch (error) {
  console.warn('⚠️ Error al aplicar parche a expo-notifications:', error);
}
