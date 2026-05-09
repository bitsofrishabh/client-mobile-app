import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { progressPhotosAPI } from '../src/services/api';
import { Card } from '../src/components/Card';
import { GradientButton } from '../src/components/GradientButton';
import { Colors, Gradients, Spacing, BorderRadius } from '../src/constants/theme';

interface Photo {
  id: string;
  photo_base64: string;
  photo_type: string;
  date: string;
  notes?: string;
}

const photoTypes = [
  { id: 'front', label: 'Front', icon: 'person' },
  { id: 'side', label: 'Side', icon: 'body' },
  { id: 'back', label: 'Back', icon: 'person-outline' },
];

export default function ProgressPhotos() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('front');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const data = await progressPhotosAPI.getAll();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadPhoto(result.assets[0].base64);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadPhoto(result.assets[0].base64);
    }
  };

  const uploadPhoto = async (base64: string) => {
    setUploading(true);
    try {
      await progressPhotosAPI.upload(base64, selectedType);
      Alert.alert('Success', 'Photo uploaded successfully!');
      fetchPhotos();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = (photoId: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await progressPhotosAPI.delete(photoId);
            fetchPhotos();
          } catch (error) {
            console.error('Error deleting photo:', error);
          }
        },
      },
    ]);
  };

  const togglePhotoSelection = (photoId: string) => {
    if (selectedPhotos.includes(photoId)) {
      setSelectedPhotos(selectedPhotos.filter((id) => id !== photoId));
    } else if (selectedPhotos.length < 2) {
      setSelectedPhotos([...selectedPhotos, photoId]);
    }
  };

  const groupPhotosByDate = () => {
    const groups: { [key: string]: Photo[] } = {};
    photos.forEach((photo) => {
      if (!groups[photo.date]) {
        groups[photo.date] = [];
      }
      groups[photo.date].push(photo);
    });
    return groups;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const photoGroups = groupPhotosByDate();
  const comparisonPhotos = photos.filter((p) => selectedPhotos.includes(p.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Photos</Text>
        <TouchableOpacity onPress={() => setCompareMode(!compareMode)}>
          <Ionicons
            name={compareMode ? 'close' : 'git-compare'}
            size={24}
            color={compareMode ? Colors.error : Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Comparison Mode */}
        {compareMode && (
          <Card style={styles.compareCard}>
            <Text style={styles.compareTitle}>Select 2 photos to compare</Text>
            <View style={styles.compareGrid}>
              {comparisonPhotos.length > 0 ? (
                comparisonPhotos.map((photo, index) => (
                  <View key={photo.id} style={styles.comparePhoto}>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${photo.photo_base64}` }}
                      style={styles.compareImage}
                    />
                    <Text style={styles.compareDate}>{photo.date}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.comparePlaceholder}>
                    <Ionicons name="image-outline" size={40} color={Colors.textLight} />
                    <Text style={styles.comparePlaceholderText}>Before</Text>
                  </View>
                  <View style={styles.comparePlaceholder}>
                    <Ionicons name="image-outline" size={40} color={Colors.textLight} />
                    <Text style={styles.comparePlaceholderText}>After</Text>
                  </View>
                </>
              )}
            </View>
          </Card>
        )}

        {/* Photo Type Selection */}
        {!compareMode && (
          <>
            <Text style={styles.sectionTitle}>Photo Type</Text>
            <View style={styles.typeSelection}>
              {photoTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    selectedType === type.id && styles.typeOptionSelected,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={24}
                    color={selectedType === type.id ? Colors.primary : Colors.textLight}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      selectedType === type.id && styles.typeLabelSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload Buttons */}
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto} disabled={uploading}>
                <LinearGradient colors={Gradients.primary} style={styles.uploadButtonGradient}>
                  {uploading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={24} color="white" />
                      <Text style={styles.uploadButtonText}>Take Photo</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={uploading}>
                <LinearGradient colors={Gradients.secondary} style={styles.uploadButtonGradient}>
                  {uploading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="images" size={24} color="white" />
                      <Text style={styles.uploadButtonText}>Gallery</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Photo Gallery */}
        <Text style={styles.sectionTitle}>Gallery</Text>
        {Object.keys(photoGroups).length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="images-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Take or upload your first progress photo!</Text>
          </Card>
        ) : (
          Object.entries(photoGroups)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, datePhotos]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateLabel}>{date}</Text>
                <View style={styles.photosGrid}>
                  {datePhotos.map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      style={[
                        styles.photoThumb,
                        compareMode && selectedPhotos.includes(photo.id) && styles.photoThumbSelected,
                      ]}
                      onPress={() => (compareMode ? togglePhotoSelection(photo.id) : null)}
                      onLongPress={() => deletePhoto(photo.id)}
                    >
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${photo.photo_base64}` }}
                        style={styles.thumbImage}
                      />
                      {compareMode && selectedPhotos.includes(photo.id) && (
                        <View style={styles.selectedOverlay}>
                          <Ionicons name="checkmark-circle" size={24} color="white" />
                        </View>
                      )}
                      <View style={styles.photoTypeBadge}>
                        <Text style={styles.photoTypeBadgeText}>{photo.photo_type}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  compareCard: {
    marginBottom: Spacing.lg,
  },
  compareTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  compareGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparePhoto: {
    width: '48%',
    alignItems: 'center',
  },
  compareImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.medium,
  },
  compareDate: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: Spacing.xs,
  },
  comparePlaceholder: {
    width: '48%',
    height: 200,
    backgroundColor: Colors.backgroundGray,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparePlaceholderText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  typeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  typeOption: {
    width: '30%',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: Colors.primary,
  },
  typeLabel: {
    fontSize: 12,
    color: Colors.textMedium,
    marginTop: Spacing.xs,
  },
  typeLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  uploadButton: {
    width: '48%',
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMedium,
    marginTop: Spacing.xs,
  },
  dateGroup: {
    marginBottom: Spacing.lg,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
    marginBottom: Spacing.sm,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  photoThumb: {
    width: '31%',
    aspectRatio: 0.75,
    margin: '1%',
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  photoThumbSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(146, 163, 253, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoTypeBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoTypeBadgeText: {
    fontSize: 10,
    color: 'white',
    textTransform: 'capitalize',
  },
});
