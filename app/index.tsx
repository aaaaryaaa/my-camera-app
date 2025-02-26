// import React, { useState, useRef, useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   TouchableOpacity, 
//   FlatList,
//   StatusBar,
//   Dimensions,
//   ActivityIndicator,
//   Alert
// } from 'react-native';
// import { Camera, useCameraDevice, useCameraPermission, VideoFile } from 'react-native-vision-camera';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Video } from 'expo-av';
// import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// export default function App() {
//   const [currentScreen, setCurrentScreen] = useState('CameraScreen');
//   const [videoList, setVideoList] = useState<string[]>([]);
//   const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

//   const navigateTo = (screen: string) => {
//     setCurrentScreen(screen);
//   };

//   useEffect(() => {
//     // saved videos when app starts
//     loadSavedVideos();
//   }, []);

//   const loadSavedVideos = async () => {
//     try {
//       const savedVideos = await AsyncStorage.getItem('savedVideos');
//       if (savedVideos) {
//         setVideoList(JSON.parse(savedVideos));
//       }
//     } catch (error) {
//       console.error('Failed to load videos', error);
//     }
//   };

//   const saveNewVideo = async (videoPath: string) => {
//     try {
//       const updatedList = [...videoList, videoPath];
//       await AsyncStorage.setItem('savedVideos', JSON.stringify(updatedList));
//       setVideoList(updatedList);
//     } catch (error) {
//       console.error('Failed to save video', error);
//     }
//   };

//   const handleVideoSelect = (videoUri: string) => {
//     setSelectedVideo(videoUri);
//     navigateTo('VideoPlayerScreen');
//   };

//   const deleteVideo = async (videoUri: string) => {
//     try {
//       const updatedList = videoList.filter(uri => uri !== videoUri);
//       await AsyncStorage.setItem('savedVideos', JSON.stringify(updatedList));
//       setVideoList(updatedList);
      
//       if (selectedVideo === videoUri) {
//         setSelectedVideo(null);
//         navigateTo('GalleryScreen');
//       }
//     } catch (error) {
//       console.error('Failed to delete video', error);
//     }
//   };

//   // to make it render current screeen
//   const renderScreen = () => {
//     switch (currentScreen) {
//       case 'CameraScreen':
//         return <CameraScreen navigateTo={navigateTo} onVideoSaved={saveNewVideo} />;
//       case 'GalleryScreen':
//         return <GalleryScreen 
//           navigateTo={navigateTo} 
//           videoList={videoList} 
//           onVideoSelect={handleVideoSelect} 
//         />;
//       case 'VideoPlayerScreen':
//         return <VideoPlayerScreen 
//           navigateTo={navigateTo} 
//           videoUri={selectedVideo} 
//           onDeleteVideo={deleteVideo} 
//         />;
//       default:
//         return <CameraScreen navigateTo={navigateTo} onVideoSaved={saveNewVideo} />;
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" />
//       {renderScreen()}
//       <BottomNavBar currentScreen={currentScreen} navigateTo={navigateTo} />
//     </View>
//   );
// }

// // the camera screen fo the recording
// const CameraScreen = ({ navigateTo, onVideoSaved }: { 
//   navigateTo: (screen: string) => void,
//   onVideoSaved: (videoPath: string) => void
// }) => {
//   const { hasPermission, requestPermission } = useCameraPermission();
//   const device = useCameraDevice('back');
//   const camera = useRef<Camera>(null);
  
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingTimer, setRecordingTimer] = useState(0);
//   const [cameraReady, setCameraReady] = useState(false);
//   const [showCountdown, setShowCountdown] = useState(false);
//   const [countdown, setCountdown] = useState(3);

//   useEffect(() => {
//     if (!hasPermission) {
//       requestPermission();
//     }
//   }, [hasPermission, requestPermission]);

//   useEffect(() => {
//     let interval: NodeJS.Timeout;
    
//     if (isRecording) {
//       interval = setInterval(() => {
//         setRecordingTimer(prev => {
//           if (prev >= 4) {
//             clearInterval(interval);
//             stopRecording();
//             return 0;
//           }
//           return prev + 1;
//         });
//       }, 1000);
//     } else {
//       setRecordingTimer(0);
//     }
    
//     return () => clearInterval(interval);
//   }, [isRecording]);

//   useEffect(() => {
//     let countdownInterval: NodeJS.Timeout;
    
//     if (showCountdown) {
//       countdownInterval = setInterval(() => {
//         setCountdown(prev => {
//           if (prev <= 1) {
//             clearInterval(countdownInterval);
//             setShowCountdown(false);
//             startRecording();
//             return 3;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     }
    
//     return () => clearInterval(countdownInterval);
//   }, [showCountdown]);

//   const startCountdown = () => {
//     if (!cameraReady) return;
//     setShowCountdown(true);
//   };

//   const startRecording = async () => {
//     if (camera.current && !isRecording) {
//       setIsRecording(true);
//       try {
//         camera.current.startRecording({
//           flash: 'off',
//           onRecordingFinished: (video) => {
//             console.log('Video recorded!', video.path);
//             onVideoSaved(video.path);
//           },
//           onRecordingError: (error) => {
//             console.error('Recording error', error);
//             setIsRecording(false);
//           },
//         });
//       } catch (e) {
//         console.error('Failed to start recording', e);
//         setIsRecording(false);
//       }
//     }
//   };

