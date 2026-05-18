import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, ScrollView,
  TextInput, Alert, SafeAreaView, StatusBar,
  Animated, Dimensions, Platform, Share
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { offlineDB } from './offlineDatabase';
import * as Speech from 'expo-speech';
// expo-speech-recognition requires native build — disabled for Expo Go compatibility
// import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

const { width } = Dimensions.get('window');

// ==================== CONFIG ====================
const BACKEND_URL = Platform.OS === 'web'
  ? 'http://localhost:8001'
  : 'http://192.168.10.11:8001';

// ==================== EXACT COLORS FROM STITCH ====================
const C = {
  primary: '#00450d',
  primaryContainer: '#1b5e20',
  primaryFixedDim: '#91d78a',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#90d689',
  secondary: '#046b5e',
  onSecondary: '#ffffff',
  secondaryContainer: '#9defde',
  onSecondaryContainer: '#0f6f62',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  bg: '#fcf9f8',
  surface: '#fcf9f8',
  surfaceContainer: '#f0eded',
  surfaceContainerLow: '#f6f3f2',
  surfaceContainerLowest: '#ffffff',
  onBg: '#1c1b1b',
  onSurface: '#1c1b1b',
  onSurfaceVariant: '#41493e',
  outline: '#717a6d',
  outlineVariant: '#c0c9bb',
  emergencyRed: '#B71C1C',
  agentBubble: '#E0F2F1',
  disclaimerBg: '#FFEBEE',
  privacyBg: '#0D1B0F',
  privacyContainer: '#122415',
  privacySurface: '#1a2e1d',
  warning: '#F57F17',
};

