/**
 * PathTracerControls.tsx
 * ─────────────────────────────────────────────────────────
 * Overlay UI shown atop the map during an active path trace.
 * Tab switch (only before any points are placed), transport
 * mode/stairs toggles, session controls, undo, discard, end.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {TransportModeMultiSelect} from '@/components/Routing/TransportModeMultiSelect';
import {TransportMode} from '@/types';
import {TraceMode} from '@/types/pathTrace.types';

export interface PathTracerControlsProps {
    traceMode: TraceMode,
    onChangeTraceMode: (mode: TraceMode) => void,
    hasStartedPlacingPoints: boolean,
    selectedModes: TransportMode[],
    onToggleMode: (mode: TransportMode) => void,
    hasStairs: boolean,
    onToggleStairs: (value: boolean) => void,
    isRecording: boolean,
    onStartRecording: () => void,
    onPauseRecording: () => void,
    canUndo: boolean,
    onUndo: () => void,
    onDiscard: () => void,
    onEndPath: () => void,
    outOfRangeWarning: boolean,
    totalPointCount: number,
    isStartDisabled?: boolean,
}

export function PathTracerControls({
                                       traceMode,
                                       onChangeTraceMode,
                                       hasStartedPlacingPoints,
                                       selectedModes,
                                       onToggleMode,
                                       hasStairs,
                                       onToggleStairs,
                                       isRecording,
                                       onStartRecording,
                                       onPauseRecording,
                                       canUndo,
                                       onUndo,
                                       onDiscard,
                                       onEndPath,
                                       outOfRangeWarning,
                                       totalPointCount,
                                       isStartDisabled = false,
                                   }: PathTracerControlsProps) {
    function handleDiscardPress() {
        Alert.alert(
            'Discard Trace',
            'This will permanently discard everything traced so far. This cannot be undone.',
            [
                {text: 'Keep Tracing', style: 'cancel'},
                {text: 'Discard', style: 'destructive', onPress: onDiscard},
            ]
        );
    }

    function handleEndPathPress() {
        if (totalPointCount < 2) {
            Alert.alert('Not enough points', 'Place at least two points before ending the path.');
            return;
        }
        onEndPath();
    }

    return (
        <View style={styles.wrapper}>
            {outOfRangeWarning && (
                <View style={styles.warningBanner}>
                    <Ionicons name="warning-outline" size={14} color="#8a5a1e"/>
                    <Text style={styles.warningText}>Too far from the last point — stay within 10 meters</Text>
                </View>
            )}
            {!hasStartedPlacingPoints && (
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, traceMode === 'off-campus' && styles.tabActive]}
                        onPress={() => onChangeTraceMode('off-campus')}
                    >
                        <Text style={[styles.tabText, traceMode === 'off-campus' && styles.tabTextActive]}>
                            Off-Campus
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, traceMode === 'on-campus' && styles.tabActive]}
                        onPress={() => onChangeTraceMode('on-campus')}
                    >
                        <Text style={[styles.tabText, traceMode === 'on-campus' && styles.tabTextActive]}>
                            On-Campus
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <TransportModeMultiSelect
                selectedModes={selectedModes}
                onToggleMode={onToggleMode}
                hasStairs={hasStairs}
                onToggleStairs={onToggleStairs}
            />


            {traceMode === 'off-campus' ? (
                <Text style={styles.hintText}>Tap the map to place the next node</Text>
            ) : (
                <TouchableOpacity
                    style={[
                        styles.recordButton,
                        isRecording && styles.recordButtonActive,
                        isStartDisabled && styles.recordButtonDisabled,
                    ]}
                    onPress={
                        isStartDisabled
                            ? undefined
                            : isRecording
                                ? onPauseRecording
                                : onStartRecording
                    }
                    disabled={isStartDisabled}
                >
                    <Ionicons
                        name={isRecording ? 'pause' : 'walk-outline'}
                        size={18}
                        color={isStartDisabled ? '#d5d5d5' : '#ffffff'}
                    />
                    <Text style={[styles.recordButtonText, isStartDisabled && styles.recordButtonTextDisabled]}>
                        {isStartDisabled ? 'Need to be on campus' : isRecording ? 'Pause' : 'Start Walking'}
                    </Text>
                </TouchableOpacity>
            )}

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionButton, !canUndo && styles.actionButtonDisabled]}
                    onPress={onUndo}
                    disabled={!canUndo}
                >
                    <Ionicons name="arrow-undo-outline" size={16} color={canUndo ? '#1a2e1a' : '#bbb'}/>
                    <Text style={[styles.actionText, !canUndo && styles.actionTextDisabled]}>Undo Point</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.discardButton} onPress={handleDiscardPress}>
                    <Ionicons name="trash-outline" size={16} color="#c0392b"/>
                    <Text style={styles.discardText}>Discard</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.endButton} onPress={handleEndPathPress}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff"/>
                    <Text style={styles.endText}>End Path</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {position: 'absolute', bottom: 20, left: 16, right: 16, gap: 10},
    tabRow: {flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 14, padding: 4, gap: 4},
    tab: {flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center'},
    tabActive: {backgroundColor: '#1a4a2e'},
    tabText: {fontSize: 13, fontWeight: '600', color: '#1a2e1a'},
    tabTextActive: {color: '#ffffff'},
    warningBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#fff3e0',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    warningText: {fontSize: 12, color: '#8a5a1e', fontWeight: '600', flexShrink: 1},
    hintText: {
        textAlign: 'center',
        fontSize: 13,
        color: '#ffffff',
        backgroundColor: 'rgba(26,74,46,0.85)',
        paddingVertical: 8,
        borderRadius: 10,
        fontWeight: '600',
    },
    recordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1a4a2e',
        paddingVertical: 14,
        borderRadius: 14,
    },
    recordButtonActive: {backgroundColor: '#e67e22'},
    recordButtonDisabled: {backgroundColor: '#bcc6c0'},
    recordButtonText: {color: '#ffffff', fontWeight: '700', fontSize: 14},
    recordButtonTextDisabled: {color: '#f5f5f5'},
    actionRow: {flexDirection: 'row', gap: 8},
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.97)',
        paddingVertical: 12,
        borderRadius: 12,
    },
    actionButtonDisabled: {opacity: 0.6},
    actionText: {fontSize: 12, fontWeight: '600', color: '#1a2e1a'},
    actionTextDisabled: {color: '#bbb'},
    discardButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#fdecea',
        paddingVertical: 12,
        borderRadius: 12,
    },
    discardText: {fontSize: 12, fontWeight: '600', color: '#c0392b'},
    endButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#1a4a2e',
        paddingVertical: 12,
        borderRadius: 12,
    },
    endText: {fontSize: 12, fontWeight: '700', color: '#ffffff'},
});