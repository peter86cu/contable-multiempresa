import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export class FirebaseAuthService {
  private static currentUser: User | null = null;
  private static authPromise: Promise<User | null> | null = null;
  private static isInitialized = false;
  private static isAuthenticating = false;

  // Autenticar con credenciales fijas desde variables de entorno
  static async ensureAuthenticated(): Promise<boolean> {
    try {
      // Si ya estamos autenticando, esperar a que termine
      if (this.isAuthenticating) {
        console.log('🔄 Autenticación en progreso, esperando...');
        if (this.authPromise) {
          await this.authPromise;
          return !!this.currentUser;
        }
      }

      // Si ya está autenticado con el usuario correcto, retornar true
      if (this.currentUser) {
        const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
        if (this.currentUser.email === email) {
          return true;
        } else {
          // Si el usuario no es el correcto, cerrar sesión y autenticar de nuevo
          console.log('⚠️ Usuario incorrecto, cerrando sesión...');
          await auth.signOut();
          this.currentUser = null;
        }
      }

      // Crear nueva promesa de autenticación
      this.isAuthenticating = true;
      this.authPromise = this.performAuthentication();
      
      try {
        const user = await this.authPromise;
        return !!user;
      } finally {
        this.isAuthenticating = false;
        this.authPromise = null;
      }
    } catch (error) {
      console.error('Error autenticando en Firebase:', error);
      this.isAuthenticating = false;
      this.authPromise = null;
      return false;
    }
  }

  private static async performAuthentication(): Promise<User | null> {
    return new Promise((resolve) => {
      // Obtener credenciales del .env
      const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
      const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
      
      if (!email || !password) {
        console.error('❌ Error: Credenciales de Firebase no configuradas en .env');
        resolve(null);
        return;
      }
      
      // Verificar si ya hay un usuario autenticado
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Desuscribirse inmediatamente
        
        if (user && user.email === email) {
          // Si el usuario ya está autenticado y es el correcto
          this.currentUser = user;
          console.log('✅ Usuario fijo ya autenticado en Firebase:', user.uid);
          resolve(user);
        } else {
          // Si no hay usuario o no es el correcto, autenticar con credenciales fijas
          if (user) {
            // Cerrar sesión primero si hay otro usuario
            console.log('⚠️ Usuario diferente autenticado, cerrando sesión...');
            await auth.signOut();
          }
          
          try {
            console.log('🔄 Autenticando con credenciales fijas...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.currentUser = userCredential.user;
            console.log('✅ Autenticado con credenciales fijas:', userCredential.user.uid);
            resolve(userCredential.user);
          } catch (authError) {
            console.error('❌ Error en autenticación con credenciales fijas:', authError);
            resolve(null);
          }
        }
      });
    });
  }

  // Verificar si el usuario está autenticado
  static isUserAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Obtener el usuario actual
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Obtener el UID del usuario actual
  static getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  // Cerrar sesión
  static async signOut(): Promise<void> {
    try {
      await auth.signOut();
      this.currentUser = null;
      this.authPromise = null;
      this.isAuthenticating = false;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  // Inicializar autenticación al cargar la aplicación
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.ensureAuthenticated();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
    }
  }
}