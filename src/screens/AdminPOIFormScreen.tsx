/**
 * AdminPOIFormScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Add or edit a single POI while in Admin Mode. This is a
 * fully controlled form — all field values live in the
 * draft object owned by MapScreen, not in local state here.
 *
 * This is intentional: tapping "Pick on Map" unmounts this
 * screen temporarily to show the map picker. Without lifting
 * state up to the parent, all typed-in field values would be
 * lost when the form remounts afterward.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ACTIVITY_OPTIONS, CATEGORY_OPTIONS } from '@/utils/filterOptions';

export interface POIDraft {
    id?: string;
    name: string;
    category: string;
    description: string;
    activities: string[];
    amenitiesText: string;
    accessible: boolean;
    hasStairs: boolean;
    hours: string;
    coordinates: [number, number] | null;
}

interface AdminPOIFormScreenProps {
    draft: POIDraft;
    onChange: (updater: (prev: POIDraft) => POIDraft) => void;
    isNew: boolean;
    onClose: () => void;
    onSave: (draft: POIDraft) => void;
    onPickOnMap: () => void;
}

export function AdminPOIFormScreen({
                                       draft,
                                       onChange,
                                       isNew,
                                       onClose,
                                       onSave,
                                       onPickOnMap,
                                   }: AdminPOIFormScreenProps) {
    const insets = useSafeAreaInsets();
    const [locatingSelf, setLocatingSelf] = React.useState(false);

    function update<K extends keyof POIDraft>(key: K, value: POIDraft[K]) {
        onChange((prev) => ({ ...prev, [key]: value }));
    }

    function toggleActivity(value: string) {
        onChange((prev) => ({
            ...prev,
            activities: prev.activities.includes(value)
                ? prev.activities.filter((a) => a !== value)
                : [...prev.activities, value],
        }));
    }

    async function handleUseCurrentLocation() {
        setLocatingSelf(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location permission needed', 'Enable location access to use this feature.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            update('coordinates', [loc.coords.longitude, loc.coords.latitude]);
        } catch {
            Alert.alert('Could not get location', 'Try again.');
        } finally {
            setLocatingSelf(false);
        }
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-down" size={24} color="#1a2e1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isNew ? 'Add POI' : 'Edit POI'}</Text>
                <TouchableOpacity onPress={() => onSave(draft)}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={draft.name}
                    onChangeText={(v) => update('name', v)}
                    placeholder="e.g. Kern Lodge"
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.chipRow}>
                    {CATEGORY_OPTIONS.map((option) => {
                        const isSelected = draft.category === option.value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => update('category', option.value)}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.label}>Activities</Text>
                <View style={styles.chipRow}>
                    {ACTIVITY_OPTIONS.map((option) => {
                        const isSelected = draft.activities.includes(option.value);
                        return (
                            <TouchableOpacity
                                key={option.value}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => toggleActivity(option.value)}
                            >
                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={draft.description}
                    onChangeText={(v) => update('description', v)}
                    placeholder="Short description shown on the POI card"
                    multiline
                />

                <Text style={styles.label}>Amenities (comma separated)</Text>
                <TextInput
                    style={styles.input}
                    value={draft.amenitiesText}
                    onChangeText={(v) => update('amenitiesText', v)}
                    placeholder="wifi, restrooms, air-conditioning"
                />

                <Text style={styles.label}>Hours</Text>
                <TextInput
                    style={styles.input}
                    value={draft.hours}
                    onChangeText={(v) => update('hours', v)}
                    placeholder="e.g. 7am - 10pm"
                />

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Wheelchair Accessible</Text>
                    <Switch value={draft.accessible} onValueChange={(v) => update('accessible', v)} />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Has Stairs</Text>
                    <Switch value={draft.hasStairs} onValueChange={(v) => update('hasStairs', v)} />
                </View>

                <Text style={styles.label}>Location</Text>
                <View style={styles.locationBox}>
                    <Text style={styles.locationText}>
                        {draft.coordinates
                            ? `${draft.coordinates[0].toFixed(6)}, ${draft.coordinates[1].toFixed(6)}`
                            : 'No location set yet'}
                    </Text>
                    <View style={styles.locationButtonRow}>
                        <TouchableOpacity
                            style={[styles.locationButton, styles.locationButtonHalf]}
                            onPress={handleUseCurrentLocation}
                            disabled={locatingSelf}
                        >
                            {locatingSelf ? (
                                <ActivityIndicator size="small" color="#1a4a2e" />
                            ) : (
                                <Text style={styles.locationButtonText}>My Location</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.locationButtonOutline, styles.locationButtonHalf]}
                            onPress={onPickOnMap}
                        >
                            <Text style={styles.locationButtonOutlineText}>Pick on Map</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a2e1a' },
    saveText: { fontSize: 15, fontWeight: '700', color: '#1a4a2e' },
    scrollContent: { padding: 16, paddingBottom: 60 },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1a2e1a',
        marginTop: 16,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1a2e1a',
    },
    multilineInput: {
        minHeight: 70,
        textAlignVertical: 'top',
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f2f2f2',
    },
    chipSelected: {
        backgroundColor: '#1a4a2e',
    },
    chipText: {
        fontSize: 12,
        color: '#444',
        fontWeight: '600',
    },
    chipTextSelected: {
        color: '#ffffff',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    locationBox: {
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        padding: 12,
    },
    locationText: {
        fontSize: 13,
        color: '#444',
        marginBottom: 10,
    },
    locationButtonRow: {
        flexDirection: 'row',
        gap: 8,
    },
    locationButtonHalf: {
        flex: 1,
    },
    locationButton: {
        backgroundColor: '#1a4a2e',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    locationButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 13,
    },
    locationButtonOutline: {
        borderWidth: 1.5,
        borderColor: '#1a4a2e',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    locationButtonOutlineText: {
        color: '#1a4a2e',
        fontWeight: '700',
        fontSize: 13,
    },
});