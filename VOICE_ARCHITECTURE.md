# Voice Architecture Documentation

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Luồng xử lý giọng nói](#luồng-xử-lý-giọng-nói)
4. [Cấu trúc AI Prompt](#cấu-trúc-ai-prompt)
5. [Các Module và API](#các-module-và-api)
6. [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Tổng quan

Hệ thống Voice Recognition của Furama Resort Digital Concierge cho phép nhân viên lễ tân tạo yêu cầu buggy ride bằng giọng nói tiếng Việt hoặc tiếng Anh. Hệ thống sử dụng:

- **Web Speech Recognition API**: Nhận diện giọng nói từ microphone
- **Google Gemini AI (2.5 Flash)**: Phân tích và trích xuất thông tin từ transcript
- **Fallback Keyword Matching**: Xử lý khi AI không khả dụng

### Tính năng chính

- ✅ Nhận diện giọng nói tiếng Việt và tiếng Anh
- ✅ Tự động dừng sau 5 giây im lặng
- ✅ Trích xuất thông tin: số phòng, điểm đón, điểm đến, số khách, ghi chú
- ✅ Tự động điền form và tạo ride request
- ✅ Animation audio level real-time
- ✅ Auto-confirm sau 5 giây khi đủ thông tin

---

## Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    ReceptionPortal Component                 │
│  (UI Layer - Voice Input Button, Form, Status Messages)      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              useVoiceRecording Hook                           │
│  - SpeechRecognition API Management                          │
│  - State: isListening, transcript, audioLevel                │
│  - Silence Detection (5s timeout)                            │
│  - Audio Level Animation                                     │
│  - Callback: onTranscriptReady                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (transcript string)
┌─────────────────────────────────────────────────────────────┐
│            voiceParsingService                               │
│  - normalizeTranscript()                                     │
│  - processTranscript()                                       │
│    ├─> parseRideRequestWithContext() [AI]                    │
│    └─> parseVoiceTranscript() [Fallback]                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            geminiService                                     │
│  - parseRideRequestWithContext()                            │
│  - extractRoomNumber()                                       │
│  - findClosestLocation()                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼ (ParsedVoiceData)
┌─────────────────────────────────────────────────────────────┐
│            ReceptionPortal                                   │
│  - Update form (setNewRideData)                             │
│  - Auto-confirm countdown (5s)                              │
│  - Create ride request                                       │
└─────────────────────────────────────────────────────────────┘
```

### Các thành phần chính

1. **ReceptionPortal Component** (`components/ReceptionPortal.tsx`)
   - UI layer, quản lý form và hiển thị kết quả
   - Tích hợp voice hook và parsing service

2. **useVoiceRecording Hook** (`hooks/useVoiceRecording.tsx`)
   - Custom React hook quản lý SpeechRecognition
   - Xử lý recording lifecycle và timers

3. **voiceParsingService** (`services/voiceParsingService.ts`)
   - Service layer cho voice parsing logic
   - Normalization, AI parsing, fallback parsing

4. **geminiService** (`services/geminiService.ts`)
   - AI integration với Google Gemini
   - Prompt engineering và response parsing

---

## Luồng xử lý giọng nói

### Flow Diagram

```
[User clicks Mic Button]
         │
         ▼
[Start SpeechRecognition]
         │
         ├─> [onstart] Set isListening = true
         │              Start silence check interval (500ms)
         │              Start audio level animation
         │
         ├─> [onresult] Update transcript
         │              Update audio level (60-100)
         │              Reset silence timer
         │
         ├─> [Silence detected > 5s] ──> Stop recording
         │
         └─> [User clicks Stop] ──> Stop recording
         
[Stop Recording]
         │
         ▼
[onTranscriptReady callback]
         │
         ▼
[normalizeTranscript()]
         │
         ├─> Remove filler words
         ├─> Clean spaces
         └─> Return normalized text
         │
         ▼
[processTranscript()]
         │
         ├─> [Try AI Parsing]
         │    └─> parseRideRequestWithContext()
         │         ├─> Build prompt with locations
         │         ├─> Call Gemini API
         │         ├─> Validate & fix locations
         │         └─> Return ParsedVoiceData
         │
         └─> [If AI fails] ──> parseVoiceTranscript() [Fallback]
              └─> Keyword matching
              └─> Return ParsedVoiceData
         │
         ▼
[Callbacks]
         │
         ├─> [onSuccess] ──> Auto-fill form
         │                   Start 5s countdown
         │                   Auto-create ride
         │
         ├─> [onPartialSuccess] ──> Fill partial data
         │                          Show message
         │
         └─> [onError] ──> Show error message
```

### Chi tiết từng bước

#### 1. Voice Recording (useVoiceRecording Hook)

```typescript
// Khởi tạo
const { isListening, transcript, audioLevel, handleToggleListening } = 
  useVoiceRecording({
    language: "vi-VN",
    onTranscriptReady: async (text) => {
      await handleProcessTranscript(text);
    },
    silenceTimeout: 5000
  });
```

**Quy trình:**
1. User click mic button → `handleToggleListening()` được gọi
2. Khởi tạo `SpeechRecognition` với:
   - `lang: "vi-VN"` (Vietnamese)
   - `interimResults: true` (hiển thị text khi đang nói)
   - `continuous: true` (tiếp tục nghe)
3. Event handlers:
   - `onstart`: Bắt đầu recording, khởi tạo timers
   - `onresult`: Cập nhật transcript và audio level
   - `onerror`: Xử lý lỗi
   - `onend`: Cleanup
4. Silence detection: Kiểm tra mỗi 500ms, nếu im lặng > 5s → tự động dừng

#### 2. Transcript Normalization

```typescript
normalizeTranscript(text: string): string
```

**Chức năng:**
- Loại bỏ filler words: "um", "uh", "à", "ừ", "thì", "là", etc.
- Chuẩn hóa khoảng trắng
- Trim whitespace

**Ví dụ:**
```
Input:  "um đón phòng 101 thì đi hồ bơi à"
Output: "đón phòng 101 đi hồ bơi"
```

#### 3. AI Parsing (Primary Method)

```typescript
parseRideRequestWithContext(
  input: string,
  locations: Location[],
  drivers?: Driver[]
): Promise<ParsedVoiceData | null>
```

**Quy trình:**
1. Build location context từ danh sách locations
2. Build prompt với extraction rules
3. Gọi Gemini API với structured output schema
4. Post-processing:
   - Validate và fix location names (fuzzy matching)
   - Extract và validate room number
   - Ensure pickup ≠ destination

**Schema Output:**
```json
{
  "roomNumber": "101",
  "pickup": "Reception",
  "destination": "Lagoon Pool",
  "guestName": "John Doe",
  "guestCount": 2,
  "notes": "Has luggage"
}
```

#### 4. Fallback Parsing (Keyword Matching)

```typescript
parseVoiceTranscript(text: string, locations: Location[]): ParsedVoiceData
```

**Khi nào sử dụng:**
- AI API không khả dụng
- AI parsing thất bại
- Network error

**Phương pháp:**
- Regex patterns cho room number
- Keyword matching cho locations
- Pattern matching cho route (from X to Y)

#### 5. Form Auto-fill & Auto-confirm

**Khi có đủ thông tin:**
- `pickup` + `destination` + `roomNumber`
- Tự động điền form
- Hiển thị countdown 5 giây
- Tự động tạo ride request

**Khi thiếu thông tin:**
- Điền phần đã nhận diện được
- Hiển thị message yêu cầu bổ sung

---

## Cấu trúc AI Prompt

### Prompt Template

```
You are an intelligent assistant for Furama Resort & Villas Da Nang. 
Extract ride request information from this Vietnamese or English text: "{input}"

VALID LOCATIONS (you MUST match locations exactly to these names - case-sensitive matching):
{locationContext}

{driverContext}

CRITICAL EXTRACTION RULES (follow these precisely for >95% accuracy):

1. ROOM NUMBER EXTRACTION (>95% accuracy required):
   - Extract room number if mentioned in ANY format:
     * "Room 101", "Phòng 101", "R101" → "101"
     * "Villa D03", "Biệt thự D5", "Villa D11" → "D03", "D5", "D11"
     * "D03", "D11", "P03" → "D03", "D11", "P03"
     * "ACC", "ABC" (2-3 letters) → "ACC", "ABC"
     * "101", "2001", "101A" → "101", "2001", "101A"
   - Common patterns: [Letter][Digits] (D11, A101), [Digits] (101, 2001), [2-3 Letters] (ACC)
   - If room number is in pickup text, extract it separately
   - Room numbers are typically: 2-4 digits, or 1 letter + 1-3 digits, or 2-3 letters

2. PICKUP LOCATION MATCHING (>90% accuracy required):
   - Match location names EXACTLY from the valid locations list above
   - If pickup is NOT specified, use the extracted room number as pickup location
   - Smart matching for common terms (use EXACT names from list):
     * "pool" or "hồ bơi" → prefer "Lagoon Pool" or "Ocean Pool"
     * "restaurant" or "nhà hàng" → match to specific restaurant
     * "villa" or "biệt thự" → match villa areas
     * "lobby" or "sảnh" or "reception" → match "Reception" or "Main Lobby"
     * "beach" or "bãi biển" → match "Beach Access" or "Beach"
   - If multiple matches possible, choose the MOST COMMON/POPULAR one
   - IMPORTANT: Return the EXACT name as it appears in the valid locations list (case-sensitive)

3. DESTINATION LOCATION MATCHING (>90% accuracy required):
   - Same rules as pickup location
   - MUST be different from pickup location
   - Match EXACTLY from valid locations list

4. GUEST NAME: Extract if mentioned (optional)

5. GUEST COUNT: Default to 1 if not specified

6. NOTES: Extract special requests (luggage, baby seat, urgent, many bags, etc.)

VALIDATION:
- Room number format: Must match patterns [A-Z]{1,3}\d{0,3}[A-Z]? or \d{2,4}[A-Z]? or [A-Z]\d{1,3}
- Location names: Must be EXACT matches from the valid locations list
- Pickup and destination: Must be different

Return JSON with exact location names matching the valid locations list.
```

### Response Schema (JSON Schema)

```typescript
{
  type: "object",
  properties: {
    roomNumber: {
      type: "string",
      description: "The guest's room number, e.g., '101' or 'Villa D03'"
    },
    pickup: {
      type: "string",
      description: "The pickup location name. Must match exactly one of the valid location names."
    },
    destination: {
      type: "string",
      description: "The destination location name. Must match exactly one of the valid location names."
    },
    guestName: {
      type: "string",
      description: "The name of the guest."
    },
    guestCount: {
      type: "number",
      description: "The number of guests, default to 1 if not mentioned."
    },
    notes: {
      type: "string",
      description: "Any special notes or requests, like 'has luggage', 'needs baby seat', 'urgent'."
    }
  },
  required: ["pickup", "destination"]
}
```

### Post-processing Logic

Sau khi nhận response từ AI, hệ thống thực hiện:

1. **Location Validation & Fixing**
   ```typescript
   // Nếu location không khớp chính xác
   if (!locationNames.includes(parsed.pickup)) {
     const closest = findClosestLocation(parsed.pickup, locations);
     if (closest) {
       parsed.pickup = closest.name; // Fix với location gần nhất
     }
   }
   ```

2. **Room Number Extraction & Validation**
   ```typescript
   // Validate và cải thiện room number
   const extracted = extractRoomNumber(parsed.roomNumber);
   if (extracted && extracted !== parsed.roomNumber) {
     parsed.roomNumber = extracted; // Cải thiện format
   }
   ```

3. **Pickup/Destination Validation**
   ```typescript
   // Đảm bảo pickup ≠ destination
   if (parsed.pickup === parsed.destination) {
     // Sử dụng room number làm pickup nếu có
     if (parsed.roomNumber) {
       parsed.pickup = parsed.roomNumber;
     }
   }
   ```

---

## Các Module và API

### 1. useVoiceRecording Hook

**File:** `hooks/useVoiceRecording.tsx`

**Interface:**
```typescript
interface UseVoiceRecordingOptions {
  language?: string;              // Default: "vi-VN"
  onTranscriptReady?: (transcript: string) => void;
  silenceTimeout?: number;        // Default: 5000ms
}

interface UseVoiceRecordingReturn {
  isListening: boolean;
  transcript: string;
  audioLevel: number;             // 0-100 for animation
  handleToggleListening: () => void;
  stopRecording: () => void;
}
```

**Usage:**
```typescript
const {
  isListening,
  transcript,
  audioLevel,
  handleToggleListening,
  stopRecording
} = useVoiceRecording({
  language: "vi-VN",
  onTranscriptReady: async (text) => {
    await processTranscript(text);
  },
  silenceTimeout: 5000
});
```

### 2. voiceParsingService

**File:** `services/voiceParsingService.ts`

**Exports:**
- `normalizeTranscript(text: string): string`
- `parseVoiceTranscript(text: string, locations: Location[]): ParsedVoiceData`
- `processTranscript(text: string, locations: Location[], callbacks: ProcessTranscriptCallbacks, existingData?: ParsedVoiceData): Promise<ParsedVoiceData | null>`
- `looksLikeRoomNumber(text: string): boolean`
- `isLocationName(text: string, locations: Location[]): boolean`

**Types:**
```typescript
interface ParsedVoiceData {
  roomNumber?: string;
  guestName?: string;
  pickup?: string;
  destination?: string;
  guestCount?: number;
  notes?: string;
}

interface ProcessTranscriptCallbacks {
  onSuccess: (data: ParsedVoiceData) => void;
  onError: (message: string) => void;
  onPartialSuccess: (data: ParsedVoiceData, foundFields: string[]) => void;
}
```

### 3. geminiService

**File:** `services/geminiService.ts`

**Functions:**
- `parseRideRequestWithContext(input: string, locations: Location[], drivers?: Driver[]): Promise<ParsedVoiceData | null>`
- `extractRoomNumber(text: string): string | null`
- `findClosestLocation(searchText: string, locations: Location[]): Location | null`

---

## Hướng dẫn sử dụng

### Cho người dùng cuối (Reception Staff)

#### Cách sử dụng Voice Input

1. **Mở form tạo ride request**
   - Click nút "Create New Ride" hoặc tương đương

2. **Bắt đầu ghi âm**
   - Click vào nút microphone (màu xanh)
   - Nút sẽ chuyển sang màu đỏ khi đang ghi âm
   - Bạn sẽ thấy animation audio level khi đang nói

3. **Nói yêu cầu**
   - Nói rõ ràng bằng tiếng Việt hoặc tiếng Anh
   - Ví dụ:
     - "Đón phòng 101 đi hồ bơi"
     - "From room D11 to reception"
     - "Phòng 205 đi nhà hàng, 2 khách, có hành lý"

4. **Dừng ghi âm**
   - Tự động dừng sau 5 giây im lặng, HOẶC
   - Click lại nút microphone để dừng thủ công

5. **Xem kết quả**
   - Hệ thống sẽ tự động điền form với thông tin đã nhận diện
   - Nếu đủ thông tin (số phòng, điểm đón, điểm đến):
     - Hiển thị countdown 5 giây
     - Tự động tạo ride request
   - Nếu thiếu thông tin:
     - Điền phần đã nhận diện được
     - Hiển thị message yêu cầu bổ sung

#### Các mẫu câu nói

**Tiếng Việt:**
- "Đón phòng 101 đi hồ bơi"
- "Từ phòng D11 đến sảnh lễ tân"
- "Phòng 205 đi nhà hàng, 3 khách, có hành lý"
- "Đón biệt thự D5 đi bãi biển, gấp"
- "Room 101 to pool, 2 guests, has luggage"

**Tiếng Anh:**
- "Pickup room 101 to pool"
- "From villa D11 to reception"
- "Room 205 to restaurant, 3 guests, urgent"
- "Pickup D5 to beach, needs baby seat"

#### Thông tin có thể nói

✅ **Bắt buộc:**
- Số phòng (Room number)
- Điểm đón (Pickup location)
- Điểm đến (Destination)

✅ **Tùy chọn:**
- Tên khách (Guest name)
- Số lượng khách (Guest count, default: 1)
- Ghi chú đặc biệt:
  - "có hành lý" / "has luggage"
  - "ghế trẻ em" / "baby seat"
  - "gấp" / "urgent"
  - "xe lăn" / "wheelchair"

#### Tips để có kết quả tốt nhất

1. **Nói rõ ràng và chậm rãi**
   - Phát âm rõ từng từ
   - Tránh nói quá nhanh

2. **Sử dụng từ khóa chuẩn**
   - "phòng" / "room" cho số phòng
   - "đón" / "pickup" / "from" cho điểm đón
   - "đi" / "to" / "đến" cho điểm đến

3. **Nói đầy đủ thông tin trong một câu**
   - Ví dụ: "Đón phòng 101 đi hồ bơi, 2 khách, có hành lý"

4. **Kiểm tra kết quả trước khi xác nhận**
   - Xem lại form đã điền đúng chưa
   - Có thể chỉnh sửa thủ công nếu cần

5. **Nếu nhận diện sai**
   - Thử nói lại với cách diễn đạt khác
   - Hoặc nhập thủ công vào form

### Cho developers

#### Testing Voice Recognition

```typescript
// Test useVoiceRecording hook
import { renderHook, act } from '@testing-library/react';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

test('should start recording', () => {
  const { result } = renderHook(() => useVoiceRecording({
    onTranscriptReady: (text) => {
      console.log('Transcript:', text);
    }
  }));
  
  act(() => {
    result.current.handleToggleListening();
  });
  
  expect(result.current.isListening).toBe(true);
});
```

#### Testing Voice Parsing Service

```typescript
// Test voiceParsingService
import { normalizeTranscript, parseVoiceTranscript } from '../services/voiceParsingService';

test('should normalize transcript', () => {
  const input = "um đón phòng 101 thì đi hồ bơi à";
  const output = normalizeTranscript(input);
  expect(output).toBe("đón phòng 101 đi hồ bơi");
});

test('should parse voice transcript', () => {
  const locations = [
    { name: "Reception", type: "FACILITY" },
    { name: "Lagoon Pool", type: "FACILITY" }
  ];
  
  const result = parseVoiceTranscript(
    "đón phòng 101 đi hồ bơi",
    locations
  );
  
  expect(result.roomNumber).toBe("101");
  expect(result.pickup).toBe("Reception");
  expect(result.destination).toBe("Lagoon Pool");
});
```

---

## Troubleshooting

### Vấn đề thường gặp

#### 1. "Speech recognition is not supported in this browser"

**Nguyên nhân:**
- Browser không hỗ trợ Web Speech Recognition API
- Chưa cấp quyền microphone

**Giải pháp:**
- Sử dụng Chrome, Edge, hoặc Safari (phiên bản mới)
- Cấp quyền microphone trong browser settings
- Kiểm tra HTTPS (Speech Recognition chỉ hoạt động trên HTTPS)

#### 2. Không nhận diện được giọng nói

**Nguyên nhân:**
- Microphone không hoạt động
- Nói quá nhỏ hoặc quá xa microphone
- Môi trường ồn

**Giải pháp:**
- Kiểm tra microphone
- Nói to và rõ ràng hơn
- Giảm tiếng ồn xung quanh
- Đảm bảo microphone không bị che

#### 3. Nhận diện sai thông tin

**Nguyên nhân:**
- Nói không rõ
- Sử dụng từ không chuẩn
- AI parsing lỗi

**Giải pháp:**
- Nói lại với cách diễn đạt khác
- Sử dụng từ khóa chuẩn (phòng, đón, đi, etc.)
- Kiểm tra và chỉnh sửa thủ công nếu cần

#### 4. Không tự động tạo ride

**Nguyên nhân:**
- Thiếu thông tin bắt buộc (số phòng, điểm đón, điểm đến)
- Location name không khớp

**Giải pháp:**
- Kiểm tra message hiển thị
- Bổ sung thông tin còn thiếu
- Đảm bảo tên location chính xác

#### 5. AI parsing thất bại

**Nguyên nhân:**
- API key không hợp lệ
- Network error
- Rate limit

**Giải pháp:**
- Hệ thống tự động fallback về keyword matching
- Kiểm tra `.env` file có `VITE_GEMINI_API_KEY`
- Kiểm tra network connection

### Debug Mode

Để debug, mở browser console và xem logs:

```javascript
// Logs từ useVoiceRecording
"5 seconds of silence detected, stopping recording..."

// Logs từ voiceParsingService
"[AI Parse] Fixed pickup: 'pool' → 'Lagoon Pool'"
"[AI Parse] Improved room number: '101A' → '101'"

// Logs từ geminiService
"AI Parse Error (Ride Request)", error
```

---

## Best Practices

### 1. Prompt Engineering

- **Be specific**: Rõ ràng về format và rules
- **Provide context**: Đưa danh sách locations đầy đủ
- **Use examples**: Ví dụ cụ thể cho từng pattern
- **Validate output**: Post-processing để đảm bảo accuracy

### 2. Error Handling

- **Always have fallback**: Keyword matching khi AI fails
- **User feedback**: Hiển thị message rõ ràng cho user
- **Graceful degradation**: Vẫn hoạt động được khi thiếu thông tin

### 3. Performance

- **Silence detection**: Tự động dừng để tiết kiệm resources
- **Debounce**: Tránh gọi API quá nhiều
- **Caching**: Cache location list nếu có thể

### 4. User Experience

- **Visual feedback**: Audio level animation, status messages
- **Auto-fill**: Tự động điền form để tiết kiệm thời gian
- **Auto-confirm**: Tự động tạo ride khi đủ thông tin
- **Error messages**: Message rõ ràng, dễ hiểu

### 5. Testing

- **Unit tests**: Test từng function riêng lẻ
- **Integration tests**: Test flow hoàn chỉnh
- **E2E tests**: Test với real Speech Recognition API
- **Edge cases**: Test với các input không chuẩn

---

## Tài liệu tham khảo

- [Web Speech Recognition API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Google Gemini API](https://ai.google.dev/docs)
- [React Hooks Documentation](https://react.dev/reference/react)

---

**Version:** 1.0  
**Last Updated:** 2024  
**Maintained by:** Furama Resort Development Team

