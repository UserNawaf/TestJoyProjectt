const firebaseConfig = {

    apiKey: "AIzaSyByT4A26ibE-L35_yBXPqQcJAAycsHfs1A",
  
    authDomain: "testjoy-2958c.firebaseapp.com",
  
    projectId: "testjoy-2958c",
  
    storageBucket: "testjoy-2958c.firebasestorage.app",
  
    messagingSenderId: "1013945106894",
  
    appId: "1:1013945106894:web:75b21f6534c21786786b9f",
  
    measurementId: "G-QM2Y6ZN8SX"
  
  };
  
function calculateResult() {
    let score = 0;
    
    userAnswers.forEach((answer, index) => {
        const question = currentExam.questions[index];
        if (checkAnswer(question, answer)) {
            score += question.points; // إضافة النقاط حسب كل سؤال
        }
    });

    const resultData = {
        examId: currentExam.id,
        userId: firebase.auth().currentUser.uid,
        score: score,
        totalPoints: currentExam.totalPoints,
        answers: userAnswers,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // حفظ النتائج في Firestore
    db.collection('results').add(resultData)
      .then(() => console.log('تم حفظ النتائج'))
      .catch(error => console.error('Error saving results:', error));

    return {
        score: score,
        totalPoints: currentExam.totalPoints,
        percentage: (score / currentExam.totalPoints) * 100
    };
}