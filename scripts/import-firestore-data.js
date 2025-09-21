#!/usr/bin/env node

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'merakierp',
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function importData() {
  try {
    console.log('🚀 Starting Firestore data import...');
    
    // Read the sample data
    const dataPath = path.join(__dirname, '..', 'firestore-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const sampleData = JSON.parse(rawData);
    
    // Import each collection
    for (const [collectionName, documents] of Object.entries(sampleData)) {
      console.log(`📄 Importing ${collectionName} collection...`);
      
      for (const [docId, docData] of Object.entries(documents)) {
        await db.collection(collectionName).doc(docId).set(docData);
        console.log(`  ✅ Created document: ${docId}`);
      }
      
      console.log(`✅ ${collectionName} collection imported successfully`);
    }
    
    console.log('🎉 All data imported successfully!');
    console.log('');
    console.log('📋 Collections created:');
    console.log('🏢 facilities - 2 documents');
    console.log('👨‍🏫 employees - 2 documents');
    console.log('📚 classes - 3 documents');
    console.log('👨‍🎓 students - 3 documents');
    console.log('📝 enrollments - 3 documents');
    console.log('💰 finances - 3 documents');
    console.log('');
    console.log('🔗 View your data in Firebase Console:');
    console.log('https://console.firebase.google.com/project/merakierp/firestore');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
}

// Run the import
importData();