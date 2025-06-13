import { auth } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';

export class FirebaseAuthService {
  private static currentUser: User | null = null;
  private static authPromise: Promise<User | null> | null = null;
  private static isInitializing: boolean = false;

  // Inicializar autenticación de Firebase al cargar la app
  static async initialize(): Promise<void> {
    if (this.isInitializing) return;
    
    this.isInitializing = true;
    console.log('🔄 Inicializando autenticación de Firebase...');
    
    try {
      await this.ensureAuthenticated();
      console.log('✅ Autenticación de Firebase inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando autenticación de Firebase:', error);
    } finally {
      this.isInitializing = false;
    }
  }

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
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Clean up listener
        
        if (user) {
          console.log('✅ Usuario ya autenticado en Firebase:', user.uid);
          this.currentUser = user;
          resolve(user);
        } else {
          try {
            console.log('🔄 Iniciando sesión con credenciales fijas...');
            
            // Obtener credenciales del .env
            const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
            const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
            
            if (!email || !password) {
              console.error('❌ Error: Credenciales de Firebase no configuradas en .env');
              console.log('⚠️ Usando autenticación anónima como fallback');
              
              // Si no hay credenciales, usar autenticación anónima como fallback
              const { signInAnonymously } = await import('firebase/auth');
              const userCredential = await signInAnonymously(auth);
              this.currentUser = userCredential.user;
              console.log('✅ Sesión anónima iniciada:', userCredential.user.uid);
              resolve(userCredential.user);
              return;
            }
            
            // Iniciar sesión con email y contraseña
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.currentUser = userCredential.user;
            console.log('✅ Sesión iniciada con credenciales fijas:', userCredential.user.uid);
            resolve(userCredential.user);
          } catch (error) {
            console.error('❌ Error en autenticación con credenciales fijas:', error);
            
            // Si falla la autenticación con credenciales, intentar autenticación anónima
            try {
              console.log('⚠️ Intentando autenticación anónima como fallback...');
              const { signInAnonymously } = await import('firebase/auth');
              const userCredential = await signInAnonymously(auth);
              this.currentUser = userCredential.user;
              console.log('✅ Sesión anónima iniciada:', userCredential.user.uid);
              resolve(userCredential.user);
            } catch (anonError) {
              console.error('❌ Error en autenticación anónima:', anonError);
              reject(anonError);
            }
          }
        }
      }, reject);
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