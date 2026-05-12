# 🔧 DEEPSEEK TASK — FIX BUTTONS + BACKEND CONNECTION
> Assigned by: Claude (CTO)
> Date: May 12, 2026
> File to edit: E:\sehatgemma\app\App.js ONLY

---

## SITUATION
Screens look great. 3 specific bugs to fix:
1. Voice / Camera / Chat bottom nav buttons do nothing
2. Backend connection fails ("کنکشن ناکام") when analyzing food
3. Voice button needs text input fallback

Web version (localhost:8081) is for testing only. Real target = phone via Expo Go.

---

## FIX 1 — BOTTOM NAV BUTTONS (all screens)

### Problem:
BottomNav onPress only handles 'health'. Voice, Camera, Chat do nothing.

### Fix — update ALL BottomNav calls in App.js:

**In Home screen** (find `<BottomNav active="chat"` and replace its onPress):
```javascript
<BottomNav active="chat" onPress={(tab) => {
  if (tab === 'health') setScreen('glucose');
  else if (tab === 'camera') pickImage();
  else if (tab === 'voice') showVoiceInput();
  else if (tab === 'chat') { /* already home */ }
}} />
```

**In Result screen** (find `<BottomNav active="camera"` and replace its onPress):
```javascript
<BottomNav active="camera" onPress={(tab) => {
  if (tab === 'health') setScreen('glucose');
  else if (tab === 'camera') setScreen('home');
  else if (tab === 'chat') setScreen('home');
  else if (tab === 'voice') { setScreen('home'); setTimeout(showVoiceInput, 300); }
}} />
```

**In AgentThinkingScreen and all other screens** — BottomNav onPress:
```javascript
onPress={() => {}}   // keep disabled while loading, already correct
```

---

## FIX 2 — ADD showVoiceInput FUNCTION

Add this function inside the App() component, near the other helper functions:

```javascript
const [voiceText, setVoiceText] = useState('');
const [showVoiceModal, setShowVoiceModal] = useState(false);

function showVoiceInput() {
  Alert.alert(
    'Describe Your Food / کھانا بتائیں',
    'Type the food name you want to analyze:',
    [
      { text: 'Cancel / منسوخ', style: 'cancel' },
      {
        text: 'Analyze / تجزیہ کریں',
        onPress: async () => {
          // Get text from input - use a state variable
        }
      }
    ]
  );
}
```

Actually Alert.prompt doesn't work on Android. Use this approach instead:

**Add a voice input modal screen.** In the main return, add before all the `if (screen === ...)` checks:

```javascript
// VOICE INPUT MODAL
const [voiceModalVisible, setVoiceModalVisible] = useState(false);
const [voiceInputText, setVoiceInputText] = useState('');
```

Add this JSX overlay on top of any screen (add inside the SafeAreaView of Home screen as an absolute overlay):

```javascript
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
```

**Add analyzeText function** (near analyzeImage):
```javascript
async function analyzeText(text) {
  setLoading(true);
  setPhotoUri(null);
  setScreen('result');
  try {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('language', language);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const resp = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });
    clearTimeout(timeoutId);
    const data = await resp.json();
    setResult(data);

    const entry = { ...data, timestamp: new Date().toISOString(), imageUri: null };
    const updated = [entry, ...history].slice(0, 50);
    setHistory(updated);
    await AsyncStorage.setItem('sehat_history', JSON.stringify(updated));
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

function showVoiceInput() {
  setVoiceModalVisible(true);
}
```

---

## FIX 3 — BACKEND CONNECTION

### Root cause options:
The phone shows "کنکشن ناکام". This means one of:
A) uvicorn stopped running on laptop
B) Ollama is not running
C) Laptop IP changed from 192.168.1.241
D) Windows Firewall blocking port 8001

### Tell Nouman to check RIGHT NOW:
1. Is uvicorn terminal still showing logs? If not, restart it:
   ```
   cd e:\sehatgemma\backend
   venv\Scripts\activate
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

2. Is Ollama desktop app open? Open it if not.

3. Verify IP hasn't changed:
   ```
   ipconfig
   ```
   If WiFi IPv4 is NOT 192.168.1.241, update line 17 in App.js:
   ```javascript
   const BACKEND_URL = 'http://NEW_IP_HERE:8001';
   ```

4. Add Windows Firewall rule (run PowerShell as Admin):
   ```
   New-NetFirewallRule -DisplayName "SehatGemma8001" -Direction Inbound -Protocol TCP -LocalPort 8001 -Action Allow
   ```

### Also add platform-aware URL in App.js:
```javascript
import { Platform } from 'react-native';
const BACKEND_URL = Platform.OS === 'web'
  ? 'http://localhost:8001'
  : 'http://192.168.1.241:8001';
```
This makes the web browser version (localhost:8081) use localhost:8001 directly,
while the phone uses the IP address.

---

## WHAT NOT TO CHANGE
- main.py — do not touch
- System prompt — do not touch
- Screen designs — they already look correct
- package.json — do not touch

---

## TEST AFTER FIXING
1. Web browser: go to localhost:8081 → click Voice → type "biryani" → Analyze → should see result
2. Phone: open Expo Go → tap Gallery → pick food photo → should see Agent Thinking → then result
3. Bottom nav: all 4 tabs should respond

## SUCCESS
Voice input → text sent to Gemma4 → risk result shown = DONE
