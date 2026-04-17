import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Animated,
} from "react-native";
import { processMedia, type ProcessResponse } from "./src/services/api";

type Screen = "home" | "processing" | "result" | "how-to" | "pricing";

export default function App() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<ProcessResponse | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS === "web") {
      const link = document.createElement("link");
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (screen === "processing") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [screen, pulseAnim]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const handlePaste = (e: any) => {
      if (screen !== "home") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1 || items[i].type.indexOf("video") !== -1) {
          const file = items[i].getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [screen]);

  const handleFile = async (file: File) => {
    const uri = URL.createObjectURL(file);
    setSourceImage(uri);
    setScreen("processing");
    try {
      const payload = await processMedia(
        {
          uri: uri,
          type: file.type,
          name: file.name || `nostalgia-${Date.now()}`,
          file, // Web requires actual File object for reliable upload
        },
        "guest",
        "free",
        "noir"
      );
      setResult(payload);
      setScreen("result");
    } catch (error) {
      Alert.alert("Processing failed", (error as Error).message);
      setScreen("home");
    }
  };

  const handlePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow media library access.");
      return;
    }

    const media = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 1,
    });

    if (media.canceled || !media.assets[0]) return;

    const asset = media.assets[0];
    
    // For Web, fetch the blob directly from the object URL
    if (Platform.OS === 'web') {
        try {
            const res = await fetch(asset.uri);
            const blob = await res.blob();
            const file = new File([blob], asset.fileName || `nostalgia-${Date.now()}`, { type: blob.type });
            handleFile(file);
            return;
        } catch (e) {
            console.error("Failed to read image blob", e);
        }
    }

    // Native fallback
    setSourceImage(asset.uri);
    setScreen("processing");
    try {
      const payload = await processMedia(
        {
          uri: asset.uri,
          type: asset.type === "video" ? "video/mp4" : "image/jpeg",
          name: asset.fileName || `nostalgia-${Date.now()}`,
        },
        "guest",
        "free",
        "noir"
      );
      setResult(payload);
      setScreen("result");
    } catch (error) {
      Alert.alert("Processing failed", (error as Error).message);
      setScreen("home");
    }
  };

  const handleSave = async () => {
    if (!result?.outputUrl) return;

    if (Platform.OS === "web") {
      try {
        // Fetch the file as a Blob to force a true download (bypasses browser tab opening)
        const response = await fetch(result.outputUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.href = blobUrl;
        const isVideo = result.outputUrl.endsWith(".mp4");
        link.download = `Nostalgia-Edit-${Date.now()}.${isVideo ? "mp4" : "jpg"}`;
        
        // Append to body, click, and remove (required for some mobile browsers)
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup memory
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } catch (err) {
        console.error("Failed to download file:", err);
        Alert.alert("Download Error", "Could not save the file directly. Please try opening the image and saving it manually.");
        // Fallback to opening in a new tab if blob fetch fails (e.g. strict CORS)
        window.open(result.outputUrl, "_blank");
      }
      return;
    }

    Alert.alert("Notice", "Save functionality relies on native sharing in mobile builds.");
  };

  const reset = () => {
    setResult(null);
    setSourceImage(null);
    setScreen("home");
  };

  // True HTML5 Drag and Drop for Web
  const DropzoneWeb = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS !== "web") {
      return <View style={styles.cardColumnInner}>{children}</View>;
    }

    return (
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragActive(false);
          const file = e.dataTransfer?.files?.[0];
          if (file) handleFile(file);
        }}
        style={{ display: "flex", flex: 1, width: "100%", flexDirection: "column", alignItems: "center" }}
      >
        {children}
      </div>
    );
  };

  const renderContent = () => {
    if (screen === "how-to") {
      return (
        <View style={styles.pageContainer}>
          <Text style={styles.pageTitle}>How to use Nostalgia</Text>
          <View style={styles.pageCard}>
            <Text style={styles.pageText}>1. Upload, drag & drop, or paste a photo/video on the home screen.</Text>
            <Text style={styles.pageText}>2. Our AI instantly applies a cinematic grade using FFmpeg & custom LUTs (crushed highlights, S-curve contrast, matte black floor, and color split).</Text>
            <Text style={styles.pageText}>3. Click Download on the result page to get your high-quality image.</Text>
            <Pressable style={styles.uploadButton} onPress={() => setScreen("home")}>
              <Text style={styles.uploadButtonText}>Try it now</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (screen === "pricing") {
      return (
        <View style={styles.pageContainer}>
          <Text style={styles.pageTitle}>Pricing</Text>
          <View style={styles.pageCard}>
            <Text style={styles.pageText}>Nostalgia is currently in <Text style={{fontWeight:"bold"}}>Free Beta</Text>.</Text>
            <Text style={styles.pageText}>Enjoy unlimited cinematic edits for your photos and videos without any watermark or subscription.</Text>
            <Pressable style={styles.uploadButton} onPress={() => setScreen("home")}>
              <Text style={styles.uploadButtonText}>Start editing</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (screen === "result" && result) {
      return (
        <View style={styles.resultPage}>
          <Text style={styles.resultTitle}>Your Cinematic Result</Text>
          <Text style={styles.resultSubtitle}>The media has been graded successfully.</Text>
          <View style={styles.resultImageContainer}>
            <Image source={{ uri: result.outputUrl }} style={styles.resultImageLarge} resizeMode="contain" />
          </View>
          <View style={styles.resultActionsRow}>
            <Pressable style={styles.downloadButtonLarge} onPress={handleSave}>
              <Text style={styles.downloadButtonTextLarge}>Download</Text>
            </Pressable>
            <Pressable style={styles.secondaryButtonLarge} onPress={reset}>
              <Text style={styles.secondaryButtonTextLarge}>Edit Another</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    // Home / Processing Screen
    return (
      <View style={[styles.mainLayout, isMobile && styles.mainLayoutMobile]}>
        
        {/* Left Column - Hero Text */}
        <View style={[styles.textColumn, isMobile && styles.textColumnMobile]}>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Cinematic Image Grading
          </Text>
          <Text style={styles.heroSubtitle}>
                100% Automatically and <Text style={styles.badge}>Free</Text>
              </Text>
              {!isMobile && (
                <Text style={styles.description}>
                  Take your everyday photos into cinematic masterpieces. No manual sliders, just perfect grading.
                </Text>
              )}
            </View>

        {/* Right Column - Interaction Card */}
        <View style={[styles.cardColumn, isMobile && styles.cardColumnMobile]}>
          <DropzoneWeb>
            <View 
              style={[styles.uploadCard, isDragActive && styles.uploadCardActive]} 
            >
              {screen === "home" && (
                <View style={styles.cardInner}>
                  <Pressable style={styles.uploadButton} onPress={handlePick}>
                    <Text style={styles.uploadButtonText}>Upload Image</Text>
                  </Pressable>
                  <Text style={styles.dropText}>or drop a file,</Text>
                  <Text style={styles.dropSubtext}>paste image or URL</Text>
                </View>
              )}

              {screen === "processing" && (
                <View style={styles.cardInner}>
                  <Animated.View style={[styles.glowContainer, { transform: [{ scale: pulseAnim }] }]}>
                    {sourceImage ? (
                      <Image source={{ uri: sourceImage }} style={styles.processingImage} blurRadius={10} />
                    ) : (
                      <View style={styles.processingPlaceholder} />
                    )}
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="large" color="#ffffff" />
                      <Text style={styles.processingText}>Applying grade...</Text>
                    </View>
                  </Animated.View>
                </View>
              )}
            </View>

            {screen === "home" && (
              <View style={styles.footerHints}>
                <Text style={styles.hintText}>No image?</Text>
                <Text style={styles.hintTextBold}>Try one of these:</Text>
                <View style={styles.hintImages}>
                  <View style={styles.hintCircle} />
                  <View style={styles.hintCircle} />
                  <View style={styles.hintCircle} />
                </View>
              </View>
            )}
          </DropzoneWeb>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navContent}>
          <Pressable onPress={() => setScreen("home")}>
            <Text style={styles.logo}>Nostalgia</Text>
          </Pressable>
          <View style={styles.navLinks}>
            <Pressable onPress={() => setScreen("how-to")}>
              <Text style={styles.navLink}>How to use</Text>
            </Pressable>
            <Pressable onPress={() => setScreen("pricing")}>
              <Text style={styles.navLink}>Pricing</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const BRAND_BROWN = "#8a5a3b";
const BG_COLOR = "#f4f4f5";
const TEXT_DARK = "#333333";
const TEXT_LIGHT = "#666666";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  navbar: {
    backgroundColor: "#ffffff",
    height: 70,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  navContent: {
    maxWidth: 1200,
    width: "100%",
    marginHorizontal: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontFamily: Platform.OS === "web" ? '"Playfair Display", serif' : undefined,
    fontSize: 24,
    fontWeight: "800",
    color: TEXT_DARK,
    letterSpacing: -0.5,
  },
  navLinks: {
    flexDirection: "row",
    gap: 20,
    display: Platform.OS === "web" ? "flex" : "none",
  },
  navLink: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    color: TEXT_LIGHT,
    fontWeight: "500",
    fontSize: 15,
    cursor: "pointer",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  mainLayout: {
    flexDirection: "row",
    maxWidth: 1100,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 40,
  },
  mainLayoutMobile: {
    flexDirection: "column",
    justifyContent: "flex-start",
    gap: 30,
  },
  textColumn: {
    flex: 1,
    maxWidth: 500,
  },
  textColumnMobile: {
    alignItems: "center",
    textAlign: "center",
  },
  heroTitle: {
    fontFamily: Platform.OS === "web" ? '"Playfair Display", serif' : undefined,
    fontSize: 56,
    fontWeight: "900",
    color: TEXT_DARK,
    lineHeight: 64,
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroTitleMobile: {
    fontSize: 42,
    lineHeight: 48,
    textAlign: "center",
  },
  heroSubtitle: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    fontSize: 24,
    fontWeight: "700",
    color: TEXT_DARK,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    backgroundColor: BRAND_BROWN,
    color: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 20,
    overflow: "hidden",
  },
  description: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    fontSize: 18,
    color: TEXT_LIGHT,
    lineHeight: 28,
  },
  cardColumn: {
    flex: 1,
    width: "100%",
    maxWidth: 550,
  },
  cardColumnInner: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  cardColumnMobile: {
    maxWidth: "100%",
  },
  uploadCard: {
    backgroundColor: "#ffffff",
    width: "100%",
    borderRadius: 24,
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  uploadCardActive: {
    borderColor: BRAND_BROWN,
    backgroundColor: "#faf5f2",
  },
  cardInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  uploadButton: {
    backgroundColor: BRAND_BROWN,
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 20,
  },
  uploadButtonText: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  dropText: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    fontSize: 18,
    color: TEXT_DARK,
    fontWeight: "600",
    marginBottom: 4,
  },
  dropSubtext: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    fontSize: 14,
    color: TEXT_LIGHT,
  },
  footerHints: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hintText: {
    color: TEXT_LIGHT,
    fontSize: 14,
  },
  hintTextBold: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: "600",
  },
  hintImages: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 8,
  },
  hintCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
  },
  glowContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e5e5",
  },
  processingImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  processingPlaceholder: {
    width: "100%",
    height: "100%",
    position: "absolute",
    backgroundColor: BRAND_BROWN,
    opacity: 0.2,
  },
  processingOverlay: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    width: "100%",
    height: "100%",
  },
  processingText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  resultPage: {
    width: "100%",
    maxWidth: 900,
    alignItems: "center",
    paddingTop: 20,
  },
  resultTitle: {
    fontFamily: Platform.OS === "web" ? '"Playfair Display", serif' : undefined,
    fontSize: 36,
    fontWeight: "800",
    color: TEXT_DARK,
    marginBottom: 8,
    textAlign: "center",
  },
  resultSubtitle: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    fontSize: 18,
    color: TEXT_LIGHT,
    marginBottom: 30,
    textAlign: "center",
  },
  resultImageContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 8,
    marginBottom: 30,
  },
  resultImageLarge: {
    width: "100%",
    height: 450,
    borderRadius: 12,
  },
  resultActionsRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    maxWidth: 500,
    justifyContent: "center",
  },
  downloadButtonLarge: {
    flex: 2,
    backgroundColor: BRAND_BROWN,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  downloadButtonTextLarge: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryButtonLarge: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  secondaryButtonTextLarge: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: "600",
  },
  pageContainer: {
    width: "100%",
    maxWidth: 600,
    alignItems: "center",
    paddingTop: 40,
  },
  pageTitle: {
    fontFamily: Platform.OS === "web" ? '"Playfair Display", serif' : undefined,
    fontSize: 32,
    fontWeight: "800",
    color: TEXT_DARK,
    marginBottom: 30,
  },
  pageCard: {
    backgroundColor: "#ffffff",
    padding: 40,
    borderRadius: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 8,
  },
  pageText: {
    fontFamily: Platform.OS === "web" ? '"Plus Jakarta Sans", sans-serif' : undefined,
    fontSize: 18,
    color: TEXT_LIGHT,
    lineHeight: 28,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: "#111",
    color: "#4ade80",
    padding: 16,
    borderRadius: 8,
    fontFamily: Platform.OS === "web" ? "monospace" : "System",
    fontSize: 14,
    marginBottom: 24,
  }
});