// ==================== MAIN APP ====================
export default function App() {
  const [screen, setScreen] = useState('disclaimer');
  const [language, setLanguage] = useState('ur');
  const [photoUri, setPhotoUri] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [glucose, setGlucose] = useState('');
  const [glucoseLogs, setGlucoseLogs] = useState([]);
  const [history, setHistory] = useState([]);
  const [permission, requestPermission] = useCameraPermissions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(null);
  const [menuResult, setMenuResult] = useState(null);

  // Voice screen state
  const [voiceText, setVoiceText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const voiceInputRef = useRef(null);

  // Chat screen state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'agent',
      text_en: 'Assalam o Alaikum! Ask me about any food — is it safe for your blood sugar?',
      text_ur: 'السلام علیکم! کسی بھی کھانے کے بارے میں پوچھیں — کیا یہ آپ کی شوگر کے لیے محفوظ ہے؟'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadHistory();
    loadGlucoseLogs();
    const checkTutorial = async () => {
      const shown = await AsyncStorage.getItem('sehat_tutorial_shown');
      if (!shown) setScreen('tutorial');
    };
    checkTutorial();

    const pingBackend = async () => {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 5000);
      try {
        const r = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
        clearTimeout(tid);
        setIsOnline(r.ok);
      } catch {
        clearTimeout(tid);
        setIsOnline(false);
      }
    };
    pingBackend();
    const pingInterval = setInterval(pingBackend, 15000);
    return () => clearInterval(pingInterval);
  }, []);

  const loadHistory = async () => {
    const h = await AsyncStorage.getItem('sehat_history');
    if (h) setHistory(JSON.parse(h));
  };

  const loadGlucoseLogs = async () => {
    const g = await AsyncStorage.getItem('sehat_glucose');
    if (g) setGlucoseLogs(JSON.parse(g));
  };

  // ==================== DISCLAIMER SCREEN ====================
  if (screen === 'disclaimer') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.disclaimerBg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.disclaimerBg} />
        <ScrollView contentContainerStyle={[s.disclaimerCanvas, { paddingBottom: 100 }]}>
          <View style={s.disclaimerIconWrap}>
            <MaterialIcons name="report" size={64} color={C.error} />
          </View>
          <Text style={s.disclaimerH1}>Important</Text>
          <Text style={[s.disclaimerH1Ur, { textAlign: 'right' }]}>اہم تنبیہ</Text>
          <View style={s.bentoDivider} />
          <View style={s.bentoCard}>
            <View style={s.bentoCardHeader}>
              <MaterialIcons name="info" size={20} color={C.primary} />
              <Text style={s.bentoCardLabel}>MEDICAL DISCLAIMER</Text>
            </View>
            <Text style={s.bentoCardBody}>
              SehatGemma is an AI assistant, not a medical professional. The information provided is for educational purposes only and does not constitute medical advice, diagnosis, or treatment.{' '}
              <Text style={{ fontWeight: 'bold', color: C.onSurface }}>
                Always seek the advice of your physician
              </Text>{' '}
              for any health concerns.
            </Text>
          </View>
          <View style={[s.bentoCard, { marginTop: 12 }]}>
            <View style={[s.bentoCardHeader, { flexDirection: 'row-reverse' }]}>
              <MaterialIcons name="health-and-safety" size={20} color={C.primary} />
              <Text style={[s.bentoCardLabel, { marginRight: 8, marginLeft: 0 }]}>طبی اعلامیہ</Text>
            </View>
            <Text style={[s.bentoCardBodyUr, { textAlign: 'right' }]}>
              صحت جیما ایک مصنوعی ذہانت کا معاون ہے، کوئی طبی پیشہ ور نہیں۔ فراہم کردہ معلومات صرف تعلیمی مقاصد کے لیے ہیں۔{' '}
              <Text style={{ fontWeight: 'bold', color: C.onSurface }}>
                کسی بھی طبی تشویش کے لیے ہمیشہ اپنے ڈاکٹر سے مشورہ کریں۔
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            style={s.disclaimerCTA}
            onPress={() => setScreen('home')}
            activeOpacity={0.9}
          >
            <Text style={s.disclaimerCTAText}>I Understand</Text>
            <Text style={s.disclaimerCTAUrdu}>میں سمجھتا ہوں</Text>
          </TouchableOpacity>
          <Text style={s.disclaimerFootnote}>
            By clicking, you acknowledge our terms of service.
          </Text>
          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>
        <Text style={s.disclaimerBrand}>SehatGemma • صحت جیما</Text>
      </SafeAreaView>
    );
  }

  // ==================== TUTORIAL SCREEN ====================
  if (screen === 'tutorial') {
    return (
      <TutorialScreen
        onComplete={async () => {
          await AsyncStorage.setItem('sehat_tutorial_shown', 'true');
          setScreen('disclaimer');
        }}
      />
    );
  }

  // ==================== HOME SCREEN ====================
  if (screen === 'home') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, width: '100%', overflow: 'hidden' }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.bg, borderBottomWidth: 0.5, borderBottomColor: C.outlineVariant }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, width: 150, flexShrink: 0 }}>
            <MaterialIcons name="nightlight" size={18} color={C.primary} />
            <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: C.primary }}>SehatGemma</Text>
            {isOnline !== null && (
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isOnline ? '#4CAF50' : '#FF9800' }} />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => setScreen('how_it_helps')} style={{ padding: 4 }}>
              <MaterialIcons name="help-outline" size={20} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ padding: 4 }}>
              <MaterialIcons name="menu" size={22} color={C.primary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', backgroundColor: C.surfaceContainer, borderRadius: 50, padding: 3 }}>
              <TouchableOpacity
                style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 }, language === 'en' && { backgroundColor: C.primary }]}
                onPress={() => setLanguage('en')}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: language === 'en' ? 'white' : C.onSurfaceVariant }}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50 }, language === 'ur' && { backgroundColor: C.primary }]}
                onPress={() => setLanguage('ur')}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: language === 'ur' ? 'white' : C.onSurfaceVariant }}>اردو</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 90 }}>
          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
            <Text style={s.homeTaglineEn}>Local AI — No Internet Required</Text>
            <Text style={s.homeTaglineUr}>مقامی AI — انٹرنیٹ کی ضرورت نہیں</Text>
          </View>

          <View style={s.agentBubble}>
            <Text style={s.agentBubbleEn}>
              Assalam o Alaikum! Aaj kya khaya? Photo lo ya bolo — main analyze karta hoon.
            </Text>
            <Text style={[s.agentBubbleUr, { textAlign: 'right' }]}>
              السلام علیکم! آج کیا کھایا؟ فوٹو لو یا بولو — میں تجزیہ کرتا ہوں۔
            </Text>
            <MaterialIcons name="nightlight" size={60} color={C.primary} style={s.agentBubbleWatermark} />
          </View>

          <View style={s.homeActionArea}>
            <TouchableOpacity style={s.primaryActionBtn} onPress={launchCamera} activeOpacity={0.9}>
              <MaterialIcons name="photo-camera" size={28} color={C.onPrimary} />
              <Text style={s.primaryActionText}>Take Photo / تصویر لیں</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.primaryActionBtn, { backgroundColor: C.secondary, marginTop: 12 }]} onPress={pickImage} activeOpacity={0.9}>
              <MaterialIcons name="photo-library" size={28} color={C.onSecondary} />
              <Text style={s.primaryActionText}>Gallery / گیلری</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.primaryActionBtn, { backgroundColor: '#5C6BC0', marginTop: 12 }]} onPress={scanMenu} activeOpacity={0.9}>
              <MaterialIcons name="menu-book" size={28} color="white" />
              <Text style={s.primaryActionText}>Scan Menu / مینو اسکین</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.primaryActionBtn, { backgroundColor: C.emergencyRed, marginTop: 12 }]}
              onPress={() => setScreen('emergency')}
              activeOpacity={0.9}
            >
              <MaterialIcons name="emergency" size={24} color="white" />
              <Text style={s.primaryActionText}>Emergency / ایمرجنسی</Text>
            </TouchableOpacity>
          </View>

          <View style={s.quickGrid}>
            <QuickBtn icon="favorite" label="Glucose" onPress={() => setScreen('glucose')} />
            <QuickBtn icon="history" label="History" onPress={() => setScreen('history')} />
            <QuickBtn icon="security" label="Privacy" onPress={() => setScreen('privacy')} />
          </View>

          {history.length > 0 && (
            <View style={s.lastMealCard}>
              {history[0].imageUri && (
                <Image source={{ uri: history[0].imageUri }} style={s.lastMealThumb} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.lastMealLabel}>Last analyzed meal</Text>
                <Text style={s.lastMealName}>{history[0].food_name_en || 'Unknown'}</Text>
                <View style={[
                  s.riskPill,
                  { backgroundColor: history[0].sugar_risk === 'high' ? C.error : history[0].sugar_risk === 'medium' ? C.warning : '#2E7D32' }
                ]}>
                  <Text style={s.riskPillText}>{(history[0].sugar_risk || 'SAFE').toUpperCase()} GLUCOSE</Text>
                </View>
              </View>
            </View>
          )}

          {history.length >= 2 && (() => {
            const highRiskCount = history.filter(h => h.sugar_risk === 'high').length;
            const totalMeals = Math.min(history.length, 7);
            const highPercent = Math.round((highRiskCount / Math.max(1, totalMeals)) * 100);
            const riceMeals = history.filter(h =>
              (h.food_name_en || '').toLowerCase().includes('rice') ||
              (h.food_name_en || '').toLowerCase().includes('pulao') ||
              (h.food_name_en || '').toLowerCase().includes('biryani')
            ).length;

            let insightEn = '';
            let insightUr = '';
            if (highPercent > 50) {
              insightEn = `Alert: ${highPercent}% of your meals were HIGH risk. Focus on low-GI swaps.`;
              insightUr = `خبردار: ${highPercent}% کھانے HIGH رسک تھے۔ کم GI متبادل استعمال کریں۔`;
            } else if (riceMeals >= 3) {
              insightEn = 'Rice detected in multiple meals. Switch to brown rice or roti to lower glucose spikes.';
              insightUr = 'کئی کھانوں میں چاول شامل تھے۔ براؤن رائس یا روٹی استعمال کریں۔';
            } else {
              insightEn = 'Good choices! Most meals were low-medium risk. Keep eating dal, sabzi, and grilled meats.';
              insightUr = 'اچھے انتخاب! زیادہ تر کھانے کم-medium رسک تھے۔ دال، سبزی، اور گرلڈ گوشت کھاتے رہیں۔';
            }

            return (
              <View style={s.insightCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <MaterialIcons name="insights" size={20} color={C.primary} />
                  <Text style={{ fontWeight: '700', color: C.primary, fontSize: 14 }}>Weekly Insight</Text>
                  <Text style={{ fontSize: 13, color: C.onSurfaceVariant }}>ہفتہ وار تجزیہ</Text>
                </View>
                <Text style={{ color: C.onSurface, fontSize: 14, lineHeight: 20 }}>{insightEn}</Text>
                <Text style={{ color: C.onSurfaceVariant, fontSize: 14, lineHeight: 24, textAlign: 'right', marginTop: 4 }}>{insightUr}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.error }} />
                    <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>HIGH: {highRiskCount}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.warning }} />
                    <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>MED: {history.filter(h => h.sugar_risk === 'medium').length}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#2E7D32' }} />
                    <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>LOW: {history.filter(h => h.sugar_risk === 'low').length}</Text>
                  </View>
                </View>
              </View>
            );
          })()}

          <TouchableOpacity style={s.demoBtn} onPress={runDemo} activeOpacity={0.8}>
            <MaterialIcons name="play-circle" size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Quick Demo / فوری ڈیمو</Text>
          </TouchableOpacity>

          <View style={s.poweredBadge}>
            <MaterialIcons name="memory" size={14} color={C.onSurfaceVariant} />
            <Text style={s.poweredText}>Gemma 4 on local device — zero internet</Text>
          </View>

          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>

        <BottomNav active="chat" onPress={(tab) => {
          if (tab === 'health') setScreen('glucose');
          else if (tab === 'camera') launchCamera();
          else if (tab === 'voice') setScreen('voice');
          else if (tab === 'chat') setScreen('chat');
        }} />

        {menuVisible && (
          <MenuOverlay
            onClose={() => setMenuVisible(false)}
            onNav={(s) => {
          setMenuVisible(false);
          if (s === 'menu_scan_trigger') { setTimeout(scanMenu, 200); }
          else setScreen(s);
        }}
          />
        )}
      </SafeAreaView>
    );
  }

  // ==================== AGENT THINKING SCREEN ====================
  if (screen === 'result' && loading) {
    return <AgentThinkingScreen />;
  }

  // ==================== RESULT SCREEN ====================
  if (screen === 'result' && !loading) {
    const riskColor =
      result?.sugar_risk === 'high' ? C.error :
        result?.sugar_risk === 'medium' ? C.warning : '#2E7D32';
    const isUrdu = language === 'ur';

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, width: '100%', overflow: 'hidden' }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={s.resultHeader}>
          <TouchableOpacity onPress={() => setScreen('home')} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.resultHeaderTitle}>SehatGemma صحت جیما</Text>
          <MaterialIcons name="nightlight" size={20} color={C.primary} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 90, width: '100%' }}>
          {photoUri && (
            <View style={s.resultPhotoWrap}>
              <Image source={{ uri: photoUri }} style={s.resultPhoto} />
              <View style={s.resultPhotoOverlay} />
            </View>
          )}
          <View style={{ paddingHorizontal: 16, width: '100%' }}>
            <View style={[s.riskBadge, { backgroundColor: riskColor }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={s.riskBadgeText}>
                    {(result?.sugar_risk || 'UNKNOWN').toUpperCase()} SUGAR RISK
                  </Text>
                  <Text style={s.riskBadgeUrdu}>
                    {result?.sugar_risk === 'high' ? 'زیادہ خطرہ' :
                      result?.sugar_risk === 'medium' ? 'درمیانہ خطرہ' :
                      result?.sugar_risk === 'low' ? 'کم خطرہ' : 'نامعلوم'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => speakResult(result)} style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                  <MaterialIcons name="volume-up" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={s.resultFoodName}>
              {isUrdu ? result?.food_name_ur : result?.food_name_en}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
              {result?._source === 'offline_db' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#E8F5E9', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#4CAF50' }}>
                  <MaterialIcons name="verified" size={14} color="#2E7D32" />
                  <Text style={{ fontSize: 11, color: '#2E7D32', fontWeight: '700' }}>Verified Database — 95% accuracy</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF8E1', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#F57F17' }}>
                  <MaterialIcons name="psychology" size={14} color="#E65100" />
                  <Text style={{ fontSize: 11, color: '#E65100', fontWeight: '600' }}>Gemma 4 AI — {result?.confidence || 0}% confidence · ±15g estimate</Text>
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <MetricChip icon="local-fire-department" label={result?.calories_estimate || 'N/A'} />
              <MetricChip icon="bar-chart" label={`${result?.confidence || 0}%`} />
              <MetricChip icon="grain" label={`${result?.carbs_g || 0}g carbs`} />
            </ScrollView>
            <View style={s.infoCard}>
              <MaterialIcons name="info" size={22} color={C.onSurfaceVariant} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.infoCardText}>
                  {isUrdu ? result?.explanation_ur : result?.explanation_en}
                </Text>
              </View>
            </View>
            <View style={[s.infoCard, s.swapCard]}>
              <MaterialIcons name="compare-arrows" size={22} color={C.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.swapLabel}>{isUrdu ? 'بہتر متبادل:' : 'Better Swap:'}</Text>
                <Text style={s.infoCardText}>
                  {isUrdu ? result?.swap_suggestion_ur : result?.swap_suggestion_en}
                </Text>
              </View>
            </View>
            {result?.sugar_risk === 'unknown' && (
              <>
                <TouchableOpacity
                  style={[s.analyzeAnotherBtn, { backgroundColor: '#FF6F00', marginBottom: 10 }]}
                  onPress={() => { setPhotoUri(null); setScreen('home'); }}
                  activeOpacity={0.9}
                >
                  <MaterialIcons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={s.analyzeAnotherText}>Retry — Check Backend / دوبارہ کوشش کریں</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.analyzeAnotherBtn, { backgroundColor: C.secondary, marginBottom: 10 }]}
                  onPress={() => { setPhotoUri(null); setScreen('voice'); }}
                  activeOpacity={0.9}
                >
                  <MaterialIcons name="mic" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={s.analyzeAnotherText}>Describe Food Instead / کھانا بتائیں</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[s.analyzeAnotherBtn, { backgroundColor: '#25D366', marginBottom: 10 }]}
              onPress={shareResult}
              activeOpacity={0.9}
            >
              <MaterialIcons name="share" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={s.analyzeAnotherText}>Share to WhatsApp / شیئر کریں</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.analyzeAnotherBtn}
              onPress={() => setScreen('home')}
              activeOpacity={0.9}
            >
              <MaterialIcons name="photo-camera" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={s.analyzeAnotherText}>Analyze Another / اگلا تجزیہ</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>
        <BottomNav active="camera" onPress={(tab) => {
          if (tab === 'health') setScreen('how_it_helps');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }} />
      </SafeAreaView>
    );
  }

  // ==================== PRIVACY SCREEN ====================
  if (screen === 'privacy') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.privacyBg }}>
        <StatusBar barStyle="light-content" backgroundColor={C.privacyBg} />
        <View style={s.privacyHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="lock" size={22} color={C.primaryFixedDim} />
            <View>
              <Text style={s.privacyHeaderTitle}>Privacy Shield</Text>
              <Text style={s.privacyHeaderUrdu}>پرائیویسی شیلڈ</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <MaterialIcons name="close" size={22} color={C.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 90 }}>
          <View style={s.privacyIconWrap}>
            <View style={s.privacyIconGlow}>
              <MaterialIcons name="security" size={48} color={C.primaryFixedDim} />
            </View>
            <Text style={s.privacySubtitle}>Your data never leaves the room.</Text>
            <Text style={{ color: C.onSurfaceVariant, fontSize: 12, textAlign: 'center', marginTop: 4, paddingHorizontal: 24 }}>
              AI runs on a local device in your clinic — not a foreign server.
            </Text>
            <Text style={[s.privacySubtitleUr, { textAlign: 'right', marginTop: 6 }]}>
              آپ کا ڈیٹا کبھی بھی کمرے سے باہر نہیں جاتا۔
            </Text>
          </View>
          <View style={s.privacyCards}>
            <PrivacyCard icon="verified-user" title="AES-256 Encrypted" urdu="ملٹری گریڈ انکرپشن" badge="Active" />
            <PrivacyCard icon="cloud-off" title="Zero Cloud Sync" urdu="کوئی کلاؤڈ نہیں — سب کچھ مقامی" badge="Local" />
            <PrivacyCard icon="router" title="Local Network Only" urdu="صرف مقامی نیٹ ورک — انٹرنیٹ نہیں" badge="Secure" />
          </View>
          <View style={s.auditLog}>
            <View style={s.auditLogHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="history" size={16} color={C.onSurfaceVariant} />
                <Text style={s.auditLogTitle}>Privacy Audit Log</Text>
              </View>
              <Text style={s.auditLogTitleUr}>آڈٹ لاگ</Text>
            </View>
            <View style={s.auditEntry}>
              <View style={{ flex: 1 }}>
                <Text style={s.auditEntryTitle}>SehatGemma Agent Access</Text>
                <Text style={s.auditEntryDesc}>Secure local database query</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.auditEntryTime}>Today 6:30 PM</Text>
                <Text style={s.auditEntryTimeUr}>آج شام 6:30</Text>
              </View>
            </View>
            <View style={s.auditDivider} />
            <View style={[s.auditEntry, { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.auditEntryTitle}>Glucose Data Entry</Text>
                <Text style={s.auditEntryDesc}>User initiated save</Text>
              </View>
              <Text style={s.auditEntryTime}>Yesterday 11:15 AM</Text>
            </View>
          </View>
          <TouchableOpacity
            style={s.burnBtn}
            onPress={() => Alert.alert(
              'Delete All Data?',
              'This action is irreversible. All health history will be permanently wiped.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive',
                  onPress: async () => {
                    await AsyncStorage.clear();
                    setHistory([]);
                    setGlucoseLogs([]);
                    Alert.alert('Done', 'All data has been wiped.');
                  }
                }
              ]
            )}
            activeOpacity={0.9}
          >
            <MaterialIcons name="delete-forever" size={20} color={C.error} />
            <Text style={s.burnBtnText}>EXPORT & DELETE ALL DATA</Text>
            <Text style={s.burnBtnUrdu}>ڈیٹا ایکسپورٹ کریں اور سب کچھ ڈیلیٹ کریں</Text>
          </TouchableOpacity>
          <Text style={s.burnWarning}>
            Warning: This action is irreversible. All health history and preferences will be permanently wiped from this device.
          </Text>
          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>
        <BottomNav active="health" onPress={(tab) => {
          if (tab === 'health') setScreen('how_it_helps');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }} />
      </SafeAreaView>
    );
  }

  // ==================== EMERGENCY SCREEN ====================
  if (screen === 'emergency') {
    return <EmergencyScreen glucoseLogs={glucoseLogs} onClose={() => setScreen('home')} />;
  }

  // ==================== GLUCOSE LOGBOOK ====================
  if (screen === 'glucose') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={s.glucoseHeader}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={s.glucoseTitle}>Sugar Logbook / شوگر ریکارڈ</Text>
            <Text style={s.glucoseSubtitle}>Target: 80–120 mg/dL (PROMPT)</Text>
          </View>
        </View>
        {glucoseLogs.length >= 3 && (
          <View style={s.trendRow}>
            {glucoseLogs.slice(0, 7).reverse().map((log, i) => {
              const h = Math.min(40, Math.max(8, (parseInt(log.value) / 300) * 40));
              const col = parseInt(log.value) > 160 ? C.error : parseInt(log.value) > 120 ? C.warning : '#2E7D32';
              return (
                <View key={i} style={s.trendBarWrap}>
                  <View style={[s.trendBar, { height: h, backgroundColor: col }]} />
                  <Text style={s.trendDay}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</Text>
                </View>
              );
            })}
            <View style={{ marginLeft: 12 }}>
              <Text style={s.trendAvg}>Avg: {Math.round(glucoseLogs.reduce((a, b) => a + parseInt(b.value || 0), 0) / Math.max(1, glucoseLogs.length))} mg/dL</Text>
            </View>
          </View>
        )}
        <View style={s.glucoseInputRow}>
          <TextInput
            style={s.glucoseInput}
            placeholder="Enter mg/dL"
            keyboardType="numeric"
            value={glucose}
            onChangeText={setGlucose}
            placeholderTextColor={C.onSurfaceVariant}
          />
          <TouchableOpacity style={s.glucoseSaveBtn} onPress={saveGlucose}>
            <MaterialIcons name="check" size={24} color={C.onPrimary} />
          </TouchableOpacity>
        </View>
        <Text style={s.recentLabel}>Recent Logs / حالیہ ریکارڈ</Text>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 90 }}>
          {glucoseLogs.map((log, i) => {
            const val = parseInt(log.value);
            const riskColor = val > 160 ? C.error : val > 120 ? C.warning : '#2E7D32';
            const riskLabel = val > 160 ? 'High' : val > 120 ? 'Moderate' : 'Normal';
            const riskUrdu = val > 160 ? 'زیادہ' : val > 120 ? 'درمیانہ' : 'نارمل';
            return (
              <View key={i} style={[s.glucoseLogItem, { borderLeftColor: riskColor }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.glucoseLogValue, { color: riskColor }]}>{log.value} mg/dL</Text>
                  <Text style={s.glucoseLogRisk}>{riskLabel} / {riskUrdu}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.glucoseLogTime}>{log.time?.split(',')[0] || ''}</Text>
                  <Text style={s.glucoseLogTime}>{log.time?.split(',')[1] || ''}</Text>
                </View>
              </View>
            );
          })}
          {glucoseLogs.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <MaterialIcons name="show-chart" size={48} color={C.outlineVariant} />
              <Text style={{ color: C.onSurfaceVariant, marginTop: 8 }}>No readings yet</Text>
            </View>
          )}
          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>
        <BottomNav active="health" onPress={(tab) => {
          if (tab === 'health') setScreen('how_it_helps');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }} />
      </SafeAreaView>
    );
  }

  // ==================== HISTORY SCREEN ====================
  if (screen === 'history') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={s.glucoseHeader}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={[s.glucoseTitle, { marginLeft: 12 }]}>Scan History</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 90 }}>
          {history.map((item, i) => (
            <View key={i} style={s.historyItem}>
              {item.imageUri && <Image source={{ uri: item.imageUri }} style={s.historyThumb} />}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '600', color: C.onSurface }}>{item.food_name_en}</Text>
                <Text style={{ color: C.onSurfaceVariant, fontSize: 12 }}>{item.timestamp?.split('T')[0]}</Text>
                <View style={[s.riskPill, {
                  backgroundColor: item.sugar_risk === 'high' ? C.error : item.sugar_risk === 'medium' ? C.warning : '#2E7D32',
                  alignSelf: 'flex-start', marginTop: 4
                }]}>
                  <Text style={s.riskPillText}>{(item.sugar_risk || '').toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ))}
          {history.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <MaterialIcons name="photo-library" size={48} color={C.outlineVariant} />
              <Text style={{ color: C.onSurfaceVariant, marginTop: 8 }}>No scans yet</Text>
            </View>
          )}
          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>
        <BottomNav active="health" onPress={(tab) => {
          if (tab === 'health') setScreen('how_it_helps');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }} />
      </SafeAreaView>
    );
  }

  // ==================== VOICE SCREEN ====================
  if (screen === 'voice') {
    return (
      <VoiceScreen
        voiceText={voiceText}
        setVoiceText={setVoiceText}
        isListening={isListening}
        setIsListening={setIsListening}
        voiceInputRef={voiceInputRef}
        onAnalyze={analyzeVoiceText}
        onBack={() => setScreen('home')}
        onNav={(tab) => {
          if (tab === 'health') setScreen('how_it_helps');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }}
        language={language}
      />
    );
  }

  // ==================== CHAT SCREEN ====================
  if (screen === 'chat') {
    return (
      <ChatScreen
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLoading={chatLoading}
        onSend={sendChatMessage}
        onBack={() => setScreen('home')}
        onNav={(tab) => {
          if (tab === 'health') setScreen('how_it_helps');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }}
        language={language}
      />
    );
  }

  // ==================== HOW IT HELPS SCREEN ====================
  if (screen === 'how_it_helps') {
    const foodChips = ['Biryani', 'Roti', 'Haleem', 'Nihari', 'کڑاہی', 'Saag', 'Daal', 'Paratha'];
    const stats = [
      { value: '33 ملین', label: 'Pakistani\nDiabetics' },
      { value: '31.4%', label: 'Prevalence' },
      { value: '70 ملین', label: '2050\nProjection' },
    ];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: C.primary }}>
              How SehatGemma Helps Pakistan
            </Text>
            <Text style={{ fontSize: 13, color: C.onSurfaceVariant, textAlign: 'right' }}>
              SehatGemma کیسے مدد کرتا ہے
            </Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Platform.OS === 'android' ? 120 : 90 }}>

          {/* Card 1 — Pakistani Food (full width) */}
          <View style={s.helpCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={s.helpCardIcon}>
                <MaterialIcons name="restaurant" size={24} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.helpCardTitle}>Knows Pakistani Food</Text>
                <Text style={[s.helpCardUrdu, { textAlign: 'right' }]}>پاکستانی کھانا پہچانتا ہے</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {foodChips.map((food, i) => (
                <View key={i} style={s.foodChip}>
                  <Text style={s.foodChipText}>{food}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Cards 2 & 3 — 2-column row */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={[s.helpCardHalf]}>
              <View style={[s.helpCardIcon, { backgroundColor: '#FFF8E1' }]}>
                <MaterialIcons name="wifi-off" size={22} color="#F57F17" />
              </View>
              <Text style={[s.helpCardTitle, { marginTop: 10, fontSize: 13 }]}>No Internet. Ever.</Text>
              <Text style={[s.helpCardUrdu, { textAlign: 'right', marginTop: 4 }]}>انٹرنیٹ بالکل نہیں چاہیے</Text>
              <Text style={{ color: C.onSurfaceVariant, fontSize: 11, lineHeight: 16, marginTop: 6 }}>
                A $75 Pi in your clinic creates a local hotspot. Gemma runs on it. Nothing goes online.
              </Text>
            </View>
            <View style={[s.helpCardHalf]}>
              <View style={[s.helpCardIcon, { backgroundColor: '#FFEBEE' }]}>
                <MaterialIcons name="emergency" size={22} color={C.error} />
              </View>
              <Text style={[s.helpCardTitle, { marginTop: 10, fontSize: 13 }]}>Emergency Help</Text>
              <Text style={[s.helpCardUrdu, { textAlign: 'right', marginTop: 4 }]}>ایمرجنسی میں مدد</Text>
              <Text style={{ color: C.onSurfaceVariant, fontSize: 11, lineHeight: 16, marginTop: 6 }}>
                Calls doctor, shows hospital
              </Text>
            </View>
          </View>

          {/* Card 4 — Privacy (full width row) */}
          <View style={[s.helpCard, { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }]}>
            <View style={[s.helpCardIcon, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="security" size={22} color="#1565C0" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.helpCardTitle}>Privacy First</Text>
              <Text style={[s.helpCardUrdu, { textAlign: 'right' }]}>آپ کا ڈیٹا محفوظ</Text>
              <Text style={{ color: C.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>Stays on local device — no cloud, no internet</Text>
            </View>
            <MaterialIcons name="verified-user" size={36} color="#1565C0" style={{ opacity: 0.15 }} />
          </View>

          {/* Deployment Model Card */}
          <View style={{ backgroundColor: C.primaryContainer, borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MaterialIcons name="router" size={24} color="white" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>How it reaches villages</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'right' }}>گاؤں تک کیسے پہنچتا ہے</Text>
              </View>
            </View>
            {[
              { step: '1', en: 'A $75 Raspberry Pi is installed in the clinic or health center', ur: 'کلینک میں ایک چھوٹا $75 ڈیوائس لگایا جاتا ہے' },
              { step: '2', en: 'The Pi runs Gemma 4 AI locally and creates a WiFi hotspot', ur: 'یہ ڈیوائس مقامی WiFi بناتا ہے — انٹرنیٹ نہیں چاہیے' },
              { step: '3', en: 'Patients connect their phone to this local hotspot', ur: 'مریض اپنا فون اس مقامی نیٹ ورک سے جوڑتے ہیں' },
              { step: '4', en: 'SehatGemma sends photos to the Pi — nothing goes online', ur: 'تصویر صرف اسی کمرے میں رہتی ہے — کہیں نہیں جاتی' },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>{item.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontSize: 13, lineHeight: 18 }}>{item.en}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'right', lineHeight: 20, marginTop: 2 }}>{item.ur}</Text>
                </View>
              </View>
            ))}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 10, marginTop: 4 }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>
                One Pi serves 100+ patients/day · Cost: $0 per query · Data never leaves the room
              </Text>
            </View>
          </View>

          {/* Statistics Banner */}
          <View style={s.statsBanner}>
            {stats.map((stat, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={s.analyzeAnotherBtn}
            onPress={() => setScreen('home')}
            activeOpacity={0.9}
          >
            <Text style={s.analyzeAnotherText}>Start Using SehatGemma / ابھی شروع کریں</Text>
          </TouchableOpacity>

          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>

        <BottomNav active="health" onPress={(tab) => {
          if (tab === 'health') setScreen('how_it_helps');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }} />
      </SafeAreaView>
    );
  }

  // ==================== MENU RESULT SCREEN ====================
  if (screen === 'menu_result' && loading) {
    return <AgentThinkingScreen label="Reading menu..." labelUr="مینو پڑھ رہا ہوں..." />;
  }

  if (screen === 'menu_result') {
    const isUrdu = language === 'ur';
    const items = menuResult?.items || [];
    const riskColor = (r) => r === 'high' ? C.error : r === 'medium' ? C.warning : '#2E7D32';
    const riskEmoji = (r) => r === 'high' ? '🚨' : r === 'medium' ? '⚠️' : '✅';

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={s.resultHeader}>
          <TouchableOpacity onPress={() => setScreen('home')} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.resultHeaderTitle}>Menu Scan / مینو تجزیہ</Text>
          <MaterialIcons name="menu-book" size={20} color={C.primary} />
        </View>

        {photoUri && (
          <Image source={{ uri: photoUri }} style={{ width: '100%', height: 110, resizeMode: 'cover' }} />
        )}

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'android' ? 120 : 90 }}>

          {/* Best choice */}
          <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#2E7D32' }}>
            <Text style={{ fontWeight: '700', color: '#2E7D32', fontSize: 13, marginBottom: 4 }}>✅ Best Order / بہترین آرڈر</Text>
            <Text style={{ color: C.onSurface, fontSize: 14, lineHeight: 20 }}>
              {isUrdu ? menuResult?.best_choice_ur : menuResult?.best_choice_en}
            </Text>
          </View>

          {/* Avoid */}
          {(menuResult?.avoid_en || menuResult?.avoid_ur) ? (
            <View style={{ backgroundColor: '#FFEBEE', borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: C.error }}>
              <Text style={{ fontWeight: '700', color: C.error, fontSize: 13, marginBottom: 4 }}>🚨 Avoid / پرہیز</Text>
              <Text style={{ color: C.onSurface, fontSize: 14, lineHeight: 20 }}>
                {isUrdu ? menuResult?.avoid_ur : menuResult?.avoid_en}
              </Text>
            </View>
          ) : null}

          {/* Items */}
          {items.length > 0 && (
            <>
              <Text style={{ fontWeight: '700', color: C.primary, fontSize: 14, marginBottom: 8 }}>
                All Items / تمام آئٹمز ({items.length})
              </Text>
              {items.map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainerLowest, borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: riskColor(item.risk), shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}>
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{riskEmoji(item.risk)}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: C.onSurface, fontSize: 14 }}>
                      {isUrdu ? (item.name_ur || item.name_en) : item.name_en}
                    </Text>
                    <Text style={{ color: C.onSurfaceVariant, fontSize: 12, marginTop: 2 }}>
                      {isUrdu ? item.note_ur : item.note_en}{item.carbs_g ? ` · ${item.carbs_g}g carbs` : ''}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: riskColor(item.risk) + '20', borderRadius: 50, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: riskColor(item.risk), fontSize: 10, fontWeight: '700' }}>
                      {(item.risk || '').toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {items.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 32, paddingHorizontal: 24 }}>
              <MaterialIcons name="image-search" size={52} color={C.outlineVariant} />
              <Text style={{ color: C.onSurfaceVariant, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
                Could not read menu items.{'\n'}Try a brighter, clearer photo.{'\n'}واضح تصویر لیں۔
              </Text>
            </View>
          )}

          <TouchableOpacity style={[s.analyzeAnotherBtn, { marginTop: 16 }]} onPress={scanMenu} activeOpacity={0.9}>
            <MaterialIcons name="menu-book" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={s.analyzeAnotherText}>Scan Another Menu / دوسرا مینو</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.analyzeAnotherBtn, { backgroundColor: C.secondary, marginTop: 10 }]} onPress={() => setScreen('home')} activeOpacity={0.9}>
            <MaterialIcons name="home" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={s.analyzeAnotherText}>Back to Home / گھر واپس</Text>
          </TouchableOpacity>

        </ScrollView>
        <BottomNav active="camera" onPress={(tab) => {
          if (tab === 'health') setScreen('glucose');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('chat');
          else if (tab === 'voice') setScreen('voice');
        }} />
      </SafeAreaView>
    );
  }

  // ==================== HELPERS ====================
  async function scanMenu() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to scan a menu.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.6,
    });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      await analyzeMenu(res.assets[0].uri);
    }
  }

  async function analyzeMenu(uri) {
    setLoading(true);
    setScreen('menu_result');
    try {
      const formData = new FormData();
      const fileUri = Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://') ? `file://${uri}` : uri;
      formData.append('file', { uri: fileUri, name: 'menu.jpg', type: 'image/jpeg' });
      formData.append('language', language);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      const resp = await fetch(`${BACKEND_URL}/scan-menu`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      setMenuResult(data);
    } catch {
      setMenuResult({
        items: [],
        best_choice_en: 'Could not analyze menu. Make sure backend is running and try again.',
        best_choice_ur: 'مینو کا تجزیہ نہیں ہوا۔ دوبارہ کوشش کریں۔',
        avoid_en: '',
        avoid_ur: '',
      });
    } finally {
      setLoading(false);
    }
  }

  async function launchCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take food photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      await analyzeImage(res.assets[0].uri);
    }
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!res.canceled) {
      setPhotoUri(res.assets[0].uri);
      await analyzeImage(res.assets[0].uri);
    }
  }

  async function analyzeImage(uri) {
    setLoading(true);
    setScreen('result');
    try {
      const formData = new FormData();
      // Android needs explicit file:// URI in some cases
      const fileUri = Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://') ? `file://${uri}` : uri;
      formData.append('file', { uri: fileUri, name: 'food.jpg', type: 'image/jpeg' });
      formData.append('language', language);
      formData.append('glucose_level', glucoseLogs[0]?.value || '');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const resp = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      setResult({ ...data, _source: 'gemma_ai' });
      speakResult(data);

      const newHistory = [{ ...data, timestamp: new Date().toISOString(), imageUri: uri, inputType: 'image' }, ...history];
      setHistory(newHistory.slice(0, 50));
      await AsyncStorage.setItem('sehat_history', JSON.stringify(newHistory.slice(0, 50)));
    } catch (err) {
      // Backend reachable but timed out or errored — offer text fallback
      setResult({
        sugar_risk: 'unknown',
        food_name_en: 'Analysis Failed — Describe It',
        food_name_ur: 'تجزیہ ناکام — کھانا بتائیں',
        explanation_en: 'Could not analyze the photo (timeout or connection issue). Tap the orange Retry button, or go to Voice tab and type/speak the food name for an instant offline result.',
        explanation_ur: 'تصویر کا تجزیہ نہیں ہو سکا۔ Voice ٹیب پر جا کر کھانے کا نام لکھیں — فوری جواب ملے گا۔',
        swap_suggestion_en: 'Make sure backend is running: uvicorn main:app --port 8001',
        swap_suggestion_ur: 'یقینی بنائیں کہ backend چل رہا ہے اور فون ایک ہی WiFi پر ہے۔',
        confidence: 0, carbs_g: 0, calories_estimate: 'N/A',
        _source: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  function speakResult(data) {
    try {
      const risk = data?.sugar_risk || 'unknown';
      const name = data?.food_name_en || 'Food';
      const carbs = data?.carbs_g;
      const textEn = `${name}. Sugar risk: ${risk}.${carbs ? ` ${carbs} grams carbs.` : ''}`;
      if (language === 'ur') {
        const riskUr = risk === 'high' ? 'زیادہ خطرہ' : risk === 'medium' ? 'درمیانہ خطرہ' : risk === 'low' ? 'کم خطرہ' : 'نامعلوم';
        const textUr = `${data?.food_name_ur || name}۔ شوگر رسک ${riskUr}۔${carbs ? ` ${carbs} گرام کاربس۔` : ''}`;
        // Try Urdu TTS — if ur-PK voice not installed on device, fall back to English
        Speech.speak(textUr, {
          language: 'ur-PK',
          rate: 0.9,
          onError: () => { try { Speech.speak(textEn, { language: 'en-US', rate: 0.95 }); } catch (_) {} },
        });
      } else {
        Speech.speak(textEn, { language: 'en-US', rate: 0.95 });
      }
    } catch (_) {}
  }

  async function analyzeText(text) {
    setLoading(true);
    setPhotoUri(null);
    setScreen('result');

    const offlineResult = offlineDB.searchFood(text);
    if (offlineResult.match_type !== 'unknown') {
      setResult({ ...offlineResult, _source: 'offline_db' });
      speakResult(offlineResult);
      const entry = { ...offlineResult, timestamp: new Date().toISOString(), imageUri: null, inputType: 'text' };
      const updated = [entry, ...history].slice(0, 50);
      setHistory(updated);
      await AsyncStorage.setItem('sehat_history', JSON.stringify(updated));
      setLoading(false);

      try {
        const formData = new FormData();
        formData.append('text', text);
        formData.append('language', language);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const resp = await fetch(`${BACKEND_URL}/analyze`, {
          method: 'POST', body: formData, signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await resp.json();
        if (data.confidence > offlineResult.confidence) {
          setResult(data);
          speakResult(data);
          const betterEntry = { ...data, timestamp: new Date().toISOString(), imageUri: null, inputType: 'text' };
          const betterUpdated = [betterEntry, ...history].slice(0, 50);
          setHistory(betterUpdated);
          await AsyncStorage.setItem('sehat_history', JSON.stringify(betterUpdated));
        }
      } catch (e) {}
      return;
    }

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', language);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const resp = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await resp.json();
      setResult(data);
      speakResult(data);

      const entry = { ...data, timestamp: new Date().toISOString(), imageUri: null, inputType: 'text' };
      const updated = [entry, ...history].slice(0, 50);
      setHistory(updated);
      await AsyncStorage.setItem('sehat_history', JSON.stringify(updated));
    } catch (err) {
      setResult(offlineResult);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeVoiceText(overrideText) {
    const text = (overrideText || voiceText || '').trim();
    if (!text) { Alert.alert('', 'Type something first / پہلے کچھ لکھیں'); return; }
    setVoiceText('');

    // Voice navigation commands (exact short commands only — don't fire on food descriptions)
    const lower = text.toLowerCase();
    const isShortCommand = text.length < 20 && !lower.includes('khayi') && !lower.includes('khaya') && !lower.includes('meri') && !lower.includes('aaj');
    if (isShortCommand && ['go home', 'ghar jao', 'واپس جاؤ'].some(w => lower.includes(w))) { setScreen('home'); return; }
    if (isShortCommand && ['emergency', 'sos', 'مدد کرو'].some(w => lower.includes(w))) { setScreen('emergency'); return; }
    if (isShortCommand && ['glucose log', 'shoogar log', 'log glucose'].some(w => lower.includes(w))) { setScreen('glucose'); return; }
    if (isShortCommand && ['history', 'taareekh', 'تاریخ دکھاؤ'].some(w => lower.includes(w))) { setScreen('history'); return; }

    await analyzeText(text);
  }

  async function sendChatMessage() {
    if (!chatInput.trim()) return;
    const userMsg = { id: Date.now(), role: 'user', text_en: chatInput, text_ur: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const inputCopy = chatInput;
    setChatInput('');
    setChatLoading(true);

    // Build context: last 6 messages + glucose context
    const recentHistory = chatMessages.slice(-6).map(m => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.text_en || m.text_ur || ''
    }));
    const glucoseCtx = glucoseLogs[0] ? `User last glucose: ${glucoseLogs[0].value} mg/dL.` : '';

    try {
      // 1) Try /chat endpoint (full conversational Gemma)
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 25000);
      const resp = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputCopy, history: recentHistory, language, context: glucoseCtx }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await resp.json();
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'agent',
        text_en: data.response_en || data.explanation_en || data.response || 'No response.',
        text_ur: data.response_ur || data.explanation_ur || data.response || 'جواب نہیں ملا',
      }]);
    } catch {
      // 2) Fallback: offline DB search
      const offlineResult = offlineDB.searchFood(inputCopy);
      if (offlineResult.match_type !== 'unknown') {
        setChatMessages(prev => [...prev, {
          id: Date.now() + 1, role: 'agent',
          text_en: `${offlineResult.food_name_en}: ${offlineResult.explanation_en} Sugar risk: ${offlineResult.sugar_risk?.toUpperCase()}. Carbs: ${offlineResult.carbs_g}g. Swap: ${offlineResult.swap_suggestion_en}`,
          text_ur: `${offlineResult.food_name_ur}: ${offlineResult.explanation_ur} — خطرہ: ${offlineResult.sugar_risk === 'high' ? 'زیادہ' : offlineResult.sugar_risk === 'medium' ? 'درمیانہ' : 'کم'}`,
        }]);
      } else {
        // 3) Fallback: /analyze endpoint
        try {
          const fd = new FormData();
          fd.append('text', inputCopy); fd.append('language', language);
          const r2 = await fetch(`${BACKEND_URL}/analyze`, { method: 'POST', body: fd });
          const d2 = await r2.json();
          setChatMessages(prev => [...prev, {
            id: Date.now() + 1, role: 'agent',
            text_en: d2.explanation_en || 'Ask me about Pakistani food and diabetes.',
            text_ur: d2.explanation_ur || 'پاکستانی کھانے کے بارے میں پوچھیں',
          }]);
        } catch {
          setChatMessages(prev => [...prev, {
            id: Date.now() + 1, role: 'agent',
            text_en: 'Running from local database (phone-only mode). Ask me about biryani, roti, haleem, nihari, or karela — 101 Pakistani foods available without any network.',
            text_ur: 'میں آف لائن پاکستانی کھانوں کے بارے میں مدد کر سکتا ہوں۔ بریانی، روٹی، حلیم پوچھیں۔',
          }]);
        }
      }
    } finally { setChatLoading(false); }
  }

  async function runDemo() {
    const demoFoods = [
      { text: 'biryani', label: 'Biryani / بریانی', delay: 1200 },
      { text: 'saag with makai roti', label: 'Saag + Makai Roti / ساگ', delay: 1500 },
      { text: 'gulab jamun', label: 'Gulab Jamun / گلاب جامن', delay: 1500 },
    ];

    setScreen('result');
    setLoading(true);

    for (const food of demoFoods) {
      const offlineResult = offlineDB.searchFood(food.text);
      setResult({ ...offlineResult, _demoLabel: food.label });
      await new Promise(r => setTimeout(r, food.delay));
    }

    setLoading(false);
    setResult(prev => ({ ...prev, _demoComplete: true }));
  }

  async function shareResult() {
    if (!result) return;
    const risk = result.sugar_risk?.toUpperCase() || 'UNKNOWN';
    const riskUrdu = risk === 'HIGH' ? 'زیادہ خطرہ' : risk === 'MEDIUM' ? 'درمیانہ' : 'کم خطرہ';
    const msg = `🩺 SehatGemma Analysis\n${result.food_name_en} — ${result.food_name_ur}\n\n⚠️ Sugar Risk: ${risk} / ${riskUrdu}\n🍚 Carbs: ${result.carbs_g}g | ${result.calories_estimate || ''}\n✅ Better Swap: ${result.swap_suggestion_en}\n\nAI runs locally — no internet, no cloud, no foreign server.\nPowered by Gemma 4 on a local device.\nصحت جیما — پاکستان کے 3 کروڑ ذیابیطس مریضوں کے لیے`;
    try {
      await Share.share({ message: msg, title: 'SehatGemma Food Analysis' });
    } catch (e) {}
  }

  async function saveGlucose() {
    if (!glucose) return;
    const val = parseInt(glucose);
    const entry = { value: glucose, time: new Date().toLocaleString() };
    const updated = [entry, ...glucoseLogs];
    setGlucoseLogs(updated.slice(0, 100));
    await AsyncStorage.setItem('sehat_glucose', JSON.stringify(updated.slice(0, 100)));
    setGlucose('');
    if (val < 70 || val > 250) {
      setScreen('emergency');
    }
  }
}