//   const stopRecording = async () => {
//     if (camera.current && isRecording) {
//       try {
//         await camera.current.stopRecording();
//       } catch (e) {
//         console.error('Failed to stop recording', e);
//       }
//       setIsRecording(false);
//     }
//   };

//   if (!hasPermission) {
//     return (
//       <View style={styles.permissionContainer}>
//         <Text style={styles.permissionText}>We need camera permission to record videos</Text>
//         <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
//           <Text style={styles.permissionButtonText}>Grant Permission</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   if (!device) {
//     return (
//       <View style={styles.permissionContainer}>
//         <Text style={styles.permissionText}>No camera device found</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.cameraContainer}>
//       <Camera
//         ref={camera}
//         style={styles.camera}
//         device={device}
//         isActive={true}
//         video={true}
//         audio={true}
//         onInitialized={() => setCameraReady(true)}
//       />
      
//       {showCountdown && (
//         <View style={styles.countdownOverlay}>
//           <Text style={styles.countdownText}>{countdown}</Text>
//         </View>
//       )}
      
//       <View style={styles.recordingIndicator}>
//         {isRecording && (
//           <>
//             <View style={styles.recordingDot} />
//             <Text style={styles.recordingTimer}>{recordingTimer}s / 4s</Text>
//           </>
//         )}
//       </View>
      
//       <View style={styles.cameraControls}>
//         <TouchableOpacity 
//           style={[
//             styles.recordButton, 
//             isRecording ? styles.recordingButton : null
//           ]}
//           onPress={isRecording ? stopRecording : startCountdown}
//           disabled={showCountdown}
//         >
//           {showCountdown ? (
//             <ActivityIndicator size="large" color="#fff" />
//           ) : null}
//         </TouchableOpacity>
//       </View>

//       <View style={styles.cameraInfoOverlay}>
//         <Text style={styles.cameraInfoText}>
//           {!cameraReady ? 'Initializing camera...' : 
//            isRecording ? 'Recording video...' : 
//            'Tap the button to record a 4 second video'}
//         </Text>
//       </View>
//     </View>
//   );
// };

// // the gallery screen to displayy the videos
// const GalleryScreen = ({ navigateTo, videoList, onVideoSelect }: {
//   navigateTo: (screen: string) => void,
//   videoList: string[],
//   onVideoSelect: (videoUri: string) => void
// }) => {
//   const [refreshing, setRefreshing] = useState(false);

//   const refreshList = async () => {
//     setRefreshing(true);
//     setTimeout(() => {
//       setRefreshing(false);
//     }, 1000);
//   };

//   const renderThumbnail = ({ item }: { item: string }) => {
//     return (
//       <TouchableOpacity
//         style={styles.videoThumbnail}
//         onPress={() => onVideoSelect(item)}
//       >
//         <View style={styles.thumbnailOverlay}>
//           <FontAwesome5 name="play-circle" size={40} color="white" />
//         </View>
//         <Text style={styles.thumbnailText}>
//           {new Date().toLocaleDateString()} Video
//         </Text>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={styles.galleryContainer}>
//       <View style={styles.galleryHeader}>
//         <Text style={styles.galleryTitle}>My Videos</Text>
//       </View>
      
//       {videoList.length === 0 ? (
//         <View style={styles.emptyGallery}>
//           <Ionicons name="videocam-outline" size={70} color="#ccc" />
//           <Text style={styles.emptyGalleryText}>No videos recorded yet</Text>
//           <Text style={styles.emptyGallerySubtext}>
//             Start recording some 4-second videos on the camera screen
//           </Text>
//           <TouchableOpacity 
//             style={styles.recordNowButton}
//             onPress={() => navigateTo('CameraScreen')}
//           >
//             <Text style={styles.recordNowButtonText}>Record Now</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={videoList}
//           renderItem={renderThumbnail}
//           keyExtractor={(item, index) => index.toString()}
//           numColumns={2}
//           contentContainerStyle={styles.galleryList}
//           refreshing={refreshing}
//           onRefresh={refreshList}
//         />
//       )}
//     </View>
//   );
// };

// // video player
// const VideoPlayerScreen = ({ navigateTo, videoUri, onDeleteVideo }: {
//   navigateTo: (screen: string) => void,
//   videoUri: string | null,
//   onDeleteVideo: (videoUri: string) => void
// }) => {
//   const videoRef = useRef<Video>(null);
//   const [status, setStatus] = useState({
//     isPlaying: false,
//     isLoaded: false,
//     error: false
//   });
  
//   useEffect(() => {
//     return () => {
//       if (videoRef.current) {
//         videoRef.current.unloadAsync();
//       }
//     };
//   }, []);
  
//   const handlePlayPause = async () => {
//     if (!videoRef.current) return;
    
//     if (status.isPlaying) {
//       await videoRef.current.pauseAsync();
//     } else {
//       await videoRef.current.playAsync();
//     }
//   };
  
