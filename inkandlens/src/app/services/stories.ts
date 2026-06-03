import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Story } from '../models/story';

@Injectable({
  providedIn: 'root',
})
export class StoriesService {
  private apiUrl = "/api/Stories";
  constructor(private http: HttpClient){}

  getStories(): Observable<Story[]> {
    return this.http.get<Story[]>(this.apiUrl);
  }

  getStory(id: number): Observable<Story> {
    return this.http.get<Story>(`${this.apiUrl}/${id}`);
  }

  uploadStory(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  downloadStory(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${id}`, { responseType: 'blob' });
  }

  deleteStory(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