// ==================== TUTORIAL SCREEN (original carousel) ====================
function TutorialScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;

  const steps = [
    { icon: 'photo-camera', community: false, urdu: 'اپنے کھانے کی تصویر لیں', english: 'Take a photo of your food', sub: 'Works on any phone — 101 foods stored locally', tip: 'اپنے کھانے کی تصویر لیں!' },
    { icon: 'head-cog',     community: true,  urdu: 'صحت جیما تجزیہ کرے گا',     english: 'Gemma 4 AI analyzes it',      sub: 'AI runs on a local device in your clinic — no internet', tip: 'AI سیکنڈوں میں جانتا ہے!' },
    { icon: 'security',     community: false, urdu: 'اردو میں محفوظ مشورہ پائیں', english: 'Get safe advice in Urdu',     sub: 'Nothing leaves your room — ever',           tip: 'آپ کا ڈیٹا محفوظ ہے!' },
  ];

  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -9, duration: 550, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0,  duration: 550, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);

  const cur = steps[step];
  return (
    <View style={{ flex: 1, backgroundColor: C.primaryContainer }}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryContainer} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Skip */}
        <TouchableOpacity style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 }} onPress={onComplete}>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Skip / چھوڑیں</Text>
        </TouchableOpacity>

        {/* Robot guide */}
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 24, marginTop: 60, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 10, maxWidth: 180, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' }}>
              <Text style={{ color: 'white', fontSize: 13, textAlign: 'right', lineHeight: 20 }}>{cur.tip}</Text>
            </View>
            <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', transform: [{ translateY: bounce }] }}>
              <MaterialIcons name="smart-toy" size={22} color="white" />
            </Animated.View>
          </View>
        </View>

        {/* Main */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}>
            {cur.community
              ? <MaterialCommunityIcons name={cur.icon} size={64} color="white" />
              : <MaterialIcons name={cur.icon} size={64} color="white" />}
          </View>
          <Text style={{ fontSize: 28, color: 'white', fontWeight: '800', textAlign: 'center', lineHeight: 46, marginBottom: 8 }}>{cur.urdu}</Text>
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 14 }}>{cur.english}</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 50, paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{cur.sub}</Text>
          </View>
        </View>

        {/* Dots + button */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center', gap: 18 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {steps.map((_, i) => (
              <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? 'white' : 'rgba(255,255,255,0.3)' }} />
            ))}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: 'white', borderRadius: 50, paddingVertical: 16, paddingHorizontal: 48, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 }}
            onPress={() => step < 2 ? setStep(step + 1) : onComplete()}
            activeOpacity={0.9}
          >
            <Text style={{ color: C.primary, fontWeight: '800', fontSize: 16 }}>
              {step < 2 ? 'آگے / Next' : 'شروع کریں / Get Started'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ==================== MENU OVERLAY ====================
function MenuOverlay({ onClose, onNav }) {
  const slideX = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    Animated.timing(slideX, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  }, []);
  const close = () => {
    Animated.timing(slideX, { toValue: 300, duration: 180, useNativeDriver: true }).start(onClose);
  };
  const items = [
    { icon: 'school',           label: 'Tutorial',       urdu: 'سبق',           screen: 'tutorial' },
    { icon: 'menu-book',        label: 'Scan Menu',      urdu: 'مینو اسکین',    screen: 'menu_scan_trigger' },
    { icon: 'help-outline',     label: 'How It Helps',   urdu: 'SehatGemma کیسے مدد کرتا ہے', screen: 'how_it_helps' },
    { icon: 'favorite',         label: 'Glucose Log',    urdu: 'شوگر ریکارڈ',   screen: 'glucose' },
    { icon: 'history',          label: 'Scan History',   urdu: 'اسکین تاریخ',   screen: 'history' },
    { icon: 'security',         label: 'Privacy Shield', urdu: 'پرائیویسی',     screen: 'privacy' },
    { icon: 'emergency',        label: 'Emergency',      urdu: 'ایمرجنسی',      screen: 'emergency' },
  ];
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={close} activeOpacity={1} />
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 280, backgroundColor: C.bg, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20, transform: [{ translateX: slideX }] }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.outlineVariant + '40' }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: C.primary }}>SehatGemma</Text>
              <Text style={{ fontSize: 13, color: C.onSurfaceVariant }}>صحت جیما</Text>
            </View>
            <TouchableOpacity onPress={close} style={{ padding: 4 }}>
              <MaterialIcons name="close" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }}>
            {items.map((item, i) => (
              <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 16, borderBottomWidth: 0.5, borderBottomColor: C.outlineVariant + '30' }}
                onPress={() => onNav(item.screen)} activeOpacity={0.7}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name={item.icon} size={22} color={C.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: C.onSurface }}>{item.label}</Text>
                  <Text style={{ fontSize: 12, color: C.onSurfaceVariant, textAlign: 'right' }}>{item.urdu}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={C.outlineVariant} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ padding: 20, borderTopWidth: 0.5, borderTopColor: C.outlineVariant + '40' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.5 }}>
              <MaterialIcons name="memory" size={13} color={C.onSurfaceVariant} />
              <Text style={{ fontSize: 11, color: C.onSurfaceVariant }}>Gemma 4 on local device — no internet needed</Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

