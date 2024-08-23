import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Socket } from 'ngx-socket-io';
import { User } from './models/user.model';  // Import the User interface

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInUser: any = null;
  private apiUrl = 'http://127.0.0.1:5000';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  private token = localStorage.getItem('token');

  constructor(private http: HttpClient, private socket: Socket) {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('private_message', (message: any) => {
      console.log('Received private message:', message);
    });
  }

  get isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  register(users: { username: string; email: string; password: string; isSeller?: boolean; uniqueID?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, users)
      .pipe(catchError(this.handleError));
  }
  

  login(loginData: { username: string; password: string; uniqueID?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        const isSeller = response.seller_id ? true : false;
        localStorage.setItem('isSeller', String(isSeller));
        this.loggedIn.next(true);
        this.getLoggedInUser().subscribe(user => {
        });
      }),
      catchError(this.handleError)
    );
  }

  
  

  getSellProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/sellproducts`);
  }

  createProduct(productData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.post<any>(`${this.apiUrl}/products`, productData, { headers })
      .pipe(catchError(this.handleError));
  }

  logout(): void {
    localStorage.removeItem('token');
    this.loggedIn.next(false);
  }

  public hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getMyProducts(): Observable<any> {
    const url = `${this.apiUrl}/myproducts`;
    return this.http.get<any>(url);
  }
 
  
  
  getProduct(productId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${productId}`)
      .pipe(catchError(this.handleError));
  }
  saveProduct(productId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/save/${productId}`, {})
      .pipe(catchError(this.handleError));
  }

  unsaveProduct(productId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/save/${productId}`)
      .pipe(catchError(this.handleError));
  }
  getFreeProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/freeproducts`)
    .pipe(catchError(this.handleError));
  }
  

  isProductSaved(productId: string): boolean {
    const savedProducts = JSON.parse(localStorage.getItem('savedProducts') || '{}');
    return !!savedProducts[productId];
  }

  updateLocalSavedProducts(productId: string, saved: boolean): void {
    const savedProducts = JSON.parse(localStorage.getItem('savedProducts') || '{}');
    if (saved) {
      savedProducts[productId] = true;
    } else {
      delete savedProducts[productId];
    }
    localStorage.setItem('savedProducts', JSON.stringify(savedProducts));
  }

  getSavedProducts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/savedproducts`)
      .pipe(catchError(this.handleError));
  }

  joinRoom(room: string): void {
    const token = this.getToken();
    if (token) {
      this.socket.emit('join', { room, token });
    } else {
      console.error('User is not authenticated');
    }
  }

  leaveRoom(room: string): void {
    const token = this.getToken();
    if (token) {
      this.socket.emit('leave', { room, token });
    } else {
      console.error('User is not authenticated');
    }
  }

  getMessages(recipientId: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.get<any>(`${this.apiUrl}/messages/${recipientId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  sendMessage(recipientId: string, message: string): void {
    const token = this.getToken();
    const payload = { recipient_id: recipientId, message: message, token: token };
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.http.post(`${this.apiUrl}/send_message`, payload, { headers }).subscribe(
      () => {
        console.log('Message Sent', payload);
      },
      (error: any) => {
        console.error('Error sending message', error);
      }
    );
  }
  updateProduct(productId: string, formData: FormData): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('User is not authenticated'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.put<any>(`${this.apiUrl}/freeproducts/${productId}`, formData, { headers })
      .pipe(
        catchError((error) => {
          console.error('Error updating product', error);
          return throwError(() => new Error('Failed to update product'));
        })
      );
  }
  searchProducts(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search`, { params: { q: query } });
  }
  
  deleteProduct(productId: string): Observable<any> {
    const url = `${this.apiUrl}/products/${productId}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`  // Replace this.getToken() with the actual method to get your token
    });
  
    return this.http.delete<any>(url, { headers })
      .pipe(
        catchError(this.handleError)  // Handle errors here
      );
  }
  sendProductMessage(product_id: string, recipient_id: string, product_title: string, product_description: string, product_image_path: string): Observable<any> {
    const token = localStorage.getItem('token'); // Adjust based on your token storage method
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = { product_id, recipient_id, product_title, product_description, product_image_path };

    return this.http.post<any>(`${this.apiUrl}/sendproductmessage`, body, { headers });
  }
  fetchMessages(recipientId: string): Observable<any> {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      return this.http.get(`${this.apiUrl}/messages/${recipientId}`, { headers })
        .pipe(catchError(this.handleError));
    } else {
      return throwError(() => new Error('User is not authenticated'));
    }
  }

  getAllUsers(): Observable<{ users: User[] }> {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      return this.http.get<{ users: User[] }>(`${this.apiUrl}/users`, { headers })
        .pipe(
          tap(response => {
            response.users.forEach(user => {
              user.profile_picture = user.profile_picture ? `${this.apiUrl}/uploads/profiles/${user.profile_picture}` : 'https://bootdey.com/img/Content/avatar/avatar1.png';
            });
          }),
          catchError(this.handleError)
        );
    } else {
      return throwError(() => new Error('User is not authenticated'));
    }
  }
  updateProfile(profileData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
    return this.http.post<any>(`${this.apiUrl}/update_profile`, profileData, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }

  getLoggedInUser(): Observable<User> {
    const token = this.getToken();
    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
      return this.http.get<User>(`${this.apiUrl}/current_user`, { headers })
        .pipe(
          tap(user => {
            user.profile_picture = user.profile_picture ? `${this.apiUrl}/uploads/profiles/${user.profile_picture}` : 'https://bootdey.com/img/Content/avatar/avatar1.png';
            this.loggedInUser = user; // Store user details in the service
            localStorage.setItem('isSeller', String(!!user.seller_id)); // Store isSeller based on the presence of seller_id
          }),
          catchError(this.handleError)
        );
    } else {
      return throwError(() => new Error('User is not authenticated'));
    }
  }
  
  addToCart(productId: string, quantity: number = 1): Observable<any> {
    const token = this.getToken();
    const payload = { product_id: productId, quantity: quantity };
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<any>(`${this.apiUrl}/cart/add`, payload, { headers })
      .pipe(catchError(this.handleError));
  }
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken(); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
  getCartItems(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/cart`, { headers })
      .pipe(catchError(this.handleError));
  }
  removeFromCart(productId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/cart/remove`, { product_id: productId }, { headers })
      .pipe(catchError(this.handleError));
  }
  createCheckoutSession(cartItems: any[]): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.apiUrl}/create-checkout-session`, { cartItems }, { headers })
      .pipe(catchError(this.handleError));
  }
  getActivity(): Observable<any> {
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.getToken()}`
    });
    return this.http.get<any>(`${this.apiUrl}/activities`, { headers }).pipe(
        tap((activities) => {
            console.log('Fetched activities:', activities);  // Debugging statement
        }),
        catchError(this.handleError)
    );
  }

  createAdsCheckoutSession(planType: string): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post<any>(`${this.apiUrl}/create-ads-checkout-session`, { plan_type: planType }, { headers });
  }
  

  
  

  get socketInstance(): Socket {
    return this.socket;
  }
  setLoggedInUser(user: any): void {
    this.loggedInUser = user;
  }

  onMessageReceived(): Observable<any> {
    return this.socket.fromEvent('private_message');
  }
}
