import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OfferCard from '../../components/OfferCard';
import api from '../../utils/api';

export default function OffersScreen() {
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFilterOptions();
    loadOffers();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        api.get('/categories'),
        api.get('/locations'),
      ]);
      setCategories(catRes.data.categories);
      setLocations(locRes.data.locations);
    } catch (error) {
      console.log('Error loading filter options:', error);
    }
  };

  const loadOffers = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedLocation) params.location = selectedLocation;
      
      const res = await api.get('/offers', { params });
      // Offers are already sorted by newest from backend (created_at desc)
      setOffers(res.data);
    } catch (error) {
      console.log('Error loading offers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory, selectedLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOffers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedLocation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedLocation(null);
    setSearch('');
  };

  const hasActiveFilters = selectedCategory || selectedLocation || search;

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search offers..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name="options"
            size={20}
            color={showFilters || hasActiveFilters ? '#00A86B' : '#888'}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Category Filter */}
          <Text style={styles.filterLabel}>Category</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All', ...categories]}
            keyExtractor={(item) => `cat-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  (item === 'All' ? !selectedCategory : selectedCategory === item) && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(item === 'All' ? null : item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    (item === 'All' ? !selectedCategory : selectedCategory === item) && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.filterList}
          />

          {/* Location Filter */}
          <Text style={styles.filterLabel}>Location</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All', ...locations]}
            keyExtractor={(item) => `loc-${item}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  (item === 'All' ? !selectedLocation : selectedLocation === item) && styles.filterChipActive,
                ]}
                onPress={() => setSelectedLocation(item === 'All' ? null : item)}
              >
                <Ionicons 
                  name="location" 
                  size={12} 
                  color={(item === 'All' ? !selectedLocation : selectedLocation === item) ? '#fff' : '#888'} 
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    (item === 'All' ? !selectedLocation : selectedLocation === item) && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.filterList}
          />

          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
              <Ionicons name="close-circle" size={16} color="#dc3545" />
              <Text style={styles.clearText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !showFilters && (
        <View style={styles.activeFiltersRow}>
          {selectedCategory && (
            <View style={styles.activeFilterTag}>
              <Text style={styles.activeFilterText}>{selectedCategory}</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Ionicons name="close" size={14} color="#00A86B" />
              </TouchableOpacity>
            </View>
          )}
          {selectedLocation && (
            <View style={styles.activeFilterTag}>
              <Ionicons name="location" size={12} color="#00A86B" />
              <Text style={styles.activeFilterText}>{selectedLocation}</Text>
              <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                <Ionicons name="close" size={14} color="#00A86B" />
              </TouchableOpacity>
            </View>
          )}
          {search && (
            <View style={styles.activeFilterTag}>
              <Text style={styles.activeFilterText}>"{search}"</Text>
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close" size={14} color="#00A86B" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {offers.length} {offers.length === 1 ? 'offer' : 'offers'} available
        </Text>
        <Text style={styles.sortText}>
          <Ionicons name="time-outline" size={12} color="#888" /> Newest first
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OfferCard
            offer={item}
            onPress={() => router.push({ pathname: '/offer-detail', params: { id: item.id } })}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color="#333" />
            <Text style={styles.emptyText}>No offers available</Text>
            <Text style={styles.emptySubtext}>
              {hasActiveFilters 
                ? 'Try adjusting your filters' 
                : 'Check back later for new deals!'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
                <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00A86B" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  filterBtn: {
    padding: 8,
  },
  filtersContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  filterLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  filterList: {
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0f0f1a',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  filterChipActive: {
    backgroundColor: '#00A86B',
    borderColor: '#00A86B',
  },
  filterChipText: {
    color: '#888',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  clearText: {
    color: '#dc3545',
    fontSize: 13,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00A86B20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    color: '#00A86B',
    fontSize: 12,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    color: '#888',
    fontSize: 13,
  },
  sortText: {
    color: '#888',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  clearFiltersBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#00A86B20',
    borderRadius: 20,
  },
  clearFiltersBtnText: {
    color: '#00A86B',
    fontSize: 14,
    fontWeight: '500',
  },
});
