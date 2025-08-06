const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase Admin SDK yapılandırması
let serviceAccount;
if (process.env.NODE_ENV === 'production') {
  // Production ortamında environment variables kullan
  console.log('🔧 Production ortamında Firebase yapılandırması...');
  
  // Environment variables'ları kontrol et
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Eksik environment variables:', missingVars);
    process.exit(1);
  }
  
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };
  
  console.log('✅ Firebase environment variables yüklendi');
  console.log('📧 Client Email:', process.env.FIREBASE_CLIENT_EMAIL);
} else {
  // Development ortamında dosyadan oku
  try {
    serviceAccount = require('./firebase-service-account.json');
    console.log('✅ Development: Firebase service account dosyası yüklendi');
  } catch (error) {
    console.error('❌ Firebase service account dosyası bulunamadı');
    console.error('Lütfen firebase-service-account.json dosyasını oluşturun');
    process.exit(1);
  }
}

// Firebase Admin SDK başlatma
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware
app.use(cors({
  origin: '*', // Tüm domainlerden erişime izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(bodyParser.json());

// Ana endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'QR Cashier API',
    version: '1.0.0',
    endpoints: {
      '/api/process-payment': 'POST - QR kod ile ödeme işlemi',
      '/api/user-balance/:userId': 'GET - Kullanıcı bakiyesi',
      '/api/transaction-history/:userId': 'GET - İşlem geçmişi'
    }
  });
});

// QR kod ile ödeme işlemi
app.post('/api/process-payment', async (req, res) => {
  try {
    const { qrData, amount, cashierId } = req.body;
    
    if (!qrData || !amount || !cashierId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Eksik parametreler: qrData, amount, cashierId gerekli' 
      });
    }

    let userData;
    try {
      userData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Geçersiz QR kod formatı' 
      });
    }

    const userId = userData.userId;
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'QR kodda kullanıcı ID bulunamadı' 
      });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Kullanıcı bulunamadı' 
      });
    }

    const userDataFromDB = userDoc.data();
    const currentBalance = userDataFromDB.points || 0;

    if (currentBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Yetersiz bakiye', 
        currentBalance, 
        requiredAmount: amount 
      });
    }

    // Firestore transaction ile atomik güncelleme
    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const currentPoints = userDoc.data().points || 0;
      
      if (currentPoints < amount) {
        throw new Error('Yetersiz bakiye');
      }
      
      const newBalance = currentPoints - amount;
      
      transaction.update(userRef, { 
        points: newBalance, 
        lastTransaction: admin.firestore.FieldValue.serverTimestamp() 
      });
      
      const transactionRef = db.collection('transactions').doc();
      transaction.set(transactionRef, {
        userId: userId,
        cashierId: cashierId,
        amount: -amount,
        type: 'payment',
        description: 'QR kod ile ödeme',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        userData: userData
      });
      
      return { newBalance, transactionId: transactionRef.id };
    });

    res.json({
      success: true,
      message: 'Ödeme başarıyla tamamlandı',
      data: {
        userId,
        previousBalance: currentBalance,
        newBalance: result.newBalance,
        amount,
        transactionId: result.transactionId,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Ödeme işlemi hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    });
  }
});

// Kullanıcı bakiyesi sorgulama
app.get('/api/user-balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        error: 'Kullanıcı bulunamadı' 
      });
    }

    const userData = userDoc.data();
    res.json({
      success: true,
      data: {
        userId,
        points: userData.points || 0,
        name: userData.name,
        email: userData.email,
        phone: userData.phone
      }
    });

  } catch (error) {
    console.error('Bakiye sorgulama hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    });
  }
});

// İşlem geçmişi
app.get('/api/transaction-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const transactionsRef = db.collection('transactions');
    const snapshot = await transactionsRef
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      data: {
        userId,
        transactions,
        count: transactions.length
      }
    });

  } catch (error) {
    console.error('İşlem geçmişi hatası:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Sunucu hatası' 
    });
  }
});

// Sunucuyu başlat
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 QR Cashier API sunucusu ${PORT} portunda çalışıyor`);
  console.log(`📱 Endpoint: http://localhost:${PORT}`);
  console.log(`🌐 Network: http://10.239.158.58:${PORT}`);
  console.log(`📖 API Dokümantasyonu: http://localhost:${PORT}`);
}); 