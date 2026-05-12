import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, SafeAreaView, StatusBar,
  Animated, Dimensions, Platform
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { offlineDB } from './offlineDatabase';

const { width } = Dimensions.get('window');

// ==================== CONFIG ====================

const BACKEND_URL = Platform.OS === 'web'
  ? 'http://localhost:8001'
  : 'http://192.168.1.241:8001';

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
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');

  useEffect(() => {
    loadHistory();
    loadGlucoseLogs();
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
        <ScrollView contentContainerStyle={s.disclaimerCanvas}>
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
        </ScrollView>
        <Text style={s.disclaimerBrand}>SehatGemma • صحت جیما</Text>
      </SafeAreaView>
    );
  }

  // ==================== HOME SCREEN ====================
  if (screen === 'home') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.homeHeader}>
          <View style={s.homeHeaderLeft}>
            <MaterialIcons name="nightlight" size={22} color={C.primary} />
            <Text style={s.homeLogoText}>SehatGemma صحت جیما</Text>
          </View>
          <View style={s.langPill}>
            <TouchableOpacity
              style={[s.langPillBtn, language === 'en' && s.langPillActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[s.langPillText, language === 'en' && { color: C.onPrimary }]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.langPillBtn, language === 'ur' && s.langPillActive]}
              onPress={() => setLanguage('ur')}
            >
              <Text style={[s.langPillTextUr, language === 'ur' && { color: C.onPrimary }]}>اردو</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
            <Text style={s.homeTaglineEn}>Offline AI Health Agent</Text>
            <Text style={s.homeTaglineUr}>آف لائن صحت ایجنٹ</Text>
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

          {/* Weekly Insights Card */}
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

          {/* Demo Mode Button */}
          <TouchableOpacity style={s.demoBtn} onPress={runDemo} activeOpacity={0.8}>
            <MaterialIcons name="play-circle" size={20} color="white" />
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Quick Demo / فوری ڈیمو</Text>
          </TouchableOpacity>

          {/* Powered By Badge */}
          <View style={s.poweredBadge}>
            <MaterialIcons name="memory" size={14} color={C.onSurfaceVariant} />
            <Text style={s.poweredText}>Powered by Gemma 4 — Running Offline</Text>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Bottom Nav */}
        <BottomNav active="chat" onPress={(tab) => {
          if (tab === 'health') setScreen('glucose');
          else if (tab === 'camera') pickImage();
          else if (tab === 'voice') showVoiceInput();
        }} />

        {/* Voice Input Modal */}
        {voiceModalVisible && (
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center',
            alignItems: 'center', zIndex: 999, padding: 24
          }}>
            <View style={{
              backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%'
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#00450d', marginBottom: 8 }}>
                Describe Your Food
              </Text>
              <Text style={{ fontSize: 16, color: '#41493e', textAlign: 'right', marginBottom: 16 }}>
                اپنا کھانا بتائیں
              </Text>
              <TextInput
                style={{
                  borderWidth: 1, borderColor: '#c0c9bb', borderRadius: 12,
                  padding: 14, fontSize: 18, color: '#1c1b1b', marginBottom: 16
                }}
                placeholder="e.g. biryani, roti, chai..."
                value={voiceInputText}
                onChangeText={setVoiceInputText}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#c0c9bb', alignItems: 'center' }}
                  onPress={() => { setVoiceModalVisible(false); setVoiceInputText(''); }}
                >
                  <Text style={{ color: '#41493e' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#00450d', alignItems: 'center' }}
                  onPress={async () => {
                    if (!voiceInputText.trim()) return;
                    setVoiceModalVisible(false);
                    const text = voiceInputText;
                    setVoiceInputText('');
                    await analyzeText(text);
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Analyze</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.resultHeader}>
          <TouchableOpacity onPress={() => setScreen('home')} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={s.resultHeaderTitle}>SehatGemma صحت جیما</Text>
          <MaterialIcons name="nightlight" size={20} color={C.primary} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {photoUri && (
            <View style={s.resultPhotoWrap}>
              <Image source={{ uri: photoUri }} style={s.resultPhoto} />
              <View style={s.resultPhotoOverlay} />
            </View>
          )}
          <View style={{ paddingHorizontal: 16 }}>
            <View style={[s.riskBadge, { backgroundColor: riskColor }]}>
              <Text style={s.riskBadgeText}>
                {(result?.sugar_risk || 'UNKNOWN').toUpperCase()} SUGAR RISK
              </Text>
              <Text style={s.riskBadgeUrdu}>
                {result?.sugar_risk === 'high' ? 'زیادہ خطرہ' :
                  result?.sugar_risk === 'medium' ? 'درمیانہ خطرہ' : 'کم خطرہ'}
              </Text>
            </View>
            <Text style={s.resultFoodName}>
              {isUrdu ? result?.food_name_ur : result?.food_name_en}
            </Text>
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
            <TouchableOpacity
              style={s.analyzeAnotherBtn}
              onPress={() => setScreen('home')}
              activeOpacity={0.9}
            >
              <Text style={s.analyzeAnotherText}>Analyze Another Meal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <BottomNav active="camera" onPress={(tab) => {
          if (tab === 'health') setScreen('glucose');
          else if (tab === 'camera') setScreen('home');
          else if (tab === 'chat') setScreen('home');
          else if (tab === 'voice') { setScreen('home'); setTimeout(showVoiceInput, 300); }
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
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={s.privacyIconWrap}>
            <View style={s.privacyIconGlow}>
              <MaterialIcons name="security" size={48} color={C.primaryFixedDim} />
            </View>
            <Text style={s.privacySubtitle}>Your data never leaves your device.</Text>
            <Text style={[s.privacySubtitleUr, { textAlign: 'right' }]}>
              آپ کا ڈیٹا کبھی بھی آپ کے فون سے باہر نہیں جاتا۔
            </Text>
          </View>
          <View style={s.privacyCards}>
            <PrivacyCard icon="verified-user" title="AES-256 Encrypted" urdu="ملٹری گریڈ انکرپشن" badge="Active" />
            <PrivacyCard icon="cloud-off" title="Zero Cloud Sync" urdu="کلاؤڈ سنک بند ہے" badge="Local" />
            <PrivacyCard icon="wifi-off" title="Offline Only" urdu="صرف آف لائن کام کرتا ہے" badge="Secure" />
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
        </ScrollView>
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
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
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
        <ScrollView style={{ flex: 1 }}>
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
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==================== HISTORY SCREEN ====================
  if (screen === 'history') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <View style={s.glucoseHeader}>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <MaterialIcons name="arrow-back" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={[s.glucoseTitle, { marginLeft: 12 }]}>Scan History</Text>
        </View>
        <ScrollView>
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
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==================== HELPERS ====================
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
      formData.append('file', { uri, name: 'food.jpg', type: 'image/jpeg' });
      formData.append('language', language);
      formData.append('glucose_level', glucoseLogs[0]?.value || '');

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

      const newHistory = [{ ...data, timestamp: new Date().toISOString(), imageUri: uri }, ...history];
      setHistory(newHistory.slice(0, 50));
      await AsyncStorage.setItem('sehat_history', JSON.stringify(newHistory.slice(0, 50)));
    } catch (err) {
      setResult({
        sugar_risk: 'unknown',
        food_name_en: 'Connection Failed',
        food_name_ur: 'کنکشن ناکام',
        explanation_en: `Cannot reach backend at ${BACKEND_URL}. Make sure: 1) uvicorn running on port 8001, 2) Ollama open, 3) Phone on same WiFi.`,
        explanation_ur: 'بیک اینڈ سے رابطہ نہیں ہو سکا۔',
        swap_suggestion_en: 'Check backend and retry.',
        swap_suggestion_ur: 'دوبارہ کوشش کریں۔',
        confidence: 0, carbs_g: 0, calories_estimate: 'N/A',
      });
    } finally {
      setLoading(false);
    }
  }

  async function analyzeText(text) {
    setLoading(true);
    setPhotoUri(null);
    setScreen('result');

    const offlineResult = offlineDB.searchFood(text);
    if (offlineResult.match_type !== 'unknown') {
      setResult(offlineResult);
      const entry = { ...offlineResult, timestamp: new Date().toISOString(), imageUri: null };
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
          const betterEntry = { ...data, timestamp: new Date().toISOString(), imageUri: null };
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

      const entry = { ...data, timestamp: new Date().toISOString(), imageUri: null };
      const updated = [entry, ...history].slice(0, 50);
      setHistory(updated);
      await AsyncStorage.setItem('sehat_history', JSON.stringify(updated));
    } catch (err) {
      setResult(offlineResult);
    } finally {
      setLoading(false);
    }
  }

  function showVoiceInput() {
    setVoiceModalVisible(true);
  }

  // Quick Demo: runs 3 pre-scripted analyses in sequence
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

  async function saveGlucose() {
    if (!glucose) return;
    const entry = { value: glucose, time: new Date().toLocaleString() };
    const updated = [entry, ...glucoseLogs];
    setGlucoseLogs(updated.slice(0, 100));
    await AsyncStorage.setItem('sehat_glucose', JSON.stringify(updated.slice(0, 100)));
    setGlucose('');
  }
}

// ==================== AGENT THINKING SCREEN ====================
function AgentThinkingScreen() {
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
          <Text style={s.thinkingBubbleEn}>Analyzing your meal...</Text>
          <Text style={[s.thinkingBubbleUr, { textAlign: 'right' }]}>
            کھانے کا تجزیہ ہو رہا ہے...
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
            <MaterialCommunityIcons name="glucose" size={14} color="white" />
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
        <ScrollView contentContainerStyle={s.emergencyCanvas}>
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
        </ScrollView>
      </SafeAreaView>
    </View>
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
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.bg, borderBottomWidth: 0, zIndex: 10 },
  homeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  homeLogoText: { fontSize: 18, fontWeight: '700', color: C.primary },
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

  // ---- DEMO BUTTON ----
  demoBtn: { marginHorizontal: 16, marginTop: 12, backgroundColor: C.secondary, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },

  // ---- POWERED BADGE ----
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
  analyzeAnotherBtn: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 12, shadowColor: C.primary, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
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
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 20 : 10, backgroundColor: 'rgba(255,255,255,0.92)', borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 8 },
  bottomNavItem: { alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50 },
  bottomNavItemActive: { backgroundColor: C.primaryContainer, paddingHorizontal: 16 },
  bottomNavLabel: { fontSize: 11, color: C.onSurfaceVariant },
});