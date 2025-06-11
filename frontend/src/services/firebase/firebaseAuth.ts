import { auth } from '../../config/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

export class FirebaseAuthService {
  private static currentUser: User | null = null;
  private static authPromise: Promise<User | null> | null = null;

  // Ensure user is authenticated (anonymously for development)
  static async ensureAuthenticated(): Promise<User | null> {
    // If we already have a user, return it
    if (this.currentUser) {
      return this.currentUser;
    }

    // If authentication is already in progress, wait for it
    if (this.authPromise) {
      return this.authPromise;
    }

    // Start authentication process
    this.authPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Clean up listener
        
        if (user) {
          console.log('✅ Usuario ya autenticado:', user.uid);
          this.currentUser = user;
          resolve(user);
        } else {
          try {
            console.log('🔄 Iniciando sesión anónima...');
            const userCredential = await signInAnonymously(auth);
            this.currentUser = userCredential.user;
            console.log('✅ Sesión anónima iniciada:', userCredential.user.uid);
            resolve(userCredential.user);
          } catch (error) {
            console.error('❌ Error en autenticación anónima:', error);
            reject(error);
          }
        }
      }, reject);
    });

    return this.authPromise;
  }

  // Get current user
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Reset authentication state
  static reset(): void {
    this.currentUser = null;
    this.authPromise = null;
  }
}