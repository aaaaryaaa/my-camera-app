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

// Sequential Video Gallery Screen Component
const GalleryScreen = ({ navigateTo, videoList }: {
  navigateTo: (screen: string) => void,
  videoList: string[]
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [status, setStatus] = useState({
    isPlaying: true,
    isLoaded: false,
    error: false,
    positionMillis: 0,
    durationMillis: 0
  });
  const videoRef = useRef<Video>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  
  // Progress animation
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  // Calculate total duration of all videos (assuming each is 4 seconds)
  const totalDuration = videoList.length * 4000; // 4 seconds per video in milliseconds
  
  const progressInterpolation = progressAnimation.interpolate({
    inputRange: [0, totalDuration],
    outputRange: [0, 100],
    extrapolate: 'clamp'
  });
  
  // Handle video completion and move to next video
  useEffect(() => {
    if (videoList.length === 0) return;
    
    const hideControlsTimeout = setTimeout(() => {
      if (status.isPlaying && controlsVisible) {
        fadeOutControls();
      }
    }, 3000);
    
    return () => clearTimeout(hideControlsTimeout);
  }, [status.isPlaying, controlsVisible]);
  
  // Automatically advance to next video when current one finishes
  useEffect(() => {
    const handleVideoFinish = async (playbackStatus: any) => {
      if (playbackStatus.isLoaded && 
          playbackStatus.didJustFinish && 
          currentVideoIndex < videoList.length - 1) {
        // Move to next video
        setCurrentVideoIndex(prevIndex => prevIndex + 1);
      }
    };
    
    if (videoRef.current) {
      videoRef.current.setOnPlaybackStatusUpdate(handleVideoFinish);
    }
  }, [currentVideoIndex, videoList]);
  
  const fadeOutControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true
    }).start(() => {
      setControlsVisible(false);
    });
  };
  
  const fadeInControls = () => {
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };
  
  const toggleControls = () => {
    if (controlsVisible) {
      fadeOutControls();
    } else {
      fadeInControls();
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
  
  const goToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prevIndex => prevIndex - 1);
    }
  };
  
  const goToNextVideo = () => {
    if (currentVideoIndex < videoList.length - 1) {
      setCurrentVideoIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // Calculate overall progress including all previous videos
  const calculateOverallProgress = () => {
    const previousVideosTime = currentVideoIndex * 4000; // 4 seconds per video
    const currentVideoTime = status.positionMillis;
    return previousVideosTime + currentVideoTime;
  };
  
  // Update progress whenever video position changes
  useEffect(() => {
    if (status.isLoaded) {
      const overallProgress = calculateOverallProgress();
      progressAnimation.setValue(overallProgress);
    }
  }, [status.positionMillis, currentVideoIndex]);
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp'
  });
  
  if (videoList.length === 0) {
    return (
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
    );
  }
  
  return (
    <View style={styles.galleryContainer}>
      <Animated.View 
        style={[
          styles.galleryHeader,
          { 
            opacity: controlsVisible ? headerOpacity : 0,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10
          }
        ]}
      >
        <LinearGradient
          colors={['#1a1a2e', 'transparent']}
          style={styles.galleryHeaderGradient}
        >
          <View style={styles.galleryTitleContainer}>
            <Text style={styles.galleryTitle}>My Story</Text>
            <Text style={styles.gallerySubtitle}>
              {videoList.length} {videoList.length === 1 ? 'moment' : 'moments'} • {Math.floor(totalDuration/1000)}s
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={() => navigateTo('CameraScreen')}
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    
      {/* Video player */}
      <TouchableOpacity 
        activeOpacity={1}
        style={styles.videoPlayerWrapper}
        onPress={toggleControls}
      >
        {videoList.length > 0 && (
          <Video
            ref={videoRef}
            style={styles.videoPlayer}
            source={{ uri: videoList[currentVideoIndex] }}
            useNativeControls={false}
            resizeMode="cover"
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
        )}
        
        {/* Loading indicator */}
        {!status.isLoaded && (
          <View style={styles.videoLoadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading your moments...</Text>
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
        
        {/* Video controls */}
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
            {/* Progress bar with segments for each video */}
            <View style={styles.videoProgressContainer}>
              <View style={styles.videoProgressBackground}>
                {/* Video segment indicators */}
                {videoList.map((_, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.videoSegmentMarker,
                      { 
                        left: `${(index / videoList.length) * 100}%`,
                        backgroundColor: index === currentVideoIndex ? '#2575fc' : 'rgba(255,255,255,0.5)'
                      }
                    ]}
                  />
                ))}
              </View>
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
              
              <View style={styles.videoNavigationControls}>
                <TouchableOpacity 
                  style={[
                    styles.videoNavButton,
                    currentVideoIndex === 0 && styles.videoNavButtonDisabled
                  ]}
                  onPress={goToPreviousVideo}
                  disabled={currentVideoIndex === 0}
                >
                  <Ionicons name="play-skip-back" size={22} color="white" />
                </TouchableOpacity>
                
                <Text style={styles.videoCounter}>
                  {currentVideoIndex + 1}/{videoList.length}
                </Text>
                
                <TouchableOpacity 
                  style={[
                    styles.videoNavButton,
                    currentVideoIndex === videoList.length - 1 && styles.videoNavButtonDisabled
                  ]}
                  onPress={goToNextVideo}
                  disabled={currentVideoIndex === videoList.length - 1}
                >
                  <Ionicons name="play-skip-forward" size={22} color="white" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.videoShareButton}
                activeOpacity={0.8}
              >
                <Feather name="share" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Center play/pause button for when video is paused */}
        {!status.isPlaying && status.isLoaded && controlsVisible && (
          <View style={styles.bigPlayButtonContainer}>
            <TouchableOpacity
              onPress={handlePlayPause}
              style={styles.bigPlayButton}
              activeOpacity={0.9}
            >
              <Ionicons name="play" size={40} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    </View>
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