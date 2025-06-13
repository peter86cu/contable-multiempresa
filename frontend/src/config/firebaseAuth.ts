import { signInWithEmailAndPassword, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { auth } from './firebase';

export class FirebaseAuthService {
  private static currentUser: User | null = null;
  private static authPromise: Promise<User | null> | null = null;
  private static isInitialized = false;

  // Autenticar con credenciales fijas desde variables de entorno
  static async ensureAuthenticated(): Promise<boolean> {
    try {
      // Si ya hay una promesa de autenticación en curso, esperarla
      if (this.authPromise) {
        await this.authPromise;
        return !!this.currentUser;
      }

      // Si ya está autenticado, retornar true
      if (this.currentUser) {
        return true;
      }

      // Crear nueva promesa de autenticación
      this.authPromise = this.performAuthentication();
      const result = await this.authPromise;
      this.authPromise = null;
      
      return !!result;
    } catch (error) {
      console.error('Error autenticando en Firebase:', error);
      this.authPromise = null;
      return false;
    }
  }

  private static async performAuthentication(): Promise<User | null> {
    return new Promise((resolve) => {
      // Verificar si ya hay un usuario autenticado
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Desuscribirse inmediatamente
        
        if (user) {
          this.currentUser = user;
          console.log('✅ Usuario ya autenticado en Firebase:', user.uid);
          resolve(user);
        } else {
          try {
            // Intentar autenticar con credenciales fijas
            const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL;
            const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD;
            
            if (email && password) {
              console.log('🔄 Autenticando con credenciales fijas...');
              try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                this.currentUser = userCredential.user;
                console.log('✅ Autenticado con credenciales fijas:', userCredential.user.uid);
                resolve(userCredential.user);
              } catch (authError) {
                console.error('❌ Error en autenticación con credenciales fijas:', authError);
                
                // Si falla la autenticación con credenciales, intentar con anónimo como fallback
                console.log('🔄 Intentando autenticación anónima como fallback...');
                const anonCredential = await signInAnonymously(auth);
                this.currentUser = anonCredential.user;
                console.log('✅ Autenticado anónimamente (fallback):', anonCredential.user.uid);
                resolve(anonCredential.user);
              }
            } else {
              // Si no hay credenciales configuradas, usar autenticación anónima
              console.log('⚠️ No hay credenciales configuradas, usando autenticación anónima');
              const userCredential = await signInAnonymously(auth);
              this.currentUser = userCredential.user;
              console.log('✅ Autenticado anónimamente:', userCredential.user.uid);
              resolve(userCredential.user);
            }
          } catch (error) {
            console.error('❌ Error en autenticación:', error);
            this.currentUser = null;
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