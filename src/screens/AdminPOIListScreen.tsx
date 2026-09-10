/**
 * AdminPOIListScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Browse, search, add, and delete POIs while in Admin Mode.
 * Tapping a POI opens the edit form. The "+" button opens the
 * same form in "add new" mode.
 *
 * Used by: SettingsScreen.tsx (opened via Admin Panel button)
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
} from 'react-native';
import { useSafeAreaInsets} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { POI } from '@/types';

interface AdminPOIListScreenProps {
    pois: POI[];
    onClose: () => void;
    onEditPOI: (poi: POI) => void;
    onAddNew: () => void;
    onDeletePOI: (poi: POI) => void;
}

export function AdminPOIListScreen({
                                       pois,
                                       onClose,
                                       onEditPOI,
                                       onAddNew,
                                       onDeletePOI,
                                   }: AdminPOIListScreenProps) {
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return pois;
        return pois.filter((p) => p.name.toLowerCase().includes(query));
    }, [pois, search]);

    function confirmDelete(poi: POI) {
        Alert.alert(
            'Delete POI',
            `Remove "${poi.name}" from the map? This takes effect immediately on this device.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDeletePOI(poi) },
            ]
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-down" size={24} color="#1a2e1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage POIs</Text>
                <TouchableOpacity onPress={onAddNew}>
                    <Ionicons name="add-circle" size={26} color="#1a4a2e" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color="#777" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search POIs..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#999"
                />
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => onEditPOI(item)}>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>{item.name}</Text>
                            <Text style={styles.rowSubtitle}>{item.category}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => confirmDelete(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#c0392b" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No POIs match your search</Text>
                }
            />
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
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#1a2e1a' },
    listContent: { padding: 16 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#f7f7f7',
        borderRadius: 12,
        marginBottom: 8,
    },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: '#1a2e1a' },
    rowSubtitle: { fontSize: 12, color: '#777', marginTop: 2, textTransform: 'capitalize' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});