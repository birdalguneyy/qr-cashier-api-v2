# QR Cashier API

QR kod ile ödeme işlemleri için Node.js API.

## 🚀 Özellikler

- QR kod ile ödeme işlemi
- Kullanıcı bakiye sorgulama
- İşlem geçmişi
- Firebase Firestore entegrasyonu
- CORS desteği

## 📋 API Endpoints

### POST /api/process-payment
QR kod ile ödeme işlemi yapar.

**Request Body:**
```json
{
  "qrData": "{\"userId\":\"user123\",\"points\":100}",
  "amount": 25,
  "cashierId": "cashier123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ödeme başarıyla tamamlandı",
  "data": {
    "userId": "user123",
    "previousBalance": 100,
    "newBalance": 75,
    "amount": 25,
    "transactionId": "txn_123"
  }
}
```

### GET /api/user-balance/:userId
Kullanıcının mevcut bakiyesini sorgular.

### GET /api/transaction-history/:userId
Kullanıcının işlem geçmişini getirir.

## 🔧 Kurulum

### Development
```bash
npm install
npm run dev
```

### Production
```bash
npm install
npm start
```

## 🌐 Environment Variables

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
PORT=3000
NODE_ENV=production
```

## 📱 Flutter Entegrasyonu

Flutter uygulamasında API URL'sini güncelleyin:

```dart
final List<String> _apiUrls = [
  'https://your-app-name.onrender.com/api/process-payment', // Render
  'http://localhost:3000/api/process-payment', // Local
];
```

## 🧪 Test

```bash
npm test
```

## 📄 Lisans

MIT 