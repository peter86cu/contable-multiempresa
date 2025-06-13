import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';

export class FirebaseAuthService {
  private static currentUser: User | null = null;
  private static authPromise: Promise<User | null> | null = null;

  // Ensure user is authenticated (using fixed credentials from .env)
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
      // Obtener credenciales del .env
      const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
      const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
      
      if (!email || !password) {
        console.error('❌ Error: Credenciales de Firebase no configuradas en .env');
        reject(new Error('Credenciales de Firebase no configuradas'));
        return;
      }
      
      // Primero verificar si ya hay un usuario autenticado
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Clean up listener
        
        if (user) {
          // Verificar si el usuario autenticado es el usuario fijo
          if (user.email === email) {
            console.log('✅ Usuario fijo ya autenticado en Firebase:', user.uid);
            this.currentUser = user;
            resolve(user);
          } else {
            // Si hay otro usuario autenticado, cerrar sesión y autenticar con el usuario fijo
            console.log('⚠️ Usuario diferente autenticado, cambiando al usuario fijo...');
            try {
              await auth.signOut();
              this.authenticateWithFixedCredentials(email, password, resolve, reject);
            } catch (error) {
              console.error('❌ Error al cerrar sesión:', error);
              reject(error);
            }
          }
        } else {
          // No hay usuario autenticado, autenticar con el usuario fijo
          this.authenticateWithFixedCredentials(email, password, resolve, reject);
        }
      }, (error) => {
        console.error('❌ Error en onAuthStateChanged:', error);
        reject(error);
      });
    });

    try {
      const user = await this.authPromise;
      this.authPromise = null;
      return user;
    } catch (error) {
      this.authPromise = null;
      throw error;
    }
  }

  // Autenticar con credenciales fijas
  private static async authenticateWithFixedCredentials(
    email: string, 
    password: string, 
    resolve: (user: User) => void, 
    reject: (error: any) => void
  ): Promise<void> {
    try {
      console.log('🔄 Iniciando sesión con credenciales fijas...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      console.log('✅ Sesión iniciada con credenciales fijas:', userCredential.user.uid);
      resolve(userCredential.user);
    } catch (error) {
      console.error('❌ Error en autenticación con credenciales fijas:', error);
      reject(error);
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Get current user ID
  static getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  // Reset authentication state
  static reset(): void {
    this.currentUser = null;
    this.authPromise = null;
  }

  // Check if user is authenticated
  static isUserAuthenticated(): boolean {
    return !!this.currentUser;
  }
}