//   const handleDeleteVideo = () => {
//     if (!videoUri) return;
    
//     Alert.alert(
//       "Delete Video",
//       "Are you sure you want to delete this video?",
//       [
//         { text: "Cancel", style: "cancel" },
//         { 
//           text: "Delete", 
//           style: "destructive",
//           onPress: () => {
//             if (videoUri) {
//               onDeleteVideo(videoUri);
//             }
//           }
//         }
//       ]
//     );
//   };
  
//   if (!videoUri) {
//     return (
//       <View style={styles.videoErrorContainer}>
//         <Text style={styles.videoErrorText}>Video not found</Text>
//         <TouchableOpacity 
//           style={styles.backButton}
//           onPress={() => navigateTo('GalleryScreen')}
//         >
//           <Text style={styles.backButtonText}>Back to Gallery</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }
  
//   return (
//     <View style={styles.videoPlayerContainer}>
//       <View style={styles.videoPlayerHeader}>
//         <TouchableOpacity 
//           style={styles.videoPlayerBackButton}
//           onPress={() => navigateTo('GalleryScreen')}
//         >
//           <Ionicons name="arrow-back" size={24} color="white" />
//           <Text style={styles.videoPlayerBackText}>Back</Text>
//         </TouchableOpacity>
        
//         <TouchableOpacity 
//           style={styles.videoPlayerDeleteButton}
//           onPress={handleDeleteVideo}
//         >
//           <MaterialIcons name="delete" size={24} color="white" />
//         </TouchableOpacity>
//       </View>
      
//       <View style={styles.videoPlayerWrapper}>
//         <Video
//           ref={videoRef}
//           style={styles.videoPlayer}
//           source={{ uri: videoUri }}
//           useNativeControls={false}
//           resizeMode="cover"
//           isLooping
//           onPlaybackStatusUpdate={(status) => {
//             if (status.isLoaded) {
//               setStatus({
//                 isPlaying: status.isPlaying,
//                 isLoaded: true,
//                 error: false
//               });
//             } else {
//               setStatus({
//                 isPlaying: false,
//                 isLoaded: false,
//                 error: true
//               });
//             }
//           }}
//         />
        
//         {!status.isLoaded && (
//           <View style={styles.videoLoadingOverlay}>
//             <ActivityIndicator size="large" color="white" />
//           </View>
//         )}
        
//         {status.error && (
//           <View style={styles.videoErrorOverlay}>
//             <Text style={styles.videoErrorText}>
//               Error loading video
//             </Text>
//           </View>
//         )}
        
//         <TouchableOpacity 
//           style={styles.videoControlOverlay}
//           onPress={handlePlayPause}
//         >
//           {!status.isPlaying && status.isLoaded && (
//             <Ionicons name="play-circle" size={70} color="rgba(255,255,255,0.8)" />
//           )}
//         </TouchableOpacity>
//       </View>
      
//       <View style={styles.videoPlayerControls}>
//         <TouchableOpacity 
//           style={styles.videoControlButton}
//           onPress={handlePlayPause}
//         >
//           <Ionicons 
//             name={status.isPlaying ? "pause" : "play"} 
//             size={30} 
//             color="white" 
//           />
//           <Text style={styles.videoControlText}>
//             {status.isPlaying ? "Pause" : "Play"}
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// // Bottom Navigation Bar
// const BottomNavBar = ({ currentScreen, navigateTo }: {
//   currentScreen: string,
//   navigateTo: (screen: string) => void
// }) => {
//   return (
//     <View style={styles.navBar}>
//       <TouchableOpacity 
//         style={[
//           styles.navButton, 
//           currentScreen === 'CameraScreen' ? styles.activeNavButton : null
//         ]}
//         onPress={() => navigateTo('CameraScreen')}
//       >
//         <Ionicons 
//           name={currentScreen === 'CameraScreen' ? "camera" : "camera-outline"} 
//           size={24} 
//           color={currentScreen === 'CameraScreen' ? "#3498db" : "#888"}
//         />
//         <Text 
//           style={[
//             styles.navButtonText,
//             currentScreen === 'CameraScreen' ? styles.activeNavButtonText : null
//           ]}
//         >
//           Camera
//         </Text>
//       </TouchableOpacity>
      
