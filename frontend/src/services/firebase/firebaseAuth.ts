import { auth } from '../../config/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';

export class FirebaseAuthService {
  private static currentUser: User | null = null;
  private static authPromise: Promise<User | null> | null = null;
  private static isAuthenticating = false;

  // Ensure user is authenticated (using fixed credentials from .env)
  static async ensureAuthenticated(): Promise<User | null> {
    // Si ya estamos autenticando, esperar a que termine
    if (this.isAuthenticating) {
      console.log('🔄 Autenticación en progreso, esperando...');
      if (this.authPromise) {
        return this.authPromise;
      }
    }

    // Si ya tenemos un usuario, verificar que sea el correcto
    if (this.currentUser) {
      const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
      if (this.currentUser.email === email) {
        return this.currentUser;
      } else {
        // Si el usuario no es el correcto, cerrar sesión y autenticar de nuevo
        console.log('⚠️ Usuario incorrecto, cerrando sesión...');
        await auth.signOut();
        this.currentUser = null;
      }
    }

    // Iniciar proceso de autenticación
    this.isAuthenticating = true;
    this.authPromise = this.authenticateWithFixedCredentials();

    try {
      const user = await this.authPromise;
      return user;
    } finally {
      this.isAuthenticating = false;
      this.authPromise = null;
    }
  }

  // Autenticar con credenciales fijas
  private static async authenticateWithFixedCredentials(): Promise<User | null> {
    // Obtener credenciales del .env
    const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
    const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
    
    if (!email || !password) {
      console.error('❌ Error: Credenciales de Firebase no configuradas en .env');
      return null;
    }
    
    try {
      console.log('🔄 Iniciando sesión con credenciales fijas...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      console.log('✅ Sesión iniciada con credenciales fijas:', userCredential.user.uid);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Error en autenticación con credenciales fijas:', error);
      return null;
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
    this.isAuthenticating = false;
  }

  // Check if user is authenticated
  static isUserAuthenticated(): boolean {
    return !!this.currentUser;
  }
  
  // Cerrar sesión
  static async signOut(): Promise<void> {
    try {
      await auth.signOut();
      this.currentUser = null;
      this.authPromise = null;
      this.isAuthenticating = false;
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  }
}