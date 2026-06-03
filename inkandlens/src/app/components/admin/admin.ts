import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StoriesService } from '../../services/stories';
import { Story } from '../../models/story';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminPortal implements OnInit {
  stories: Story[] = [];
  loading = true;
  deletingId: number | null = null;
  uploading = false;

  newStory = {
    title: '',
    description: ''
  };
  selectedFile: File | null = null;
  
  uploadStatus: 'idle' | 'success' | 'error' = 'idle';
  statusMessage = '';

  constructor(private storiesService: StoriesService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // Basic route protection
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }
    this.loadStories();
  }

  loadStories() {
    this.loading = true;
    this.storiesService.getStories().subscribe({
      next: (data) => {
        this.stories = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load catalog', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  uploadStory(event: Event) {
    event.preventDefault();
    if (!this.selectedFile || !this.newStory.title) return;

    this.uploading = true;
    this.uploadStatus = 'idle';
    this.statusMessage = '';

    const formData = new FormData();
    formData.append('title', this.newStory.title);
    formData.append('description', this.newStory.description);
    formData.append('file', this.selectedFile);

    this.storiesService.uploadStory(formData).subscribe({
      next: (res) => {
        this.uploading = false;
        this.uploadStatus = 'success';
        this.statusMessage = 'Story published and saved successfully!';
        
        // Reset form
        this.newStory = { title: '', description: '' };
        this.selectedFile = null;
        
        // Reload library list
        this.loadStories();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.uploading = false;
        this.uploadStatus = 'error';
        this.statusMessage = 'Failed to publish story. Make sure the API is running.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteStory(id: number) {
    if (!confirm('Are you sure you want to permanently delete this story and its physical file?')) {
      return;
    }

    this.deletingId = id;
    this.cdr.detectChanges();
    this.storiesService.deleteStory(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadStories();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Deletion failed', err);
        alert('Could not delete the story record.');
        this.deletingId = null;
        this.cdr.detectChanges();
      }
    });
  }

  downloadStory(story: Story) {
    this.storiesService.downloadStory(story.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = story.fileName.substring(story.fileName.indexOf('_') + 1) || 'story.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to download file', err);
        alert('File is missing on the server disk.');
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }
}
