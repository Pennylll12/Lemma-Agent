const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

function getCustomerMasterDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || "lemma-customerdata";
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const credential = serviceAccount
      ? cert(JSON.parse(serviceAccount))
      : applicationDefault();

    initializeApp({ credential, projectId });
  }

  return getFirestore();
}

module.exports = { getCustomerMasterDb };
