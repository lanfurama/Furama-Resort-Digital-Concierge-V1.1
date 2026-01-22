import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Car,
  Settings,
  RefreshCw,
  Zap,
  Users,
  List,
  Grid3x3,
  CheckCircle,
  MapPin,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Map as MapIcon,
  Star,
  Loader2,
  Brain,
  ArrowRight,
  Clock,
  UtensilsCrossed,
  Building2,
  Utensils,
  Waves,
  Search,
  Bell,
  Mic,
  Navigation,
  ZoomIn,
  ZoomOut,
  BarChart3,
  Download,
  TrendingUp,
  Award,
  Plus,
} from "lucide-react";
import {
  getRides,
  getRidesSync,
  getUsers,
  getUsersSync,
  updateRideStatus,
  getLocations,
  getServiceRequests,
  updateServiceStatus,
  requestRide,
  updateRide,
  cancelRide,
  setDriverOnlineFor10Hours,
  markDriverOffline,
  checkDriverAvailability,
  getHistoricalRideReports,
  getReportStatistics,
  exportRidesToCSV,
  ReportStatistics,
  getDriverPerformanceStats,
  DriverPerformanceStats,
} from "../services/dataService";
import { authenticateStaff } from "../services/authService";
import {
  parseAdminInput,
  parseRideRequestWithContext,
  extractRoomNumber,
} from "../services/geminiService";
import { useVoiceRecording } from "../hooks/useVoiceRecording";
import { useAdaptivePolling } from "../hooks/useAdaptivePolling";
import {
  processTranscript,
  ParsedVoiceData,
} from "../services/voiceParsingService";
import { useConversationState } from "../hooks/useConversationState";
import {
  User,
  UserRole,
  RideRequest,
  BuggyStatus,
  Location,
  ServiceRequest,
  RouteSegment,
} from "../types";
import { apiClient } from "../services/apiClient";
import BuggyNotificationBell from "./BuggyNotificationBell";
import { useTranslation } from "../contexts/LanguageContext";
import { RESORT_CENTER } from "../constants";
import VoiceInputOverlay from "./VoiceInputOverlay";

// Import extracted utilities
import {
  resolveLocationCoordinates as resolveLocationCoordinatesUtil,
  calculateDistance as calculateDistanceUtil,
  getMapPosition as getMapPositionUtil,
} from "./ReceptionPortal/utils/locationUtils";
import {
  getPendingRequestsCount as getPendingRequestsCountUtil,
  getActiveRidesCount as getActiveRidesCountUtil,
  getCompletedRidesTodayCount as getCompletedRidesTodayCountUtil,
  getTotalDriversCount as getTotalDriversCountUtil,
  getOnlineDriversCount as getOnlineDriversCountUtil,
  getOfflineDriversCount as getOfflineDriversCountUtil,
  getPendingServiceRequestsCount as getPendingServiceRequestsCountUtil,
  getConfirmedServiceRequestsCount as getConfirmedServiceRequestsCountUtil,
  getDepartmentForServiceType as getDepartmentForServiceTypeUtil,
} from "./ReceptionPortal/utils/rideHelpers";
import ConversationalVoiceAssistantModal from "./ReceptionPortal/modals/VoiceAssistantModal";
import {
  getDriverLocation as getDriverLocationUtil,
  resolveDriverCoordinates as resolveDriverCoordinatesUtil,
} from "./ReceptionPortal/utils/driverUtils";
import {
  canCombineRides as canCombineRidesUtil,
  calculateOptimalMergeRoute as calculateOptimalMergeRouteUtil,
} from "./ReceptionPortal/utils/mergeRideUtils";

interface ReceptionPortalProps {
  onLogout: () => void;
  user: User;
  embedded?: boolean; // If true, hide header and use embedded styling
}

