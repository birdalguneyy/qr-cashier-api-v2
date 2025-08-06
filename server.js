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