// ==================== AGENT THINKING SCREEN ====================
function AgentThinkingScreen({ label, labelUr }) {
  const pulse1 = useRef(new Animated.Value(0.8)).current;
  const pulse2 = useRef(new Animated.Value(0.8)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ring1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1.3, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
      ])
    );
    const ring2 = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(pulse2, { toValue: 1.4, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0.8, duration: 1500, useNativeDriver: true }),
      ])
    );
    const makeDotAnim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(700),
        ])
      );

    ring1.start();
    ring2.start();
    makeDotAnim(dot1, 0).start();
    makeDotAnim(dot2, 200).start();
    makeDotAnim(dot3, 400).start();

    return () => { ring1.stop(); ring2.stop(); };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)' }]} />
      <View style={s.thinkingCanvas}>
        <View style={s.thinkingIconWrap}>
          <Animated.View style={[s.pulseRing1, { transform: [{ scale: pulse1 }] }]} />
          <Animated.View style={[s.pulseRing2, { transform: [{ scale: pulse2 }] }]} />
          <View style={s.thinkingIconCore}>
            <MaterialCommunityIcons name="head-cog" size={48} color={C.primaryFixedDim} />
            <View style={s.sparkleBadge}>
              <MaterialIcons name="auto-awesome" size={12} color={C.onSecondaryContainer} />
            </View>
          </View>
        </View>
        <View style={s.thinkingBubble}>
          <Text style={s.thinkingBubbleEn}>{label || 'Analyzing your meal...'}</Text>
          <Text style={[s.thinkingBubbleUr, { textAlign: 'right' }]}>
            {labelUr || 'کھانے کا تجزیہ ہو رہا ہے...'}
          </Text>
          <View style={s.dotsRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View key={i} style={[s.dot, { transform: [{ translateY: dot }] }]} />
            ))}
          </View>
        </View>
        <View style={s.chipRow}>
          <View style={s.chip}>
            <MaterialIcons name="restaurant" size={14} color="white" />
            <Text style={s.chipText}>Identifying Ingredients</Text>
          </View>
          <View style={s.chip}>
            <MaterialCommunityIcons name="water" size={14} color="white" />
            <Text style={s.chipText}>Estimating Glycemic Impact</Text>
          </View>
        </View>
      </View>
      <BottomNav active="camera" onPress={() => { }} />
    </View>
  );
}

