/**
 * offlineDownloadPrompt.ts
 * ─────────────────────────────────────────────────────────
 * Shared logic for prompting the user before starting an
 * offline map download. Checks WiFi vs cellular and shows a
 * native-style confirmation, matching the App Store's own
 * WiFi/cellular download prompt pattern.
 *
 * Used by: OfflineDownloadBanner.tsx, SettingsScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import { Alert } from 'react-native';
import * as Network from 'expo-network';

export async function promptAndDownload(onDownload: () => void) {
    const state = await Network.getNetworkStateAsync();

    if (state.type === Network.NetworkStateType.WIFI) {
        onDownload();
        return;
    }

    if (state.type === Network.NetworkStateType.CELLULAR) {
        Alert.alert(
            'Cellular Data',
            'Downloading the offline map may use a large amount of cellular data. Wait for Wi-Fi, or continue using cellular?',
            [
                { text: 'Wait for Wi-Fi', style: 'cancel' },
                { text: 'Use Cellular', style: 'default', onPress: onDownload },
            ]
        );
        return;
    }

    Alert.alert(
        'No Internet Connection',
        'Connect to Wi-Fi or cellular data to download the offline map.'
    );
}