import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    return android;
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDX0cAywDOeLFdPMfpu7lRqmIhx5JMzItQ',
    appId: '1:29278538868:android:4ad866492bceb092255521',
    messagingSenderId: '29278538868',
    projectId: 'itsupport-90d38',
  );
}