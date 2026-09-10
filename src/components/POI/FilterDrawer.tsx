/**
 * FilterDrawer.tsx
 * ─────────────────────────────────────────────────────────
 * Left-side sliding drawer for searching POIs by name and
 * filtering the map by Activity or Category tags (OR logic).
 *
 * Three collapsible sections:
 *  - Activities: things you can DO (swimming, dining, etc.)
 *  - Categories: what a POI IS (chapel, lodging, etc.)
 *  - Locations: every named POI, searchable by name
 *
 * When searching, all three sections expand automatically and
 * show only matching items under their respective header.
 *
 * Selecting a Location closes the drawer and hands the chosen
 * POI back to the caller (MapScreen pans the camera to it and
 * opens its info card). Selecting an Activity or Category tag
 * toggles it in the shared activeFilters store state.
 *
 * Used by: MapScreen.tsx
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Animated,
    Dimensions,
    StyleSheet,
    ScrollView,
    Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { POI } from '@/types';
import {
    ACTIVITY_OPTIONS,
    CATEGORY_OPTIONS,
} from '@/utils/filterOptions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);

interface FilterDrawerProps {
    visible: boolean;
    onClose: () => void;
    pois: POI[];
    activeFilters: string[];
    onToggleFilter: (value: string) => void;
    onClearFilters: () => void;
    onSelectPOI: (poi: POI) => void;
}

type SectionKey = 'activities' | 'categories' | 'locations';

export function FilterDrawer({
                                 visible,
                                 onClose,
                                 pois,
                                 activeFilters,
                                 onToggleFilter,
                                 onClearFilters,
                                 onSelectPOI,
                             }: FilterDrawerProps) {
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
        activities: false,
        categories: false,
        locations: true,
    });

    useEffect(() => {
        Animated.timing(translateX, {
            toValue: visible ? 0 : -DRAWER_WIDTH,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, [visible]);

    const query = searchQuery.trim().toLowerCase();
    const isSearching = query.length > 0;

    const filteredActivities = useMemo(
        () => ACTIVITY_OPTIONS.filter((o) => o.label.toLowerCase().includes(query)),
        [query]
    );

    const filteredCategories = useMemo(
        () => CATEGORY_OPTIONS.filter((o) => o.label.toLowerCase().includes(query)),
        [query]
    );

    const filteredLocations = useMemo(() => {
        return pois.filter((poi) => {
            const matchesSearch = poi.name.toLowerCase().includes(query);

            const matchesFilters =
                activeFilters.length === 0 ||
                activeFilters.some(
                    (filter) => poi.activities.includes(filter as any) || poi.category === filter
                );

            return matchesSearch && matchesFilters;
        });
    }, [pois, query, activeFilters]);

    function toggleSection(key: SectionKey) {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function handleSelectPOI(poi: POI) {
        setSearchQuery('');
        onSelectPOI(poi);
    }

    const activitiesOpen = isSearching || expanded.activities;
    const categoriesOpen = isSearching || expanded.categories;
    const locationsOpen = isSearching || expanded.locations;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <View style={styles.overlayContainer}>
                <Pressable style={styles.backdrop} onPress={onClose} />

                <Animated.View
                    style={[styles.drawer, { width: DRAWER_WIDTH, transform: [{ translateX }] }]}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Explore Campus</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={22} color="#1a2e1a" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={18} color="#777" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search locations, activities..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#999"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {activeFilters.length > 0 && (
                        <TouchableOpacity style={styles.clearFiltersRow} onPress={onClearFilters}>
                            <Text style={styles.clearFiltersText}>
                                Clear {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
                        {/* Activities */}
                        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('activities')}>
                            <Text style={styles.sectionTitle}>Activities</Text>
                            <Ionicons
                                name={activitiesOpen ? 'chevron-down' : 'chevron-forward'}
                                size={18}
                                color="#666"
                            />
                        </TouchableOpacity>
                        {activitiesOpen && (
                            <View style={styles.chipContainer}>
                                {filteredActivities.length === 0 ? (
                                    <Text style={styles.noResultsText}>No matches</Text>
                                ) : (
                                    filteredActivities.map((option) => {
                                        const isSelected = activeFilters.includes(option.value);
                                        return (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[styles.chip, isSelected && styles.chipSelected]}
                                                onPress={() => onToggleFilter(option.value)}
                                            >
                                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* Categories */}
                        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('categories')}>
                            <Text style={styles.sectionTitle}>Categories</Text>
                            <Ionicons
                                name={categoriesOpen ? 'chevron-down' : 'chevron-forward'}
                                size={18}
                                color="#666"
                            />
                        </TouchableOpacity>
                        {categoriesOpen && (
                            <View style={styles.chipContainer}>
                                {filteredCategories.length === 0 ? (
                                    <Text style={styles.noResultsText}>No matches</Text>
                                ) : (
                                    filteredCategories.map((option) => {
                                        const isSelected = activeFilters.includes(option.value);
                                        return (
                                            <TouchableOpacity
                                                key={option.value}
                                                style={[styles.chip, isSelected && styles.chipSelected]}
                                                onPress={() => onToggleFilter(option.value)}
                                            >
                                                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                                    {option.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                            </View>
                        )}

                        {/* Locations */}
                        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('locations')}>
                            <Text style={styles.sectionTitle}>Locations</Text>
                            <Ionicons
                                name={locationsOpen ? 'chevron-down' : 'chevron-forward'}
                                size={18}
                                color="#666"
                            />
                        </TouchableOpacity>
                        {locationsOpen && (
                            <View>
                                {filteredLocations.length === 0 ? (
                                    <Text style={styles.noResultsText}>No matches</Text>
                                ) : (
                                    filteredLocations.map((poi) => (
                                        <TouchableOpacity
                                            key={poi.id}
                                            style={styles.poiRow}
                                            onPress={() => handleSelectPOI(poi)}
                                        >
                                            <Ionicons name="location-outline" size={16} color="#2d7a4f" />
                                            <Text style={styles.poiRowText}>{poi.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        backgroundColor: '#ffffff',
        paddingTop: 50,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1a2e1a',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        backgroundColor: '#f2f2f2',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1a2e1a',
    },
    clearFiltersRow: {
        marginHorizontal: 16,
        marginBottom: 8,
    },
    clearFiltersText: {
        fontSize: 12,
        color: '#c0392b',
        fontWeight: '600',
    },
    scrollArea: {
        flex: 1,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a2e1a',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingVertical: 10,
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
    poiRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
    },
    poiRowText: {
        fontSize: 14,
        color: '#1a2e1a',
    },
    noResultsText: {
        fontSize: 12,
        color: '#999',
        paddingVertical: 10,
    },
});