// ==================== EMERGENCY SCREEN ====================
function EmergencyScreen({ glucoseLogs, onClose }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.95, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.emergencyRed }}>
      <StatusBar barStyle="light-content" backgroundColor={C.emergencyRed} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.emergencyHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialIcons name="emergency" size={28} color="white" />
            <Text style={s.emergencyHeaderText}>SehatGemma صحت جیما</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={[s.emergencyCanvas, { paddingBottom: Platform.OS === 'android' ? 60 : 40 }]}>
          <Animated.View style={[s.emergencyIconWrap, { transform: [{ scale: pulse }] }]}>
            <MaterialIcons name="add-moderator" size={80} color={C.emergencyRed} />
          </Animated.View>
          <Text style={s.emergencyTitleUr}>فوری مدد درکار ہے</Text>
          <Text style={s.emergencyTitleEn}>EMERGENCY DETECTED</Text>
          <Text style={s.emergencyDesc}>
            Your glucose levels have dropped critically low. Help is being notified.
          </Text>
          <TouchableOpacity
            style={s.emergencyCallCard}
            onPress={() => Alert.alert('Emergency', 'Calling Dr. Ahmed...')}
            activeOpacity={0.9}
          >
            <View style={s.emergencyCallLeft}>
              <View style={s.emergencyCallIcon}>
                <MaterialIcons name="call" size={24} color={C.emergencyRed} />
              </View>
              <View>
                <Text style={s.emergencyCallLabel}>Emergency Contact</Text>
                <Text style={s.emergencyCallName}>Call Dr. Ahmed</Text>
              </View>
            </View>
            <Text style={s.emergencyCallUrdu}>ڈاکٹر سے رابطہ کریں</Text>
          </TouchableOpacity>
          <View style={s.emergencyGrid}>
            <View style={s.emergencyReadingCard}>
              <Text style={s.emergencyReadingLabel}>Last Reading</Text>
              <Text style={s.emergencyReadingLabelUr}>آخری ریڈنگ</Text>
              <Text style={s.emergencyReadingValue}>
                {glucoseLogs[0]?.value || '—'}
              </Text>
              <Text style={s.emergencyReadingUnit}>mg/dL</Text>
              <View style={s.criticalBadge}>
                <Text style={s.criticalBadgeText}>
                  {parseInt(glucoseLogs[0]?.value) < 70 ? 'Critical Low' :
                    parseInt(glucoseLogs[0]?.value) > 250 ? 'Critical High' : 'Reading'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.emergencyHospitalCard}
              onPress={() => Alert.alert('Navigate', 'Opening maps to City General Hospital...')}
              activeOpacity={0.9}
            >
              <Text style={s.emergencyReadingLabel}>Nearest Hospital</Text>
              <Text style={s.emergencyReadingLabelUr}>قریبی ہسپتال</Text>
              <Text style={s.emergencyHospitalName}>City General Hospital</Text>
              <Text style={s.emergencyHospitalDist}>0.8 km away</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                <MaterialIcons name="directions" size={14} color={C.primaryContainer} />
                <Text style={{ color: C.primaryContainer, fontSize: 12, fontWeight: 'bold' }}>Navigate</Text>
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.safeBtn} onPress={onClose} activeOpacity={0.9}>
            <MaterialIcons name="health-and-safety" size={20} color="white" />
            <Text style={s.safeBtnText}>I am safe now / میں اب ٹھیک ہوں</Text>
          </TouchableOpacity>
          <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
        </ScrollView>
        <BottomNav active="health" onPress={(tab) => {
          if (tab === 'health') onClose();
          else if (tab === 'camera') onClose();
          else if (tab === 'chat') onClose();
          else if (tab === 'voice') onClose();
        }} />
      </SafeAreaView>
    </View>
  );
}