const ReceptionPortal: React.FC<ReceptionPortalProps> = ({
  onLogout,
  user,
  embedded = false,
}) => {
  const { t } = useTranslation();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  // View Mode: Switch between Buggy, Reports, and Performance
  const [viewMode, setViewMode] = useState<"BUGGY" | "REPORTS" | "PERFORMANCE">("BUGGY");

  // Fleet Config State
  const [showFleetSettings, setShowFleetSettings] = useState(false);
  const [fleetConfig, setFleetConfig] = useState({
    maxWaitTimeBeforeAutoAssign: 300, // seconds
    autoAssignEnabled: true, // Default ON - auto AI assignment
  });

  // Driver View Mode State
  const [driverViewMode, setDriverViewMode] = useState<"LIST" | "MAP">("LIST");

  // Map State for Driver Fleet
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [mapError, setMapError] = useState(!((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' && process.env?.API_KEY)));
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);

  // Handle toggling listening with overlay
  const handleVoiceAssistantStart = () => {
    setShowCreateRideModal(true);
    setShowVoiceOverlay(true);
    if (!isListening) {
      handleToggleListening();
    }
  };

  const handleVoiceAssistantClose = () => {
    setShowVoiceOverlay(false);
    if (isListening) {
      stopRecording();
    }
  };

  const [driverFilter, setDriverFilter] = useState<'ALL' | 'AVAILABLE' | 'BUSY'>('ALL');

  // TTS Voice State
  const [vietnameseVoice, setVietnameseVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn("Speech Synthesis API not supported in this browser");
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log("[TTS] Available voices:", voices.map(v => `${v.name} (${v.lang})`));

      // Priority order for Vietnamese voices:
      // 1. Google Vietnamese (vi-VN) - Best quality, natural
      // 2. Microsoft An (vi-VN) - Good quality
      // 3. Any other Vietnamese voice
      const googleVi = voices.find(v =>
        v.lang === 'vi-VN' && v.name.toLowerCase().includes('google')
      );
      const microsoftAn = voices.find(v =>
        v.lang === 'vi-VN' && (v.name.toLowerCase().includes('an') || v.name.toLowerCase().includes('microsoft'))
      );
      const anyViVoice = voices.find(v => v.lang.startsWith('vi'));

      const selectedVoice = googleVi || microsoftAn || anyViVoice || null;

      if (selectedVoice) {
        console.log("[TTS] ✅ Selected voice:", selectedVoice.name, `(${selectedVoice.lang})`);
        setVietnameseVoice(selectedVoice);
      } else {
        console.warn("[TTS] ⚠️ No Vietnamese voice found!");
      }
    };

    loadVoices();
    // Chrome requires this event listener
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // AI Assignment Modal State
  const [showAIAssignment, setShowAIAssignment] = useState(false);
  const [aiAssignmentData, setAIAssignmentData] = useState<{
    status: "analyzing" | "matching" | "completed" | "error";
    pendingRides: RideRequest[];
    onlineDrivers: User[];
    assignments: Array<{
      driver: User;
      ride: RideRequest;
      cost: number;
      isChainTrip?: boolean;
      pickupLat?: number;
      pickupLng?: number;
      destinationLat?: number;
      destinationLng?: number;
    }>;
    errorMessage?: string;
  } | null>(null);

  // AI Assignment Progress State for inline indicator
  const [aiAssignmentProgress, setAIAssignmentProgress] = useState<{
    isProcessing: boolean;
    processedCount: number;
    totalCount: number;
    currentRideId: string | null;
    results: Array<{ rideId: string; driverName: string; success: boolean }>;
  }>({
    isProcessing: false,
    processedCount: 0,
    totalCount: 0,
    currentRideId: null,
    results: [],
  });

  // Service AI Assignment Modal State
  const [showServiceAIAssignment, setShowServiceAIAssignment] = useState(false);
  const [serviceAIAssignmentData, setServiceAIAssignmentData] = useState<{
    status: "analyzing" | "matching" | "completed" | "error";
    pendingServices: ServiceRequest[];
    onlineStaff: User[];
    assignments: Array<{ staff: User; service: ServiceRequest; cost: number }>;
    errorMessage?: string;
  } | null>(null);

  // Track last auto-assign time to prevent too frequent calls
  const lastAutoAssignRef = useRef<number>(0);
  const handleAutoAssignRef = useRef<
    ((isAutoTriggered: boolean) => Promise<void>) | null
  >(null);

  // Refs for latest values to avoid stale closures in interval
  const ridesRef = useRef<RideRequest[]>([]);
  const fleetConfigRef = useRef(fleetConfig);

  // Current time state for countdown
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Auto-assign countdown state (updates every second)
  const [autoAssignCountdown, setAutoAssignCountdown] = useState<number | null>(null);

  // Cache for guest information by room number
  const [guestInfoCache, setGuestInfoCache] = useState<
    Record<string, { last_name: string; villa_type?: string | null }>
  >({});

  // Reports State
  const [reportRides, setReportRides] = useState<RideRequest[]>([]);
  const [reportStats, setReportStats] = useState<ReportStatistics | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('day');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportDriverId, setReportDriverId] = useState<string>('');
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Driver Performance Analytics State
  const [driverPerformanceStats, setDriverPerformanceStats] = useState<DriverPerformanceStats[]>([]);
  const [performancePeriod, setPerformancePeriod] = useState<'day' | 'week' | 'month'>('week');
  const [performanceDriverId, setPerformanceDriverId] = useState<string>('');
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

  // Pagination States for performance optimization
  const [pendingRidesLimit, setPendingRidesLimit] = useState(10);
  const [driverListLimit, setDriverListLimit] = useState(15);

  // Create New Ride Modal State
  const [showCreateRideModal, setShowCreateRideModal] = useState(false);
  const [newRideData, setNewRideData] = useState({
    roomNumber: "",
    pickup: "",
    destination: "",
    guestName: "",
    guestCount: 1,
    notes: "",
  });
  const [pickupSearchQuery, setPickupSearchQuery] = useState("");
  const [destinationSearchQuery, setDestinationSearchQuery] = useState("");
  const [locationFilterType, setLocationFilterType] = useState<
    "ALL" | "RESTAURANT" | "FACILITY"
  >("ALL");
  const [locationModal, setLocationModal] = useState<{
    isOpen: boolean;
    type: "pickup" | "destination" | null;
  }>({ isOpen: false, type: null });
  const [isCreatingRide, setIsCreatingRide] = useState(false);

  // Voice Input State - using custom hook
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<{
    status: "success" | "error" | null;
    message: string;
  }>({ status: null, message: "" });

  // Conversational Voice State
  const conversation = useConversationState({
    locations,
    onComplete: (data: ParsedVoiceData) => {
      console.log("[ReceptionPortal] Conversation completed with data:", data);
      // Auto-fill form with parsed data
      setNewRideData((prev) => ({
        ...prev,
        roomNumber: data.roomNumber || prev.roomNumber,
        pickup: data.pickup || prev.pickup,
        destination: data.destination || prev.destination,
        guestCount: data.guestCount || prev.guestCount || 1,
        notes: data.notes || prev.notes,
      }));

      // Close voice overlay
      setShowVoiceOverlay(false);

      // Show success message
      setVoiceResult({
        status: "success",
        message: "✅ Đã nhận diện thành công! Đang tạo chuyến...",
      });
      speakFeedback("Đã nhận diện thành công. Đang tạo chuyến.");

      // Auto-create ride after 1 second
      setTimeout(() => {
        handleCreateRide();
      }, 1000);
    },
    onCancel: () => {
      console.log("[ReceptionPortal] Conversation cancelled");
      setShowVoiceOverlay(false);
      setVoiceResult({ status: null, message: "" });
    },
    onError: (message: string) => {
      console.error("[ReceptionPortal] Conversation error:", message);
      setVoiceResult({
        status: "error",
        message,
      });
      speakFeedback(message);
    },
  });

  // Use voice recording hook
  const {
    isListening,
    transcript,
    audioLevel,
    silenceCountdown,
    silenceRemainingTime,
    handleToggleListening,
    stopRecording,
  } = useVoiceRecording({
    language: "vi-VN",
    onTranscriptReady: async (finalTranscript: string) => {
      // NEW: Pass to conversation handler instead of old processTranscript
      console.log("[ReceptionPortal] Voice transcript ready:", finalTranscript);
      await conversation.processUserResponse(finalTranscript);
    },
    silenceTimeout: 3000, // 3 seconds for conversational flow
    t, // Pass translation function for multilingual error messages
  });

  // Voice Auto-Confirm State (in form, not separate modal)
  const [isAutoConfirming, setIsAutoConfirming] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Merge Options Modal State
  const [showMergeModal, setShowMergeModal] = useState(false);

  // Manual Assign Modal State
  const [showManualAssignModal, setShowManualAssignModal] = useState(false);
  const [selectedRideForAssign, setSelectedRideForAssign] =
    useState<RideRequest | null>(null);

  // Detail Request Modal State
  const [showDetailRequestModal, setShowDetailRequestModal] = useState(false);
  const [selectedRideForDetail, setSelectedRideForDetail] =
    useState<RideRequest | null>(null);



  // Handle admin authentication and toggle driver status
  // Handle toggling driver status (Online <-> Offline) without auth
  const handleToggleDriverStatus = async (driver: User) => {
    if (!driver || !driver.id) return;

    // Check current status (using last heartbeat < 30s as online criteria)
    // We parse updatedAt to ensure correct date comparison
    const updatedAt = driver.updatedAt ? new Date(driver.updatedAt).getTime() : 0;
    const isOnline = updatedAt > 0 && (Date.now() - updatedAt < 30000);

    try {
      if (isOnline) {
        // Set Offline
        await markDriverOffline(driver.id);
      } else {
        // Set Online (10 hours)
        await setDriverOnlineFor10Hours(driver.id);
      }

      // Refresh users list
      const refreshedUsers = await getUsers().catch(() => getUsersSync());
      setUsers(refreshedUsers);
    } catch (error: any) {
      console.error("Error toggling driver status:", error);
      alert(error.message || "Failed to update driver status");
    }
  };

  // Cleanup countdown timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Load reports when REPORTS viewMode is active
  useEffect(() => {
    if (viewMode !== 'REPORTS') return;

    const loadReports = async () => {
      setIsLoadingReports(true);
      try {
        const params: any = {};

        if (reportPeriod === 'custom') {
          if (reportStartDate) params.startDate = reportStartDate;
          if (reportEndDate) params.endDate = reportEndDate;
        } else {
          params.period = reportPeriod;
        }

        if (reportDriverId) {
          params.driverId = reportDriverId;
        }

        const [ridesData, statsData] = await Promise.all([
          getHistoricalRideReports(params),
          getReportStatistics(params)
        ]);

        setReportRides(ridesData);
        setReportStats(statsData);
      } catch (error) {
        console.error('Failed to load reports:', error);
      } finally {
        setIsLoadingReports(false);
      }
    };

    loadReports();
  }, [viewMode, reportPeriod, reportStartDate, reportEndDate, reportDriverId]);

  // Load driver performance stats when PERFORMANCE viewMode is active
  useEffect(() => {
    if (viewMode !== 'PERFORMANCE') return;

    const loadPerformanceStats = async () => {
      setIsLoadingPerformance(true);
      try {
        const params: any = {
          period: performancePeriod,
        };

        if (performanceDriverId) {
          params.driverId = performanceDriverId;
        }

        const stats = await getDriverPerformanceStats(params);
        setDriverPerformanceStats(stats);
      } catch (error) {
        console.error('Failed to load driver performance stats:', error);
      } finally {
        setIsLoadingPerformance(false);
      }
    };

    loadPerformanceStats();
  }, [viewMode, performancePeriod, performanceDriverId]);

  // Cleanup countdown timer when auto-confirm stops
  useEffect(() => {
    if (!isAutoConfirming && countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, [isAutoConfirming]);

  // Manual ride merging functions
  const canCombineRides = (ride1: RideRequest, ride2: RideRequest): boolean => {
    return canCombineRidesUtil(ride1, ride2);
  };

  // TTS Helper: Uses Google Translate (unofficial) for natural voice
  const speakFeedback = (text: string) => {
    const cleanText = text.replace(/[⚠️✅]/g, '').trim();
    if (!cleanText) return;

    const browserSpeak = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        if (vietnameseVoice) {
          utterance.voice = vietnameseVoice;
          console.log(`[TTS] Speaking with: ${vietnameseVoice.name}`);
        } else {
          console.warn("[TTS] No Vietnamese voice set, using default");
        }

        window.speechSynthesis.speak(utterance);
      }
    };

    // Try Google Translate TTS (Free, natural voice)
    try {
      if (cleanText.length < 200) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=vi&q=${encodeURIComponent(cleanText)}`;
        const audio = new Audio(url);
        audio.play().catch((err) => {
          console.warn("Google TTS failed, falling back", err);
          browserSpeak();
        });
      } else {
        browserSpeak();
      }
    } catch (e) {
      browserSpeak();
    }
  };

  // Handle processing transcript using voice parsing service
  const handleProcessTranscript = async (text: string) => {
    console.log(`[ReceptionPortal] Processing transcript: "${text}" with ${locations.length} locations`);
    setIsProcessing(true);
    setVoiceResult({ status: null, message: "" });

    await processTranscript(
      text,
      locations,
      {
        onSuccess: (data: ParsedVoiceData) => {
          // Update form data (Now pre-validated by service)
          setNewRideData((prev) => ({
            ...prev,
            roomNumber: data.roomNumber || (prev.roomNumber && prev.roomNumber.trim() ? prev.roomNumber : ""),
            pickup: data.pickup || prev.pickup,
            destination: data.destination || prev.destination,
            guestCount: data.guestCount || prev.guestCount || 1,
            notes: data.notes || prev.notes,
          }));

          // Show success message and start auto-confirm countdown
          const successMsg = "✅ Đã nhận diện thành công! Tự động tạo chuyến sau 5 giây...";
          setVoiceResult({
            status: "success",
            message: successMsg,
          });
          speakFeedback("Đã nhận diện thành công. Đang tự động tạo chuyến.");

          setIsAutoConfirming(true);
          setCountdown(5);

          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }

          countdownTimerRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (countdownTimerRef.current) {
                  clearInterval(countdownTimerRef.current);
                  countdownTimerRef.current = null;
                }
                setIsAutoConfirming(false);
                setTimeout(() => {
                  handleCreateRide();
                }, 100);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        },
        onError: (message: string) => {
          setVoiceResult({
            status: "error",
            message,
          });
          speakFeedback(message);
        },
        onPartialSuccess: (data: ParsedVoiceData, foundFields: string[], missingFields: string[]) => {
          // Update form data with partial results
          setNewRideData((prev) => ({
            ...prev,
            roomNumber: data.roomNumber || (prev.roomNumber && prev.roomNumber.trim() ? prev.roomNumber : ""),
            pickup: data.pickup || prev.pickup,
            destination: data.destination || prev.destination,
            guestCount: data.guestCount || prev.guestCount || 1,
            notes: data.notes || prev.notes,
          }));

          const missingMsg = missingFields.length > 0 ? `Thiếu: ${missingFields.join(", ")}` : "";
          const errorMsg = `⚠️ Chưa đủ thông tin. ${missingMsg ? `(${missingMsg})` : ""} Vui lòng nói rõ hơn.`;

          setVoiceResult({
            status: "error",
            message: errorMsg,
          });
          speakFeedback(errorMsg);
        },
      },
      newRideData
    );

    setIsProcessing(false);
  };
  const calculateOptimalMergeRoute = (
    ride1: RideRequest,
    ride2: RideRequest,
  ): {
    pickup: string;
    destination: string;
    routePath: string[];
    segments: RouteSegment[];
    isChainTrip: boolean;
  } => {
    return calculateOptimalMergeRouteUtil(
      ride1,
      ride2,
      resolveLocationCoordinates,
      calculateDistance
    );
  };

  const handleMergeRides = async (ride1Id: string, ride2Id: string) => {
    try {
      const ride1 = rides.find((r) => r.id === ride1Id);
      const ride2 = rides.find((r) => r.id === ride2Id);

      if (!ride1 || !ride2) {
        alert("Không tìm thấy chuyến xe để ghép");
        return;
      }

      if (!canCombineRides(ride1, ride2)) {
        alert("Không thể ghép 2 chuyến này - vượt quá sức chứa 7 khách");
        return;
      }

      // Calculate optimal route for merged ride
      const optimalRoute = calculateOptimalMergeRoute(ride1, ride2);

      // Confirm with user
      const totalGuests = (ride1.guestCount || 1) + (ride2.guestCount || 1);
      const routePathDisplay = optimalRoute.routePath.join(" → ");
      const routeInfo = optimalRoute.isChainTrip
        ? `\n🔗 Chain Trip (Tối ưu): ${routePathDisplay}`
        : `\n📍 Merged Route: ${routePathDisplay}`;

      // Build detailed route segments info
      const segmentsInfo = optimalRoute.segments
        .map((segment, idx) => {
          const onBoardInfo = segment.onBoard
            .map((g) => `Room #${g.roomNumber} (${g.name}, ${g.count} pax)`)
            .join(", ");
          return `\n${idx + 1}. ${segment.from} → ${segment.to}\n   On Board: ${onBoardInfo || "Empty"}`;
        })
        .join("");

      const message =
        `🚐 Ghép chuyến?\n\n` +
        `📋 Original Requests:\n` +
        `- Room #${ride1.roomNumber} (${ride1.guestCount || 1} khách): ${ride1.pickup} → ${ride1.destination}\n` +
        `- Room #${ride2.roomNumber} (${ride2.guestCount || 1} khách): ${ride2.pickup} → ${ride2.destination}` +
        routeInfo +
        `\n\n📍 Route Details (Step by Step):` +
        segmentsInfo +
        `\n\n💺 Tổng: ${totalGuests}/7 khách\n\n` +
        `📝 Lưu ý hành lý:\n` +
        `- ${ride1.roomNumber}: ${ride1.notes || "Không có ghi chú"}\n` +
        `- ${ride2.roomNumber}: ${ride2.notes || "Không có ghi chú"}\n\n` +
        `⚠️ Hãy kiểm tra hành lý trước khi ghép chuyến!`;

      if (!confirm(message)) return;

      // Create merged ride with combined information
      const mergedNotes =
        [ride1.notes, ride2.notes].filter((n) => n?.trim()).join(" | ") || "";
      const mergedGuestNames =
        [ride1.guestName, ride2.guestName]
          .filter((n) => n?.trim())
          .join(" + ") || "Multiple Guests";

      // Use the ride with earlier timestamp as base, combine room numbers
      const baseRide = ride1.timestamp <= ride2.timestamp ? ride1 : ride2;
      const otherRide = ride1.timestamp <= ride2.timestamp ? ride2 : ride1;

      const mergedRide = {
        ...baseRide,
        roomNumber: `${ride1.roomNumber}+${ride2.roomNumber}`,
        guestName: mergedGuestNames,
        guestCount: totalGuests,
        notes: mergedNotes,
        pickup: optimalRoute.pickup,
        destination: optimalRoute.destination,
        timestamp: Math.min(ride1.timestamp, ride2.timestamp), // Use earliest timestamp
        isMerged: true,
        segments: optimalRoute.segments,
      };

      // Update the base ride and delete the other
      await updateRide(mergedRide);
      await cancelRide(otherRide.id!);

      // Refresh rides list
      const updatedRides = await getRides();
      setRides(updatedRides);

      alert(
        `✅ Đã ghép chuyến thành công!\n\nRoom: ${mergedRide.roomNumber}\nTổng khách: ${totalGuests}`,
      );
    } catch (error) {
      console.error("Failed to merge rides:", error);
      alert("❌ Lỗi khi ghép chuyến. Vui lòng thử lại.");
    }
  };

  // Sound notification state
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem("reception_sound_enabled");
        return saved !== null ? saved === "true" : true; // Default to enabled
      }
    } catch (e) {
      console.warn("Failed to access localStorage for sound settings:", e);
    }
    return true;
  });

  // Screen Wake Lock (Keep Screen On)
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('[Reception] Wake Lock is active');

          document.addEventListener('visibilitychange', handleVisibilityChange);
        }
      } catch (err) {
        console.error('[Reception] Wake Lock request failed:', err);
      }
    };

    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [ridesData, usersData, locationsData, servicesData] =
          await Promise.all([
            getRides().catch(() => getRidesSync()),
            getUsers().catch(() => getUsersSync()),
            getLocations().catch(() => []),
            getServiceRequests().catch(() => []),
          ]);
        setRides(ridesData);
        setUsers(usersData);
        setLocations(locationsData);
        setServiceRequests(servicesData);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();

    // Load fleet config from localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedConfig = localStorage.getItem("fleetConfig");
        if (savedConfig) {
          try {
            setFleetConfig(JSON.parse(savedConfig));
          } catch (error) {
            console.error("Failed to load fleet config:", error);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to access localStorage for fleet config:", e);
    }
  }, []);

  // Update current time every second for countdown
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second

    return () => clearInterval(timeInterval);
  }, []);

  // Update auto-assign countdown every second
  useEffect(() => {
    const updateCountdown = () => {
      const pendingRides = rides.filter(
        (r) => r.status === BuggyStatus.SEARCHING,
      );
      const hasPendingRides = pendingRides.length > 0;
      const hasOnlineDrivers = getOnlineDriversCount() > 0;

      if (
        fleetConfig.autoAssignEnabled &&
        hasPendingRides &&
        hasOnlineDrivers
      ) {
        // Find the oldest pending ride
        const oldestRide = pendingRides.reduce(
          (oldest, ride) => {
            return ride.timestamp < oldest.timestamp ? ride : oldest;
          },
          pendingRides[0],
        );

        const waitTimeSeconds = Math.floor(
          (Date.now() - oldestRide.timestamp) / 1000,
        );
        const remainingSeconds =
          fleetConfig.maxWaitTimeBeforeAutoAssign - waitTimeSeconds;

        if (remainingSeconds > 0) {
          setAutoAssignCountdown(remainingSeconds);
        } else {
          setAutoAssignCountdown(0); // Auto assign will trigger soon
        }
      } else {
        setAutoAssignCountdown(null);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const countdownInterval = setInterval(updateCountdown, 1000);

    return () => clearInterval(countdownInterval);
  }, [
    rides,
    users, // getOnlineDriversCount depends on users
    fleetConfig.autoAssignEnabled,
    fleetConfig.maxWaitTimeBeforeAutoAssign,
    currentTime, // Include currentTime to trigger recalculation when time updates
  ]);

  // Auto-refresh rides, users, and service requests
  const refreshData = useCallback(async () => {
    try {
      const [refreshedRides, refreshedUsers, refreshedServices] =
        await Promise.all([
          getRides().catch(() => getRidesSync()),
          getUsers().catch(() => getUsersSync()),
          getServiceRequests().catch(() => []),
        ]);

      setRides(refreshedRides);
      setUsers(refreshedUsers);
      setServiceRequests(refreshedServices);
    } catch (error) {
      console.error("Failed to auto-refresh data:", error);
    }
  }, []);

  useAdaptivePolling(refreshData, {
    activeInterval: 3000,
    idleInterval: 10000,
    backgroundInterval: 60000,
    enabled: true
  });

  // Load guest information for active rides
  useEffect(() => {
    const loadGuestInfo = async () => {
      // Get unique room numbers from active rides (ASSIGNED, ARRIVING, ON_TRIP)
      const activeRides = rides.filter(
        (r) =>
          r.status === BuggyStatus.ASSIGNED ||
          r.status === BuggyStatus.ARRIVING ||
          r.status === BuggyStatus.ON_TRIP,
      );

      const roomNumbers = [...new Set(activeRides.map((r) => r.roomNumber))];

      // Filter out merged ride room numbers (contain '+') and only keep valid room numbers
      const validRoomNumbers = roomNumbers.filter((roomNum) => {
        const roomNumStr = String(roomNum);
        // Skip if room number contains '+' (merged rides)
        if (roomNumStr.includes('+')) return false;
        // Skip if room number is not a valid number
        if (isNaN(Number(roomNumStr))) return false;
        return true;
      });

      // Load guest info for rooms that we don't have in cache
      const roomsToLoad = validRoomNumbers.filter(
        (roomNum) => !guestInfoCache[roomNum],
      );

      if (roomsToLoad.length === 0) return;

      // Load guest info for each room
      const loadPromises = roomsToLoad.map(async (roomNumber) => {
        try {
          const guestData = await apiClient.get<any>(
            `/users/room/${roomNumber}`,
          );
          if (guestData && guestData.role === "GUEST") {
            return {
              roomNumber,
              guestInfo: {
                last_name: guestData.last_name,
                villa_type: guestData.villa_type,
              },
            };
          }
        } catch (error: any) {
          // Silently skip 404 errors (room has no guest) - this is expected
          if (error?.message !== 'User not found') {
            console.error(
              `Failed to load guest info for room ${roomNumber}:`,
              error,
            );
          }
        }
        return null;
      });

      const results = await Promise.all(loadPromises);
      const newGuestInfo: Record<
        string,
        { last_name: string; villa_type?: string | null }
      > = {};

      results.forEach((result) => {
        if (result && result.roomNumber) {
          newGuestInfo[String(result.roomNumber)] = result.guestInfo;
        }
      });

      if (Object.keys(newGuestInfo).length > 0) {
        setGuestInfoCache((prev) => ({ ...prev, ...newGuestInfo }));
      }
    };

    loadGuestInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rides]);

  // --- GOOGLE MAPS INTEGRATION FOR DRIVER FLEET ---
  useEffect(() => {
    if (driverViewMode === "MAP" && !mapInstance && !mapError) {
      // Define global error handler for Auth Failure (Invalid Key)
      (window as any).gm_authFailure = () => {
        console.error("Google Maps Authentication Error (gm_authFailure). Falling back to static map.");
        setMapError(true);
        setMapInstance(null); // Clear invalid instance
      };

      // Check if script already exists
      if ((window as any).google && (window as any).google.maps) {
        initMap();
        return;
      }

      // Load Google Maps Script
      if (!document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) {
        const script = document.createElement("script");
        const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || "";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&callback=initGoogleMapReception&v=weekly`;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
          console.error("Failed to load Google Maps script (Network Error).");
          setMapError(true);
        };

        (window as any).initGoogleMapReception = () => {
          initMap();
        };

        document.head.appendChild(script);
      }
    }
  }, [driverViewMode, mapError]);

  const initMap = () => {
    if (!mapRef.current || !(window as any).google || mapError) return;

    try {
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: RESORT_CENTER.lat, lng: RESORT_CENTER.lng },
        zoom: 17,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
      setMapInstance(map);
    } catch (e) {
      console.error("Error initializing map constructor", e);
      setMapError(true);
    }
  };

  // Update Markers on Map
  useEffect(() => {
    if (mapInstance && driverViewMode === "MAP" && (window as any).google && !mapError) {
      markers.forEach((m) => m.setMap(null));
      const newMarkers: any[] = [];

      // Get driver users and determine their status
      const driverUsers = users.filter((u) => u.role === UserRole.DRIVER);
      const activeRides = rides.filter(
        (r) =>
          r.status === BuggyStatus.ASSIGNED ||
          r.status === BuggyStatus.ARRIVING ||
          r.status === BuggyStatus.ON_TRIP,
      );
      const completedRides = rides.filter((r) => r.status === BuggyStatus.COMPLETED);

      // Filter drivers based on filter state and online status
      const filteredDrivers = driverUsers.filter((driver) => {
        const driverIdStr = driver.id ? String(driver.id) : "";
        const hasActiveRide = activeRides.some((r) => {
          const rideDriverId = r.driverId ? String(r.driverId) : "";
          return rideDriverId === driverIdStr;
        });

        // Check if driver is online (updated within last 30 seconds)
        const isOnline = driver.updatedAt && Date.now() - driver.updatedAt < 30000;
        if (!isOnline && !hasActiveRide) return false; // Don't show offline drivers

        // Apply filter
        if (driverFilter === "ALL") return true;
        if (driverFilter === "AVAILABLE" && !hasActiveRide) return true;
        if (driverFilter === "BUSY" && hasActiveRide) return true;
        return false;
      });

      filteredDrivers.forEach((driver) => {
        const coords = resolveDriverCoordinates(driver);
        const driverIdStr = driver.id ? String(driver.id) : "";
        const activeRide = activeRides.find((r) => {
          const rideDriverId = r.driverId ? String(r.driverId) : "";
          return rideDriverId === driverIdStr;
        });

        let infoContent = "";
        if (activeRide) {
          infoContent = `
            <div style="color: #1f2937; padding: 4px; max-width: 200px;">
              <strong style="font-size: 14px; color: #d97706;">${driver.lastName || "Unknown"} (Busy)</strong>
              <hr style="margin: 4px 0; border: 0; border-top: 1px solid #eee;"/>
              <div style="font-size: 12px;">
                <strong>Trip:</strong> Room ${activeRide.roomNumber}<br/>
                <span style="color: #6b7280;">${activeRide.pickup} &rarr; ${activeRide.destination}</span>
              </div>
            </div>
          `;
        } else {
          const lastRide = completedRides
            .filter((r) => {
              const rideDriverId = r.driverId ? String(r.driverId) : "";
              return rideDriverId === driverIdStr;
            })
            .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))[0];

          let timeSinceStr = "No recent trips";
          if (lastRide && lastRide.completedAt) {
            const diffMins = Math.floor((Date.now() - lastRide.completedAt) / 60000);
            timeSinceStr = diffMins === 0 ? "Just now" : `${diffMins} mins ago`;
          }

          const locationName = getDriverLocation(driver);
          let gpsInfo = "";
          if (driver.currentLat !== undefined && driver.currentLng !== undefined) {
            gpsInfo = `<br/><strong>GPS:</strong> ${driver.currentLat.toFixed(6)}, ${driver.currentLng.toFixed(6)}`;
            if (driver.locationUpdatedAt) {
              const locationAge = Math.floor((Date.now() - driver.locationUpdatedAt) / 60000);
              gpsInfo += ` <span style="color: ${locationAge > 5 ? "#ef4444" : "#10b981"}; font-size: 10px;">(${locationAge}m ago)</span>`;
            }
          }

          infoContent = `
            <div style="color: #1f2937; padding: 6px; max-width: 220px;">
              <strong style="font-size: 14px; color: #059669;">${driver.lastName || "Unknown"} (Available)</strong>
              <hr style="margin: 4px 0; border: 0; border-top: 1px solid #eee;"/>
              <div style="font-size: 11px; color: #6b7280;">
                <strong>Idle:</strong> ${timeSinceStr}<br/>
                <strong>Location:</strong> ${locationName}${gpsInfo}
              </div>
            </div>
          `;
        }

        const hasActiveRide = !!activeRide;
        const color = hasActiveRide ? "#f97316" : "#10b981";
        const svgIcon = {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
              <path fill="${color}" stroke="white" stroke-width="2" d="M20,0 C28.28,0 35,6.72 35,15 C35,25 20,40 20,40 C20,40 5,25 5,15 C5,6.72 11.72,0 20,0 Z"></path>
              <circle cx="20" cy="15" r="10" fill="white" />
              <path transform="translate(12, 9) scale(0.7)" fill="${color}" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2a2 2 0 0 0 4 0h3a2 2 0 0 0 4 0h3zm-3-6l1.3 2.5c.1.2.1.5.1.8v.7H6v-.7c0-.3 0-.6.2-.8L7.5 11h8.5z" />
            </svg>
          `)}`,
          scaledSize: new (window as any).google.maps.Size(40, 40),
          anchor: new (window as any).google.maps.Point(20, 40),
          labelOrigin: new (window as any).google.maps.Point(20, -10),
        };

        const marker = new (window as any).google.maps.Marker({
          position: coords,
          map: mapInstance,
          icon: svgIcon,
          animation: (window as any).google.maps.Animation.DROP,
          label: {
            text: driver.lastName || "Driver",
            color: "#374151",
            fontWeight: "bold",
            fontSize: "12px",
            className: "bg-white px-1 rounded shadow-sm",
          },
        });

        const infoWindow = new (window as any).google.maps.InfoWindow({ content: infoContent });
        marker.addListener("click", () => infoWindow.open(mapInstance, marker));
        marker.addListener("mouseover", () => infoWindow.open(mapInstance, marker));
        newMarkers.push(marker);
      });

      setMarkers(newMarkers);

      // Auto-fit bounds to show all drivers
      if (newMarkers.length > 0 && mapInstance) {
        const bounds = new (window as any).google.maps.LatLngBounds();
        filteredDrivers.forEach((driver) => {
          const coords = resolveDriverCoordinates(driver);
          bounds.extend(coords);
        });
        mapInstance.fitBounds(bounds);
        // Ensure minimum zoom level
        if (mapInstance.getZoom() && mapInstance.getZoom() > 18) {
          mapInstance.setZoom(18);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, rides, mapInstance, driverViewMode, mapError, driverFilter]);

  // Auto-assign logic: Automatically assign rides that have been waiting too long
  // Keep refs in sync with state values
  useEffect(() => {
    ridesRef.current = rides;
  }, [rides]);

  useEffect(() => {
    fleetConfigRef.current = fleetConfig;
  }, [fleetConfig]);

  // Main auto-assign interval - uses refs to avoid stale closures
  useEffect(() => {
    // Early return if disabled
    if (!fleetConfig.autoAssignEnabled) {
      console.log("[Auto-Assign] Auto-assign is disabled");
      return;
    }

    console.log(
      "[Auto-Assign] Auto-assign is enabled, checking every 5 seconds...",
    );

    const checkAndAutoAssign = async () => {
      // Use refs for latest values to avoid stale closures
      const currentRides = ridesRef.current;
      const currentFleetConfig = fleetConfigRef.current;

      const pendingRides = currentRides.filter(
        (r) => r.status === BuggyStatus.SEARCHING,
      );
      console.log(
        `[Auto-Assign] Checking ${pendingRides.length} pending ride(s)...`,
      );

      if (pendingRides.length === 0) {
        return;
      }

      // Prevent too frequent auto-assign calls (at least 10 seconds between calls)
      const now = Date.now();
      if (now - lastAutoAssignRef.current < 10000) {
        console.log(
          "[Auto-Assign] Skipping - last auto-assign was less than 10 seconds ago",
        );
        return;
      }

      // Check if any ride has been waiting longer than maxWaitTimeBeforeAutoAssign
      const ridesToAutoAssign = pendingRides.filter((ride) => {
        const waitTime = Math.floor((now - ride.timestamp) / 1000); // seconds
        const shouldAssign =
          waitTime >= currentFleetConfig.maxWaitTimeBeforeAutoAssign;
        if (shouldAssign) {
          console.log(
            `[Auto-Assign] Ride ${ride.id} has been waiting ${waitTime}s (threshold: ${currentFleetConfig.maxWaitTimeBeforeAutoAssign}s)`,
          );
        }
        return shouldAssign;
      });

      if (ridesToAutoAssign.length > 0) {
        console.log(
          `[Auto-Assign] Found ${ridesToAutoAssign.length} ride(s) waiting over ${currentFleetConfig.maxWaitTimeBeforeAutoAssign}s, triggering auto-assign...`,
        );
        lastAutoAssignRef.current = now;

        // Set progress indicator - START
        setAIAssignmentProgress({
          isProcessing: true,
          processedCount: 0,
          totalCount: ridesToAutoAssign.length,
          currentRideId: ridesToAutoAssign[0]?.id || null,
          results: [],
        });

        // Trigger auto-assign for these rides
        if (handleAutoAssignRef.current) {
          await handleAutoAssignRef.current(true);
        }

        // Set progress indicator - COMPLETE (after 2s delay for visual feedback)
        setTimeout(() => {
          setAIAssignmentProgress({
            isProcessing: false,
            processedCount: ridesToAutoAssign.length,
            totalCount: ridesToAutoAssign.length,
            currentRideId: null,
            results: [],
          });
        }, 2000);
      } else {
        console.log("[Auto-Assign] No rides need auto-assignment yet");
      }
    };

    // Check every 5 seconds if there are rides that need auto-assignment
    const autoAssignInterval = setInterval(checkAndAutoAssign, 5000);

    // Run immediately on mount
    checkAndAutoAssign();

    return () => clearInterval(autoAssignInterval);
  }, [fleetConfig.autoAssignEnabled]); // Only re-create interval when toggle changes

  // Helper: Resolve location coordinates from location name
  const resolveLocationCoordinates = (
    locationName: string,
  ): { lat: number; lng: number } | null => {
    return resolveLocationCoordinatesUtil(locationName, locations);
  };

  // Helper: Calculate distance between two coordinates using Haversine formula (in meters)
  const calculateDistance = (
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number },
  ): number => {
    return calculateDistanceUtil(coord1, coord2);
  };

  // Helper: Get driver's current or expected location
  const getDriverLocation = (driver: User): string => {
    return getDriverLocationUtil(driver, rides, locations);
  };

  // Helper: Get online drivers count
  // Helper: Get online drivers count
  const getOnlineDriversCount = (): number => {
    return getOnlineDriversCountUtil(users, rides);
  };

  // Helper: Resolve driver coordinates for map view
  const resolveDriverCoordinates = (
    driver: User,
  ): { lat: number; lng: number } => {
    return resolveDriverCoordinatesUtil(driver, rides, locations, resolveLocationCoordinates);
  };

  // Helper: Get position on map (percentage)
  const getMapPosition = (lat: number, lng: number) => {
    const mapBounds = {
      minLat: 16.0375,
      maxLat: 16.042,
      minLng: 108.246,
      maxLng: 108.25,
    };
    return getMapPositionUtil(lat, lng, mapBounds);
  };

  // Helper: Get pending requests count
  const getPendingRequestsCount = (): number => {
    return getPendingRequestsCountUtil(rides);
  };

  // Helper: Get offline drivers count
  const getOfflineDriversCount = (): number => {
    return getOfflineDriversCountUtil(users, rides);
  };

  // Helper: Get active rides count (ASSIGNED, ARRIVING, ON_TRIP)
  const getActiveRidesCount = (): number => {
    return getActiveRidesCountUtil(rides);
  };

  // Helper: Get completed rides count today
  const getCompletedRidesTodayCount = (): number => {
    return getCompletedRidesTodayCountUtil(rides);
  };

  // Helper: Get total drivers count
  const getTotalDriversCount = (): number => {
    return getTotalDriversCountUtil(users);
  };

  // Service Request Helpers
  const getPendingServiceRequestsCount = (): number => {
    return getPendingServiceRequestsCountUtil(serviceRequests);
  };

  const getConfirmedServiceRequestsCount = (): number => {
    return getConfirmedServiceRequestsCountUtil(serviceRequests);
  };

  // Helper: Map service type to staff department
  const getDepartmentForServiceType = (serviceType: string): string => {
    return getDepartmentForServiceTypeUtil(serviceType);
  };

  // Helper: Get staff for a service type (by department)
  const getAvailableStaffForService = (serviceType: string): User[] => {
    const department = getDepartmentForServiceType(serviceType);
    return users.filter(
      (u) =>
        u.role === UserRole.STAFF &&
        (u.department === department || u.department === "All"),
    );
  };

  // Helper: Get staff status (available/busy) based on active service requests
  const getStaffStatus = (staff: User): "AVAILABLE" | "BUSY" => {
    const staffIdStr = staff.id ? String(staff.id) : "";
    const department = staff.department || "All";

    // Count active (CONFIRMED but not COMPLETED) service requests for this staff's department
    const activeRequests = serviceRequests.filter((sr) => {
      if (sr.type === "BUGGY") return false;
      const srDepartment = getDepartmentForServiceType(sr.type);
      return (
        sr.status === "CONFIRMED" &&
        (srDepartment === department || department === "All")
      );
    });

    // If staff has 3+ active requests, consider them busy
    // Note: Since we don't have staffId in service request, we estimate based on department
    // This is a simplified approach - in a real system, you'd track staff assignments
    const estimatedActiveCount = Math.floor(
      activeRequests.length /
      Math.max(
        1,
        getAvailableStaffForService(activeRequests[0]?.type || "DINING")
          .length,
      ),
    );
    return estimatedActiveCount >= 3 ? "BUSY" : "AVAILABLE";
  };

  // Helper: Get online staff count for service requests
  const getOnlineStaffCount = (): number => {
    const staffUsers = users.filter((u) => u.role === UserRole.STAFF);
    return staffUsers.filter((staff) => {
      // Check if staff has recent heartbeat
      if (staff.updatedAt) {
        const timeSinceUpdate = Date.now() - staff.updatedAt;
        return timeSinceUpdate < 30000; // 30 seconds
      }
      return false;
    }).length;
  };

  // Helper: Calculate assignment cost (simplified - based on staff availability and workload)
  const calculateServiceAssignmentCost = (
    staff: User,
    service: ServiceRequest,
  ): number => {
    const staffStatus = getStaffStatus(staff);
    let cost = 0;

    // Higher cost if staff is busy
    if (staffStatus === "BUSY") {
      cost += 1000;
    }

    // Add random variation for simplicity (in real system, consider location, skills, etc.)
    cost += Math.random() * 100;

    return cost;
  };

  // Helper: Calculate cost for a (driver, ride) pair
  const calculateAssignmentCost = async (driver: User, ride: RideRequest): Promise<number> => {
    const driverIdStr = driver.id ? String(driver.id) : "";

    // Check driver schedule availability
    const rideDate = new Date(ride.timestamp).toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().substring(0, 8); // HH:MM:SS format
    const isScheduledAvailable = await checkDriverAvailability(driverIdStr, rideDate, currentTime);

    // If driver is not available according to schedule, return very high cost
    if (!isScheduledAvailable) {
      return 10000000; // Very high cost to prevent assignment
    }

    // Check driver status
    const driverActiveRides = rides.filter((r) => {
      const rideDriverId = r.driverId ? String(r.driverId) : "";
      return (
        rideDriverId === driverIdStr &&
        (r.status === BuggyStatus.ASSIGNED ||
          r.status === BuggyStatus.ARRIVING ||
          r.status === BuggyStatus.ON_TRIP)
      );
    });
    const isAvailable = driverActiveRides.length === 0;
    const currentRide = driverActiveRides[0];

    // TEMPORARILY DISABLED: GPS-based location logic (Phase 1 - drivers don't use app)
    // Use time-based priority only: Driver near completion > Available driver > Busy driver

    // Calculate wait time in seconds (longer wait = higher priority = lower cost)
    const waitTimeSeconds = Math.floor((Date.now() - ride.timestamp) / 1000);
    const waitTimeBonus = waitTimeSeconds * 10; // Each second of wait reduces cost by 10 points

    let cost = 0;

    if (isAvailable) {
      // Driver is AVAILABLE: Medium priority (not as good as near-completion)
      cost = 5000; // Base cost for available drivers
    } else if (currentRide) {
      // Driver is BUSY: Calculate how close they are to completing current ride
      const now = Date.now();
      let rideDuration = 0;

      // Calculate ride duration based on status
      if (
        currentRide.status === BuggyStatus.ON_TRIP &&
        currentRide.pickedUpAt
      ) {
        // Driver is on trip: time since pickup
        rideDuration = now - currentRide.pickedUpAt;
      } else if (
        currentRide.status === BuggyStatus.ARRIVING &&
        currentRide.confirmedAt
      ) {
        // Driver is arriving: time since assignment
        rideDuration = now - currentRide.confirmedAt;
      } else if (
        currentRide.status === BuggyStatus.ASSIGNED &&
        currentRide.confirmedAt
      ) {
        // Driver is assigned: time since assignment
        rideDuration = now - currentRide.confirmedAt;
      }

      // Average ride duration is about 5-10 minutes (300000-600000 ms)
      // Drivers who have been on trip for > 5 minutes are likely near completion
      const rideDurationMinutes = rideDuration / (1000 * 60);

      if (rideDurationMinutes >= 5) {
        // Driver is likely near completion: HIGH PRIORITY (very low cost)
        // The longer the ride, the lower the cost (closer to completion)
        cost = 1000 - (rideDurationMinutes - 5) * 200; // Lower cost for longer rides
        cost = Math.max(0, cost); // Don't go negative
      } else if (rideDurationMinutes >= 3) {
        // Driver is getting close: Medium-high priority
        cost = 2000;
      } else {
        // Driver just started: Lower priority
        cost = 8000; // Higher cost for drivers who just started
      }

      // Check for chain trip opportunity (based on location names, not GPS)
      const dropoffCoords = resolveLocationCoordinates(currentRide.destination);
      const pickupCoords = resolveLocationCoordinates(ride.pickup);
      if (dropoffCoords && pickupCoords) {
        const chainDistance = calculateDistance(dropoffCoords, pickupCoords);
        if (chainDistance < 200) {
          // Chain trip: Very high priority
          cost = chainDistance - 10000; // Very low cost for chain trips
        }
      }
    } else {
      // Driver is OFFLINE or unknown status: Very high cost
      cost = 100000;
    }

    // Subtract wait time bonus (longer wait = lower cost = higher priority)
    cost -= waitTimeBonus;

    return cost;
  };

  // Service AI Auto-Assign Logic
  const handleServiceAutoAssign = async (isAutoTriggered: boolean = false) => {
    const pendingServicesList = serviceRequests.filter(
      (sr) => sr.status === "PENDING" && sr.type !== "BUGGY",
    );
    const staffUsers = users.filter((u) => u.role === UserRole.STAFF);
    const totalStaff = staffUsers.length;

    if (pendingServicesList.length === 0) {
      if (!isAutoTriggered) {
        setServiceAIAssignmentData({
          status: "error",
          pendingServices: [],
          onlineStaff: [],
          assignments: [],
          errorMessage: `⚠️ Không có yêu cầu dịch vụ nào đang chờ.\n\n⚠️ No pending service requests.\n\n📊 Trạng thái / Status:\n- Pending Requests: 0\n- Total Staff: ${totalStaff}\n- Online Staff: ${getOnlineStaffCount()}`,
        });
        setShowServiceAIAssignment(true);
      }
      return;
    }

    if (staffUsers.length === 0) {
      if (!isAutoTriggered) {
        setServiceAIAssignmentData({
          status: "error",
          pendingServices: pendingServicesList,
          onlineStaff: [],
          assignments: [],
          errorMessage: `❌ Không có nhân viên nào trong hệ thống.\n\n❌ No staff available at the moment.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingServicesList.length}\n- Total Staff: 0\n- Online Staff: 0`,
        });
        setShowServiceAIAssignment(true);
      }
      return;
    }

    const onlineStaff = staffUsers.filter((staff) => {
      if (staff.updatedAt) {
        const timeSinceUpdate = Date.now() - staff.updatedAt;
        return timeSinceUpdate < 30000; // 30 seconds
      }
      return false;
    });

    if (onlineStaff.length === 0) {
      if (!isAutoTriggered) {
        setServiceAIAssignmentData({
          status: "error",
          pendingServices: pendingServicesList,
          onlineStaff: [],
          assignments: [],
          errorMessage: `⚠️ Tất cả nhân viên đang offline.\n\n⚠️ All staff are offline.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingServicesList.length}\n- Total Staff: ${totalStaff}\n- Online Staff: 0`,
        });
        setShowServiceAIAssignment(true);
      }
      return;
    }

    if (!isAutoTriggered) {
      setServiceAIAssignmentData({
        status: "analyzing",
        pendingServices: pendingServicesList,
        onlineStaff: onlineStaff,
        assignments: [],
      });
      setShowServiceAIAssignment(true);
    }

    if (!isAutoTriggered) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Calculate cost for all (staff, service) pairs
    const assignments: Array<{
      staff: User;
      service: ServiceRequest;
      cost: number;
    }> = [];

    for (const service of pendingServicesList) {
      const availableStaff = getAvailableStaffForService(service.type);
      for (const staff of availableStaff) {
        const cost = calculateServiceAssignmentCost(staff, service);
        assignments.push({ staff, service, cost });
      }
    }

    assignments.sort((a, b) => a.cost - b.cost);

    if (!isAutoTriggered) {
      setServiceAIAssignmentData((prev) =>
        prev ? { ...prev, status: "matching" } : null,
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Greedy assignment
    const assignedServices = new Set<string>();
    const assignedStaff = new Set<string>();
    const finalAssignments: Array<{
      staff: User;
      service: ServiceRequest;
      cost: number;
    }> = [];

    for (const assignment of assignments) {
      const serviceId = assignment.service.id;
      const staffId = assignment.staff.id ? String(assignment.staff.id) : "";

      if (assignedServices.has(serviceId) || assignedStaff.has(staffId)) {
        continue;
      }

      // Check if staff is too busy
      const staffStatus = getStaffStatus(assignment.staff);
      if (staffStatus === "BUSY") {
        // Still allow but with higher cost threshold
        if (assignment.cost > 1500) {
          continue;
        }
      }

      assignedServices.add(serviceId);
      assignedStaff.add(staffId);
      finalAssignments.push(assignment);
    }

    if (!isAutoTriggered) {
      setServiceAIAssignmentData((prev) =>
        prev
          ? { ...prev, assignments: finalAssignments, status: "completed" }
          : null,
      );
    }

    // Actually assign services
    let assignmentCount = 0;
    for (const assignment of finalAssignments) {
      try {
        await updateServiceStatus(assignment.service.id, "CONFIRMED");
        assignmentCount++;
      } catch (error) {
        console.error(
          `Failed to assign service ${assignment.service.id} to staff ${assignment.staff.id}:`,
          error,
        );
      }
    }

    if (!isAutoTriggered) {
      // Status already set to completed above
    } else {
      console.log(
        `[Service Auto-Assign] Successfully assigned ${assignmentCount} service request(s) automatically`,
      );
    }

    // Refresh data
    try {
      const refreshedServices = await getServiceRequests();
      setServiceRequests(refreshedServices);
    } catch (error) {
      console.error("Failed to refresh services after assignment:", error);
    }
  };

  // AI Auto-Assign Logic with Cost-Based Algorithm
  const handleAutoAssign = useCallback(
    async (isAutoTriggered: boolean = false) => {
      const pendingRidesList = rides.filter(
        (r) => r.status === BuggyStatus.SEARCHING,
      );
      const driverUsers = users.filter((u) => u.role === UserRole.DRIVER);
      const totalDrivers = driverUsers.length;

      // Show modal with error if no pending rides (only if manual trigger)
      if (pendingRidesList.length === 0) {
        if (!isAutoTriggered) {
          setAIAssignmentData({
            status: "error",
            pendingRides: [],
            onlineDrivers: [],
            assignments: [],
            errorMessage: `⚠️ Không có yêu cầu nào đang chờ được gán.\n\n⚠️ No pending rides to assign.\n\n📊 Trạng thái / Status:\n- Pending Requests: 0\n- Total Drivers: ${totalDrivers}\n- Online Drivers: ${getOnlineDriversCount()}`,
          });
          setShowAIAssignment(true);
        }
        return;
      }

      // Get all drivers (including busy ones for chain trip opportunities)
      const allDrivers = driverUsers;

      if (allDrivers.length === 0) {
        if (!isAutoTriggered) {
          setAIAssignmentData({
            status: "error",
            pendingRides: pendingRidesList,
            onlineDrivers: [],
            assignments: [],
            errorMessage: `❌ Không có tài xế nào trong hệ thống.\n\n❌ No drivers available at the moment.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingRidesList.length}\n- Total Drivers: 0\n- Online Drivers: 0`,
          });
          setShowAIAssignment(true);
        }
        return;
      }

      // Check if there are any online drivers
      // Only consider drivers as online if they have:
      // 1. Active ride (busy), OR
      // 2. Recent heartbeat (updatedAt within last 30 seconds)
      // Do NOT use completed rides as indicator of online status
      const onlineDrivers = allDrivers.filter((driver) => {
        const driverIdStr = driver.id ? String(driver.id) : "";
        const hasActiveRide = rides.some((r) => {
          const rideDriverId = r.driverId ? String(r.driverId) : "";
          return (
            rideDriverId === driverIdStr &&
            (r.status === BuggyStatus.ASSIGNED ||
              r.status === BuggyStatus.ARRIVING ||
              r.status === BuggyStatus.ON_TRIP)
          );
        });
        if (hasActiveRide) return true; // Busy drivers are considered online

        // Check if driver has recent heartbeat (updated_at within last 30 seconds)
        // This is the PRIMARY indicator that driver portal is open and active
        if (driver.updatedAt) {
          const timeSinceUpdate = Date.now() - driver.updatedAt;
          if (timeSinceUpdate < 30000) {
            // 30 seconds
            return true; // Driver is online (heartbeat active)
          }
        }

        // Driver is offline if no active ride and no recent heartbeat
        return false;
      });

      const offlineDrivers = totalDrivers - onlineDrivers.length;

      if (onlineDrivers.length === 0) {
        if (!isAutoTriggered) {
          setAIAssignmentData({
            status: "error",
            pendingRides: pendingRidesList,
            onlineDrivers: [],
            assignments: [],
            errorMessage: `⚠️ Tất cả tài xế đang offline.\n\n⚠️ All drivers are offline.\n\n📊 Trạng thái / Status:\n- Pending Requests: ${pendingRidesList.length}\n- Total Drivers: ${totalDrivers}\n- Online Drivers: 0\n- Offline Drivers: ${offlineDrivers}\n\n💡 Vui lòng đợi tài xế online hoặc kiểm tra kết nối.\n💡 Please wait for drivers to come online or check connection.`,
          });
          setShowAIAssignment(true);
        }
        return;
      }

      // Show modal with analyzing status (only if manual trigger)
      if (!isAutoTriggered) {
        setAIAssignmentData({
          status: "analyzing",
          pendingRides: pendingRidesList,
          onlineDrivers: onlineDrivers,
          assignments: [],
        });
        setShowAIAssignment(true);
      }

      // Simulate AI analysis delay (only if showing modal)
      if (!isAutoTriggered) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // IMPORTANT: Manual merge only - NO automatic merging during assignment
      // Each ride will be assigned individually unless manually merged by staff using the Merge button
      // Rides can only be merged manually through the Merge Options modal
      const MAX_BUGGY_CAPACITY = 7;
      const rideGroups: Array<{ rides: RideRequest[]; totalGuests: number }> =
        [];

      // Create individual groups for each ride - NO automatic combining/merging
      // Staff must manually merge rides using the Merge Options feature if they want to combine rides
      pendingRidesList.forEach((ride) => {
        rideGroups.push({
          rides: [ride], // Each ride is in its own group - no merging
          totalGuests: ride.guestCount || 1,
        });
      });

      // Use individual rides for assignment - no automatic merging
      const finalRideGroups = rideGroups;

      // Calculate cost for all (driver, ride group) pairs - ONLY for online drivers
      const assignments: Array<{
        driver: User;
        rides: RideRequest[];
        cost: number;
        totalGuests: number;
      }> = [];

      // Create a Set of online driver IDs for quick lookup
      const onlineDriverIds = new Set(
        onlineDrivers.map((d) => (d.id ? String(d.id) : "")),
      );

      // Calculate cost for each individual ride with each online driver
      // Note: Each group contains only 1 ride (no automatic merging)
      for (const group of finalRideGroups) {
        // Each group contains exactly 1 ride (no automatic merging)
        const ride = group.rides[0];

        // Only calculate cost for online drivers
        for (const driver of allDrivers) {
          const driverIdStr = driver.id ? String(driver.id) : "";
          // Skip offline drivers
          if (!onlineDriverIds.has(driverIdStr)) {
            continue;
          }
          const cost = await calculateAssignmentCost(driver, ride);
          assignments.push({
            driver,
            rides: group.rides,
            cost,
            totalGuests: group.totalGuests,
          });
        }
      }

      // Sort assignments with priority order:
      // 1. Driver proximity to pickup (distance-based cost)
      // 2. Guest wait time (longer wait = higher priority)
      // 3. Driver near completion of current ride (chain trip opportunity)
      assignments.sort((a, b) => {
        const rideA = a.rides[0];
        const rideB = b.rides[0];

        // Priority 1: Driver proximity (distance-based cost)
        // Lower cost means closer driver
        if (Math.abs(a.cost - b.cost) > 100) {
          // Significant cost difference (>100) = prioritize by distance
          return a.cost - b.cost;
        }

        // Priority 2: Guest wait time (longer wait = higher priority)
        const waitTimeA = Date.now() - (rideA?.timestamp || 0);
        const waitTimeB = Date.now() - (rideB?.timestamp || 0);
        if (Math.abs(waitTimeA - waitTimeB) > 30000) {
          // Significant wait time difference (>30s) = prioritize longer wait
          return waitTimeB - waitTimeA; // Longer wait first
        }

        // Priority 3: Driver near completion (chain trip)
        // Check if drivers are busy and near completion
        const driverAId = a.driver.id ? String(a.driver.id) : "";
        const driverBId = b.driver.id ? String(b.driver.id) : "";
        const activeRidesA = rides.filter((r) => {
          const rideDriverId = r.driverId ? String(r.driverId) : "";
          return (
            rideDriverId === driverAId &&
            (r.status === BuggyStatus.ASSIGNED ||
              r.status === BuggyStatus.ARRIVING ||
              r.status === BuggyStatus.ON_TRIP)
          );
        });
        const activeRidesB = rides.filter((r) => {
          const rideDriverId = r.driverId ? String(r.driverId) : "";
          return (
            rideDriverId === driverBId &&
            (r.status === BuggyStatus.ASSIGNED ||
              r.status === BuggyStatus.ARRIVING ||
              r.status === BuggyStatus.ON_TRIP)
          );
        });

        const currentRideA = activeRidesA[0];
        const currentRideB = activeRidesB[0];

        if (currentRideA && !currentRideB) {
          // Driver A is busy, Driver B is available - prefer B
          return 1;
        }
        if (!currentRideA && currentRideB) {
          // Driver A is available, Driver B is busy - prefer A
          return -1;
        }
        if (currentRideA && currentRideB) {
          // Both busy - check ride duration (near completion)
          const now = Date.now();
          let durationA = 0;
          let durationB = 0;

          if (
            currentRideA.status === BuggyStatus.ON_TRIP &&
            currentRideA.pickedUpAt
          ) {
            durationA = now - currentRideA.pickedUpAt;
          } else if (currentRideA.confirmedAt) {
            durationA = now - currentRideA.confirmedAt;
          }

          if (
            currentRideB.status === BuggyStatus.ON_TRIP &&
            currentRideB.pickedUpAt
          ) {
            durationB = now - currentRideB.pickedUpAt;
          } else if (currentRideB.confirmedAt) {
            durationB = now - currentRideB.confirmedAt;
          }

          // Prefer driver closer to completion (longer duration)
          if (Math.abs(durationA - durationB) > 60000) {
            // >1 minute difference
            return durationB - durationA; // Longer duration first (closer to completion)
          }
        }

        // Final tie-breaker: cost
        return a.cost - b.cost;
      });

      // Update to matching status (only if showing modal)
      if (!isAutoTriggered) {
        setAIAssignmentData((prev) =>
          prev ? { ...prev, status: "matching" } : null,
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      // Greedy assignment with bulk assignment support: assign multiple rides to drivers when capacity allows
      // Group rides by driver to allow bulk assignment (multiple rides per driver)
      const assignedRides = new Set<string>();
      const driverAssignments = new Map<string, Array<{
        rides: RideRequest[];
        cost: number;
        isChainTrip?: boolean;
        totalGuests: number;
      }>>();

      // Group assignments by driver
      for (const assignment of assignments) {
        const ride = assignment.rides[0];

        // Skip if ride already assigned
        if (assignedRides.has(ride.id)) {
          continue;
        }

        const driverId = assignment.driver.id
          ? String(assignment.driver.id)
          : "";

        // Get or create driver's assignment list
        if (!driverAssignments.has(driverId)) {
          driverAssignments.set(driverId, []);
        }
        driverAssignments.get(driverId)!.push(assignment);
      }

      // Process each driver's assignments - allow multiple rides per driver
      const finalAssignments: Array<{
        driver: User;
        rides: RideRequest[];
        cost: number;
        isChainTrip?: boolean;
        totalGuests: number;
      }> = [];

      for (const [driverId, driverRideAssignments] of driverAssignments.entries()) {
        const driver = allDrivers.find((d) => (d.id ? String(d.id) : "") === driverId);
        if (!driver) continue;

        // Get driver's active rides
        const driverActiveRides = rides.filter((r) => {
          const rideDriverId = r.driverId ? String(r.driverId) : "";
          return (
            rideDriverId === driverId &&
            (r.status === BuggyStatus.ASSIGNED ||
              r.status === BuggyStatus.ARRIVING ||
              r.status === BuggyStatus.ON_TRIP)
          );
        });

        const activeRidesGuestCount = driverActiveRides.reduce(
          (sum, r) => sum + (r.guestCount || 1),
          0,
        );

        // Sort assignments by cost (best first)
        driverRideAssignments.sort((a, b) => a.cost - b.cost);

        // Collect rides that can be assigned to this driver (bulk assignment)
        const ridesToAssign: RideRequest[] = [];
        let totalGuestsToAssign = 0;
        let hasChainTrip = false;

        for (const assignment of driverRideAssignments) {
          const ride = assignment.rides[0];

          // Skip if ride already assigned
          if (assignedRides.has(ride.id)) {
            continue;
          }

          // Check if driver is busy
          const isBusy = driverActiveRides.length > 0;

          if (isBusy) {
            // Driver is busy - only allow chain trips (cost is very negative)
            if (assignment.cost > -5000) {
              continue; // Not a chain trip, skip
            }
            hasChainTrip = true;
          }

          // Check capacity: active rides + already selected rides + this ride
          const newTotalGuests = activeRidesGuestCount + totalGuestsToAssign + assignment.totalGuests;
          if (newTotalGuests > MAX_BUGGY_CAPACITY) {
            // Cannot add this ride - would exceed capacity
            continue;
          }

          // Add this ride to bulk assignment
          ridesToAssign.push(ride);
          totalGuestsToAssign += assignment.totalGuests;
          assignedRides.add(ride.id);
        }

        // If we have rides to assign, create bulk assignment
        if (ridesToAssign.length > 0) {
          // Use the best cost (first assignment's cost)
          const bestCost = driverRideAssignments.find(a => ridesToAssign.includes(a.rides[0]))?.cost || 0;

          finalAssignments.push({
            driver,
            rides: ridesToAssign,
            cost: bestCost,
            isChainTrip: hasChainTrip,
            totalGuests: totalGuestsToAssign,
          });
        }
      }

      // Update modal with assignments (only if showing modal)
      // Flatten bulk assignments for display (one entry per ride)
      const displayAssignments = finalAssignments.flatMap((assignment) => {
        return assignment.rides.map((ride) => {
          const pickupCoords = resolveLocationCoordinates(ride.pickup);
          const destinationCoords = resolveLocationCoordinates(ride.destination);

          return {
            driver: assignment.driver,
            ride: ride,
            cost: assignment.cost,
            isChainTrip: assignment.isChainTrip,
            pickupLat: pickupCoords?.lat,
            pickupLng: pickupCoords?.lng,
            destinationLat: destinationCoords?.lat,
            destinationLng: destinationCoords?.lng,
          };
        });
      });
      if (!isAutoTriggered) {
        setAIAssignmentData((prev) =>
          prev
            ? { ...prev, status: "matching", assignments: displayAssignments }
            : null,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Execute assignments - assign all rides in each bulk assignment
      let assignmentCount = 0;
      for (const { driver, rides } of finalAssignments) {
        // Assign all rides in this bulk assignment to the driver
        for (const ride of rides) {
          try {
            await updateRideStatus(ride.id, BuggyStatus.ASSIGNED, driver.id, 5); // 5 min ETA
            assignmentCount++;
          } catch (error) {
            console.error(`Failed to assign ride ${ride.id} to driver ${driver.id}:`, error);
          }
        }
      }

      // Update to completed status (only if showing modal)
      if (!isAutoTriggered) {
        setAIAssignmentData((prev) =>
          prev ? { ...prev, status: "completed" } : null,
        );
      } else {
        // For auto-triggered assignments, just log success
        if (assignmentCount > 0) {
          console.log(
            `[Auto-Assign] Successfully auto-assigned ${assignmentCount} ride(s)`,
          );
          // Auto-disable auto assign after successful assignment
          setFleetConfig((prev) => ({ ...prev, autoAssignEnabled: false }));
          console.log(
            "[Auto-Assign] Auto assign has been automatically disabled after assignment",
          );
        } else {
          console.log(
            "[Auto-Assign] No assignments were made (no available drivers or other constraints)",
          );
        }
      }

      // Refresh data after assignments
      try {
        const refreshedRides = await getRides();
        setRides(refreshedRides);
      } catch (error) {
        console.error("Failed to refresh rides after assignment:", error);
        setRides(getRidesSync());
      }
    },
    [rides, users, locations],
  );

  // Update ref whenever handleAutoAssign changes
  useEffect(() => {
    handleAutoAssignRef.current = handleAutoAssign;
  }, [handleAutoAssign]);

  // Handle ending a buggy ride
  const handleEndRide = async (rideId: string) => {
    try {
      await updateRideStatus(rideId, BuggyStatus.COMPLETED);
      // Refresh data after ending ride
      const refreshedRides = await getRides();
      setRides(refreshedRides);
    } catch (error) {
      console.error("Failed to end ride:", error);
      // Refresh anyway to sync state
      setRides(getRidesSync());
    }
  };

  // Handle pickup guest (mark ride as ON_TRIP)
  const handlePickupGuest = async (rideId: string) => {
    try {
      await updateRideStatus(rideId, BuggyStatus.ON_TRIP);
      // Refresh data after pickup
      const refreshedRides = await getRides();
      setRides(refreshedRides);
    } catch (error) {
      console.error("Failed to pickup guest:", error);
      // Refresh anyway to sync state
      setRides(getRidesSync());
    }
  };

  // Handle creating new ride
  const handleCreateRide = async () => {
    const isPickupValid = locations.some(l => l.name === newRideData.pickup);
    const isDestValid = locations.some(l => l.name === newRideData.destination);

    if (!newRideData.roomNumber || !newRideData.roomNumber.trim()) {
      alert("Please enter a valid Room Number.");
      return;
    }

    if (!newRideData.pickup) {
      alert("Pickup location is required.");
      return;
    }

    if (!isPickupValid) {
      alert(`Invalid Pickup Location: '${newRideData.pickup}'. Please select a location from the list.`);
      return;
    }

    if (!newRideData.destination) {
      alert("Destination is required.");
      return;
    }

    if (!isDestValid) {
      alert(`Invalid Destination: '${newRideData.destination}'. Please select a location from the list.`);
      return;
    }

    if (newRideData.pickup === newRideData.destination) {
      alert("Pickup and destination cannot be the same");
      return;
    }

    // Check for duplicate pending ride (any status except COMPLETED)
    // Check by Room Number and Route (pickup → destination), and also by guest name
    const duplicateRide = rides.find((r) => {
      if (r.status === BuggyStatus.COMPLETED) return false;

      // First check: Room Number and Route (pickup → destination)
      const sameRoomNumber =
        newRideData.roomNumber &&
        r.roomNumber &&
        r.roomNumber.toLowerCase() === newRideData.roomNumber.toLowerCase();

      const sameRoute =
        newRideData.pickup &&
        newRideData.destination &&
        r.pickup &&
        r.destination &&
        r.pickup.toLowerCase() === newRideData.pickup.toLowerCase() &&
        r.destination.toLowerCase() === newRideData.destination.toLowerCase();

      if (sameRoomNumber && sameRoute) {
        return true; // Duplicate: same room number and same route
      }

      // Second check: Guest name (as fallback)
      if (newRideData.guestName && newRideData.guestName.trim() !== "") {
        if (
          r.guestName &&
          r.guestName.toLowerCase() === newRideData.guestName.toLowerCase()
        ) {
          return true;
        }
      }

      return false;
    });

    if (duplicateRide) {
      const identifier = newRideData.guestName || "Guest";
      alert(
        `${identifier} already has an active ride request (${duplicateRide.pickup} → ${duplicateRide.destination}, Status: ${duplicateRide.status}). Please wait for it to complete or cancel it first.`,
      );
      return;
    }

    setIsCreatingRide(true);
    try {
      // Use guest name from input, fallback to room number if available
      const guestName =
        newRideData.guestName ||
        (newRideData.roomNumber ? `Guest ${newRideData.roomNumber}` : "Guest");
      // Only send room number if it's not empty, otherwise send null to avoid backend duplicate check
      const roomNumber =
        newRideData.roomNumber && newRideData.roomNumber.trim() !== ""
          ? newRideData.roomNumber
          : null;

      await requestRide(
        guestName,
        newRideData.roomNumber,
        newRideData.pickup,
        newRideData.destination,
        newRideData.guestCount || 1,
        newRideData.notes || undefined,
      );

      // Refresh rides list
      const refreshedRides = await getRides();
      setRides(refreshedRides);

      // Close modal and reset form
      setShowCreateRideModal(false);
      setIsAutoConfirming(false);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setNewRideData({
        roomNumber: "",
        pickup: "",
        destination: "",
        guestName: "",
        guestCount: 1,
        notes: "",
      });
      setPickupSearchQuery("");
      setDestinationSearchQuery("");
      setVoiceResult({ status: null, message: "" });
    } catch (error: any) {
      console.error("Failed to create ride:", error);
      // Check if error is about duplicate
      if (
        error?.response?.data?.error?.includes("duplicate") ||
        error?.message?.includes("duplicate")
      ) {
        alert(
          `A pending ride already exists for Room ${newRideData.roomNumber} from ${newRideData.pickup} to ${newRideData.destination}. Please wait for it to complete or cancel it first.`,
        );
      } else {
        alert("Failed to create ride. Please try again.");
      }
    } finally {
      setIsCreatingRide(false);
    }
  };

  // Filter locations based on search query and filter type
  const getFilteredLocations = (
    query: string,
    filterType: "ALL" | "VILLA" | "FACILITY" | "RESTAURANT" = "ALL",
  ) => {
    let filtered = locations;

    // Filter by type
    if (filterType !== "ALL") {
      filtered = filtered.filter((loc) => loc.type === filterType);
    }

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (loc) =>
          loc.name.toLowerCase().includes(lowerQuery) ||
          loc.type.toLowerCase().includes(lowerQuery),
      );
    }

    // Sort alphabetically
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem("reception_sound_enabled", String(soundEnabled));
  }, [soundEnabled]);

  const getStatusText = (status: BuggyStatus) => {
    switch (status) {
      case BuggyStatus.SEARCHING:
        return "Finding Driver";
      case BuggyStatus.ASSIGNED:
        return "Driver Assigned";
      case BuggyStatus.ARRIVING:
        return "Driver Arriving";
      case BuggyStatus.ON_TRIP:
        return "On Trip";
      case BuggyStatus.COMPLETED:
        return "Completed";
      case BuggyStatus.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div
      className={`${embedded ? "" : "min-h-screen"} bg-gray-100 flex flex-col font-sans`}
    >
      {/* Header */}
      {!embedded && (
        <header
          role="banner"
          aria-label="Dispatch Center Header"
          className="bg-emerald-900 text-white py-2 md:py-3 px-3 md:px-4 flex justify-between items-center shadow-lg sticky top-0 z-20"
        >
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white/90 rounded-full p-0.5 shadow-md flex-shrink-0" />
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${viewMode === "BUGGY" ? "bg-emerald-700" :
                viewMode === "REPORTS" ? "bg-purple-600" :
                  viewMode === "PERFORMANCE" ? "bg-indigo-600" : "bg-emerald-700"
                }`}
            >
              {viewMode === "BUGGY" ? (
                <Car size={20} className="md:w-6 md:h-6 text-white" />
              ) : viewMode === "REPORTS" ? (
                <BarChart3 size={20} className="md:w-6 md:h-6 text-white" />
              ) : viewMode === "PERFORMANCE" ? (
                <TrendingUp size={20} className="md:w-6 md:h-6 text-white" />
              ) : (
                <Car size={20} className="md:w-6 md:h-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-bold truncate">Dispatch Center</h1>
              <p className="text-[10px] md:text-xs text-emerald-100 truncate">
                {viewMode === "BUGGY"
                  ? "BUGGY FLEET MANAGEMENT"
                  : "SERVICE REQUEST MANAGEMENT"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            {/* Notification Bell - Only show when BUGGY view mode */}
            {viewMode === "BUGGY" && (
              <BuggyNotificationBell
                rides={rides}
                users={users}
                onNavigate={() => setViewMode("BUGGY")}
                soundEnabled={soundEnabled}
                onSoundToggle={(enabled) => {
                  setSoundEnabled(enabled);
                  localStorage.setItem(
                    "reception_sound_enabled",
                    String(enabled),
                  );
                }}
                localStorageKey="reception_sound_enabled"
                showCompleted={true}
                showAssigned={true}
                showActive={true}
              />
            )}
            <div className="text-right hidden sm:block">
              <div className="text-xs md:text-sm font-semibold">
                {user.lastName || "Hotline"}
              </div>
              <div className="text-[10px] md:text-xs text-emerald-100">
                ID: {user.id || "N/A"}
              </div>
            </div>
            <button
              onClick={onLogout}
              aria-label="Logout from Dispatch Center"
              className="text-xs md:text-sm bg-emerald-800 px-2 md:px-3 py-1.5 md:py-2 rounded hover:bg-emerald-700 border border-emerald-700 flex items-center gap-1 min-h-[36px] touch-manipulation"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content - Reuse Fleet Section from AdminPortal */}
      <div className={`flex-1 ${embedded ? "" : "p-4 md:p-6"} overflow-auto`}>
        <div className="space-y-4">
          {/* View Mode Tabs */}
          <nav role="navigation" aria-label="View mode navigation" className="flex items-center gap-2 mb-4 px-2 md:px-4">
            <button
              onClick={() => setViewMode("BUGGY")}
              aria-current={viewMode === "BUGGY" ? "page" : undefined}
              aria-label="Switch to Buggy Fleet view"
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all min-h-[44px] touch-manipulation ${viewMode === "BUGGY"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <Car size={16} className="md:w-[18px] md:h-[18px]" aria-hidden="true" />
              <span className="whitespace-nowrap">Buggy Fleet</span>
            </button>
            <button
              onClick={() => setViewMode("REPORTS")}
              aria-current={viewMode === "REPORTS" ? "page" : undefined}
              aria-label="Switch to Reports view"
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all min-h-[44px] touch-manipulation ${viewMode === "REPORTS"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <BarChart3 size={16} className="md:w-[18px] md:h-[18px]" aria-hidden="true" />
              <span className="whitespace-nowrap">Reports</span>
            </button>
            <button
              onClick={() => setViewMode("PERFORMANCE")}
              aria-current={viewMode === "PERFORMANCE" ? "page" : undefined}
              aria-label="Switch to Performance view"
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all min-h-[44px] touch-manipulation ${viewMode === "PERFORMANCE"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <TrendingUp size={16} className="md:w-[18px] md:h-[18px]" aria-hidden="true" />
              <span className="whitespace-nowrap">Performance</span>
            </button>
          </nav>

          {/* Buggy Fleet Dispatch */}
          {viewMode === "BUGGY" && (
            <>
              {/* Fleet Header - Hidden on mobile for cleaner UI */}
              <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 px-2 md:px-4 py-2 md:py-3">
                <div className="flex items-center gap-2 md:gap-2.5">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-emerald-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <Car size={18} className="md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base md:text-lg font-bold text-gray-800">
                      Buggy Fleet Dispatch
                    </h2>
                    <p className="text-[10px] md:text-xs text-gray-500">
                      Manage real-time buggy requests and driver fleet.
                    </p>
                  </div>
                </div>
                {/* Status Indicator - Hidden on mobile (info in stats cards) */}
                <div className="hidden md:flex items-center gap-1.5 md:gap-2 bg-white rounded-lg px-2 md:px-3 py-1.5 border border-gray-200 shadow-sm w-full md:w-auto">
                  <div className="flex items-center gap-1 md:gap-1.5 flex-1 md:flex-initial">
                    <div className="flex items-center gap-1">
                      <AlertCircle size={12} className="md:w-[14px] md:h-[14px] text-orange-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700">
                        {getPendingRequestsCount()}
                      </span>
                      <span className="text-xs md:text-sm text-gray-500">Pending</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="md:w-[14px] md:h-[14px] text-green-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-700">
                        {getOnlineDriversCount()}
                      </span>
                      <span className="text-xs md:text-sm text-gray-500">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 md:gap-1.5 relative z-10">
                  <button
                    onClick={() => setShowFleetSettings(!showFleetSettings)}
                    className={`p-2 md:p-1.5 rounded-md transition min-h-[44px] md:min-h-0 touch-manipulation ${showFleetSettings ? "bg-gray-200 text-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                  >
                    <Settings size={18} className="md:w-[18px] md:h-[18px]" />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const [refreshedRides, refreshedUsers] =
                          await Promise.all([
                            getRides().catch(() => getRidesSync()),
                            getUsers().catch(() => getUsersSync()),
                          ]);
                        setRides(refreshedRides);
                        setUsers(refreshedUsers);
                      } catch (error) {
                        console.error("Failed to refresh data:", error);
                        // Fallback to sync functions if Promise.all itself fails
                        setRides(getRidesSync());
                        setUsers(getUsersSync());
                      }
                    }}
                    className="p-2 md:p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition min-h-[44px] md:min-h-0 touch-manipulation"
                  >
                    <RefreshCw size={18} className="md:w-[18px] md:h-[18px]" />
                  </button>
                  <div className="relative group">
                    {(() => {
                      const pendingRides = rides.filter(
                        (r) => r.status === BuggyStatus.SEARCHING,
                      );
                      const hasPendingRides = pendingRides.length > 0;
                      const hasOnlineDrivers = getOnlineDriversCount() > 0;

                      const formatCountdown = (seconds: number): string => {
                        if (seconds <= 0) return "0s";
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        if (mins > 0) {
                          return `${mins}m ${secs}s`;
                        }
                        return `${secs}s`;
                      };

                      return (
                        <button
                          onClick={async () => {
                            await handleAutoAssign();
                          }}
                          disabled={!hasPendingRides || !hasOnlineDrivers}
                          className="bg-blue-600 text-white px-2.5 md:px-3 py-2 md:py-1.5 rounded-md flex items-center gap-1 md:gap-1.5 hover:bg-blue-700 transition text-xs md:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed relative min-h-[44px] md:min-h-0 touch-manipulation"
                        >
                          <Zap size={14} className="md:w-4 md:h-4" />
                          <span className="hidden sm:inline">Assign by AI</span>
                          <span className="sm:hidden">AI</span>
                          {autoAssignCountdown !== null && (
                            <span className="ml-1 text-[10px] md:text-xs bg-blue-500/80 px-1.5 py-0.5 rounded font-bold">
                              {autoAssignCountdown <= 0
                                ? "NOW"
                                : formatCountdown(autoAssignCountdown)}
                            </span>
                          )}
                        </button>
                      );
                    })()}
                    {/* Enhanced Tooltip */}
                    {(() => {
                      const hasPendingRides = getPendingRequestsCount() > 0;
                      const hasOnlineDrivers = getOnlineDriversCount() > 0;
                      const pendingCount = getPendingRequestsCount();
                      const onlineCount = getOnlineDriversCount();

                      if (!hasPendingRides || !hasOnlineDrivers) {
                        return (
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0">
                              <div className="border-4 border-transparent border-b-gray-900"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Info size={14} />
                              <div>
                                {!hasPendingRides && (
                                  <div>⚠️ Không có yêu cầu đang chờ</div>
                                )}
                                {!hasOnlineDrivers && (
                                  <div>
                                    ⚠️ Không có tài xế online (
                                    {
                                      users.filter(
                                        (u) => u.role === UserRole.DRIVER,
                                      ).length
                                    }{" "}
                                    offline)
                                  </div>
                                )}
                                <div className="text-[10px] text-gray-300 mt-1">
                                  {!hasPendingRides && "No pending requests"}
                                  {!hasOnlineDrivers && " / No online drivers"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0">
                            <div className="border-4 border-transparent border-b-gray-900"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap size={14} />
                            <div>
                              <div>✅ Sẵn sàng gán tự động</div>
                              <div className="text-[10px] text-gray-300 mt-1">
                                {pendingCount} requests • {onlineCount} drivers
                                online
                              </div>
                              <div className="text-[10px] text-gray-300">
                                Ready to assign • Cost-based algorithm
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Dashboard Stats */}
              <div
                role="region"
                aria-label="Fleet status overview"
                className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-4 px-2 md:px-0"
              >
                {/* Drivers Online */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-md p-2 md:p-1.5 border border-green-200/60">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Users
                        size={12}
                        className="md:w-[14px] md:h-[14px] text-green-600 flex-shrink-0"
                      />
                      <span className="text-[10px] md:text-sm font-medium text-green-700 truncate">
                        Drivers Online
                      </span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-green-700 flex-shrink-0">
                      {getOnlineDriversCount()}
                    </span>
                  </div>
                  <div className="text-[9px] md:text-xs text-green-600 opacity-75 mt-0.5">
                    of {getTotalDriversCount()} total
                  </div>
                </div>

                {/* Drivers Offline - Hidden on mobile */}
                <div className="hidden md:block bg-gradient-to-br from-gray-50 to-slate-50 rounded-md p-2 md:p-1.5 border border-gray-200/60">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Users
                        size={12}
                        className="md:w-[14px] md:h-[14px] text-gray-500 flex-shrink-0"
                      />
                      <span className="text-[10px] md:text-sm font-medium text-gray-600 truncate">
                        Drivers Offline
                      </span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-gray-700 flex-shrink-0">
                      {getOfflineDriversCount()}
                    </span>
                  </div>
                </div>

                {/* Active Rides */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-md p-2 md:p-1.5 border border-blue-200/60">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Car size={12} className="md:w-[14px] md:h-[14px] text-blue-600 flex-shrink-0" />
                      <span className="text-[10px] md:text-sm font-medium text-blue-700 truncate">
                        Active Rides
                      </span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-blue-700 flex-shrink-0">
                      {getActiveRidesCount()}
                    </span>
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-md p-2 md:p-1.5 border border-orange-200/60">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <Clock
                        size={12}
                        className="md:w-[14px] md:h-[14px] text-orange-600 flex-shrink-0"
                      />
                      <span className="text-[10px] md:text-sm font-medium text-orange-700 truncate">
                        Pending Requests
                      </span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-orange-700 flex-shrink-0">
                      {getPendingRequestsCount()}
                    </span>
                  </div>
                </div>

                {/* Completed Today - Hidden on mobile */}
                <div className="hidden md:block bg-gradient-to-br from-emerald-50 to-green-50 rounded-md p-2 md:p-1.5 border border-emerald-200/60">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <CheckCircle
                        size={12}
                        className="md:w-[14px] md:h-[14px] text-emerald-600 flex-shrink-0"
                      />
                      <span className="text-[10px] md:text-sm font-medium text-emerald-700 truncate">
                        Completed Today
                      </span>
                    </div>
                    <span className="text-base md:text-lg font-bold text-emerald-700 flex-shrink-0">
                      {getCompletedRidesTodayCount()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dispatch Configuration Modal */}
              {showFleetSettings && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in"
                  onClick={() => setShowFleetSettings(false)}
                >
                  <div
                    className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[95vw] max-w-96 p-4 md:p-6 mx-2 animate-in slide-in-from-top-5 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setShowFleetSettings(false)}
                      className="touch-btn absolute top-3 right-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
                      aria-label="Close"
                    >
                      <X size={22} />
                    </button>
                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center pr-8">
                      <Settings size={18} className="mr-2" /> Dispatch
                      Configuration
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                          MAX WAIT TIME (SECONDS)
                        </label>
                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          value={fleetConfig.maxWaitTimeBeforeAutoAssign}
                          onChange={(e) =>
                            setFleetConfig({
                              ...fleetConfig,
                              maxWaitTimeBeforeAutoAssign:
                                parseInt(e.target.value) || 300,
                            })
                          }
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sm font-medium text-gray-700">
                          Enable Auto-Assign
                        </span>
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={true}
                          onChange={() => { }}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-not-allowed opacity-50"
                        />
                      </div>
                      <button
                        onClick={() => {
                          localStorage.setItem(
                            "fleetConfig",
                            JSON.stringify(fleetConfig),
                          );
                          setShowFleetSettings(false);
                        }}
                        className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition shadow-md active:scale-95"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Assignment Modal */}
              {showAIAssignment && aiAssignmentData && (
                <div
                  className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in"
                  onClick={() => {
                    if (
                      aiAssignmentData.status === "completed" ||
                      aiAssignmentData.status === "error"
                    ) {
                      setShowAIAssignment(false);
                      setAIAssignmentData(null);
                    }
                  }}
                >
                  <div
                    className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[95vw] sm:w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-top-5 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 md:p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Brain size={20} className="md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base md:text-lg truncate">
                            AI Assignment Engine
                          </h3>
                          <p className="text-[10px] md:text-xs text-blue-100 truncate">
                            Intelligent ride-driver matching
                          </p>
                        </div>
                      </div>
                      {(aiAssignmentData.status === "completed" ||
                        aiAssignmentData.status === "error") && (
                          <button
                            onClick={() => {
                              setShowAIAssignment(false);
                              setAIAssignmentData(null);
                            }}
                            className="text-white/80 hover:text-white transition-colors p-1 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 touch-manipulation flex items-center justify-center"
                            aria-label="Close"
                          >
                            <X size={20} className="md:w-6 md:h-6" />
                          </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
                      {aiAssignmentData.status === "analyzing" && (
                        <div className="flex flex-col items-center justify-center py-8 md:py-12">
                          <Loader2
                            size={40}
                            className="md:w-12 md:h-12 text-blue-600 animate-spin mb-4"
                          />
                          <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2 text-center px-4">
                            Analyzing Requests...
                          </h4>
                          <p className="text-sm md:text-base text-gray-600 text-center max-w-md px-4">
                            AI is analyzing{" "}
                            {aiAssignmentData.pendingRides.length} pending
                            request(s) and{" "}
                            {aiAssignmentData.onlineDrivers.length} available
                            driver(s)
                          </p>
                          <div className="mt-6 flex gap-2">
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {aiAssignmentData.status === "matching" && (
                        <div className="space-y-3 md:space-y-4">
                          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                            <Loader2
                              size={20}
                              className="md:w-6 md:h-6 text-blue-600 animate-spin flex-shrink-0"
                            />
                            <h4 className="text-base md:text-lg font-bold text-gray-800">
                              Matching Drivers to Requests...
                            </h4>
                          </div>

                          {aiAssignmentData.assignments.length > 0 ? (
                            <div className="space-y-3">
                              {aiAssignmentData.assignments.map(
                                (assignment, idx) => {
                                  const driverLocation = getDriverLocation(
                                    assignment.driver,
                                  );
                                  const waitTime = Math.floor(
                                    (Date.now() - assignment.ride.timestamp) /
                                    1000 /
                                    60,
                                  );

                                  return (
                                    <div
                                      key={`${assignment.driver.id}-${assignment.ride.id}`}
                                      className="bg-gradient-to-r from-blue-50 to-emerald-50 border-2 border-blue-200 rounded-lg p-3 md:p-4 animate-in fade-in slide-in-from-left"
                                      style={{
                                        animationDelay: `${idx * 100}ms`,
                                      }}
                                    >
                                      <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
                                        {/* Driver Info */}
                                        <div className="flex-1 bg-white rounded-lg p-2 md:p-3 border border-blue-200 w-full sm:w-auto">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                              <Users
                                                size={14}
                                                className="md:w-4 md:h-4 text-blue-600"
                                              />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="font-bold text-xs md:text-sm text-gray-800 truncate">
                                                {assignment.driver.lastName}
                                              </div>
                                              <div className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                                                <MapPin size={9} className="md:w-[10px] md:h-[10px] flex-shrink-0" />
                                                <span className="truncate">{driverLocation}</span>
                                              </div>
                                            </div>
                                          </div>
                                          {assignment.isChainTrip && (
                                            <div className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold">
                                              🔗 Chain Trip
                                            </div>
                                          )}
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex items-center justify-center pt-1 sm:pt-2 self-center sm:self-auto">
                                          <ArrowRight
                                            size={20}
                                            className="md:w-6 md:h-6 text-blue-600 rotate-90 sm:rotate-0"
                                          />
                                        </div>

                                        {/* Ride Info */}
                                        <div className="flex-1 bg-white rounded-lg p-2 md:p-3 border border-emerald-200 w-full sm:w-auto">
                                          <div className="flex items-center gap-2 mb-2">
                                            <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                              <Car
                                                size={14}
                                                className="md:w-4 md:h-4 text-emerald-600"
                                              />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <div className="font-bold text-xs md:text-sm text-gray-800 truncate">
                                                {assignment.ride.guestName ||
                                                  `Guest ${assignment.ride.roomNumber}`}
                                              </div>
                                              <div className="text-[10px] md:text-xs text-gray-500">
                                                Room{" "}
                                                {assignment.ride.roomNumber}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-1 text-[10px] md:text-xs">
                                            <div className="flex items-center gap-1 text-gray-600 flex-wrap">
                                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                              <span className="truncate">
                                                {assignment.ride.pickup}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-gray-600 flex-wrap">
                                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></div>
                                              <span className="truncate">
                                                {assignment.ride.destination}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="mt-2 flex items-center gap-2 text-[9px] md:text-[10px]">
                                            <div className="flex items-center gap-1 text-orange-600">
                                              <Clock size={9} className="md:w-[10px] md:h-[10px]" />
                                              {waitTime}m wait
                                            </div>
                                            <div className="text-gray-500">
                                              Cost:{" "}
                                              {Math.round(assignment.cost)}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Loader2
                                size={32}
                                className="animate-spin mx-auto mb-3 text-blue-600"
                              />
                              <p>Calculating optimal matches...</p>
                            </div>
                          )}
                        </div>
                      )}

                      {aiAssignmentData.status === "completed" && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-4">
                            <CheckCircle size={32} className="text-green-600" />
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">
                                Assignments Completed!
                              </h4>
                              <p className="text-sm text-gray-600">
                                Successfully assigned{" "}
                                {aiAssignmentData.assignments.length} ride(s)
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aiAssignmentData.assignments.map((assignment) => {
                              const driverLocation = getDriverLocation(
                                assignment.driver,
                              );

                              return (
                                <div
                                  key={`${assignment.driver.id}-${assignment.ride.id}`}
                                  className="bg-green-50 border-2 border-green-200 rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle
                                        size={16}
                                        className="text-green-600"
                                      />
                                      <span className="font-bold text-sm text-gray-800">
                                        {assignment.driver.lastName} →{" "}
                                        {assignment.ride.guestName ||
                                          `Guest ${assignment.ride.roomNumber}`}
                                      </span>
                                    </div>
                                    {assignment.isChainTrip && (
                                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                                        Chain
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-600 space-y-0.5">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className="truncate">
                                        {assignment.ride.pickup}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="truncate">
                                        {assignment.ride.destination}
                                      </span>
                                    </div>
                                    <div className="text-gray-500">
                                      Driver at: {driverLocation}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                Total Assignments:
                              </span>
                              <span className="font-bold text-gray-800">
                                {aiAssignmentData.assignments.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-1">
                              <span className="text-gray-600">
                                Chain Trips:
                              </span>
                              <span className="font-bold text-purple-600">
                                {
                                  aiAssignmentData.assignments.filter(
                                    (a) => a.isChainTrip,
                                  ).length
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {aiAssignmentData.status === "error" && (
                        <div className="flex flex-col items-center justify-center py-12">
                          <AlertCircle
                            size={48}
                            className="text-red-600 mb-4"
                          />
                          <h4 className="text-xl font-bold text-gray-800 mb-2">
                            Assignment Failed
                          </h4>
                          <p className="text-gray-600 text-center whitespace-pre-line max-w-md">
                            {aiAssignmentData.errorMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {(aiAssignmentData.status === "completed" ||
                      aiAssignmentData.status === "error") && (
                        <div className="border-t border-gray-200 p-3 md:p-4 bg-gray-50 flex justify-end">
                          <button
                            onClick={() => {
                              setShowAIAssignment(false);
                              setAIAssignmentData(null);
                            }}
                            className="bg-blue-600 text-white px-5 md:px-6 py-2.5 md:py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm md:text-base min-h-[44px] md:min-h-0 touch-manipulation"
                          >
                            Close
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Three Columns Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 px-2 md:px-0">
                {/* Column 1: Pending Requests */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-3 flex flex-col max-h-[600px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                    <h3 className="font-bold text-xs md:text-sm text-gray-800">
                      Pending Requests (
                      {
                        rides.filter((r) => r.status === BuggyStatus.SEARCHING)
                          .length
                      }
                      )
                    </h3>
                    <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto">
                      {/* Merge Options Button */}
                      {(() => {
                        const pendingRides = rides.filter(
                          (r) => r.status === BuggyStatus.SEARCHING,
                        );
                        let mergeCount = 0;
                        for (let i = 0; i < pendingRides.length - 1; i++) {
                          for (let j = i + 1; j < pendingRides.length; j++) {
                            if (
                              canCombineRides(pendingRides[i], pendingRides[j])
                            ) {
                              mergeCount++;
                            }
                          }
                        }
                        if (mergeCount === 0) return null;
                        return (
                          <button
                            onClick={() => setShowMergeModal(true)}
                            className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 md:py-1 bg-blue-500 hover:bg-blue-600 text-white text-[10px] md:text-xs font-semibold rounded transition-colors min-h-[36px] md:min-h-0 touch-manipulation"
                            title="View Merge Options"
                          >
                            <span>🔗</span>
                            <span className="hidden sm:inline">Merge ({mergeCount})</span>
                            <span className="sm:hidden">({mergeCount})</span>
                          </button>
                        );
                      })()}

                      <div className="flex items-center gap-1.5 md:gap-2">
                        {/* AI Assignment Progress Indicator - Inline */}
                        {aiAssignmentProgress.isProcessing && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
                            <Loader2 size={12} className="text-blue-600 animate-spin" />
                            <span className="text-[10px] md:text-xs text-blue-700 font-medium">
                              AI: {aiAssignmentProgress.processedCount}/{aiAssignmentProgress.totalCount}
                            </span>
                          </div>
                        )}

                        {/* Toggle Switch - Enabled with ARIA */}
                        <button
                          role="switch"
                          aria-checked={fleetConfig.autoAssignEnabled}
                          aria-label="Auto Assign AI toggle"
                          disabled={aiAssignmentProgress.isProcessing}
                          onClick={() => {
                            setFleetConfig(prev => ({
                              ...prev,
                              autoAssignEnabled: !prev.autoAssignEnabled
                            }));
                          }}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 touch-manipulation ${fleetConfig.autoAssignEnabled
                            ? "bg-emerald-500"
                            : "bg-gray-300"
                            } ${aiAssignmentProgress.isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                          title={fleetConfig.autoAssignEnabled ? "Auto Assign is ON" : "Auto Assign is OFF"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fleetConfig.autoAssignEnabled ? "translate-x-4" : "translate-x-1"
                              }`}
                          />
                        </button>

                        {/* Auto Assign Status */}
                        <span
                          aria-live="polite"
                          className={`text-[10px] md:text-xs font-medium ${fleetConfig.autoAssignEnabled ? "text-emerald-600" : "text-gray-600"
                            }`}>
                          {fleetConfig.autoAssignEnabled ? "AI: On" : "AI: Off"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {rides.filter((r) => r.status === BuggyStatus.SEARCHING)
                      .length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-[10px] md:text-xs">
                        No pending requests.
                      </div>
                    ) : (
                      (() => {
                        // Sort by wait time (longest first) and map to display
                        const allPendingRides = rides
                          .filter((r) => r.status === BuggyStatus.SEARCHING)
                          .map((ride) => {
                            const waitTime = Math.floor(
                              (Date.now() - ride.timestamp) / 1000,
                            );
                            return { ride, waitTime };
                          })
                          .sort((a, b) => b.waitTime - a.waitTime); // Longest wait first

                        const totalPendingCount = allPendingRides.length;
                        const pendingRides = allPendingRides.slice(0, pendingRidesLimit);

                        return (
                          <>
                            {pendingRides.map(({ ride, waitTime }, index) => {
                              let waitTimeText = "";
                              if (waitTime < 60) {
                                waitTimeText = `${waitTime}s`;
                              } else if (waitTime < 3600) {
                                waitTimeText = `${Math.floor(waitTime / 60)}m ${waitTime % 60}s`;
                              } else if (waitTime < 86400) {
                                waitTimeText = `${Math.floor(waitTime / 3600)}h ${Math.floor((waitTime % 3600) / 60)}m`;
                              } else {
                                waitTimeText = `${Math.floor(waitTime / 86400)}d ${Math.floor((waitTime % 86400) / 3600)}h`;
                              }

                              // Determine urgency level based on wait time
                              let urgencyLevel: "normal" | "warning" | "urgent" =
                                "normal";
                              if (waitTime >= 600) urgencyLevel = "urgent";
                              else if (waitTime >= 300) urgencyLevel = "warning";

                              const styles = {
                                urgent: {
                                  bg: "bg-red-50",
                                  border: "border-red-300",
                                  badge: "bg-red-100 text-red-700",
                                },
                                warning: {
                                  bg: "bg-orange-50",
                                  border: "border-orange-300",
                                  badge: "bg-orange-100 text-orange-700",
                                },
                                normal: {
                                  bg: "bg-white",
                                  border: "border-gray-200",
                                  badge: "bg-gray-100 text-gray-600",
                                },
                              };
                              const style = styles[urgencyLevel];

                              return (
                                <div
                                  key={ride.id}
                                  onClick={() => {
                                    setSelectedRideForDetail(ride);
                                    setShowDetailRequestModal(true);
                                  }}
                                  className={`${style.bg} ${style.border} p-2 md:p-2.5 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md hover:border-emerald-400 touch-manipulation`}
                                >
                                  {/* Header Row: Room + Guest + Pax + Wait Time */}
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1 md:gap-1.5 min-w-0 flex-1">
                                      <span className="font-semibold text-xs md:text-sm text-gray-800">
                                        #{ride.roomNumber}
                                      </span>
                                      <span className="text-[10px] md:text-xs text-gray-500 truncate">
                                        {ride.guestName}
                                      </span>
                                      <span className="text-[9px] md:text-[10px] text-gray-500 flex-shrink-0">
                                        {ride.guestCount || 1} pax
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${style.badge}`}
                                    >
                                      {waitTimeText}
                                    </span>
                                  </div>

                                  {/* Route Row */}
                                  <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs mt-1 flex-wrap">
                                    <span className="text-gray-500 flex-shrink-0">From:</span>
                                    <span className="text-gray-700 font-medium truncate min-w-0">
                                      {ride.pickup}
                                    </span>
                                    <span className="text-gray-400 flex-shrink-0">→</span>
                                    <span className="text-gray-500 flex-shrink-0">To:</span>
                                    <span className="text-gray-700 font-medium truncate min-w-0">
                                      {ride.destination}
                                    </span>
                                  </div>

                                  {/* Notes - if exists */}
                                  {ride.notes && ride.notes.trim() && (
                                    <div className="text-[9px] md:text-[10px] text-amber-600 truncate mt-1">
                                      Note: {ride.notes}
                                    </div>
                                  )}

                                  {/* Assign Driver Button */}
                                  <div className="mt-2 pt-2 border-t border-gray-200/60">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // prevent opening detail modal
                                        setSelectedRideForAssign(ride);
                                        setShowManualAssignModal(true);
                                      }}
                                      className="w-full bg-emerald-600 text-white text-[10px] md:text-xs font-semibold px-2 md:px-3 py-2 md:py-1.5 rounded-md hover:bg-emerald-700 transition min-h-[36px] md:min-h-0 touch-manipulation"
                                    >
                                      Assign Driver
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            {/* Load More Button for Pending Rides */}
                            {totalPendingCount > pendingRidesLimit && (
                              <button
                                onClick={() => setPendingRidesLimit(prev => prev + 10)}
                                className="w-full mt-2 py-2 px-3 text-[10px] md:text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all touch-manipulation min-h-[40px] flex items-center justify-center gap-1"
                                aria-label={`Load more pending rides. ${totalPendingCount - pendingRidesLimit} remaining`}
                              >
                                <span>⬇</span>
                                <span>Load More ({totalPendingCount - pendingRidesLimit} remaining)</span>
                              </button>
                            )}
                          </>
                        );
                      })()
                    )}
                  </div>
                </div>

                {/* Column 2: Driver Fleet */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-3">
                  <div className="flex justify-between items-center mb-2 md:mb-3 gap-2">
                    <h3 className="font-bold text-xs md:text-sm text-gray-800">
                      Driver Fleet (
                      {users
                        .filter((u) => u.role === UserRole.DRIVER)
                        .filter((driver) => {
                          const driverIdStr = driver.id ? String(driver.id) : "";
                          const hasActiveRide = rides.some((r) => {
                            const rideDriverId = r.driverId
                              ? String(r.driverId)
                              : "";
                            return (
                              rideDriverId === driverIdStr &&
                              (r.status === BuggyStatus.ASSIGNED ||
                                r.status === BuggyStatus.ARRIVING ||
                                r.status === BuggyStatus.ON_TRIP)
                            );
                          });
                          const isOnline =
                            driver.updatedAt && Date.now() - driver.updatedAt < 30000;
                          return isOnline || hasActiveRide;
                        }).length}{" "}
                      online)
                    </h3>
                    <div className="flex items-center gap-2">
                      {driverViewMode === "MAP" && (
                        <div className="flex bg-white rounded-lg p-0.5 border border-blue-100 mr-1">
                          <button
                            onClick={() => setDriverFilter("ALL")}
                            className={`px-2 py-1 text-[10px] rounded ${driverFilter === "ALL"
                              ? "bg-blue-100 text-blue-700 font-bold"
                              : "text-slate-400 hover:text-slate-600"
                              }`}
                          >
                            All
                          </button>
                          <button
                            onClick={() => setDriverFilter("AVAILABLE")}
                            className={`px-2 py-1 text-[10px] rounded ${driverFilter === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-700 font-bold"
                              : "text-slate-400 hover:text-slate-600"
                              }`}
                          >
                            Available
                          </button>
                          <button
                            onClick={() => setDriverFilter("BUSY")}
                            className={`px-2 py-1 text-[10px] rounded ${driverFilter === "BUSY"
                              ? "bg-orange-100 text-orange-700 font-bold"
                              : "text-slate-400 hover:text-slate-600"
                              }`}
                          >
                            Busy
                          </button>
                        </div>
                      )}
                      <div className="flex gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => setDriverViewMode("LIST")}
                          className={`p-1.5 md:p-1 rounded transition min-h-[36px] md:min-h-0 touch-manipulation ${driverViewMode === "LIST"
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                          title="List View"
                        >
                          <List size={14} className="md:w-[14px] md:h-[14px]" />
                        </button>
                        <button
                          onClick={() => setDriverViewMode("MAP")}
                          className={`p-1.5 md:p-1 rounded transition min-h-[36px] md:min-h-0 touch-manipulation ${driverViewMode === "MAP"
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                          title="Map View"
                        >
                          <MapIcon size={14} className="md:w-[14px] md:h-[14px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {driverViewMode === "LIST" ? (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                      {(() => {
                        const driverUsers = users.filter(
                          (u) => u.role === UserRole.DRIVER,
                        );

                        // Enhanced sorting: AVAILABLE > BUSY (near completion) > BUSY > OFFLINE
                        const sortedDrivers = driverUsers
                          .map((driver) => {
                            const driverIdStr = driver.id
                              ? String(driver.id)
                              : "";
                            const driverRides = rides.filter((r) => {
                              const rideDriverId = r.driverId
                                ? String(r.driverId)
                                : "";
                              return (
                                rideDriverId === driverIdStr &&
                                (r.status === BuggyStatus.ASSIGNED ||
                                  r.status === BuggyStatus.ARRIVING ||
                                  r.status === BuggyStatus.ON_TRIP)
                              );
                            });
                            const hasActiveRide = driverRides.length > 0;

                            // Determine driver status
                            let driverStatus:
                              | "AVAILABLE"
                              | "BUSY"
                              | "NEAR_COMPLETION"
                              | "OFFLINE" = "OFFLINE";

                            if (hasActiveRide) {
                              // Check if any trip is near completion
                              const hasNearCompletion = driverRides.some(
                                (r) => {
                                  if (
                                    r.status === BuggyStatus.ON_TRIP &&
                                    r.pickedUpAt
                                  ) {
                                    const tripDuration = Math.floor(
                                      (Date.now() - r.pickedUpAt) / 1000,
                                    );
                                    return tripDuration > 180;
                                  }
                                  return false;
                                },
                              );
                              driverStatus = hasNearCompletion
                                ? "NEAR_COMPLETION"
                                : "BUSY";
                            } else {
                              // Check if driver has recent heartbeat (updated_at within last 30 seconds)
                              // This is the PRIMARY way to determine if driver is online
                              if (driver.updatedAt) {
                                const timeSinceUpdate =
                                  Date.now() - driver.updatedAt;
                                if (timeSinceUpdate < 30000) {
                                  // 30 seconds
                                  driverStatus = "AVAILABLE";
                                } else {
                                  // Driver has been offline for more than 30 seconds
                                  driverStatus = "OFFLINE";
                                }
                              } else {
                                // No updatedAt timestamp means driver is offline
                                driverStatus = "OFFLINE";
                              }

                              // Note: We removed the fallback to completed rides because:
                              // 1. A driver who just logged out should be OFFLINE immediately
                              // 2. Heartbeat (updatedAt) is the most reliable indicator of online status
                              // 3. Completed rides can be old and don't indicate current online status
                            }

                            // Calculate priority score (lower = higher priority)
                            let priorityScore = 0;
                            if (driverStatus === "AVAILABLE") priorityScore = 1;
                            else if (driverStatus === "NEAR_COMPLETION")
                              priorityScore = 2;
                            else if (driverStatus === "BUSY") priorityScore = 3;
                            else priorityScore = 4; // OFFLINE

                            return {
                              driver,
                              driverRides,
                              hasActiveRide,
                              driverStatus,
                              priorityScore,
                            };
                          })
                          .sort((a, b) => {
                            // Sort by priority score first
                            if (a.priorityScore !== b.priorityScore) {
                              return a.priorityScore - b.priorityScore;
                            }
                            // Then alphabetically
                            return a.driver.lastName.localeCompare(
                              b.driver.lastName,
                            );
                          });

                        const totalDriverCount = sortedDrivers.length;
                        const paginatedDrivers = sortedDrivers.slice(0, driverListLimit);

                        return (
                          <>
                            {paginatedDrivers.map(
                              ({
                                driver,
                                driverRides,
                                hasActiveRide,
                                driverStatus,
                              }) => {
                                const driverDisplayName =
                                  driver.lastName || "Unknown";
                                const driverLocation = getDriverLocation(driver);

                                // Status styling
                                const statusStyles = {
                                  AVAILABLE: {
                                    bg: "bg-green-50",
                                    border: "border-green-300",
                                    badge: "bg-green-500 text-white",
                                    text: "ONLINE",
                                  },
                                  NEAR_COMPLETION: {
                                    bg: "bg-blue-50",
                                    border: "border-blue-300",
                                    badge: "bg-blue-500 text-white",
                                    text: "FINISHING",
                                  },
                                  BUSY: {
                                    bg: "bg-orange-50",
                                    border: "border-orange-300",
                                    badge: "bg-orange-500 text-white",
                                    text: "BUSY",
                                  },
                                  OFFLINE: {
                                    bg: "bg-gray-50",
                                    border: "border-gray-200",
                                    badge: "bg-gray-400 text-white",
                                    text: "OFFLINE",
                                  },
                                };
                                const style = statusStyles[driverStatus];

                                return (
                                  <div
                                    key={driver.id}
                                    className={`${style.bg} ${style.border} p-2 md:p-2.5 rounded-lg border transition-all duration-200`}
                                  >
                                    {/* Driver Header - Compact */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                                        <span className="font-bold text-xs md:text-sm text-gray-800 truncate">
                                          {driverDisplayName}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 md:gap-1.5 flex-shrink-0">
                                        {hasActiveRide && (
                                          <span className="text-[9px] md:text-[10px] text-gray-600 font-medium">
                                            {driverRides.length} job
                                            {driverRides.length > 1 ? "s" : ""}
                                          </span>
                                        )}
                                        {/* Enhanced Status Badge with Icon and Animation */}
                                        <span
                                          className={`text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 md:py-1 rounded font-bold ${style.badge} flex items-center gap-1 transition-all`}
                                          role="status"
                                          aria-label={`Driver status: ${style.text}`}
                                        >
                                          {/* Status Icon */}
                                          {driverStatus === "AVAILABLE" && (
                                            <>
                                              <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-200"></span>
                                              </span>
                                              <CheckCircle size={10} className="hidden md:inline" aria-hidden="true" />
                                            </>
                                          )}
                                          {driverStatus === "NEAR_COMPLETION" && (
                                            <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                                          )}
                                          {driverStatus === "BUSY" && (
                                            <Car size={10} aria-hidden="true" />
                                          )}
                                          {driverStatus === "OFFLINE" && (
                                            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" aria-hidden="true"></span>
                                          )}
                                          <span>{style.text}</span>
                                        </span>
                                        {/* Toggle Status Button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleDriverStatus(driver);
                                          }}
                                          className={`text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded font-medium text-white transition-colors min-h-[28px] md:min-h-0 touch-manipulation ${driverStatus === "OFFLINE"
                                            ? "bg-emerald-500 hover:bg-emerald-600"
                                            : "bg-red-500 hover:bg-red-600"
                                            }`}
                                          title={
                                            driverStatus === "OFFLINE"
                                              ? "Set driver online"
                                              : "Set driver offline"
                                          }
                                        >
                                          {driverStatus === "OFFLINE"
                                            ? "Set Online"
                                            : "Set Offline"}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Active Rides - Compact List */}
                                    {hasActiveRide && (
                                      <div className="mt-1.5 space-y-1">
                                        {driverRides.map((ride, idx) => {
                                          const tripProgress =
                                            ride.status === BuggyStatus.ON_TRIP &&
                                              ride.pickedUpAt
                                              ? Math.floor(
                                                (Date.now() - ride.pickedUpAt) /
                                                60000,
                                              )
                                              : null;
                                          const guestInfo =
                                            guestInfoCache[ride.roomNumber];

                                          return (
                                            <div
                                              key={ride.id || idx}
                                              className="bg-white/60 rounded px-2 md:px-2.5 py-1.5 border border-gray-200/50"
                                            >
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  {/* Room + Status + Route inline */}
                                                  <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs flex-wrap">
                                                    <span className="font-semibold text-gray-800">
                                                      #{ride.roomNumber}
                                                    </span>
                                                    {guestInfo && (
                                                      <span className="text-gray-500 truncate">
                                                        {guestInfo.last_name}
                                                      </span>
                                                    )}
                                                    <span className="text-[8px] md:text-[9px] text-gray-500">
                                                      {ride.guestCount || 1} pax
                                                    </span>
                                                    <span
                                                      className={`text-[8px] md:text-[9px] px-1 py-0.5 rounded font-bold ${ride.status ===
                                                        BuggyStatus.ON_TRIP
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : ride.status ===
                                                          BuggyStatus.ARRIVING
                                                          ? "bg-blue-100 text-blue-700"
                                                          : "bg-amber-100 text-amber-700"
                                                        }`}
                                                    >
                                                      {ride.status ===
                                                        BuggyStatus.ON_TRIP
                                                        ? "ON-TRIP"
                                                        : ride.status ===
                                                          BuggyStatus.ARRIVING
                                                          ? "ARRIVING"
                                                          : "ASSIGNED"}
                                                    </span>
                                                    {tripProgress !== null && (
                                                      <span className="text-[8px] md:text-[9px] text-gray-500">
                                                        {tripProgress}m
                                                      </span>
                                                    )}
                                                  </div>
                                                  {/* Route */}
                                                  <div className="text-[9px] md:text-[10px] text-gray-600 truncate mt-0.5">
                                                    {ride.pickup} →{" "}
                                                    {ride.destination}
                                                  </div>
                                                </div>
                                                {/* Action Button */}
                                                <button
                                                  onClick={() =>
                                                    ride.status ===
                                                      BuggyStatus.ON_TRIP
                                                      ? handleEndRide(ride.id)
                                                      : handlePickupGuest(ride.id)
                                                  }
                                                  className={`text-[9px] md:text-[10px] px-2 py-1.5 md:py-1 rounded font-medium transition-colors flex-shrink-0 flex items-center gap-1 min-h-[32px] md:min-h-0 touch-manipulation ${ride.status ===
                                                    BuggyStatus.ON_TRIP
                                                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                                                    }`}
                                                >
                                                  {ride.status ===
                                                    BuggyStatus.ON_TRIP ? (
                                                    <>
                                                      <CheckCircle size={12} />
                                                      <span>Completed</span>
                                                    </>
                                                  ) : (
                                                    "Pickup"
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              },
                            )}
                            {/* Load More Button for Driver Fleet */}
                            {totalDriverCount > driverListLimit && (
                              <button
                                onClick={() => setDriverListLimit(prev => prev + 15)}
                                className="w-full mt-2 py-2 px-3 text-[10px] md:text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-all touch-manipulation min-h-[40px] flex items-center justify-center gap-1"
                                aria-label={`Load more drivers. ${totalDriverCount - driverListLimit} remaining`}
                              >
                                <span>⬇</span>
                                <span>Load More ({totalDriverCount - driverListLimit} remaining)</span>
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    // MAP VIEW - Google Maps
                    <div className="flex-1 relative bg-emerald-50 overflow-hidden min-h-[400px] rounded-md border border-gray-200">
                      {mapError ? (
                        <>
                          <img
                            src="https://furamavietnam.com/wp-content/uploads/2018/07/Furama-Resort-Danang-Map-768x552.jpg"
                            loading="lazy"
                            decoding="async"
                            alt="Map"
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                          />
                        </>
                      ) : (
                        <div ref={mapRef} className="w-full h-full" />
                      )}
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur p-2 rounded text-[10px] shadow border border-gray-200 z-10">
                        <div className="flex items-center mb-1 text-gray-800">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></div>{" "}
                          Available Driver
                        </div>
                        <div className="flex items-center text-gray-800">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5"></div>{" "}
                          Busy / On Trip
                        </div>
                        {mapError && (
                          <div className="mt-1 text-red-500 font-bold text-[9px] flex items-center">
                            <AlertTriangle size={8} className="mr-1" /> Static View
                            (Map Error)
                          </div>
                        )}
                        {!mapError && (
                          <div className="mt-1 text-emerald-600 font-bold text-[9px] flex items-center">
                            <MapPin size={8} className="mr-1" /> Real-time GPS Tracking
                          </div>
                        )}
                      </div>
                      {!mapError && mapInstance && (
                        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                          <button
                            onClick={() =>
                              mapInstance.setZoom(mapInstance.getZoom()! + 1)
                            }
                            className="bg-white/90 backdrop-blur p-1.5 rounded shadow border border-gray-200 hover:bg-white transition"
                            title="Zoom In"
                          >
                            <ZoomIn size={14} className="text-gray-700" />
                          </button>
                          <button
                            onClick={() =>
                              mapInstance.setZoom(mapInstance.getZoom()! - 1)
                            }
                            className="bg-white/90 backdrop-blur p-1.5 rounded shadow border border-gray-200 hover:bg-white transition"
                            title="Zoom Out"
                          >
                            <ZoomOut size={14} className="text-gray-700" />
                          </button>
                          <button
                            onClick={() => {
                              if (mapInstance) {
                                const driverUsers = users.filter(
                                  (u) => u.role === UserRole.DRIVER,
                                );
                                const bounds = new (window as any).google.maps.LatLngBounds();
                                driverUsers.forEach((driver) => {
                                  const driverIdStr = driver.id
                                    ? String(driver.id)
                                    : "";
                                  const hasActiveRide = rides.some((r) => {
                                    const rideDriverId = r.driverId
                                      ? String(r.driverId)
                                      : "";
                                    return (
                                      rideDriverId === driverIdStr &&
                                      (r.status === BuggyStatus.ASSIGNED ||
                                        r.status === BuggyStatus.ARRIVING ||
                                        r.status === BuggyStatus.ON_TRIP)
                                    );
                                  });
                                  const isOnline =
                                    driver.updatedAt &&
                                    Date.now() - driver.updatedAt < 30000;
                                  if (isOnline || hasActiveRide) {
                                    const coords = resolveDriverCoordinates(driver);
                                    bounds.extend(coords);
                                  }
                                });
                                mapInstance.fitBounds(bounds);
                              }
                            }}
                            className="bg-white/90 backdrop-blur p-1.5 rounded shadow border border-gray-200 hover:bg-white transition"
                            title="Fit All Drivers"
                          >
                            <Navigation size={14} className="text-gray-700" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Column 3: Recent Completed - Hidden on mobile */}
                <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-3">
                  <div className="flex justify-between items-center mb-2 md:mb-3">
                    <h3 className="font-bold text-xs md:text-sm text-gray-800">
                      Recent Completed
                    </h3>
                  </div>

                  {/* Recent Completed Section */}
                  <div className="pt-3">
                    <div className="space-y-1.5 max-h-[450px] overflow-y-auto">
                      {(() => {
                        // Sort completed rides by completion time (most recent first)
                        const completedRides = rides
                          .filter((r) => r.status === BuggyStatus.COMPLETED)
                          .sort((a, b) => {
                            const timeA = a.completedAt || a.timestamp || 0;
                            const timeB = b.completedAt || b.timestamp || 0;
                            return timeB - timeA; // Most recent first
                          })
                          .slice(0, 5);

                        return completedRides.map((ride) => {
                          // Find driver name
                          const rideDriverId = ride.driverId
                            ? String(ride.driverId)
                            : "";
                          const driver = users.find((u) => {
                            const userIdStr = u.id ? String(u.id) : "";
                            return userIdStr === rideDriverId;
                          });
                          const driverName = driver
                            ? driver.lastName || "Unknown"
                            : "N/A";

                          // Calculate time ago
                          const completedTime =
                            ride.completedAt || ride.timestamp || Date.now();
                          const timeAgo = Math.floor(
                            (Date.now() - completedTime) / 1000 / 60,
                          ); // minutes ago
                          let timeAgoText = "";
                          if (timeAgo < 1) {
                            timeAgoText = "Just now";
                          } else if (timeAgo < 60) {
                            timeAgoText = `${timeAgo}m ago`;
                          } else {
                            const hoursAgo = Math.floor(timeAgo / 60);
                            timeAgoText = `${hoursAgo}h ago`;
                          }

                          // Truncate pickup and destination if too long
                          const truncateText = (
                            text: string,
                            maxLength: number = 20,
                          ) => {
                            if (text.length <= maxLength) return text;
                            return text.substring(0, maxLength - 3) + "...";
                          };

                          return (
                            <div
                              key={ride.id}
                              className="bg-gray-50 p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              {/* Header Row: Room + Driver + Pax + Time */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-semibold text-sm text-gray-800">
                                    #{ride.roomNumber}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {driverName}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {ride.guestCount || 1} pax
                                  </span>
                                  {ride.rating && (
                                    <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-yellow-100 text-yellow-700">
                                      ★{ride.rating}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-[9px] px-1 py-0.5 rounded font-bold bg-green-100 text-green-700">
                                    COMPLETED
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {timeAgoText}
                                  </span>
                                </div>
                              </div>

                              {/* Route Row */}
                              <div className="flex items-center gap-1.5 text-xs mt-1">
                                <span className="text-gray-500">From:</span>
                                <span className="text-gray-700 font-medium truncate">
                                  {ride.pickup}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="text-gray-500">To:</span>
                                <span className="text-gray-700 font-medium truncate">
                                  {ride.destination}
                                </span>
                              </div>

                              {/* Notes - if exists */}
                              {ride.notes && ride.notes.trim() && (
                                <div className="text-[10px] text-amber-600 truncate mt-0.5">
                                  Note: {ride.notes}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                      {rides.filter((r) => r.status === BuggyStatus.COMPLETED)
                        .length === 0 && (
                          <div className="text-center py-3 text-gray-400 text-[10px]">
                            No completed trips yet.
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Merge Options Modal */}
          {showMergeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="bg-blue-600 text-white p-3 md:p-4 flex justify-between items-center rounded-t-xl flex-shrink-0">
                  <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                    🔗 Merge Options
                  </h3>
                  <button
                    onClick={() => setShowMergeModal(false)}
                    className="text-white hover:text-gray-200 transition min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 touch-manipulation flex items-center justify-center"
                  >
                    <X size={20} className="md:w-6 md:h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 md:p-4 overflow-y-auto flex-1">
                  {(() => {
                    const pendingRides = rides.filter(
                      (r) => r.status === BuggyStatus.SEARCHING,
                    );
                    const mergeOptions: Array<{
                      ride1: RideRequest;
                      ride2: RideRequest;
                      totalGuests: number;
                      isSameRoute: boolean;
                      key: string;
                      optimalRoute: {
                        pickup: string;
                        destination: string;
                        routePath: string[];
                        segments: RouteSegment[];
                        isChainTrip: boolean;
                      };
                    }> = [];

                    // Find all combinable pairs
                    for (let i = 0; i < pendingRides.length - 1; i++) {
                      for (let j = i + 1; j < pendingRides.length; j++) {
                        if (canCombineRides(pendingRides[i], pendingRides[j])) {
                          const ride1 = pendingRides[i];
                          const ride2 = pendingRides[j];
                          const totalGuests =
                            (ride1.guestCount || 1) + (ride2.guestCount || 1);
                          const optimalRoute = calculateOptimalMergeRoute(
                            ride1,
                            ride2,
                          );
                          const isSameRoute =
                            ride1.pickup === ride2.pickup &&
                            ride1.destination === ride2.destination;

                          mergeOptions.push({
                            ride1,
                            ride2,
                            totalGuests,
                            isSameRoute:
                              isSameRoute || optimalRoute.isChainTrip,
                            key: `merge-${ride1.id}-${ride2.id}`,
                            optimalRoute,
                          });
                        }
                      }
                    }

                    if (mergeOptions.length === 0) {
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-base md:text-lg">No merge options available</p>
                          <p className="text-xs md:text-sm mt-2 px-4">
                            Need at least 2 pending rides with combined guests ≤
                            7
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        <p className="text-xs md:text-sm text-gray-600 mb-3">
                          Found {mergeOptions.length} merge option
                          {mergeOptions.length > 1 ? "s" : ""}. Click "Merge" to
                          combine.
                        </p>
                        {mergeOptions.map(
                          ({
                            ride1,
                            ride2,
                            totalGuests,
                            isSameRoute,
                            key,
                            optimalRoute,
                          }) => (
                            <div
                              key={key}
                              className="p-2 bg-blue-50 border border-blue-200 rounded-lg"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  {/* Header row: Guest Names + Tags + Routes */}
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                      {ride1.guestName || "Guest"}
                                    </span>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-300 font-semibold text-xs">
                                      ({ride1.pickup} → {ride1.destination})
                                    </span>
                                    <span className="text-blue-400 text-xs">
                                      +
                                    </span>
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                                      {ride2.guestName || "Guest"}
                                    </span>
                                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-300 font-semibold text-xs">
                                      ({ride2.pickup} → {ride2.destination})
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                      •
                                    </span>
                                    <span className="text-xs text-gray-600">
                                      {totalGuests}/7 pax
                                    </span>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded ${isSameRoute
                                        ? "bg-green-100 text-green-700"
                                        : "bg-yellow-100 text-yellow-700"
                                        }`}
                                    >
                                      {isSameRoute
                                        ? "Same"
                                        : optimalRoute.isChainTrip
                                          ? "Chain"
                                          : "Merge"}
                                    </span>
                                  </div>

                                  {/* Optimal merged route - show detailed segments */}
                                  <div className="mt-3">
                                    <div className="text-xs text-gray-700 font-semibold mb-2 flex items-center gap-1.5">
                                      <MapPin
                                        size={13}
                                        className="text-gray-600"
                                      />
                                      <span>Optimized Route</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                                      {(() => {
                                        // Track guest pickup/dropoff status
                                        const guestStatus: Record<
                                          string,
                                          {
                                            pickedUp: boolean;
                                            dropped: boolean;
                                            roomNumber: string;
                                            guestCount: number;
                                          }
                                        > = {
                                          [ride1.guestName || "Guest1"]: {
                                            pickedUp: false,
                                            dropped: false,
                                            roomNumber: ride1.roomNumber,
                                            guestCount: ride1.guestCount || 1,
                                          },
                                          [ride2.guestName || "Guest2"]: {
                                            pickedUp: false,
                                            dropped: false,
                                            roomNumber: ride2.roomNumber,
                                            guestCount: ride2.guestCount || 1,
                                          },
                                        };

                                        const allActions: Array<{
                                          type: "pickup" | "dropoff" | "move";
                                          location: string;
                                          guests: Array<{
                                            name: string;
                                            roomNumber: string;
                                            guestCount: number;
                                          }>;
                                          segment?: RouteSegment;
                                        }> = [];

                                        // Process each segment to extract actions
                                        optimalRoute.segments.forEach(
                                          (segment, idx) => {
                                            // Determine which guests are picked up at segment.from
                                            const pickedUpGuests: Array<{
                                              name: string;
                                              roomNumber: string;
                                              guestCount: number;
                                            }> = [];
                                            if (
                                              segment.from === ride1.pickup &&
                                              !guestStatus[
                                                ride1.guestName || "Guest1"
                                              ].pickedUp
                                            ) {
                                              pickedUpGuests.push({
                                                name:
                                                  ride1.guestName || "Guest",
                                                roomNumber: ride1.roomNumber,
                                                guestCount:
                                                  ride1.guestCount || 1,
                                              });
                                              guestStatus[
                                                ride1.guestName || "Guest1"
                                              ].pickedUp = true;
                                            }
                                            if (
                                              segment.from === ride2.pickup &&
                                              !guestStatus[
                                                ride2.guestName || "Guest2"
                                              ].pickedUp
                                            ) {
                                              pickedUpGuests.push({
                                                name:
                                                  ride2.guestName || "Guest",
                                                roomNumber: ride2.roomNumber,
                                                guestCount:
                                                  ride2.guestCount || 1,
                                              });
                                              guestStatus[
                                                ride2.guestName || "Guest2"
                                              ].pickedUp = true;
                                            }

                                            // Determine which guests are dropped off at segment.to
                                            // Check both rides - both guests can be dropped at the same location
                                            const droppedGuests: Array<{
                                              name: string;
                                              roomNumber: string;
                                              guestCount: number;
                                            }> = [];

                                            // Check ride1
                                            if (
                                              segment.to ===
                                              ride1.destination &&
                                              guestStatus[
                                                ride1.guestName || "Guest1"
                                              ].pickedUp &&
                                              !guestStatus[
                                                ride1.guestName || "Guest1"
                                              ].dropped
                                            ) {
                                              droppedGuests.push({
                                                name:
                                                  ride1.guestName || "Guest",
                                                roomNumber: ride1.roomNumber,
                                                guestCount:
                                                  ride1.guestCount || 1,
                                              });
                                              guestStatus[
                                                ride1.guestName || "Guest1"
                                              ].dropped = true;
                                            }

                                            // Check ride2 - can be dropped at the same location as ride1
                                            if (
                                              segment.to ===
                                              ride2.destination &&
                                              guestStatus[
                                                ride2.guestName || "Guest2"
                                              ].pickedUp &&
                                              !guestStatus[
                                                ride2.guestName || "Guest2"
                                              ].dropped
                                            ) {
                                              droppedGuests.push({
                                                name:
                                                  ride2.guestName || "Guest",
                                                roomNumber: ride2.roomNumber,
                                                guestCount:
                                                  ride2.guestCount || 1,
                                              });
                                              guestStatus[
                                                ride2.guestName || "Guest2"
                                              ].dropped = true;
                                            }

                                            // Add pickup action if any
                                            if (pickedUpGuests.length > 0) {
                                              allActions.push({
                                                type: "pickup",
                                                location: segment.from,
                                                guests: pickedUpGuests,
                                                segment,
                                              });
                                            }

                                            // Add dropoff action if any
                                            if (droppedGuests.length > 0) {
                                              allActions.push({
                                                type: "dropoff",
                                                location: segment.to,
                                                guests: droppedGuests,
                                                segment,
                                              });
                                            }

                                            // Only add move/transit action if there's no pickup/dropoff at the destination
                                            // This prevents redundant move actions when we already have pickup/dropoff actions
                                            const hasActionAtDestination =
                                              pickedUpGuests.length > 0 ||
                                              droppedGuests.length > 0;
                                            if (!hasActionAtDestination) {
                                              allActions.push({
                                                type: "move",
                                                location: `${segment.from} → ${segment.to}`,
                                                guests: [],
                                                segment,
                                              });
                                            } else if (
                                              pickedUpGuests.length === 0 &&
                                              droppedGuests.length === 0
                                            ) {
                                              // Only add move if there's no action at destination AND no action at source
                                              // But if we have pickup at source, we still need move to show route
                                              const nextSegment =
                                                optimalRoute.segments[idx + 1];
                                              const needsMoveToShowRoute =
                                                segment.from !== segment.to;
                                              if (needsMoveToShowRoute) {
                                                allActions.push({
                                                  type: "move",
                                                  location: `${segment.from} → ${segment.to}`,
                                                  guests: [],
                                                  segment,
                                                });
                                              }
                                            }
                                          },
                                        );

                                        // Merge consecutive actions: if move action ends at a location and next action is pickup/dropoff at that location
                                        // Also merge multiple dropoff/pickup actions at the same location
                                        const mergedActions: typeof allActions =
                                          [];
                                        for (
                                          let i = 0;
                                          i < allActions.length;
                                          i++
                                        ) {
                                          const current = allActions[i];
                                          const next = allActions[i + 1];

                                          // If current is move action and next is pickup at the destination
                                          if (
                                            current.type === "move" &&
                                            current.segment &&
                                            next &&
                                            next.type === "pickup" &&
                                            next.location === current.segment.to
                                          ) {
                                            // Collect all consecutive pickup actions at the same location
                                            const allPickupGuests = [
                                              ...next.guests,
                                            ];
                                            let j = i + 2;
                                            while (
                                              j < allActions.length &&
                                              allActions[j].type === "pickup" &&
                                              allActions[j].location ===
                                              next.location
                                            ) {
                                              allPickupGuests.push(
                                                ...allActions[j].guests,
                                              );
                                              j++;
                                            }

                                            // Merge: show move with pickup info
                                            mergedActions.push({
                                              type: "pickup",
                                              location: next.location,
                                              guests: allPickupGuests,
                                              segment: current.segment,
                                            });
                                            i = j - 1; // Skip all merged actions
                                          }
                                          // If current is move action and next is dropoff at the destination
                                          else if (
                                            current.type === "move" &&
                                            current.segment &&
                                            next &&
                                            next.type === "dropoff" &&
                                            next.location === current.segment.to
                                          ) {
                                            // Collect all consecutive dropoff actions at the same location (including move actions that lead to the same dropoff)
                                            const allDropoffGuests = [
                                              ...next.guests,
                                            ];
                                            let j = i + 2;
                                            // Skip any move actions that lead to the same dropoff location
                                            while (j < allActions.length) {
                                              if (
                                                allActions[j].type ===
                                                "dropoff" &&
                                                allActions[j].location ===
                                                next.location
                                              ) {
                                                allDropoffGuests.push(
                                                  ...allActions[j].guests,
                                                );
                                                j++;
                                              } else if (
                                                allActions[j].type === "move" &&
                                                allActions[j].segment &&
                                                allActions[j].segment.to ===
                                                next.location
                                              ) {
                                                // Skip move actions that lead to the same dropoff location
                                                j++;
                                              } else {
                                                break;
                                              }
                                            }

                                            // Merge: show move with dropoff info
                                            mergedActions.push({
                                              type: "dropoff",
                                              location: next.location,
                                              guests: allDropoffGuests,
                                              segment: current.segment,
                                            });
                                            i = j - 1; // Skip all merged actions
                                          }
                                          // If current is dropoff and next is move to the same location, merge them (dropoff before move)
                                          else if (
                                            current.type === "dropoff" &&
                                            next &&
                                            next.type === "move" &&
                                            next.segment &&
                                            next.segment.to ===
                                            current.location &&
                                            next.segment.from ===
                                            current.segment?.from
                                          ) {
                                            // Merge: show move with dropoff info
                                            mergedActions.push({
                                              type: "dropoff",
                                              location: current.location,
                                              guests: current.guests,
                                              segment: current.segment,
                                            });
                                            i++; // Skip next move action as it's merged
                                          }
                                          // If current is dropoff and next is also dropoff at the same location, merge them
                                          else if (
                                            current.type === "dropoff" &&
                                            next &&
                                            next.type === "dropoff" &&
                                            next.location === current.location
                                          ) {
                                            const allDropoffGuests = [
                                              ...current.guests,
                                              ...next.guests,
                                            ];
                                            mergedActions.push({
                                              type: "dropoff",
                                              location: current.location,
                                              guests: allDropoffGuests,
                                              segment:
                                                current.segment || next.segment,
                                            });
                                            i++; // Skip next action as it's merged
                                          }
                                          // If current is pickup and next is move to the same location, merge them (pickup before move)
                                          else if (
                                            current.type === "pickup" &&
                                            next &&
                                            next.type === "move" &&
                                            next.segment &&
                                            next.segment.to ===
                                            current.location &&
                                            next.segment.from ===
                                            current.segment?.from
                                          ) {
                                            // Merge: show move with pickup info
                                            mergedActions.push({
                                              type: "pickup",
                                              location: current.location,
                                              guests: current.guests,
                                              segment: current.segment,
                                            });
                                            i++; // Skip next move action as it's merged
                                          }
                                          // Skip standalone move actions that duplicate dropoff/pickup locations
                                          else if (
                                            current.type === "move" &&
                                            current.segment
                                          ) {
                                            // Check if this move is redundant (same as previous dropoff/pickup)
                                            const prevAction =
                                              mergedActions[
                                              mergedActions.length - 1
                                              ];
                                            if (
                                              prevAction &&
                                              ((prevAction.type === "dropoff" &&
                                                prevAction.location ===
                                                current.segment.to) ||
                                                (prevAction.type === "pickup" &&
                                                  prevAction.location ===
                                                  current.segment.to))
                                            ) {
                                              // Skip this redundant move action
                                              continue;
                                            }
                                            mergedActions.push(current);
                                          } else {
                                            mergedActions.push(current);
                                          }
                                        }

                                        // Replace allActions with mergedActions
                                        allActions.length = 0;
                                        allActions.push(...mergedActions);

                                        // If no actions were created, show segments directly
                                        if (
                                          allActions.length === 0 &&
                                          optimalRoute.segments.length > 0
                                        ) {
                                          return (
                                            <div className="space-y-2.5">
                                              {optimalRoute.segments.map(
                                                (segment, idx) => (
                                                  <div
                                                    key={idx}
                                                    className="flex items-start gap-3"
                                                  >
                                                    <div className="flex-shrink-0 w-6 h-6 bg-white border-2 border-gray-300 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                                                      {idx + 1}
                                                    </div>
                                                    <div className="flex-1 flex items-center gap-1.5 text-xs pt-0.5">
                                                      <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">
                                                        {segment.from}
                                                      </span>
                                                      <ArrowRight
                                                        size={11}
                                                        className="text-gray-400"
                                                      />
                                                      <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">
                                                        {segment.to}
                                                      </span>
                                                    </div>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          );
                                        }

                                        return (
                                          <div className="space-y-2.5">
                                            {allActions.map((action, idx) => (
                                              <div
                                                key={idx}
                                                className="flex items-start gap-3"
                                              >
                                                {/* Step number */}
                                                <div className="flex-shrink-0 w-6 h-6 bg-white border-2 border-gray-300 text-gray-700 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm">
                                                  {idx + 1}
                                                </div>

                                                {/* Action content */}
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                  {action.type === "pickup" && (
                                                    <div className="flex flex-col gap-1.5">
                                                      {/* Route path if exists */}
                                                      {action.segment &&
                                                        action.segment.from !==
                                                        action.location && (
                                                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            <span className="font-medium">
                                                              {
                                                                action.segment
                                                                  .from
                                                              }
                                                            </span>
                                                            <ArrowRight
                                                              size={11}
                                                              className="text-gray-400"
                                                            />
                                                            <span className="font-medium">
                                                              {action.location}
                                                            </span>
                                                          </div>
                                                        )}
                                                      {/* Action details */}
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md border border-blue-200 font-medium text-xs">
                                                          <Users size={11} />
                                                          Pick up
                                                        </span>
                                                        {action.guests.map(
                                                          (guest, gIdx) => (
                                                            <span
                                                              key={gIdx}
                                                              className="bg-white text-gray-800 px-2 py-0.5 rounded border border-gray-300 font-medium text-xs shadow-sm"
                                                            >
                                                              {guest.name}
                                                            </span>
                                                          ),
                                                        )}
                                                        <span className="text-gray-500 text-xs font-medium">
                                                          at
                                                        </span>
                                                        <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold text-xs shadow-sm">
                                                          {action.location}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  )}

                                                  {action.type ===
                                                    "dropoff" && (
                                                      <div className="flex flex-col gap-1.5">
                                                        {/* Route path if exists */}
                                                        {action.segment &&
                                                          action.segment.from !==
                                                          action.location && (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                              <span className="font-medium">
                                                                {
                                                                  action.segment
                                                                    .from
                                                                }
                                                              </span>
                                                              <ArrowRight
                                                                size={11}
                                                                className="text-gray-400"
                                                              />
                                                              <span className="font-medium">
                                                                {action.location}
                                                              </span>
                                                            </div>
                                                          )}
                                                        {/* Action details */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 px-2.5 py-1 rounded-md border border-green-200 font-medium text-xs">
                                                            <CheckCircle
                                                              size={11}
                                                            />
                                                            Drop off
                                                          </span>
                                                          {action.guests.map(
                                                            (guest, gIdx) => (
                                                              <span
                                                                key={gIdx}
                                                                className="bg-white text-gray-800 px-2 py-0.5 rounded border border-gray-300 font-medium text-xs shadow-sm"
                                                              >
                                                                {guest.name}
                                                              </span>
                                                            ),
                                                          )}
                                                          <span className="text-gray-500 text-xs font-medium">
                                                            at
                                                          </span>
                                                          <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold text-xs shadow-sm">
                                                            {action.location}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    )}

                                                  {action.type === "move" &&
                                                    action.segment && (
                                                      <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">
                                                          {action.segment.from}
                                                        </span>
                                                        <ArrowRight
                                                          size={11}
                                                          className="text-gray-400"
                                                        />
                                                        <span className="bg-white text-gray-900 px-2 py-0.5 rounded border border-gray-300 font-semibold shadow-sm">
                                                          {action.segment.to}
                                                        </span>
                                                      </div>
                                                    )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  {/* Notes - inline if exists */}
                                  {(ride1.notes || ride2.notes) && (
                                    <div className="mt-1 text-xs text-amber-600 truncate">
                                      Note:{" "}
                                      {[ride1.notes, ride2.notes]
                                        .filter((n) => n?.trim())
                                        .join(" | ")}
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    handleMergeRides(ride1.id!, ride2.id!);
                                    setShowMergeModal(false);
                                  }}
                                  className={`px-3 md:px-3 py-2 md:py-1.5 rounded-md font-medium text-xs transition hover:scale-105 flex-shrink-0 min-h-[44px] md:min-h-0 touch-manipulation ${isSameRoute
                                    ? "bg-green-500 text-white hover:bg-green-600"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                                    }`}
                                >
                                  Merge
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Footer */}
                <div className="p-3 md:p-4 border-t bg-gray-50 flex justify-end">
                  <button
                    onClick={() => setShowMergeModal(false)}
                    className="w-full sm:w-auto px-4 py-3 md:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition text-base md:text-sm min-h-[44px] md:min-h-0 touch-manipulation"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create New Ride Modal - Centered on Mobile */}
          {showCreateRideModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
                <div className="bg-white border-b border-gray-200 p-3 flex justify-between items-center z-10 rounded-t-2xl">
                  <h3 className="font-bold text-base md:text-lg text-gray-900">
                    Tạo Chuyến Mới
                  </h3>
                  <button
                    onClick={() => setShowCreateRideModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 touch-manipulation flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="relative p-6 flex flex-col items-center bg-gradient-to-b from-blue-50/80 to-white border-b border-blue-100 overflow-hidden">
                  {/* Glowing background effect */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl animate-pulse pointer-events-none"></div>

                  <button
                    type="button"
                    onClick={handleVoiceAssistantStart}
                    className="group relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-600/30 flex items-center justify-center hover:scale-110 transition-all duration-300 ring-4 ring-white z-10"
                  >
                    {/* Inner highlight */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <Mic size={32} className="md:w-10 md:h-10 drop-shadow-sm group-hover:drop-shadow-md transition-all" />

                    {isListening && (
                      <>
                        <span className="absolute inset-0 rounded-full border-4 border-red-400/50 animate-ping"></span>
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        </span>
                      </>
                    )}
                  </button>

                  <div className="mt-4 text-center z-10 relative">
                    <h4 className="font-bold text-gray-900 text-sm md:text-base mb-1 tracking-tight">
                      Trợ Lý Giọng Nói AI
                    </h4>
                    <p className="text-blue-600 font-medium text-xs md:text-sm bg-blue-50 px-3 py-1 rounded-full border border-blue-100 inline-block">
                      Chạm vào micro để nói
                    </p>
                  </div>
                </div>

                {/* Form Section - Compact layout to avoid scroll */}
                <div className="p-3 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Row 1: Room + Guest Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                        Phòng
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={newRideData.roomNumber}
                        placeholder="VD: 101"
                        onChange={(e) =>
                          setNewRideData((p) => ({
                            ...p,
                            roomNumber: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setLocationModal({ isOpen: true, type: "pickup" });
                            setLocationFilterType("ALL");
                            setPickupSearchQuery("");
                          }
                        }}
                        className="w-full px-2.5 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base shadow-sm min-h-[44px] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                        Tên Khách <span className="text-gray-400 font-normal normal-case">(tùy chọn)</span>
                      </label>
                      <input
                        type="text"
                        value={newRideData.guestName}
                        placeholder="Tên khách"
                        onChange={(e) =>
                          setNewRideData((p) => ({
                            ...p,
                            guestName: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base shadow-sm min-h-[44px] transition-colors"
                      />
                    </div>
                    {/* Row 2: Pickup + Destination */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                        Điểm Đón
                      </label>
                      <input
                        type="text"
                        value={newRideData.pickup}
                        placeholder="Chọn điểm đón"
                        readOnly
                        onClick={() => {
                          setLocationModal({ isOpen: true, type: "pickup" });
                          setLocationFilterType("ALL");
                          setPickupSearchQuery("");
                        }}
                        className="w-full px-2.5 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 hover:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer placeholder:text-gray-400 text-base shadow-sm min-h-[44px] touch-manipulation transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                        Điểm Đến
                      </label>
                      <input
                        type="text"
                        value={newRideData.destination}
                        placeholder="Chọn điểm đến"
                        readOnly
                        onClick={() => {
                          setLocationModal({
                            isOpen: true,
                            type: "destination",
                          });
                          setLocationFilterType("ALL");
                          setDestinationSearchQuery("");
                        }}
                        className="w-full px-2.5 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 hover:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer placeholder:text-gray-400 text-base shadow-sm min-h-[44px] touch-manipulation transition-colors"
                      />
                    </div>
                    {/* Row 3: Guest Count + Notes (compact) */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                        Số Khách
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewRideData(p => ({ ...p, guestCount: Math.max(1, (p.guestCount || 1) - 1) }))}
                          className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-300 active:bg-gray-400 touch-manipulation font-bold text-xl transition-colors"
                        >
                          -
                        </button>
                        <div className="flex-1 text-center font-bold text-gray-900 text-lg md:text-xl py-2 bg-gray-50 border-2 border-gray-300 rounded-lg min-h-[44px] flex items-center justify-center">
                          {newRideData.guestCount || 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewRideData(p => ({ ...p, guestCount: Math.min(7, (p.guestCount || 1) + 1) }))}
                          className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-300 active:bg-gray-400 touch-manipulation font-bold text-xl transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                        Ghi Chú
                      </label>
                      <input
                        type="text"
                        value={newRideData.notes}
                        placeholder="Ghi chú (tùy chọn)"
                        onChange={(e) =>
                          setNewRideData((p) => ({
                            ...p,
                            notes: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base shadow-sm min-h-[44px] transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 md:p-4 border-t bg-gray-50 flex justify-end gap-3 z-10 rounded-b-2xl">
                  <button
                    onClick={() => setShowCreateRideModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors min-h-[44px] md:min-h-0"
                    disabled={isCreatingRide}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateRide}
                    disabled={isCreatingRide || !newRideData.roomNumber || !newRideData.pickup || !newRideData.destination}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2 min-h-[44px] md:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingRide ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Tạo Chuyến
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {locationModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
                <div className="p-3 md:p-4 border-b flex justify-between items-center">
                  <h3 className="text-sm md:text-base lg:text-lg font-bold text-gray-800">
                    {locationModal.type === "pickup"
                      ? "Select Pickup Location"
                      : "Select Destination"}
                  </h3>
                  <button
                    onClick={() => {
                      setLocationModal({ isOpen: false, type: null });
                      setLocationFilterType("ALL");
                      if (locationModal.type === "pickup") {
                        setPickupSearchQuery("");
                      } else {
                        setDestinationSearchQuery("");
                      }
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 touch-manipulation flex items-center justify-center"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-3 md:p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    className="w-full px-3 py-3 md:py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-base md:text-sm min-h-[44px] md:min-h-0"
                    onChange={(e) =>
                      locationModal.type === "pickup"
                        ? setPickupSearchQuery(e.target.value)
                        : setDestinationSearchQuery(e.target.value)
                    }
                  />
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setLocationFilterType("ALL")}
                      className={`px-3 md:px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap flex-shrink-0 min-h-[44px] md:min-h-0 touch-manipulation ${locationFilterType === "ALL"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setLocationFilterType("RESTAURANT")}
                      className={`px-3 md:px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap flex-shrink-0 min-h-[44px] md:min-h-0 touch-manipulation ${locationFilterType === "RESTAURANT"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      Restaurant
                    </button>
                    <button
                      onClick={() => setLocationFilterType("FACILITY")}
                      className={`px-3 md:px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap flex-shrink-0 min-h-[44px] md:min-h-0 touch-manipulation ${locationFilterType === "FACILITY"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                      Public Areas
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 md:p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {getFilteredLocations(
                      locationModal.type === "pickup"
                        ? pickupSearchQuery
                        : destinationSearchQuery,
                      locationFilterType,
                    ).map((loc) => {
                      const otherSelection =
                        locationModal.type === "pickup"
                          ? newRideData.destination
                          : newRideData.pickup;
                      const isSelected = loc.name === otherSelection;
                      return (
                        <button
                          key={loc.id}
                          disabled={isSelected}
                          onClick={() => {
                            if (locationModal.type === "pickup") {
                              setNewRideData((p) => ({
                                ...p,
                                pickup: loc.name,
                              }));
                              // Auto-advance to Destination
                              setLocationModal({ isOpen: true, type: "destination" });
                              setLocationFilterType("ALL");
                              setPickupSearchQuery(""); // Clear pickup query
                              setDestinationSearchQuery(""); // Ensure dest query is empty
                            } else {
                              setNewRideData((p) => ({
                                ...p,
                                destination: loc.name,
                              }));
                              setLocationModal({ isOpen: false, type: null });
                              setLocationFilterType("ALL");
                              setDestinationSearchQuery("");
                            }
                          }}
                          className={`w-full text-center p-3 md:p-2.5 rounded-lg transition text-xs md:text-sm min-h-[44px] md:min-h-0 touch-manipulation ${isSelected ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"}`}
                        >
                          {loc.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="p-3 md:p-4 border-t bg-gray-50 flex justify-end">
                  <button
                    onClick={() => {
                      setLocationModal({ isOpen: false, type: null });
                      setLocationFilterType("ALL");
                      if (locationModal.type === "pickup") {
                        setPickupSearchQuery("");
                      } else {
                        setDestinationSearchQuery("");
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-3 md:py-2.5 bg-gray-200 text-gray-700 rounded-lg text-base md:text-sm min-h-[44px] md:min-h-0 touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Ride Detail Modal */}
      {
        showDetailRequestModal &&
        selectedRideForDetail &&
        (() => {
          const renderRouteSteps = () => {
            if (!selectedRideForDetail) return null;

            if (
              !selectedRideForDetail.isMerged ||
              !selectedRideForDetail.segments ||
              selectedRideForDetail.segments.length === 0
            ) {
              return (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Pickup</p>
                      <p className="text-gray-600">
                        {selectedRideForDetail.guestName} at{" "}
                        {selectedRideForDetail.pickup}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Drop-off</p>
                      <p className="text-gray-600">
                        {selectedRideForDetail.guestName} at{" "}
                        {selectedRideForDetail.destination}
                      </p>
                    </div>
                  </div>
                </>
              );
            }

            const locationActions: Record<
              string,
              { pickups: any[]; dropoffs: any[] }
            > = {};

            let onBoard: { roomNumber: string; name: string }[] = [];
            selectedRideForDetail.segments.forEach((segment) => {
              const onBoardInSegment = segment.onBoard.map((g) => ({
                name: g.name,
                roomNumber: g.roomNumber,
              }));

              const pickups = onBoardInSegment.filter(
                (g) => !onBoard.some((ob) => ob.roomNumber === g.roomNumber),
              );
              if (pickups.length > 0) {
                if (!locationActions[segment.from])
                  locationActions[segment.from] = { pickups: [], dropoffs: [] };
                locationActions[segment.from].pickups.push(...pickups);
              }

              const dropoffs = onBoard.filter(
                (g) =>
                  !onBoardInSegment.some(
                    (ob) => ob.roomNumber === g.roomNumber,
                  ),
              );
              if (dropoffs.length > 0) {
                if (!locationActions[segment.from])
                  locationActions[segment.from] = { pickups: [], dropoffs: [] };
                locationActions[segment.from].dropoffs.push(...dropoffs);
              }

              onBoard = onBoardInSegment;
            });

            const lastSegment =
              selectedRideForDetail.segments[
              selectedRideForDetail.segments.length - 1
              ];
            if (lastSegment.onBoard.length > 0) {
              if (!locationActions[lastSegment.to])
                locationActions[lastSegment.to] = { pickups: [], dropoffs: [] };
              locationActions[lastSegment.to].dropoffs.push(
                ...lastSegment.onBoard.map((g) => ({
                  name: g.name,
                  roomNumber: g.roomNumber,
                })),
              );
            }

            const routePath = [
              selectedRideForDetail.segments[0].from,
              ...selectedRideForDetail.segments.map((s) => s.to),
            ];
            const uniqueStops = Array.from(new Set(routePath));

            return uniqueStops
              .map((location, index) => {
                const actions = locationActions[location];
                if (
                  !actions ||
                  (actions.pickups.length === 0 &&
                    actions.dropoffs.length === 0)
                )
                  return null;

                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex items-center justify-center font-bold text-gray-700 bg-gray-100 rounded-full w-10 h-10 flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="pt-1">
                      <p className="font-bold text-gray-800 uppercase">
                        GO TO: {location}
                      </p>
                      <div className="pl-2 border-l-2 border-gray-200 ml-2">
                        {actions.pickups.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs font-semibold text-blue-700">
                              PICK UP
                            </p>
                            {actions.pickups.map((g: any, i: number) => (
                              <p key={i} className="text-sm text-gray-700">
                                {" "}
                                - {g.name} (Room {g.roomNumber})
                              </p>
                            ))}
                          </div>
                        )}
                        {actions.dropoffs.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs font-semibold text-emerald-700">
                              DROP OFF
                            </p>
                            {actions.dropoffs.map((g: any, i: number) => (
                              <p key={i} className="text-sm text-gray-700">
                                {" "}
                                - {g.name} (Room {g.roomNumber})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
              .filter(Boolean);
          };

          return (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowDetailRequestModal(false)}
            >
              <div
                className="backdrop-blur-xl bg-white rounded-2xl shadow-2xl w-[95vw] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto border-2 border-gray-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 md:p-5 flex justify-between items-center z-10">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base md:text-lg text-gray-900">
                      Ride Request Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetailRequestModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 touch-manipulation flex items-center justify-center flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 md:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase">
                        Guest(s)
                      </label>
                      <p className="text-gray-800 font-semibold">
                        {selectedRideForDetail.guestName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase">
                        Room(s)
                      </label>
                      <p className="text-gray-800 font-semibold">
                        {selectedRideForDetail.roomNumber}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase">
                        Guest Count
                      </label>
                      <p className="text-gray-800 font-semibold">
                        {selectedRideForDetail.guestCount || 1} pax
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase">
                        Status
                      </label>
                      <p className="text-gray-800 font-semibold">
                        {getStatusText(selectedRideForDetail.status)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Notes
                    </label>
                    <p className="text-gray-700 bg-gray-50 p-2 border border-gray-200 rounded-md">
                      {selectedRideForDetail.notes || "No notes provided."}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-gray-700 mb-3 mt-4 flex items-center gap-2">
                      <MapPin size={16} />
                      Route Steps
                    </h4>
                    <div className="space-y-3">{renderRouteSteps()}</div>
                  </div>
                </div>
                <div className="p-3 md:p-4 border-t bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 rounded-b-xl">
                  <button
                    onClick={() => setShowDetailRequestModal(false)}
                    className="w-full sm:w-auto px-4 py-3 md:py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium text-base md:text-sm min-h-[44px] md:min-h-0 touch-manipulation"
                  >
                    Close
                  </button>
                  <button
                    onClick={(e) => {
                      setShowDetailRequestModal(false);
                      setSelectedRideForAssign(selectedRideForDetail);
                      setShowManualAssignModal(true);
                    }}
                    className="w-full sm:w-auto px-4 py-3 md:py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center justify-center gap-2 text-base md:text-sm min-h-[44px] md:min-h-0 touch-manipulation"
                  >
                    <Car size={16} />
                    Assign Driver
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      }
      {/* Manual Assign Driver Modal */}
      {
        showManualAssignModal && selectedRideForAssign && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowManualAssignModal(false)}
          >
            <div
              className="backdrop-blur-xl bg-white rounded-2xl shadow-2xl w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 md:p-5 flex justify-between items-center z-10">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="font-bold text-base md:text-lg text-gray-900">
                    Assign Driver
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                    {selectedRideForAssign.guestName} •{" "}
                    {selectedRideForAssign.pickup} →{" "}
                    {selectedRideForAssign.destination}
                  </p>
                </div>
                <button
                  onClick={() => setShowManualAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-all min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 touch-manipulation flex items-center justify-center flex-shrink-0"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 md:p-5">
                {(() => {
                  const onlineDrivers = users
                    .filter((u) => u.role === UserRole.DRIVER)
                    .filter((driver) => {
                      const driverIdStr = driver.id ? String(driver.id) : "";
                      const hasActiveRide = rides.some((r) => {
                        const rideDriverId = r.driverId ? String(r.driverId) : "";
                        return (
                          rideDriverId === driverIdStr &&
                          (r.status === BuggyStatus.ASSIGNED ||
                            r.status === BuggyStatus.ARRIVING ||
                            r.status === BuggyStatus.ON_TRIP)
                        );
                      });
                      if (hasActiveRide) return true;
                      if (driver.updatedAt) {
                        const timeSinceUpdate = Date.now() - driver.updatedAt;
                        if (timeSinceUpdate < 30000) return true;
                      }
                      return false;
                    });

                  const handleAssignDriver = async (driver: User) => {
                    try {
                      await updateRideStatus(
                        selectedRideForAssign.id,
                        BuggyStatus.ARRIVING,
                        driver.id,
                        5,
                      );
                      const refreshedRides = await getRides();
                      setRides(refreshedRides);
                      setShowManualAssignModal(false);
                      setSelectedRideForAssign(null);
                      alert(
                        `Successfully assigned driver ${driver.lastName} to Room ${selectedRideForAssign.roomNumber}`,
                      );
                    } catch (error) {
                      console.error("Failed to assign driver:", error);
                      alert("Failed to assign driver. Please try again.");
                    }
                  };

                  const getDriverStatus = (driver: User) => {
                    const driverIdStr = driver.id ? String(driver.id) : "";
                    const activeRide = rides.find((r) => {
                      const rideDriverId = r.driverId ? String(r.driverId) : "";
                      return (
                        rideDriverId === driverIdStr &&
                        (r.status === BuggyStatus.ASSIGNED ||
                          r.status === BuggyStatus.ARRIVING ||
                          r.status === BuggyStatus.ON_TRIP)
                      );
                    });
                    if (activeRide) {
                      return {
                        status: "busy",
                        text: `On Trip: Room ${activeRide.roomNumber}`,
                        color: "bg-orange-100 text-orange-700",
                      };
                    }
                    return {
                      status: "available",
                      text: "Available",
                      color: "bg-emerald-100 text-emerald-700",
                    };
                  };

                  return (
                    <div className="space-y-4">
                      {/* Online Drivers */}
                      {onlineDrivers.length > 0 ? (
                        <div>
                          <h4 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            Online Drivers ({onlineDrivers.length})
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {onlineDrivers.map((driver) => {
                              const driverStatus = getDriverStatus(driver);
                              return (
                                <button
                                  key={driver.id}
                                  onClick={() => handleAssignDriver(driver)}
                                  disabled={driverStatus.status === "busy"}
                                  className={`p-3 md:p-4 rounded-lg border-2 transition-all text-left min-h-[60px] md:min-h-0 touch-manipulation ${driverStatus.status === "busy"
                                    ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                    : "border-emerald-200 bg-emerald-50 hover:border-emerald-400 hover:bg-emerald-100 cursor-pointer"
                                    }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-sm md:text-base text-gray-900">
                                          {driver.lastName}
                                        </span>
                                        <span
                                          className={`text-[10px] md:text-xs px-2 py-0.5 rounded font-semibold ${driverStatus.color}`}
                                        >
                                          {driverStatus.text}
                                        </span>
                                      </div>
                                    </div>
                                    {driverStatus.status === "available" && (
                                      <div className="ml-2 flex-shrink-0">
                                        <span className="text-emerald-600 font-semibold text-xs md:text-sm">
                                          Assign →
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="font-semibold">
                            No online drivers available
                          </p>
                          <p className="text-sm mt-1">
                            Please wait for drivers to come online.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )
      }

      {/* Reports View */}
      {
        viewMode === "REPORTS" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => {
                      setReportPeriod(e.target.value as any);
                      if (e.target.value !== 'custom') {
                        setReportStartDate('');
                        setReportEndDate('');
                      }
                    }}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="day">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {reportPeriod === 'custom' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Driver (Optional)</label>
                  <select
                    value={reportDriverId}
                    onChange={(e) => setReportDriverId(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">All Drivers</option>
                    {users
                      .filter(u => u.role === UserRole.DRIVER)
                      .map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName} ({driver.roomNumber})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setIsLoadingReports(true);
                    try {
                      const params: any = {};
                      if (reportPeriod === 'custom') {
                        if (reportStartDate) params.startDate = reportStartDate;
                        if (reportEndDate) params.endDate = reportEndDate;
                      } else {
                        params.period = reportPeriod;
                      }
                      if (reportDriverId) params.driverId = reportDriverId;

                      const [ridesData, statsData] = await Promise.all([
                        getHistoricalRideReports(params),
                        getReportStatistics(params)
                      ]);
                      setReportRides(ridesData);
                      setReportStats(statsData);
                    } catch (error) {
                      console.error('Failed to load reports:', error);
                    } finally {
                      setIsLoadingReports(false);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-semibold flex items-center gap-2"
                >
                  <RefreshCw size={14} className={isLoadingReports ? 'animate-spin' : ''} />
                  {isLoadingReports ? 'Loading...' : 'Refresh'}
                </button>

                {reportRides.length > 0 && (
                  <button
                    onClick={() => {
                      const periodLabel = reportPeriod === 'day' ? 'today' : reportPeriod === 'week' ? 'last7days' : reportPeriod === 'month' ? 'thismonth' : 'custom';
                      const filename = `ride-reports-${periodLabel}-${new Date().toISOString().split('T')[0]}.csv`;
                      exportRidesToCSV(reportRides, filename);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold flex items-center gap-2"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            {reportStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Total Rides</div>
                  <div className="text-2xl font-bold text-emerald-600">{reportStats.totalRides}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Total Guests</div>
                  <div className="text-2xl font-bold text-blue-600">{reportStats.totalGuests}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Average Rating</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {reportStats.avgRating > 0 ? reportStats.avgRating.toFixed(1) : 'N/A'}
                    {reportStats.avgRating > 0 && <Star size={16} className="inline ml-1 text-yellow-400" />}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">({reportStats.totalRatings} ratings)</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Avg Response Time</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {reportStats.avgResponseTime > 0
                      ? `${Math.round(reportStats.avgResponseTime / 1000 / 60)} min`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Rides Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Ride History</h3>
                <span className="text-sm text-gray-500">{reportRides.length} rides</span>
              </div>

              {isLoadingReports ? (
                <div className="p-10 text-center">
                  <Loader2 size={32} className="mx-auto mb-4 text-emerald-600 animate-spin" />
                  <p className="text-gray-500">Loading reports...</p>
                </div>
              ) : reportRides.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No rides found for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Guest</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Requested</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Completed</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportRides.map((ride) => {
                        const driver = users.find(u => u.id === ride.driverId);
                        return (
                          <tr key={ride.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">#{ride.id}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{ride.guestName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{ride.roomNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-600">{ride.pickup}</span>
                                <ArrowRight size={12} className="text-gray-400" />
                                <span className="text-blue-600">{ride.destination}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {driver ? `${driver.firstName} ${driver.lastName}` : `Driver ${ride.driverId || 'N/A'}`}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {ride.timestamp ? new Date(ride.timestamp).toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {ride.completedAt ? new Date(ride.completedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {ride.rating ? (
                                <div className="flex items-center gap-1">
                                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                  <span className="font-semibold">{ride.rating}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Driver Performance Analytics View */}
      {
        viewMode === "PERFORMANCE" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Period</label>
                  <select
                    value={performancePeriod}
                    onChange={(e) => setPerformancePeriod(e.target.value as any)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="day">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Driver (Optional)</label>
                  <select
                    value={performanceDriverId}
                    onChange={(e) => setPerformanceDriverId(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    <option value="">All Drivers</option>
                    {users
                      .filter(u => u.role === UserRole.DRIVER)
                      .map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName} ({driver.roomNumber})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <button
                onClick={async () => {
                  setIsLoadingPerformance(true);
                  try {
                    const params: any = { period: performancePeriod };
                    if (performanceDriverId) params.driverId = performanceDriverId;
                    const stats = await getDriverPerformanceStats(params);
                    setDriverPerformanceStats(stats);
                  } catch (error) {
                    console.error('Failed to load performance stats:', error);
                  } finally {
                    setIsLoadingPerformance(false);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-semibold flex items-center gap-2"
              >
                <RefreshCw size={14} className={isLoadingPerformance ? 'animate-spin' : ''} />
                {isLoadingPerformance ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Performance Stats Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-indigo-600" />
                  Driver Performance Analytics
                </h3>
                <span className="text-sm text-gray-500">{driverPerformanceStats.length} drivers</span>
              </div>

              {isLoadingPerformance ? (
                <div className="p-10 text-center">
                  <Loader2 size={32} className="mx-auto mb-4 text-indigo-600 animate-spin" />
                  <p className="text-gray-500">Loading performance data...</p>
                </div>
              ) : driverPerformanceStats.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Award size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No performance data found for the selected period.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Driver</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Rides</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg Rating</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg Response</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Avg Trip Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Performance Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {driverPerformanceStats.map((stats, index) => {
                        const rank = index + 1;
                        const scoreColor = stats.performance_score >= 80 ? 'text-green-600' :
                          stats.performance_score >= 60 ? 'text-yellow-600' : 'text-red-600';
                        return (
                          <tr key={stats.driver_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              {rank === 1 && <Award size={16} className="inline text-yellow-500 mr-1" />}
                              <span className="font-bold text-gray-700">#{rank}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{stats.driver_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{stats.total_rides}</td>
                            <td className="px-4 py-3 text-sm">
                              {stats.avg_rating > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                  <span className="font-semibold">{stats.avg_rating.toFixed(1)}</span>
                                  <span className="text-xs text-gray-400">({stats.rating_count})</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {stats.avg_response_time > 0
                                ? `${Math.round(stats.avg_response_time / 1000 / 60)} min`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {stats.avg_trip_time > 0
                                ? `${Math.round(stats.avg_trip_time / 1000 / 60)} min`
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${stats.performance_score >= 80 ? 'bg-green-500' : stats.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(stats.performance_score, 100)}%` }}
                                  />
                                </div>
                                <span className={`font-bold ${scoreColor} min-w-[50px]`}>
                                  {stats.performance_score.toFixed(1)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      }



      {/* Floating New Ride Button - Circular with Text */}
      {
        viewMode === "BUGGY" && !showCreateRideModal && (
          <button
            onClick={handleVoiceAssistantStart}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-full w-20 h-20 md:w-16 md:h-16 flex items-center justify-center transition-all z-50 touch-manipulation hover:scale-110 active:scale-95"
            style={{
              boxShadow: "0 8px 30px -4px rgba(16, 185, 129, 0.6), 0 4px 15px rgba(16, 185, 129, 0.3)",
            }}
            title="Create New Ride"
          >
            <span className="text-xs md:text-[10px] font-bold text-center leading-tight">New<br />Ride</span>
          </button>
        )
      }
      {/* Conversational Voice Assistant Overlay */}
      {/* Conversational Voice Assistant Overlay */}
      <VoiceInputOverlay
        isOpen={showVoiceOverlay}
        onClose={handleVoiceAssistantClose}
        isListening={isListening}
        audioLevel={audioLevel}
        silenceCountdown={silenceCountdown}
        silenceRemainingTime={silenceRemainingTime}
        transcript={transcript}
        onToggleListening={handleToggleListening}
        currentStep={conversation.state.step}
        currentPrompt={conversation.currentPrompt}
        progressPercentage={conversation.progressPercentage}
        stepInfo={conversation.stepInfo}
        isProcessing={conversation.isProcessing}
        collectedData={conversation.state.data}
        onGoBack={conversation.goBack}
        onConfirm={conversation.confirm}
        onCancel={conversation.cancel}
        voiceResult={voiceResult}
      />
    </div >
  );
};

export default ReceptionPortal;