//       <TouchableOpacity 
//         style={[
//           styles.navButton, 
//           currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen' 
//             ? styles.activeNavButton 
//             : null
//         ]}
//         onPress={() => navigateTo('GalleryScreen')}
//       >
//         <MaterialIcons 
//           name={
//             currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen'
//               ? "video-library" 
//               : "video-library"
//           } 
//           size={24} 
//           color={
//             currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen'
//               ? "#3498db" 
//               : "#888"
//           }
//         />
//         <Text 
//           style={[
//             styles.navButtonText,
//             currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen' 
//               ? styles.activeNavButtonText 
//               : null
//           ]}
//         >
//           Gallery
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const { width, height } = Dimensions.get('window');

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#121212',
//   },
//   // Camera Screen Styles
//   cameraContainer: {
//     flex: 1,
//     backgroundColor: 'black',
//   },
//   camera: {
//     flex: 1,
//   },
//   cameraControls: {
//     position: 'absolute',
//     bottom: 80,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   recordButton: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#FF4757',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 4,
//     borderColor: 'white',
//   },
//   recordingButton: {
//     backgroundColor: '#2ecc71',
//     transform: [{ scale: 0.8 }],
//   },
//   permissionContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#121212',
//     padding: 20,
//   },
//   permissionText: {
//     color: 'white',
//     fontSize: 18,
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   permissionButton: {
//     backgroundColor: '#3498db',
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 8,
//   },
//   permissionButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   recordingIndicator: {
//     position: 'absolute',
//     top: 50,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 10,
//   },
//   recordingDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#FF4757',
//     marginRight: 8,
//   },
//   recordingTimer: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   countdownOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   countdownText: {
//     color: 'white',
//     fontSize: 80,
//     fontWeight: 'bold',
//   },
//   cameraInfoOverlay: {
//     position: 'absolute',
//     bottom: 150,
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//   },
//   cameraInfoText: {
//     color: 'white',
//     fontSize: 14,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     padding: 8,
//     borderRadius: 8,
//   },
  
//   // Gallery Screen Styles
//   galleryContainer: {
//     flex: 1,
//     backgroundColor: '#121212',
//   },
//   galleryHeader: {
//     padding: 15,
//     borderBottomColor: '#333',
//     borderBottomWidth: 1,
//   },
//   galleryTitle: {
//     color: 'white',
//     fontSize: 22,
//     fontWeight: 'bold',
//   },
//   emptyGallery: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   emptyGalleryText: {
//     color: 'white',
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginTop: 20,
//   },
//   emptyGallerySubtext: {
//     color: '#aaa',
//     fontSize: 16,
//     textAlign: 'center',
//     marginTop: 10,
//     marginHorizontal: 30,
//   },
//   recordNowButton: {
//     marginTop: 30,
//     backgroundColor: '#3498db',
//     paddingVertical: 12,
//     paddingHorizontal: 30,
//     borderRadius: 8,
//   },
//   recordNowButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   galleryList: {
//     padding: 10,
//   },
//   videoThumbnail: {
//     flex: 1,
//     height: 160,
//     margin: 5,
//     backgroundColor: '#333',
//     borderRadius: 8,
//     overflow: 'hidden',
//     justifyContent: 'flex-end',
//   },
//   thumbnailOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   thumbnailText: {
//     color: 'white',
//     fontSize: 12,
//     padding: 8,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//   },
  
//   // Video Player Screen Styles
//   videoPlayerContainer: {
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   videoPlayerHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 15,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//   },
//   videoPlayerBackButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   videoPlayerBackText: {
//     color: 'white',
//     fontSize: 16,
//     marginLeft: 5,
//   },
//   videoPlayerDeleteButton: {
//     padding: 5,
//   },
//   videoPlayerWrapper: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoPlayer: {
//     width: '100%',
//     height: '100%',
//   },
//   videoLoadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoErrorOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoErrorText: {
//     color: 'white',
//     fontSize: 18,
//   },
//   videoControlOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   videoPlayerControls: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     padding: 20,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//   },
//   videoControlButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(52,152,219,0.8)',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 25,
//   },
//   videoControlText: {
//     color: 'white',
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   videoErrorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#121212',
//   },
//   backButton: {
//     marginTop: 20,
//     backgroundColor: '#3498db',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//   },
//   backButtonText: {
//     color: 'white',
//     fontSize: 16,
//   },
  
//   // Navigation Bar Styles
//   navBar: {
//     flexDirection: 'row',
//     backgroundColor: '#1a1a1a',
//     borderTopWidth: 1,
//     borderTopColor: '#333',
//     paddingBottom: 20, // Extra padding for newer iPhone models
//   },
//   navButton: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 12,
//   },
//   activeNavButton: {
//     borderTopWidth: 2,
//     borderTopColor: '#3498db',
//     backgroundColor: 'rgba(52, 152, 219, 0.1)',
//   },
//   navButtonText: {
//     color: '#888',
//     fontSize: 12,
//     marginTop: 4,
//   },
//   activeNavButtonText: {
//     color: '#3498db',
//     fontWeight: 'bold',
//   },
// });
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing,
  ImageBackground,
  SafeAreaView,
  Platform
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5, Feather, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';

// Main App with Navigation
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('CameraScreen');
  const [videoList, setVideoList] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  
  // Animation value for screen transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const navigateTo = (screen: string) => {
    // Animate screen transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        delay: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      })
    ]).start();
    
    // Change screen after fade out starts
    setTimeout(() => setCurrentScreen(screen), 150);
  };

  useEffect(() => {
    // Load saved videos when app starts
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      const savedVideos = await AsyncStorage.getItem('savedVideos');
      if (savedVideos) {
        setVideoList(JSON.parse(savedVideos));
      }
    } catch (error) {
      console.error('Failed to load videos', error);
    }
  };

  const saveNewVideo = async (videoPath: string) => {
    try {
      const timestamp = new Date().toISOString();
      const videoData = { path: videoPath, timestamp };
      const updatedList = [...videoList, videoPath];
      await AsyncStorage.setItem('savedVideos', JSON.stringify(updatedList));
      setVideoList(updatedList);
      
      // Show success animation or feedback
      setTimeout(() => {
        navigateTo('GalleryScreen');
      }, 500);
    } catch (error) {
      console.error('Failed to save video', error);
    }
  };

  const handleVideoSelect = (videoUri: string) => {
    setSelectedVideo(videoUri);
    navigateTo('VideoPlayerScreen');
  };

  const deleteVideo = async (videoUri: string) => {
    try {
      const updatedList = videoList.filter(uri => uri !== videoUri);
      await AsyncStorage.setItem('savedVideos', JSON.stringify(updatedList));
      setVideoList(updatedList);
      
      if (selectedVideo === videoUri) {
        setSelectedVideo(null);
        navigateTo('GalleryScreen');
      }
    } catch (error) {
      console.error('Failed to delete video', error);
    }
  };

  // Render the current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'CameraScreen':
        return <CameraScreen navigateTo={navigateTo} onVideoSaved={saveNewVideo} />;
      case 'GalleryScreen':
        return <GalleryScreen 
          navigateTo={navigateTo} 
          videoList={videoList} 
          onVideoSelect={handleVideoSelect} 
        />;
      case 'VideoPlayerScreen':
        return <VideoPlayerScreen 
          navigateTo={navigateTo} 
          videoUri={selectedVideo} 
          onDeleteVideo={deleteVideo} 
        />;
      default:
        return <CameraScreen navigateTo={navigateTo} onVideoSaved={saveNewVideo} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Animated.View 
        style={[
          styles.container,
          { opacity: fadeAnim }
        ]}
      >
        {renderScreen()}
        <BottomNavBar currentScreen={currentScreen} navigateTo={navigateTo} />
      </Animated.View>
    </SafeAreaView>
  );
}