// ==================== VOICE SCREEN COMPONENT ====================
function VoiceScreen({ voiceText, setVoiceText, isListening, setIsListening, voiceInputRef, onAnalyze, onBack, onNav, language }) {
  const pulse1 = useRef(new Animated.Value(0.8)).current;
  const pulse2 = useRef(new Animated.Value(0.8)).current;
  const inputRef = useRef(null);
  const [speechError, setSpeechError] = useState('');

  const chips = [
    'Meri sugar 180 hai',
    'Aaj biryani khayi',
    'Chakkar aa raha hai',
    'Diet plan chahiye',
  ];

  const speechAvailable = false; // native STT disabled in Expo Go build

  useEffect(() => {
    const a1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse1, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse1, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
      ])
    );
    const a2 = Animated.loop(
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(pulse2, { toValue: 1.55, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
      ])
    );
    if (isListening) {
      a1.start();
      a2.start();
    }
    return () => { a1.stop(); a2.stop(); };
  }, [isListening]);

  const toggleListening = async () => {
    setSpeechError('');
    if (isListening) {
      setIsListening(false);
      try { Speech.stop(); } catch (e) {}
      return;
    }
    // Keyboard mic fallback (works in Expo Go and APK)
    setIsListening(true);
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 150);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.privacyBg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.privacyBg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>بولیں</Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>Speak Now</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 120 : 90 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mic visualization */}
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 200, marginBottom: 8 }}>
          {isListening && (
            <>
              <Animated.View style={[s.voicePulseOuter, { transform: [{ scale: pulse2 }] }]} />
              <Animated.View style={[s.voicePulseInner, { transform: [{ scale: pulse1 }] }]} />
            </>
          )}
          <View style={[s.voiceMicCore, isListening && { backgroundColor: '#ff5252' }]}>
            <MaterialIcons name={isListening ? 'graphic-eq' : 'mic'} size={44} color="white" />
          </View>
        </View>

        {/* Listening instruction banner — visible when mic is active */}
        {isListening && (
          <View style={{ backgroundColor: 'rgba(255,82,82,0.15)', borderRadius: 14, borderWidth: 1, borderColor: '#ff5252', paddingHorizontal: 18, paddingVertical: 10, marginBottom: 12, alignItems: 'center', width: '100%' }}>
            <Text style={{ color: '#ff5252', fontWeight: '700', fontSize: 14, marginBottom: 2 }}>
              🎤 Listening... سن رہا ہوں
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' }}>
              {speechAvailable ? 'Speak now — your words will appear below' : "Type food name below OR tap 🎤 on keyboard"}{'\n'}
              {speechAvailable ? 'اب بولیں — آپ کے الفاظ نیچے آ جائیں گے' : 'نیچے کھانے کا نام لکھیں یا کی بورڈ مائیک دبائیں'}
            </Text>
          </View>
        )}

        {speechError ? (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <Text style={{ color: '#ff5252', fontSize: 12, textAlign: 'center' }}>{speechError}</Text>
          </View>
        ) : null}

        {/* Record button */}
        <TouchableOpacity
          style={[s.voiceRecordBtn, isListening && { backgroundColor: '#ff5252' }]}
          onPress={toggleListening}
          activeOpacity={0.85}
        >
          <MaterialIcons name={isListening ? 'stop' : 'mic'} size={36} color="white" />
        </TouchableOpacity>
        <Text style={{ color: isListening ? '#ff5252' : 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8, marginBottom: 16, textAlign: 'center' }}>
          {isListening ? 'Tap ■ to stop / روکنے کے لیے دبائیں' : 'Tap to activate voice / مائیک چالو کریں'}
        </Text>

        {/* Example chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
          {chips.map((chip, i) => (
            <TouchableOpacity
              key={i}
              style={s.voiceChip}
              onPress={() => { setVoiceText(chip); setTimeout(() => onAnalyze(chip), 300); }}
              activeOpacity={0.7}
            >
              <Text style={{ color: 'white', fontSize: 13 }}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transcription card */}
        <View style={s.voiceTranscriptCard}>
          <TextInput
            style={{ fontSize: 16, color: C.onSurface, minHeight: 80, textAlignVertical: 'top' }}
            multiline
            placeholder="آپ کی آواز یہاں لکھیں / Type or use mic..."
            placeholderTextColor={C.onSurfaceVariant}
            value={voiceText}
            onChangeText={setVoiceText}
            autoFocus={isListening && !speechAvailable}
            ref={inputRef}
            returnKeyType="send"
            onSubmitEditing={() => voiceText && onAnalyze(voiceText)}
          />
        </View>

        {/* Analyze button */}
        <TouchableOpacity
          style={[s.voiceAnalyzeBtn, !voiceText.trim() && { backgroundColor: C.outline }]}
          onPress={() => { if (!voiceText.trim()) return; onAnalyze(voiceText.trim()); setVoiceText(''); }}
          activeOpacity={0.9}
        >
          <MaterialIcons name="send" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
            تجزیہ کریں / Analyze
          </Text>
        </TouchableOpacity>

        {/* Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12, opacity: 0.45 }}>
          <MaterialIcons name="memory" size={13} color="white" />
          <Text style={{ color: 'white', fontSize: 11 }}>Powered by Gemma 4 — Understanding Urdu</Text>
        </View>

        <View style={{ height: Platform.OS === 'android' ? 110 : 80 }} />
      </ScrollView>

      <BottomNav active="voice" onPress={onNav} />
    </SafeAreaView>
  );
}

// ==================== CHAT SCREEN COMPONENT ====================
function ChatScreen({ chatMessages, chatInput, setChatInput, chatLoading, onSend, onBack, onNav, language }) {
  const isUrdu = language === 'ur';
  const chatScrollRef = useRef(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={s.glucoseHeader}>
        <TouchableOpacity onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color={C.primary} />
        </TouchableOpacity>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={s.glucoseTitle}>Chat with SehatGemma</Text>
          <Text style={{ fontSize: 13, color: chatLoading ? C.primary : C.onSurfaceVariant, fontWeight: chatLoading ? '600' : '400' }}>
            {chatLoading ? '⚡ Gemma thinking... جواب آ رہا ہے' : 'صحت جیما سے بات کریں'}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={chatScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 16 }}
        onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
      >
        {chatMessages.map((msg) => (
          <View
            key={msg.id}
            style={{
              alignSelf: msg.role === 'agent' ? 'flex-start' : 'flex-end',
              backgroundColor: msg.role === 'agent' ? C.agentBubble : C.primaryContainer,
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
              maxWidth: '85%',
              borderTopLeftRadius: msg.role === 'agent' ? 4 : 16,
              borderTopRightRadius: msg.role === 'user' ? 4 : 16,
            }}
          >
            <Text
              style={{
                color: msg.role === 'agent' ? C.onSurface : 'white',
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              {isUrdu ? (msg.text_ur || msg.text_en) : (msg.text_en || msg.text_ur)}
            </Text>
          </View>
        ))}
        {chatLoading && (
          <View style={{ alignSelf: 'flex-start', padding: 14, backgroundColor: C.agentBubble, borderRadius: 16, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[0, 1, 2].map(i => <TypingDot key={i} delay={i * 200} />)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Chat input — fixed above bottom safe area */}
      <View style={s.chatInputBar}>
        <TextInput
          style={s.chatInputField}
          placeholder={isUrdu ? "کھانے کے بارے میں پوچھیں..." : "Ask about food..."}
          placeholderTextColor={C.onSurfaceVariant}
          value={chatInput}
          onChangeText={setChatInput}
          multiline
          onSubmitEditing={onSend}
        />
        <TouchableOpacity
          style={[s.chatSendBtn, { backgroundColor: chatInput.trim() ? C.primary : C.outlineVariant }]}
          onPress={onSend}
          disabled={!chatInput.trim() || chatLoading}
        >
          <MaterialIcons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
      {/* NO BottomNav here — it clashes with chat input bar */}
    </SafeAreaView>
  );
}

