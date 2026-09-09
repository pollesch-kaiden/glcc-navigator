/**
 * AdminPathListScreen.tsx
 * ─────────────────────────────────────────────────────────
 * Manage Paths — browse traced paths, launch a new trace,
 * delete admin-traced path groups.
 *
 * Editing existing OSM/custom paths is a future step; this
 * screen currently only supports viewing and starting new
 * traces.
 *
 * Used by: MapScreen.tsx (opened via Settings)
 * ─────────────────────────────────────────────────────────
 */

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePaths } from '@/hooks/usePaths';
import { useAdminStore } from '@/store/useAdminStore';
import { PathFeature } from '@/routing/buildGraph';

interface AdminPathListScreenProps {
    onClose: () => void;
    onTraceNew: () => void;
    onEditPath: (feature: PathFeature) => void;
}

interface PathGroup {
    key: string;
    name: string;
    segmentCount: number;
    source: string;
    traceGroupId?: string;
    feature?: PathFeature;
}

export function AdminPathListScreen({ onClose, onTraceNew, onEditPath }: AdminPathListScreenProps) {
    const insets = useSafeAreaInsets();
    const paths = usePaths();
    const { markPathDeleted } = useAdminStore();

    const groups = useMemo<PathGroup[]>(() => {
        const map = new Map<string, PathGroup>();

        for (const feature of paths) {
            const props: any = feature.properties ?? {};
            const traceGroupId = props.traceGroupId as string | undefined;
            const key = traceGroupId ?? props.id ?? props.name ?? 'unnamed';
            const name = props.name ?? props.id ?? 'Unnamed Path';

            if (map.has(key)) {
                map.get(key)!.segmentCount += 1;
            } else {
                map.set(key, {
                    key,
                    name,
                    segmentCount: 1,
                    source: props.source ?? 'osm',
                    traceGroupId,
                    feature,
                });
            }
        }

        return Array.from(map.values());
    }, [paths]);

    function confirmDeleteGroup(group: PathGroup) {
        if (group.source !== 'admin') {
            Alert.alert(
                'Cannot delete',
                'Only admin-traced paths can be deleted here. Editing OSM-sourced paths is coming in a future update.'
            );
            return;
        }

        Alert.alert(
            'Delete Path',
            `Remove "${group.name}" (${group.segmentCount} segment${group.segmentCount === 1 ? '' : 's'})? This takes effect immediately on this device.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        for (const feature of paths) {
                            const props: any = feature.properties ?? {};
                            const matches = group.traceGroupId
                                ? props.traceGroupId === group.traceGroupId
                                : props.id === group.key;
                            if (matches && props.id) {
                                markPathDeleted(props.id);
                            }
                        }
                    },
                },
            ]
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-down" size={24} color="#1a2e1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Paths</Text>
                <TouchableOpacity onPress={onTraceNew}>
                    <Ionicons name="add-circle" size={26} color="#1a4a2e" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={groups}
                keyExtractor={(item) => item.key}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => item.feature && onEditPath(item.feature)}>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>{item.name}</Text>
                            <Text style={styles.rowSubtitle}>
                                {item.segmentCount} segment{item.segmentCount === 1 ? '' : 's'} · {item.source}
                            </Text>
                        </View>
                        {item.source === 'admin' && (
                            <TouchableOpacity
                                onPress={() => confirmDeleteGroup(item)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="trash-outline" size={20} color="#c0392b" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No paths found</Text>}
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
    traceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1a4a2e',
        marginHorizontal: 16,
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 14,
    },
    traceButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
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
    rowSubtitle: { fontSize: 12, color: '#777', marginTop: 2 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
});