// Camera Screen Component
const CameraScreen = ({ navigateTo, onVideoSaved }: { 
  navigateTo: (screen: string) => void,
  onVideoSaved: (videoPath: string) => void
}) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const camera = useRef<Camera>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  // Animation values
  const countdownScale = useRef(new Animated.Value(1)).current;
  const recordButtonScale = useRef(new Animated.Value(1)).current;
  const recordingAnimation = useRef(new Animated.Value(0)).current;
  
  // Pulse animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          }),
          Animated.timing(recordingAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          })
        ])
      ).start();
    } else {
      recordingAnimation.setValue(0);
    }
  }, [isRecording]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTimer(prev => {
          if (prev >= 4) {
            clearInterval(interval);
            stopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingTimer(0);
    }
    
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    
    if (showCountdown) {
      countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowCountdown(false);
            startRecording();
            return 3;
          }
          
          // Animate countdown number
          Animated.sequence([
            Animated.timing(countdownScale, {
              toValue: 1.5,
              duration: 300,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease)
            }),
            Animated.timing(countdownScale, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
              easing: Easing.in(Easing.ease)
            })
          ]).start();
          
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(countdownInterval);
  }, [showCountdown]);

  const startCountdown = () => {
    if (!cameraReady) return;
    
    // Animate button press
    Animated.sequence([
      Animated.timing(recordButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }),
      Animated.timing(recordButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease)
      })
    ]).start();
    
    setShowCountdown(true);
  };

  const startRecording = async () => {
    if (camera.current && !isRecording) {
      setIsRecording(true);
      try {
        camera.current.startRecording({
          flash: 'off',
          onRecordingFinished: (video) => {
            console.log('Video recorded!', video.path);
            onVideoSaved(video.path);
          },
          onRecordingError: (error) => {
            console.error('Recording error', error);
            setIsRecording(false);
          },
        });
      } catch (e) {
        console.error('Failed to start recording', e);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = async () => {
    if (camera.current && isRecording) {
      try {
        await camera.current.stopRecording();
      } catch (e) {
        console.error('Failed to stop recording', e);
      }
      setIsRecording(false);
    }
  };

  if (!hasPermission) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#121212']}
        style={styles.permissionContainer}
      >
        <Image 
          source={{ uri: 'https://api.a0.dev/assets/image?text=video%20recording%20app%20camera%20permission&aspect=1:1&seed=123' }} 
          style={styles.permissionImage}
        />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>We need camera permission to record your awesome 4-second moments</Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off-outline" size={80} color="#e74c3c" />
        <Text style={styles.permissionTitle}>Camera Not Available</Text>
        <Text style={styles.permissionText}>We couldn't find a camera on your device</Text>
      </View>
    );
  }

  const pulseOpacity = recordingAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1]
  });

  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        video={true}
        audio={true}
        onInitialized={() => setCameraReady(true)}
      />
      
      {/* Status area at top */}
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
        style={styles.cameraHeader}
      >
        <Text style={styles.cameraHeaderText}>
          4-Second Moments
        </Text>
        
        {isRecording && (
          <View style={styles.headerRecordingIndicator}>
            <Animated.View 
              style={[
                styles.recordingDot, 
                { opacity: pulseOpacity }
              ]} 
            />
            <Text style={styles.recordingTimer}>REC {recordingTimer}s</Text>
          </View>
        )}
      </LinearGradient>
      
      {/* Countdown overlay */}
      {showCountdown && (
        <View style={styles.countdownOverlay}>
          <Animated.Text 
            style={[
              styles.countdownText,
              { transform: [{ scale: countdownScale }] }
            ]}
          >
            {countdown}
          </Animated.Text>
          <Text style={styles.countdownSubtext}>Get ready!</Text>
        </View>
      )}
      
      {/* Recording progress indicator */}
      {isRecording && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground} />
          <View 
            style={[
              styles.progressBar, 
              { width: `${(recordingTimer / 4) * 100}%` }
            ]} 
          />
        </View>
      )}
      
      {/* Camera controls */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
        style={styles.cameraControls}
      >
        <View style={styles.controlsRow}>
          {/* Left side spacer */}
          <View style={styles.controlButtonSide}></View>
          
          {/* Center - Record button */}
          <Animated.View 
            style={[
              { transform: [{ scale: recordButtonScale }] }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.recordButton, 
                isRecording ? styles.recordingButton : null
              ]}
              onPress={isRecording ? stopRecording : startCountdown}
              disabled={showCountdown}
              activeOpacity={0.8}
            >
              {showCountdown ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <View style={isRecording ? styles.recordingButtonInner : styles.recordButtonInner} />
              )}
            </TouchableOpacity>
          </Animated.View>
          
          {/* Right side - Gallery shortcut */}
          <TouchableOpacity 
            style={styles.controlButtonSide} 
            onPress={() => navigateTo('GalleryScreen')}
            activeOpacity={0.8}
          >
            <View style={styles.galleryShortcut}>
              <MaterialIcons name="video-library" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.cameraInfoOverlay}>
          <Text style={styles.cameraInfoText}>
            {!cameraReady ? 'Initializing camera...' : 
             isRecording ? 'Recording your moment...' : 
             'Tap to record a 4-second moment'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// Gallery Screen Component
const GalleryScreen = ({ navigateTo, videoList, onVideoSelect }: {
  navigateTo: (screen: string) => void,
  videoList: string[],
  onVideoSelect: (videoUri: string) => void
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const refreshList = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderThumbnail = ({ item, index }: { item: string, index: number }) => {
    // Alternating animation delay for staggered effect
    const delay = index % 2 === 0 ? 0 : 100;
    
    return (
      <Animated.View
        style={{
          opacity: scrollY.interpolate({
            inputRange: [-100, 0, (index * 160)],
            outputRange: [1, 1, 1],
            extrapolate: 'clamp'
          }),
          transform: [{
            scale: scrollY.interpolate({
              inputRange: [-100, 0, (index * 160)],
              outputRange: [1, 1, 0.9],
              extrapolate: 'clamp'
            })
          }]
        }}
      >
        <TouchableOpacity
          style={styles.videoThumbnail}
          onPress={() => onVideoSelect(item)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#6a11cb', '#2575fc']}
            style={styles.thumbnailGradient}
          >
            <Text style={styles.thumbnailDuration}>4s</Text>
            <View style={styles.thumbnailOverlay}>
              <MaterialCommunityIcons name="play-circle-outline" size={46} color="white" />
            </View>
          </LinearGradient>
          <View style={styles.thumbnailFooter}>
            <Text style={styles.thumbnailText}>
              Moment {videoList.length - index}
            </Text>
            <Text style={styles.thumbnailDate}>
              {new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp'
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 80],
    extrapolate: 'clamp'
  });

  return (
    <View style={styles.galleryContainer}>
      <Animated.View 
        style={[
          styles.galleryHeader,
          { 
            opacity: headerOpacity 
          }
        ]}
      >
        <LinearGradient
          colors={['#1a1a2e', '#121212']}
          style={styles.galleryHeaderGradient}
        >
          <Text style={styles.galleryTitle}>My Moments</Text>
          <Text style={styles.gallerySubtitle}>
            {videoList.length} {videoList.length === 1 ? 'video' : 'videos'} captured
          </Text>
        </LinearGradient>
      </Animated.View>
      
      {videoList.length === 0 ? (
        <View style={styles.emptyGallery}>
          <Image 
            source={{ uri: 'https://api.a0.dev/assets/image?text=empty%20video%20collection%20illustration&aspect=1:1&seed=565' }} 
            style={styles.emptyGalleryImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyGalleryText}>Your gallery is empty</Text>
          <Text style={styles.emptyGallerySubtext}>
            Start capturing short 4-second moments to preserve your memories
          </Text>
          <TouchableOpacity 
            style={styles.recordNowButton}
            onPress={() => navigateTo('CameraScreen')}
            activeOpacity={0.8}
          >
            <Feather name="video" size={18} color="white" style={styles.recordNowButtonIcon} />
            <Text style={styles.recordNowButtonText}>Record Your First Moment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={videoList.slice().reverse()}
          renderItem={renderThumbnail}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          contentContainerStyle={styles.galleryList}
          refreshing={refreshing}
          onRefresh={refreshList}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />
      )}
    </View>
  );
};

// Video Player Screen
const VideoPlayerScreen = ({ navigateTo, videoUri, onDeleteVideo }: {
  navigateTo: (screen: string) => void,
  videoUri: string | null,
  onDeleteVideo: (videoUri: string) => void
}) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState({
    isPlaying: false,
    isLoaded: false,
    error: false,
    positionMillis: 0,
    durationMillis: 0
  });
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  
  // Progress bar animation
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const progressInterpolation = progressAnimation.interpolate({
    inputRange: [0, 4000], // 4 seconds in milliseconds
    outputRange: [0, 100],
    extrapolate: 'clamp'
  });
  
  useEffect(() => {
    // Fade in animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
    
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Auto-hide controls after 3 seconds if playing
    if (status.isPlaying) {
      timeout = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }).start();
      }, 3000);
    } else {
      // Show controls when paused
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
    
    return () => clearTimeout(timeout);
  }, [status.isPlaying]);
  
  const toggleControls = () => {
    if (controlsOpacity._value === 0) {
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else if (status.isPlaying) {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };
  
  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };
  
  const handleDeleteVideo = () => {
    if (!videoUri) return;
    
    Alert.alert(
      "Delete Moment",
      "Are you sure you want to delete this moment?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            if (videoUri) {
              // Fade out animation before delete
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
              }).start(() => {
                onDeleteVideo(videoUri);
              });
            }
          }
        }
      ]
    );
  };
  
  if (!videoUri) {
    return (
      <View style={styles.videoErrorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#e74c3c" />
        <Text style={styles.videoErrorTitle}>Video Not Found</Text>
        <Text style={styles.videoErrorText}>The selected video could not be loaded</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigateTo('GalleryScreen')}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Back to Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <Animated.View 
      style={[
        styles.videoPlayerContainer,
        { opacity: fadeAnim }
      ]}
    >
      {/* Video player */}
      <TouchableOpacity 
        activeOpacity={1}
        style={styles.videoPlayerWrapper}
        onPress={toggleControls}
      >
        <Video
          ref={videoRef}
          style={styles.videoPlayer}
          source={{ uri: videoUri }}
          useNativeControls={false}
          resizeMode="cover"
          isLooping
          shouldPlay={true}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setStatus({
                isPlaying: status.isPlaying,
                isLoaded: true,
                error: false,
                positionMillis: status.positionMillis,
                durationMillis: status.durationMillis || 4000
              });
              
              // Update progress animation
              progressAnimation.setValue(status.positionMillis);
            } else {
              setStatus({
                isPlaying: false,
                isLoaded: false,
                error: true,
                positionMillis: 0,
                durationMillis: 0
              });
            }
          }}
        />
        
        {/* Loading indicator */}
        {!status.isLoaded && (
          <View style={styles.videoLoadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading your moment...</Text>
          </View>
        )}
        
        {/* Error overlay */}
        {status.error && (
          <View style={styles.videoErrorOverlay}>
            <AntDesign name="warning" size={50} color="#e74c3c" />
            <Text style={styles.videoErrorText}>
              Failed to load video
            </Text>
          </View>
        )}
        
        {/* Header controls */}
        <Animated.View 
          style={[
            styles.videoPlayerHeader,
            { opacity: controlsOpacity }
          ]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)']}
            style={styles.videoHeaderGradient}
          >
            <TouchableOpacity 
              style={styles.videoPlayerBackButton}
              onPress={() => navigateTo('GalleryScreen')}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={28} color="white" />
              <Text style={styles.videoPlayerBackText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.videoPlayerDeleteButton}
              onPress={handleDeleteVideo}
              activeOpacity={0.8}
            >
              <MaterialIcons name="delete-outline" size={28} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
        
        {/* Center play/pause button */}
        <Animated.View 
          style={[
            styles.videoControlOverlay,
            { 
              opacity: controlsOpacity.interpolate({
                inputRange: [0, 1],
                outputRange: [0, status.isPlaying ? 0 : 1]
              })
            }
          ]}
        >
          {!status.isPlaying && status.isLoaded && (
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.bigPlayButton}
              activeOpacity={0.9}
            >
              <Ionicons name="play" size={40} color="white" />
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {/* Bottom controls */}
        <Animated.View 
          style={[
            styles.videoPlayerControls,
            { opacity: controlsOpacity }
          ]}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
            style={styles.videoControlsGradient}
          >
            {/* Progress bar */}
            <View style={styles.videoProgressContainer}>
              <View style={styles.videoProgressBackground} />
              <Animated.View 
                style={[
                  styles.videoProgress,
                  { width: `${progressInterpolation}%` }
                ]} 
              />
            </View>
            
            <View style={styles.videoControlsRow}>
              <TouchableOpacity 
                style={styles.videoControlButton}
                onPress={handlePlayPause}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={status.isPlaying ? "pause" : "play"} 
                  size={24} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <Text style={styles.videoDuration}>
                00:0{Math.floor(status.positionMillis / 1000)}/{Math.floor(status.durationMillis / 1000)}s
              </Text>
              
              <TouchableOpacity 
                style={styles.videoShareButton}
                activeOpacity={0.8}
              >
                <Feather name="share" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Bottom Navigation Bar
const BottomNavBar = ({ currentScreen, navigateTo }: {
  currentScreen: string,
  navigateTo: (screen: string) => void
}) => {
  // Animation values
  const cameraScale = useRef(new Animated.Value(currentScreen === 'CameraScreen' ? 1.2 : 1)).current;
  const galleryScale = useRef(new Animated.Value(
    currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen' ? 1.2 : 1
  )).current;
  
  // Update animations when screen changes
  useEffect(() => {
    Animated.parallel([
      Animated.spring(cameraScale, {
        toValue: currentScreen === 'CameraScreen' ? 1.2 : 1,
        useNativeDriver: true,
        friction: 8
      }),
      Animated.spring(galleryScale, {
        toValue: currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen' ? 1.2 : 1,
        useNativeDriver: true,
        friction: 8
      })
    ]).start();
  }, [currentScreen]);
  
  return (
    <LinearGradient
      colors={['rgba(0,0,0,0.8)', '#000']}
      style={styles.navBar}
    >
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => navigateTo('CameraScreen')}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: cameraScale }] }}>
          <LinearGradient
            colors={currentScreen === 'CameraScreen' ? 
              ['#6a11cb', '#2575fc'] : 
              ['#333', '#222']}
            style={[
              styles.navButtonCircle,
              currentScreen === 'CameraScreen' ? styles.activeNavButtonCircle : null
            ]}
          >
            <Ionicons 
              name="camera" 
              size={24} 
              color="white"
            />
          </LinearGradient>
        </Animated.View>
        <Text 
          style={[
            styles.navButtonText,
            currentScreen === 'CameraScreen' ? styles.activeNavButtonText : null
          ]}
        >
          Camera
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={() => navigateTo('GalleryScreen')}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: galleryScale }] }}>
          <LinearGradient
            colors={currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen' ? 
              ['#6a11cb', '#2575fc'] : 
              ['#333', '#222']}
            style={[
              styles.navButtonCircle,
              (currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen') ? 
                styles.activeNavButtonCircle : null
            ]}
          >
            <MaterialIcons 
              name="video-library" 
              size={24} 
              color="white"
            />
          </LinearGradient>
        </Animated.View>
        <Text 
          style={[
            styles.navButtonText,
            (currentScreen === 'GalleryScreen' || currentScreen === 'VideoPlayerScreen') ? 
              styles.activeNavButtonText : null
          ]}
        >
          Gallery
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  // Camera Screen Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraHeaderText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRecordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 100,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
  },
  recordingButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderColor: '#e74c3c',
  },
  recordingButtonInner: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: '#e74c3c',
  },
  controlButtonSide: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryShortcut: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 30,
  },
  permissionImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 30,
  },
  permissionTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#6a11cb',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    overflow: 'hidden',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e74c3c',
    marginRight: 8,
  },
  recordingTimer: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: 'white',
    fontSize: 120,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  countdownSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 22,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 4,
    backgroundColor: '#e74c3c',
  },
  cameraInfoOverlay: {
    alignItems: 'center',
    marginTop: 20,
  },
  cameraInfoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Gallery Screen Styles
  galleryContainer: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  galleryHeader: {
    width: '100%',
    overflow: 'hidden',
  },
  galleryHeaderGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  galleryTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  gallerySubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 5,
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyGalleryImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
    marginBottom: 30,
  },
  emptyGalleryText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyGallerySubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  recordNowButton: {
    backgroundColor: '#6a11cb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  recordNowButtonIcon: {
    marginRight: 10,
  },
  recordNowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  galleryList: {
    padding: 10,
    paddingTop: 5,
  },
  videoThumbnail: {
    flex: 1,
    marginHorizontal: 5,
    marginVertical: 8,
    height: 220,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbnailGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  thumbnailDuration: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    fontSize: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnailOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailFooter: {
    backgroundColor: '#222',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thumbnailText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  thumbnailDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  
  // Video Player Screen Styles
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPlayerWrapper: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  videoHeaderGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  videoPlayerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  videoPlayerBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoPlayerBackText: {
    color: 'white',
    fontSize: 18,
    marginLeft: 5,
  },
  videoPlayerDeleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
  },
  videoErrorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoErrorTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  videoErrorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  videoControlOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(106, 17, 203, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  videoControlsGradient: {
    paddingTop: 80,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
  },
  videoControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  videoProgressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  videoProgressBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  videoProgress: {
    height: '100%',
    backgroundColor: '#6a11cb',
  },
  videoControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    color: 'white',
    fontSize: 14,
  },
  videoShareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c0c0c',
    padding: 30,
  },
  backButton: {
    marginTop: 30,
    backgroundColor: '#6a11cb',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Navigation Bar Styles
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  navButton: {
    alignItems: 'center',
  },
  navButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeNavButtonCircle: {
    shadowColor: '#6a11cb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  navButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 3,
  },
  activeNavButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});