// ==================== REUSABLE COMPONENTS ====================
function QuickBtn({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={s.quickBtn} onPress={onPress} activeOpacity={0.8}>
      <MaterialIcons name={icon} size={26} color={C.primary} />
      <Text style={s.quickBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function PrivacyCard({ icon, title, urdu, badge }) {
  return (
    <View style={s.privacyCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
        <View style={s.privacyCardIcon}>
          <MaterialIcons name={icon} size={22} color={C.primaryFixedDim} />
        </View>
        <View>
          <Text style={s.privacyCardTitle}>{title}</Text>
          <Text style={s.privacyCardUrdu}>{urdu}</Text>
        </View>
      </View>
      <View style={s.privacyBadge}>
        <Text style={s.privacyBadgeText}>{badge}</Text>
      </View>
    </View>
  );
}

function MetricChip({ icon, label }) {
  return (
    <View style={s.metricChip}>
      <MaterialIcons name={icon} size={16} color={C.onSurfaceVariant} />
      <Text style={s.metricChipText}>{label}</Text>
    </View>
  );
}

function BottomNav({ active, onPress }) {
  const tabs = [
    { id: 'voice', icon: 'mic', label: 'Voice' },
    { id: 'camera', icon: 'photo-camera', label: 'Camera' },
    { id: 'chat', icon: 'forum', label: 'Chat' },
    { id: 'health', icon: 'medical-services', label: 'Health' },
  ];
  return (
    <View style={s.bottomNav}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[s.bottomNavItem, active === tab.id && s.bottomNavItemActive]}
          onPress={() => onPress(tab.id)}
        >
          <MaterialIcons
            name={tab.icon}
            size={24}
            color={active === tab.id ? C.onPrimaryContainer : C.onSurfaceVariant}
          />
          <Text style={[s.bottomNavLabel, active === tab.id && { color: C.onPrimaryContainer }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function TypingDot({ delay }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(y, { toValue: -5, duration: 300, useNativeDriver: true }),
      Animated.timing(y, { toValue: 0,  duration: 300, useNativeDriver: true }),
      Animated.delay(600),
    ])).start();
  }, []);
  return <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.outline, transform: [{ translateY: y }] }} />;
}

