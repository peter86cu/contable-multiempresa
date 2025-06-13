import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

export class FirebaseAuthService {
  private static isAuthenticated = false;
  private static authPromise: Promise<boolean> | null = null;

  // Autenticar con credenciales fijas
  static async ensureAuthenticated(): Promise<boolean> {
    try {
      // Si ya hay una promesa de autenticación en curso, esperarla
      if (this.authPromise) {
        return await this.authPromise;
      }

      // Si ya está autenticado, retornar true
      if (this.isAuthenticated && auth.currentUser) {
        return true;
      }

      // Crear nueva promesa de autenticación
      this.authPromise = this.performAuthentication();
      const result = await this.authPromise;
      this.authPromise = null;
      
      return result;
    } catch (error) {
      console.error('Error autenticando en Firebase:', error);
      this.authPromise = null;
      return false;
    }
  }

  private static async performAuthentication(): Promise<boolean> {
    return new Promise((resolve) => {
      // Verificar si ya hay un usuario autenticado
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe(); // Desuscribirse inmediatamente
        
        if (user) {
          this.isAuthenticated = true;
          console.log('Usuario ya autenticado en Firebase:', user.uid);
          resolve(true);
        } else {
          try {
            // Usar credenciales fijas desde variables de entorno
            const email = import.meta.env.VITE_FIREBASE_AUTH_EMAIL || 'admin@contaempresa.com';
            const password = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD || 'contaempresa123';
            
            console.log(`Intentando autenticar con usuario fijo: ${email}`);
            
            try {
              const userCredential = await signInWithEmailAndPassword(auth, email, password);
              this.isAuthenticated = true;
              console.log('Autenticado con usuario fijo en Firebase:', userCredential.user.uid);
              resolve(true);
            } catch (authError: any) {
              console.error('Error en autenticación con credenciales fijas:', authError);
              
              // Si estamos en desarrollo, simular autenticación exitosa
              if (import.meta.env.DEV) {
                console.log('Modo desarrollo: Simulando autenticación exitosa');
                this.isAuthenticated = true;
                resolve(true);
              } else {
                console.log('Fallo en autenticación de Firebase - operaciones de Firebase no estarán disponibles');
                this.isAuthenticated = false;
                resolve(false);
              }
            }
          } catch (error) {
            console.error('Error en autenticación con credenciales fijas:', error);
            
            // En desarrollo, simular autenticación exitosa
            if (import.meta.env.DEV) {
              console.log('Modo desarrollo: Simulando autenticación exitosa');
              this.isAuthenticated = true;
              resolve(true);
            } else {
              console.log('Fallo en autenticación de Firebase - operaciones de Firebase no estarán disponibles');
              this.isAuthenticated = false;
              resolve(false);
            }
          }
        }
      });
    });
  }

  // Verificar si el usuario está autenticado
  static isUserAuthenticated(): boolean {
    return !!auth.currentUser && this.isAuthenticated;
  }

  // Obtener el usuario actual
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Obtener el UID del usuario actual
  static getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null;
  }

  // Cerrar sesión
  static async signOut(): Promise<void> {
    try {
      await auth.signOut();
      this.isAuthenticated = false;
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  // Inicializar autenticación al cargar la aplicación
  static async initialize(): Promise<void> {
    try {
      await this.ensureAuthenticated();
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
    }
  }
}