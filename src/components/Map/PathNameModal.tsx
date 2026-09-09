/**
 * PathNameModal.tsx
 * ─────────────────────────────────────────────────────────
 * Bottom-sheet modal for naming a path before saving, shown
 * after "End Path". Custom modal, not Alert.prompt, since
 * Alert.prompt has no Android equivalent.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

interface PathNameModalProps {
    visible: boolean;
    onCancel: () => void;
    onConfirm: (name: string) => void;
    segmentCount: number;
}

export function PathNameModal({ visible, onCancel, onConfirm, segmentCount }: PathNameModalProps) {
    const [name, setName] = useState('');

    useEffect(() => {
        if (visible) setName('');
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
            <View style={styles.backdrop}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.sheetWrapper}
                >
                    <View style={styles.sheet}>
                        <View style={styles.handle} />
                        <Text style={styles.title}>Name This Path</Text>
                        <Text style={styles.subtitle}>
                            {segmentCount} segment{segmentCount === 1 ? '' : 's'} will be saved
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Boat House Trail"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
                                onPress={() => name.trim() && onConfirm(name.trim())}
                                disabled={!name.trim()}
                            >
                                <Text style={styles.saveText}>Save Path</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheetWrapper: { width: '100%' },
    sheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 36,
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 18, fontWeight: '700', color: '#1a2e1a', textAlign: 'center' },
    subtitle: { fontSize: 13, color: '#777', textAlign: 'center', marginTop: 4, marginBottom: 16 },
    input: {
        backgroundColor: '#f2f2f2',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1a2e1a',
        marginBottom: 20,
    },
    buttonRow: { flexDirection: 'row', gap: 10 },
    cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f2f2f2', alignItems: 'center' },
    cancelText: { color: '#444', fontWeight: '600', fontSize: 14 },
    saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1a4a2e', alignItems: 'center' },
    saveButtonDisabled: { backgroundColor: '#a9c2b1' },
    saveText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
});