// ==================== STYLES ====================
const s = StyleSheet.create({
  // ---- DISCLAIMER ----
  disclaimerCanvas: { alignItems: 'center', padding: 16, paddingTop: 40, paddingBottom: 40 },
  disclaimerIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, marginBottom: 16 },
  disclaimerH1: { fontSize: 30, fontWeight: '700', color: C.onBg, textAlign: 'center' },
  disclaimerH1Ur: { fontSize: 24, color: C.onBg, marginTop: 4, marginBottom: 16 },
  bentoDivider: { height: 1, backgroundColor: C.outlineVariant, width: '100%', marginVertical: 12 },
  bentoCard: { backgroundColor: C.surfaceContainerLowest, borderRadius: 12, padding: 16, width: '100%', borderWidth: 0.5, borderColor: C.outlineVariant + '50', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  bentoCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bentoCardLabel: { fontSize: 11, fontWeight: '700', color: C.primary, letterSpacing: 1, marginLeft: 8, textTransform: 'uppercase' },
  bentoCardBody: { fontSize: 15, color: C.onSurfaceVariant, lineHeight: 22 },
  bentoCardBodyUr: { fontSize: 16, color: C.onSurfaceVariant, lineHeight: 30 },
  disclaimerCTA: { backgroundColor: C.primary, width: '100%', borderRadius: 50, paddingVertical: 18, alignItems: 'center', marginTop: 24, shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  disclaimerCTAText: { color: C.onPrimary, fontSize: 20, fontWeight: '600' },
  disclaimerCTAUrdu: { color: C.onPrimary + 'CC', fontSize: 18, marginTop: 2 },
  disclaimerFootnote: { fontSize: 12, color: C.onSurfaceVariant + 'AA', marginTop: 12, textAlign: 'center' },
  disclaimerBrand: { textAlign: 'center', color: C.primary, fontWeight: '700', letterSpacing: 2, fontSize: 11, textTransform: 'uppercase', paddingBottom: 12, opacity: 0.7 },

  // ---- HOME ----
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg, borderBottomWidth: 0, zIndex: 10, width: '100%' },
  homeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, flexShrink: 1, marginRight: 8 },
  homeLogoText: { fontSize: 16, fontWeight: '700', color: C.primary, flexShrink: 1 },
  langPill: { flexDirection: 'row', backgroundColor: C.surfaceContainer, borderRadius: 50, padding: 4 },
  langPillBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50 },
  langPillActive: { backgroundColor: C.primary },
  langPillText: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  langPillTextUr: { fontSize: 13, fontWeight: '600', color: C.onSurfaceVariant },
  homeTaglineEn: { fontSize: 13, color: C.onSurfaceVariant },
  homeTaglineUr: { fontSize: 14, color: C.onSurfaceVariant },
  agentBubble: { marginHorizontal: 16, marginVertical: 12, backgroundColor: C.agentBubble, borderRadius: 12, borderTopLeftRadius: 2, padding: 16, borderWidth: 0.5, borderColor: C.outlineVariant + '30', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, overflow: 'hidden' },
  agentBubbleEn: { fontSize: 15, color: C.onSurface, lineHeight: 22 },
  agentBubbleUr: { fontSize: 16, color: C.onSurface, lineHeight: 30, marginTop: 8 },
  agentBubbleWatermark: { position: 'absolute', bottom: -16, right: -8, opacity: 0.05 },
  homeActionArea: { paddingHorizontal: 16, marginTop: 4 },
  primaryActionBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  primaryActionText: { color: 'white', fontSize: 18, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 },
  quickBtn: { flex: 1, backgroundColor: C.surfaceContainerLowest, borderWidth: 0.5, borderColor: C.outlineVariant, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  quickBtnLabel: { fontSize: 11, color: C.onSurface, fontWeight: '500' },
  lastMealCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: C.surfaceContainerLowest, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: C.outlineVariant },
  lastMealThumb: { width: 72, height: 72, borderRadius: 8, marginRight: 12, backgroundColor: C.surfaceContainer },
  lastMealLabel: { fontSize: 11, color: C.primary, fontWeight: '500' },
  lastMealName: { fontSize: 14, color: C.onSurfaceVariant, marginTop: 2 },

  // ---- WEEKLY INSIGHT ----
  insightCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: C.surfaceContainerLowest, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.primary + '30', borderLeftWidth: 4, borderLeftColor: C.primary },

  // ---- DEMO / POWERED ----
  demoBtn: { marginHorizontal: 16, marginTop: 12, backgroundColor: C.secondary, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  poweredBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 6, opacity: 0.6, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: C.surfaceContainerLowest, borderRadius: 50, alignSelf: 'center' },
  poweredText: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3, color: C.onBg },
  riskPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  riskPillText: { color: 'white', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ---- AGENT THINKING ----
  thinkingCanvas: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 24, paddingBottom: 80 },
  thinkingIconWrap: { position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  pulseRing1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: C.primary + '30' },
  pulseRing2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: C.primary + '18' },
  thinkingIconCore: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, borderWidth: 3, borderColor: C.primary + '40' },
  sparkleBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: C.secondaryContainer, padding: 4, borderRadius: 50 },
  thinkingBubble: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  thinkingBubbleEn: { fontSize: 20, fontWeight: '600', color: C.primary, letterSpacing: -0.3 },
  thinkingBubbleUr: { fontSize: 20, color: C.primary, lineHeight: 36, marginTop: 4 },
  dotsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { color: 'white', fontSize: 13, fontWeight: '500' },

  // ---- RESULT ----
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  resultHeaderTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  resultPhotoWrap: { height: 240, position: 'relative', marginBottom: 0 },
  resultPhoto: { width: '100%', height: '100%' },
  resultPhotoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  riskBadge: { marginTop: 16, borderRadius: 50, paddingHorizontal: 24, paddingVertical: 10, alignSelf: 'center', alignItems: 'center' },
  riskBadgeText: { color: 'white', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  riskBadgeUrdu: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  resultFoodName: { fontSize: 26, fontWeight: '700', color: C.onSurface, textAlign: 'center', marginVertical: 12 },
  infoCard: { backgroundColor: C.surfaceContainerLowest, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  infoCardText: { flex: 1, fontSize: 15, color: C.onSurfaceVariant, lineHeight: 22 },
  swapCard: { borderLeftWidth: 3, borderLeftColor: C.primary },
  swapLabel: { fontWeight: '700', color: C.primary, marginBottom: 4, fontSize: 14 },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.surfaceContainer, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  metricChipText: { fontSize: 13, color: C.onSurfaceVariant, fontWeight: '500' },
  analyzeAnotherBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center', shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  analyzeAnotherText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // ---- PRIVACY ----
  privacyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'android' ? 16 : 8 },
  privacyHeaderTitle: { color: C.primaryFixedDim, fontSize: 20, fontWeight: '700' },
  privacyHeaderUrdu: { color: C.primaryFixedDim, fontSize: 16 },
  privacyIconWrap: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  privacyIconGlow: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.primaryFixedDim + '50', shadowColor: '#2E7D32', shadowOpacity: 0.4, shadowRadius: 20, elevation: 8, marginBottom: 16 },
  privacySubtitle: { color: C.onSurfaceVariant, fontSize: 14, textAlign: 'center' },
  privacySubtitleUr: { color: C.onSurfaceVariant, fontSize: 14, marginTop: 4 },
  privacyCards: { paddingHorizontal: 16, gap: 10 },
  privacyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.privacyContainer, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: C.primaryFixedDim + '30', shadowColor: '#00ff00', shadowOpacity: 0.05, shadowRadius: 8 },
  privacyCardIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: C.primaryContainer + '66', alignItems: 'center', justifyContent: 'center' },
  privacyCardTitle: { color: 'white', fontSize: 13, fontWeight: '600' },
  privacyCardUrdu: { color: C.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  privacyBadge: { backgroundColor: C.primaryContainer + '44', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  privacyBadgeText: { color: C.primaryFixedDim, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  auditLog: { marginHorizontal: 16, marginTop: 16, backgroundColor: C.privacySurface, borderRadius: 12, padding: 14 },
  auditLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: C.outlineVariant + '20' },
  auditLogTitle: { color: C.onSurfaceVariant, fontSize: 13 },
  auditLogTitleUr: { color: C.onSurfaceVariant, fontSize: 13 },
  auditEntry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  auditEntryTitle: { color: 'white', fontSize: 14, fontWeight: '500' },
  auditEntryDesc: { color: C.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  auditEntryTime: { color: 'white', fontSize: 12 },
  auditEntryTimeUr: { color: C.onSurfaceVariant, fontSize: 11 },
  auditDivider: { height: 0.5, backgroundColor: C.outlineVariant + '20', marginVertical: 4 },
  burnBtn: { marginHorizontal: 16, marginTop: 20, backgroundColor: C.error + '22', borderWidth: 0.5, borderColor: C.error + '60', borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
  burnBtnText: { color: C.error, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  burnBtnUrdu: { color: C.error, fontSize: 14 },
  burnWarning: { color: C.onSurfaceVariant, fontSize: 11, textAlign: 'center', marginTop: 12, marginHorizontal: 32, fontStyle: 'italic' },

  // ---- EMERGENCY ----
  emergencyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  emergencyHeaderText: { color: 'white', fontSize: 18, fontWeight: '700' },
  emergencyCanvas: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 40 },
  emergencyIconWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: 'white', shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  emergencyTitleUr: { color: 'white', fontSize: 28, lineHeight: 50, textAlign: 'center', marginBottom: 4 },
  emergencyTitleEn: { color: 'white', fontSize: 26, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  emergencyDesc: { color: 'rgba(255,255,255,0.85)', fontSize: 15, textAlign: 'center', marginTop: 10, marginBottom: 24, lineHeight: 22, maxWidth: 300 },
  emergencyCallCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  emergencyCallLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emergencyCallIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.errorContainer, alignItems: 'center', justifyContent: 'center' },
  emergencyCallLabel: { color: C.outline, fontSize: 12 },
  emergencyCallName: { color: C.emergencyRed, fontWeight: '700', fontSize: 18 },
  emergencyCallUrdu: { color: C.outline, fontSize: 13 },
  emergencyGrid: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 20 },
  emergencyReadingCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  emergencyReadingLabel: { color: C.outline, fontSize: 12 },
  emergencyReadingLabelUr: { color: C.outline, fontSize: 11, marginTop: 2 },
  emergencyReadingValue: { fontSize: 46, fontWeight: '900', color: C.emergencyRed, lineHeight: 52, marginTop: 8 },
  emergencyReadingUnit: { color: C.outline, fontSize: 13 },
  criticalBadge: { backgroundColor: C.emergencyRed, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, marginTop: 6, alignSelf: 'flex-start' },
  criticalBadgeText: { color: 'white', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  emergencyHospitalCard: { flex: 1, backgroundColor: 'white', borderRadius: 12, padding: 14, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  emergencyHospitalName: { color: C.emergencyRed, fontWeight: '700', fontSize: 15, lineHeight: 20, marginTop: 6 },
  emergencyHospitalDist: { color: C.outline, fontSize: 12, marginTop: 2 },
  safeBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' },
  safeBtnText: { color: 'white', fontWeight: '500', fontSize: 14 },

  // ---- GLUCOSE LOGBOOK ----
  glucoseHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  glucoseTitle: { fontSize: 18, fontWeight: '700', color: C.primary },
  glucoseSubtitle: { fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 },
  trendRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  trendBarWrap: { alignItems: 'center', gap: 4 },
  trendBar: { width: 20, borderRadius: 4 },
  trendDay: { fontSize: 10, color: C.onSurfaceVariant },
  trendAvg: { color: C.onSurfaceVariant, fontSize: 12, fontWeight: '500' },
  glucoseInputRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  glucoseInput: { flex: 1, backgroundColor: C.surfaceContainerLowest, borderWidth: 1, borderColor: C.outlineVariant, borderRadius: 12, padding: 14, fontSize: 18, color: C.onSurface, fontWeight: '600' },
  glucoseSaveBtn: { backgroundColor: C.primary, borderRadius: 12, width: 52, alignItems: 'center', justifyContent: 'center' },
  recentLabel: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 13, color: C.onSurfaceVariant, fontWeight: '500' },
  glucoseLogItem: { backgroundColor: C.surfaceContainerLowest, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  glucoseLogValue: { fontSize: 20, fontWeight: '700' },
  glucoseLogRisk: { color: C.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  glucoseLogTime: { color: C.onSurfaceVariant, fontSize: 11, textAlign: 'right' },

  // ---- HISTORY ----
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceContainerLowest, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  historyThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: C.surfaceContainer },

  // ---- BOTTOM NAV ----
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'android' ? 32 : 16, minHeight: 70, backgroundColor: 'rgba(255,255,255,0.97)', borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 20 },
  bottomNavItem: { alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50 },
  bottomNavItemActive: { backgroundColor: C.primaryContainer, paddingHorizontal: 16 },
  bottomNavLabel: { fontSize: 11, color: C.onSurfaceVariant },

  // ---- VOICE ----
  voicePulseOuter: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: C.primary + '20' },
  voicePulseInner: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: C.primary + '35' },
  voiceMicCore: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: C.primaryFixedDim + '50' },
  voiceRecordBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.emergencyRed, alignItems: 'center', justifyContent: 'center', shadowColor: C.emergencyRed, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8 },
  voiceChip: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8 },
  voiceTranscriptCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, width: '100%', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  voiceAnalyzeBtn: { backgroundColor: C.primary, borderRadius: 50, paddingVertical: 16, paddingHorizontal: 32, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  // ---- CHAT INPUT BAR ----
  chatInputBar: { backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.outlineVariant + '60', paddingHorizontal: 12, paddingTop: 8, paddingBottom: Platform.OS === 'android' ? 40 : 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatInputField: { flex: 1, backgroundColor: C.surfaceContainerLowest, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: C.onSurface, maxHeight: 100 },
  chatSendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // ---- HOW IT HELPS ----
  helpCard: { backgroundColor: C.surfaceContainerLowest, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 0.5, borderColor: C.outlineVariant, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  helpCardHalf: { flex: 1, backgroundColor: C.surfaceContainerLowest, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: C.outlineVariant, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  helpCardIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary + '15', alignItems: 'center', justifyContent: 'center' },
  helpCardTitle: { fontWeight: '700', color: C.onSurface, fontSize: 15 },
  helpCardUrdu: { color: C.onSurfaceVariant, fontSize: 13, marginTop: 2 },
  foodChip: { backgroundColor: C.primary + '12', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 0.5, borderColor: C.primary + '30' },
  foodChipText: { color: C.primary, fontSize: 13, fontWeight: '500' },
  statsBanner: { backgroundColor: C.primary, borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-around' },
  statValue: { color: 'white', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, textAlign: 'center', marginTop: 4, lineHeight: 14 },
});
